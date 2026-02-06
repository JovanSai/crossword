import json
import re

from django.http import HttpRequest, JsonResponse
from django.views import View
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Crosswordpuzzlebank, Crosswordpuzzleresults
from .serializers import CrosswordPuzzleSerializer
from .auth import (
    ExternalAuthError,
    create_signed_otp_challenge,
    create_signed_session,
    is_success_response,
    load_signed_otp_challenge,
    load_signed_session,
    post_form_json,
    require_env,
)

SYSTEM_NAME = 'isl'
REGISTER_ROLE = 'isl_user'


def _normalize_phone(raw: str) -> str:
    return re.sub(r'\D+', '', (raw or '').strip())


def _get_bearer_token(request: HttpRequest) -> str | None:
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    prefix = 'Bearer '
    if not auth_header.startswith(prefix):
        return None

    token = auth_header[len(prefix) :].strip()
    return token or None


def _get_session_payload(request: HttpRequest) -> dict | None:
    token = _get_bearer_token(request)
    if not token:
        return None
    try:
        return load_signed_session(token)
    except ExternalAuthError:
        return None


def _json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return {}


def _external_error_message(result: dict, default: str) -> str:
    return result.get('error') or result.get('message') or default


def _external_success_message(result: dict) -> str | None:
    message = (result.get('message') or result.get('status') or '').strip()
    return message or None


def _post_external_or_error(
    *,
    url_env: str,
    payload: dict[str, str],
    failure_status: int,
    failure_default_message: str,
) -> tuple[dict | None, JsonResponse | None]:
    try:
        url = require_env(url_env)
    except ExternalAuthError as exc:
        return None, JsonResponse({'error': str(exc)}, status=500)

    try:
        result = post_form_json(url=url, payload=payload)
    except ExternalAuthError as exc:
        return None, JsonResponse({'error': str(exc)}, status=502)

    if not is_success_response(result):
        message = _external_error_message(result, failure_default_message)
        return None, JsonResponse({'error': message}, status=failure_status)

    return result, None


class HealthView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'status': 'ok'})


class ApiLoginView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        username_raw = (payload.get('username') or '').strip()
        password = (payload.get('password') or '').strip()

        if not username_raw or not password:
            return JsonResponse({'error': 'Please enter username and password.'}, status=400)

        result, error = _post_external_or_error(
            url_env='LOGIN_THROUGH_PASSWORD_URL',
            payload={
                'email': username_raw,
                'password': password,
                'system_name': SYSTEM_NAME,
            },
            failure_status=401,
            failure_default_message='Invalid username or password.',
        )
        if error:
            return error

        session_payload = {'email': username_raw}
        session_payload.update(result or {})
        raw_token, expires_at = create_signed_session(payload=session_payload)

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': expires_at.isoformat(),
                'user': {
                    'id': None,
                    'username': username_raw,
                },
            }
        )


class ApiForgotPasswordView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        email = (payload.get('email') or '').strip()
        password = (payload.get('password') or '').strip()

        if not email or not password:
            return JsonResponse({'error': 'Please enter email and password.'}, status=400)

        result, error = _post_external_or_error(
            url_env='FORGET_PASSWORD_URL',
            payload={
                'email': email,
                'password': password,
                'system_name': SYSTEM_NAME,
            },
            failure_status=400,
            failure_default_message='Unable to reset password.',
        )
        if error:
            return error

        return JsonResponse({'ok': True, 'message': _external_success_message(result or {})})


class ApiRegisterView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        display_name = (payload.get('display_name') or '').strip()
        email = (payload.get('email') or '').strip()
        phone_number = _normalize_phone(payload.get('phone_number') or '')
        password = (payload.get('password') or '').strip()

        if not display_name or not email or not phone_number or not password:
            return JsonResponse({'error': 'Please fill all required fields.'}, status=400)

        result, error = _post_external_or_error(
            url_env='REGISTER_URL',
            payload={
                'display_name': display_name,
                'email': email,
                'phone_number': phone_number,
                'password': password,
                'system_name': SYSTEM_NAME,
                'role': REGISTER_ROLE,
            },
            failure_status=400,
            failure_default_message='Unable to create account.',
        )
        if error:
            return error

        return JsonResponse({'ok': True, 'message': _external_success_message(result or {})})


