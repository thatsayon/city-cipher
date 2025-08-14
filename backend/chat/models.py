from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from game.models import Team
import uuid

User = get_user_model()

class ChatRoom(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    ROOM_TYPE_CHOICES = [
        ('team', 'Team'),
        ('private', 'Private'),
    ]
    room_type = models.CharField(
        max_length=30, 
        choices=ROOM_TYPE_CHOICES
    )

    # Only for team chats
    team = models.OneToOneField(
        Team,
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='chat_room'
    )

    # Only for private chats
    user_1 = models.ForeignKey(
        User,
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='chats_as_user1'
    )
    user_2 = models.ForeignKey(
        User,
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='chats_as_user2'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['team'],
                name='unique_team_chat'
            ),
            models.UniqueConstraint(
                fields=['user_1', 'user_2'],
                name='unique_private_chat'
            )
        ]

    def __str__(self):
        if self.room_type == "team" and self.team:
            return f"Team Chat: {self.team.name}"
        elif self.room_type == "private" and self.user_1 and self.user_2:
            return f"Private Chat: {self.user_1.username} & {self.user_2.username}"
        return f"ChatRoom {self.id}"

class ChatMessage(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    room = models.ForeignKey(ChatRoom, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.message[:20]}"
