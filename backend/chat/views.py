from rest_framework import generics, permissions
from django.db.models import Q
from django.db import models
from .models import ChatMessage, ChatRoom

from .serializers import (
    ChatMessageSerializer,
    UserChatRoomSerializer,
)

class GetUserChatRooms(generics.ListAPIView):
    serializer_class = UserChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Return chat rooms where the user is either the room user or part of the team
        return ChatRoom.objects.filter(
            models.Q(user=user)
        ).distinct().order_by('-created_at')

class ChatHistoryView(generics.ListAPIView):
    serializer_class = UserChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('-created_at')

