from django.db import models
from django.contrib.auth import get_user_model
from .leaderboard.models import *
import uuid
import secrets

User = get_user_model()

# game model
class Game(models.Model):
    GAME_TYPE_CHOICES = [
        ('solo', 'Solo Player'),
        ('team', 'Team Based'),
        ('both', 'Both Solo and Team'),
    ]

    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Game Name"
    )
    slug = models.SlugField(
        unique=True,
        verbose_name="Slug"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description",
    )
    start_time = models.DateTimeField(
        verbose_name="Start Time",
        help_text="Date and time when the game starts"
    )
    is_active = models.BooleanField(
        default=False
    )

    game_type = models.CharField(
        max_length=10,
        choices=GAME_TYPE_CHOICES,
        default='solo',
        help_text='Specify if the game is for solo player, teams or both.'
    )
    
    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['start_time']),
            models.Index(fields=['is_active']),
            models.Index(fields=['game_type']),
        ]
        verbose_name = "Game"
        verbose_name_plural = "Games"

    def __str__(self):
        return f"{self.name} - {self.start_time}"

 
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

