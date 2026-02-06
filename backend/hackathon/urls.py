from django.urls import path
from . import views

urlpatterns = [
    path('hello', views.HealthView.as_view(), name='health'),
    path('api/crossword/puzzle/<str:puzzle_id>', views.get_puzzle, name='get_puzzle'),
    path('api/crossword/submit', views.submit_puzzle, name='submit_puzzle'),
    path('api/crossword/leaderboard', views.get_leaderboard, name='get_leaderboard'),
    path('api/crossword/leaderboard/search', views.search_leaderboard, name='search_leaderboard'),
    path('api/crossword/analytics', views.get_analytics, name='get_analytics'),
    path('api/crossword/game-history', views.get_game_history, name='get_game_history'),
]