class ApiMeView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if session_payload is None:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        email = (session_payload.get('email') or '').strip() or None

        return JsonResponse(
            {
                'user': {
                    'id': None,
                    'username': email,
                },
                'member': {
                    'id': None,
                    'name': session_payload.get('display_name'),
                    'email': email,
                    'phone': session_payload.get('phone_number'),
                },
            }
        )


class ApiLogoutView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'ok': True})


class ApiOtpRequestView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        channel = (payload.get('channel') or '').strip().lower()
        phone = _normalize_phone(payload.get('phone') or payload.get('username') or '')
        email = (payload.get('email') or payload.get('username') or '').strip()

        if channel not in {'whatsapp', 'email'}:
            return JsonResponse({'error': 'Invalid OTP channel.'}, status=400)

        if channel == 'whatsapp' and not phone:
            return JsonResponse({'error': 'Please enter mobile number.'}, status=400)
        if channel == 'email' and not email:
            return JsonResponse({'error': 'Please enter email id.'}, status=400)

        identifier = email if channel == 'email' else phone
        result, error = _post_external_or_error(
            url_env='SEND_OTP_URL',
            payload={
                'email': identifier,
                'type': channel,
                'system_name': SYSTEM_NAME,
            },
            failure_status=400,
            failure_default_message='Unable to request key',
        )
        if error:
            return error

        challenge_id, expires_at = create_signed_otp_challenge(email=identifier, channel=channel)
        return JsonResponse({'challenge_id': challenge_id, 'expires_at': expires_at.isoformat()})


class ApiOtpVerifyView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        challenge_id = payload.get('challenge_id')
        otp = (payload.get('otp') or '').strip()

        if not challenge_id or not otp:
            return JsonResponse({'error': 'Please enter OTP.'}, status=400)

        try:
            otp_payload = load_signed_otp_challenge(str(challenge_id))
        except ExternalAuthError as exc:
            return JsonResponse({'error': str(exc)}, status=401)

        email = (otp_payload.get('email') or '').strip()
        result, error = _post_external_or_error(
            url_env='VERIFY_OTP_URL',
            payload={
                'email': email,
                'otp': otp,
                'system_name': SYSTEM_NAME,
            },
            failure_status=401,
            failure_default_message='Invalid or expired OTP.',
        )
        if error:
            return error

        session_payload = {'email': email}
        session_payload.update(result or {})
        raw_token, expires_at = create_signed_session(payload=session_payload)

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': expires_at.isoformat(),
                'user': {'id': None, 'username': email},
            }
        )


from .serializers import CrosswordPuzzleSerializer

