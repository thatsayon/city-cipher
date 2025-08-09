from django.urls import path, include

urlpatterns = [
    path('leader/', include('game.leaderboard.urls'))
]
