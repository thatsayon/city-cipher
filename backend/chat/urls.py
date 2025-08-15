from django.urls import path
from .views import (
    ChatHistoryView,
    GetUserChatRooms,
    GenerateAgoraTokenView
)

urlpatterns = [
    path('<int:room_id>/', ChatHistoryView.as_view(), name='chat-history'),
    path('user-chat-room/', GetUserChatRooms.as_view(), name='user chat room'),
    path('agora-token/', GenerateAgoraTokenView.as_view(), name='generate agora')
]
