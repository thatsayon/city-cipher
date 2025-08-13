from rest_framework import generics, permissions
from .models import ChatMessage, ChatRoom
from .serializers import ChatMessageSerializer

class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('-created_at')

