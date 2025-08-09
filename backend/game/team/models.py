from django.db import models
from django.contrib.auth import get_user_model
from game.models import Game
import uuid
import secrets

User = get_user_model()

class Team(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.PROTECT,
        related_name='teams'
    )
    name = models.CharField(
        max_length=100
    )
    leader = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='led_team'
    )
    join_code = models.CharField(
        max_length=8,
        unique=True,
        editable=False
    )
    max_member = models.PositiveIntegerField(
        default=5
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = ('name', 'game')

    def __str__(self):
        return f"{self.game.name}"

    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = secrets.token_hex(4).upper()
        super().save(*args, **kwargs)

    def is_full(self):
        return self.members.count() >= self.max_member
