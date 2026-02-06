from django.urls import path

from .views import ApiForgotPasswordView, ApiLoginView, ApiLogoutView, ApiMeView, ApiOtpRequestView, ApiOtpVerifyView, ApiRegisterView, HealthView
from . import views

urlpatterns = [
    path('hi', HealthView.as_view(), name='health'),
    path('api/login', ApiLoginView.as_view(), name='api_login'),
    path('api/register', ApiRegisterView.as_view(), name='api_register'),
    path('api/forgot-password', ApiForgotPasswordView.as_view(), name='api_forgot_password'),
    path('api/otp/request', ApiOtpRequestView.as_view(), name='api_otp_request'),
    path('api/otp/verify', ApiOtpVerifyView.as_view(), name='api_otp_verify'),
    path('', ApiMeView.as_view(), name='api_home'),
    path('api/logout', ApiLogoutView.as_view(), name='api_logout'),
    path('api/crossword/puzzle/<str:puzzle_id>', views.get_puzzle, name='get_puzzle'),
    path('api/crossword/submit', views.submit_puzzle, name='submit_puzzle'),
    path('api/crossword/leaderboard', views.get_leaderboard, name='get_leaderboard'),
    path('api/crossword/leaderboard/search', views.search_leaderboard, name='search_leaderboard'),
    path('api/crossword/analytics', views.get_analytics, name='get_analytics'),
    path('api/crossword/game-history', views.get_game_history, name='get_game_history'),
]
