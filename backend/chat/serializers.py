from rest_framework import serializers
from .models import ChatMessage, ChatRoom

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_username', 'message', 'created_at']



class UserChatRoomSerializer(serializers.ModelSerializer):
    room_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'room_type', 'room_name', 'created_at']
    
    def get_room_name(self, obj):
        if obj.room_type == "team":
            return f"Team Chat: {obj.team.name}"
        return f"Private Chat with Company: {obj.user.username}"
