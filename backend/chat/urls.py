from django.urls import path
from .views import (
    ChatHistoryView,
    GetUserChatRooms
)

urlpatterns = [
    path('<int:room_id>/', ChatHistoryView.as_view(), name='chat-history'),
    path('user-chat-room/', GetUserChatRooms.as_view(), name='user chat room')
]