@api_view(['GET'])
def get_puzzle(request, puzzle_id):
    try:
        # User requested flexible ID, models has CharField
        puzzle = Crosswordpuzzlebank.objects.get(puzzleid=puzzle_id)
        serializer = CrosswordPuzzleSerializer(puzzle)
        return Response(serializer.data)
    except Crosswordpuzzlebank.DoesNotExist:
        return Response({'error': 'Puzzle not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def submit_puzzle(request):
    """
    Handle puzzle submission.
    Calculates score based on correctness and time remaining.
    Stores results in database.
    """
    data = request.data
    puzzle_id = data.get('puzzleID')
    submitted_grid = data.get('submittedPuzzle', {})
    time_remaining = data.get('timeRemaining', 0)
    team_name = data.get('teamName', 'Anonymous')
    session_id = data.get('sessionID', None)
    user_email = data.get('email', None)
    
    try:
        puzzle = Crosswordpuzzlebank.objects.get(puzzleid=puzzle_id)
    except Crosswordpuzzlebank.DoesNotExist:
        return Response({'error': 'Puzzle not found'}, status=status.HTTP_404_NOT_FOUND)

    correct_answers = {}
    
    # Extract answers from across hints
    if puzzle.accrosshintarray:
        try:
            across_hints = json.loads(puzzle.accrosshintarray.replace("'", '"')) if isinstance(puzzle.accrosshintarray, str) else puzzle.accrosshintarray
            for hint in across_hints:
                if 'answer' in hint and 'cellID' in hint:
                   start_cell = int(hint['cellID'])
                   answer_text = hint['answer'].upper()
                   for i, char in enumerate(answer_text):
                       cell_num = start_cell + i
                       correct_answers[str(cell_num)] = char
        except Exception as e:
            print(f"Error parsing across hints: {e}")

    # Extract answers from down hints
    if puzzle.downhintarray:
        try:
            down_hints = json.loads(puzzle.downhintarray.replace("'", '"')) if isinstance(puzzle.downhintarray, str) else puzzle.downhintarray
            for hint in down_hints:
                if 'answer' in hint and 'cellID' in hint:
                   start_cell = int(hint['cellID'])
                   answer_text = hint['answer'].upper()
                   for i, char in enumerate(answer_text):
                       cell_num = start_cell + (i * 9) 
                       correct_answers[str(cell_num)] = char
        except Exception as e:
             print(f"Error parsing down hints: {e}")

    # Check which words are completely correct
    correct_words_count = 0
    total_words_count = 0
    
    # Check across words
    if puzzle.accrosshintarray:
        try:
            across_hints = json.loads(puzzle.accrosshintarray.replace("'", '"')) if isinstance(puzzle.accrosshintarray, str) else puzzle.accrosshintarray
            total_words_count += len(across_hints)
            for hint in across_hints:
                if 'answer' in hint and 'cellID' in hint:
                    start_cell = int(hint['cellID'])
                    answer_text = hint['answer'].upper()
                    word_correct = True
                    for i, char in enumerate(answer_text):
                        cell_num = str(start_cell + i)
                        if submitted_grid.get(cell_num, '').upper() != char:
                            word_correct = False
                            break
                    if word_correct:
                        correct_words_count += 1
        except Exception as e:
            print(f"Error checking across words: {e}")
    
    # Check down words
    if puzzle.downhintarray:
        try:
            down_hints = json.loads(puzzle.downhintarray.replace("'", '"')) if isinstance(puzzle.downhintarray, str) else puzzle.downhintarray
            total_words_count += len(down_hints)
            for hint in down_hints:
                if 'answer' in hint and 'cellID' in hint:
                    start_cell = int(hint['cellID'])
                    answer_text = hint['answer'].upper()
                    word_correct = True
                    for i, char in enumerate(answer_text):
                        cell_num = str(start_cell + (i * 9))
                        if submitted_grid.get(cell_num, '').upper() != char:
                            word_correct = False
                            break
                    if word_correct:
                        correct_words_count += 1
        except Exception as e:
            print(f"Error checking down words: {e}")
    
    # Score: 1 point per correct word + time bonus only if 6 or more words are correct
    if correct_words_count >= 6:
        score = correct_words_count + (time_remaining * 0.1)
    else:
        score = correct_words_count
    
    # Check if all words are correct
    all_words_correct = (correct_words_count == total_words_count)
    
    # Store result in database
    try:
        from django.utils import timezone
        result = Crosswordpuzzleresults.objects.create(
            puzzleid=puzzle_id,
            riderid=team_name,
            submittedpuzzle=json.dumps(submitted_grid),
            gamescore=str(score),
            duration=str(time_remaining),
            status=1 if all_words_correct else 0,
            createddate=timezone.now(),
            email=user_email
        )
        print(f"✅ Result saved successfully! Team: {team_name}, Score: {score}")
    except Exception as e:
        print(f"❌ Error saving result: {e}")
        import traceback
        traceback.print_exc()
    
    return Response({
        'score': score,
        'correctWords': correct_words_count,
        'totalWords': total_words_count,
        'allWordsCorrect': all_words_correct,
        'message': 'Submission successful'
    })


@api_view(['GET'])
def get_leaderboard(request):
    """
    Get leaderboard data aggregated by email.
    Returns top players with total score and rounds played.
    Supports filter query parameter: ?filter=today
    """
    from django.db.models import Sum, Count, FloatField
    from django.db.models.functions import Cast
    from datetime import date
    
    # Get filter parameter
    filter_type = request.GET.get('filter', 'overall')
    
    # Base queryset
    queryset = Crosswordpuzzleresults.objects
    
    # Apply date filter if 'today' is selected
    if filter_type == 'today':
        today = date.today()
        queryset = queryset.filter(createddate__date=today)
    
    # Aggregate results by email
    leaderboard = queryset.values('email').annotate(
        totalScore=Sum(Cast('gamescore', FloatField())),
        roundsPlayed=Count('id')
    ).filter(
        email__isnull=False
    ).exclude(
        email=''
    ).order_by('-totalScore')[:10]
    
    # Format the response
    results = []
    for idx, entry in enumerate(leaderboard, 1):
        results.append({
            'rank': idx,
            'email': entry['email'],
            'totalScore': round(entry['totalScore'] or 0, 1),
            'roundsPlayed': entry['roundsPlayed']
        })
    
    return Response(results)


@api_view(['GET'])
def search_leaderboard(request):
    """
    Search for a specific player in the leaderboard by email.
    Returns player's rank, score, and rounds played even if not in top 10.
    Supports filter query parameter: ?filter=today
    """
    from django.db.models import Sum, Count, FloatField
    from django.db.models.functions import Cast
    from datetime import date
    
    # Get search email and filter parameter
    search_email = request.GET.get('email', '').strip()
    filter_type = request.GET.get('filter', 'overall')
    
    if not search_email:
        return Response({'error': 'Email parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Base queryset
    queryset = Crosswordpuzzleresults.objects
    
    # Apply date filter if 'today' is selected
    if filter_type == 'today':
        today = date.today()
        queryset = queryset.filter(createddate__date=today)
    
    # Get all players ranked by score
    all_players = queryset.values('email').annotate(
        totalScore=Sum(Cast('gamescore', FloatField())),
        roundsPlayed=Count('id')
    ).filter(
        email__isnull=False
    ).exclude(
        email=''
    ).order_by('-totalScore')
    
    # Find the player and their rank
    player_found = False
    rank = 0
    player_data = None
    
    for idx, entry in enumerate(all_players, 1):
        if search_email.lower() in entry['email'].lower():
            player_found = True
            rank = idx
            player_data = {
                'rank': rank,
                'email': entry['email'],
                'totalScore': round(entry['totalScore'] or 0, 1),
                'roundsPlayed': entry['roundsPlayed']
            }
            break
    
    if not player_found:
        return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(player_data)


@api_view(['GET'])
def get_analytics(request):
    """
    Get analytics data for a specific user by email.
    Returns total games, wins, losses, best score, average score, and win rate.
    """
    from django.db.models import Avg, Max, Count, FloatField, Q
    from django.db.models.functions import Cast
    
    # Get email from query parameter
    email = request.GET.get('email')
    
    if not email:
        return Response({'error': 'Email parameter is required'}, status=400)
    
    # Get all results for this email
    user_results = Crosswordpuzzleresults.objects.filter(email=email)
    
    # Calculate statistics
    total_games = user_results.count()
    
    # Wins are games where status = 1 (all words correct)
    total_wins = user_results.filter(status=1).count()
    
    # Losses are games where status = 0 (not all words correct)
    total_losses = user_results.filter(status=0).count()
    
    # Get best score (max gamescore)
    best_score_result = user_results.aggregate(
        best=Max(Cast('gamescore', FloatField()))
    )
    best_score = best_score_result['best'] or 0
    
    # Get average score
    avg_score_result = user_results.aggregate(
        average=Avg(Cast('gamescore', FloatField()))
    )
    average_score = avg_score_result['average'] or 0
    
    # Calculate win rate
    win_rate = round((total_wins / total_games * 100) if total_games > 0 else 0)
    
    return Response({
        'totalGames': total_games,
        'totalWins': total_wins,
        'totalLosses': total_losses,
        'bestScore': round(best_score, 2),
        'averageScore': round(average_score, 2),
        'winRate': win_rate
    })


@api_view(['GET'])
def get_game_history(request):
    """
    Get detailed game history for a specific user by email.
    Returns list of all games with scores, dates, and status.
    """
    from django.db.models import FloatField
    from django.db.models.functions import Cast
    
    # Get email from query parameter
    email = request.GET.get('email')
    
    if not email:
        return Response({'error': 'Email parameter is required'}, status=400)
    
    # Get all results for this email ordered by date
    user_results = Crosswordpuzzleresults.objects.filter(email=email).order_by('createddate')
    
    # Format the response
    games = []
    for result in user_results:
        try:
            score = float(result.gamescore) if result.gamescore else 0
        except:
            score = 0
            
        games.append({
            'puzzleId': result.puzzleid,
            'score': round(score, 2),
            'duration': result.duration or '0',
            'status': result.status,
            'date': result.createddate.isoformat() if result.createddate else None
        })
    
    return Response(games)
