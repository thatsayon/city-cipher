from django.db import models
from django.conf import settings
from game.models import Team
import uuid

class ChatRoom(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    ROOM_TYPE_CHOICES = [
        ('team', 'Team'),
        ('private_to_company', 'Private to Company'),
    ]
    room_type = models.CharField(max_length=30, choices=ROOM_TYPE_CHOICES)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room_type', 'team', 'user')

    def __str__(self):
        if self.room_type == "team":
            return f"Team Chat: {self.team.name}"
        return f"Private Chat with Company: {self.user.username}"


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
