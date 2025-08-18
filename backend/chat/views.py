from django.db.models import Prefetch
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.db import models

from agora_token_builder import RtcTokenBuilder

from .models import ChatMessage, ChatRoom
import os
import time 

from .serializers import (
    ChatMessageSerializer,
    UserChatRoomSerializer,
)

# hi
class GetUserChatRooms(generics.ListAPIView):
    serializer_class = UserChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Return rooms where:
        # - It's a private chat and the user is either user_1 or user_2
        # - OR it's a team chat and the user is a member of the team
        return ChatRoom.objects.filter(
            Q(room_type='private', user_1=user) | Q(room_type='private', user_2=user) |
            Q(room_type='team', team__members=user)
        ).prefetch_related(
            Prefetch(
                'messages',
                queryset=ChatMessage.objects.order_by('-created_at')[:10],  # last 10 messages
                to_attr='latest_messages'
            )
        ).distinct().order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class ChatHistoryView(generics.ListAPIView):
    serializer_class = UserChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('-created_at')

class GenerateAgoraTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Optional: restrict token generation

    def get(self, request):
        app_id = os.getenv("AGORA_APP_ID")
        app_certificate = os.getenv("AGORA_APP_CERTIFICATE")
        channel_name = request.query_params.get("channelName")
        uid = request.query_params.get("uid", "0")  # "0" lets Agora assign UID

        if not channel_name:
            return Response({"error": "channelName is required"}, status=400)

        expiration_time_in_seconds = 3600  # 1 hour
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expiration_time_in_seconds

        token = RtcTokenBuilder.buildTokenWithUid(
            app_id, app_certificate, channel_name, int(uid), 1, privilege_expired_ts
        )

        return Response({
            "appId": app_id,
            "token": token,
            "channelName": channel_name,
            "uid": uid
        })
