from rest_framework import serializers
from .models import ChatMessage, ChatRoom

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_username', 'message', 'created_at']



# class UserChatRoomSerializer(serializers.ModelSerializer):
#     room_name = serializers.SerializerMethodField()
#
#     class Meta:
#         model = ChatRoom
#         fields = ['id', 'room_type', 'room_name', 'created_at']
#
#     def get_room_name(self, obj):
#         if obj.room_type == "team":
#             return f"Team Chat: {obj.team.name}"
#         return f"Private Chat with Company: {obj.user.username}"

class UserChatRoomSerializer(serializers.ModelSerializer):
    latest_messages = serializers.SerializerMethodField()
    team_name = serializers.CharField(source='team.name', read_only=True)
    private_chat_users = serializers.SerializerMethodField()  # New field for private chats
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'room_type', 'team_name', 'private_chat_users', 'created_at', 'latest_messages']
    
    def get_latest_messages(self, obj):
        request = self.context.get('request')
        current_user = request.user if request and hasattr(request, 'user') else None
        
        if hasattr(obj, 'latest_messages'):
            messages = obj.latest_messages
        else:
            messages = obj.messages.order_by('-created_at')[:10]
        
        return [
            {
                'id': str(msg.id),
                'sender': msg.sender.username,
                'sender_id': str(msg.sender.id),
                'message': msg.message,
                'created_at': msg.created_at,
                'is_mine': msg.sender == current_user if current_user else False
            } for msg in messages
        ]
    
    def get_private_chat_users(self, obj):
        """Return usernames for private chats excluding the current user"""
        request = self.context.get('request')
        current_user = request.user if request and hasattr(request, 'user') else None
        
        if obj.room_type != 'private':
            return None
        
        users = []
        if obj.user_1 and obj.user_1 != current_user:
            users.append(obj.user_1.username)
        if obj.user_2 and obj.user_2 != current_user:
            users.append(obj.user_2.username)
        return users

