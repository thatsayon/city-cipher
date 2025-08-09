from django.db import models
from .leaderboard.models import *
import uuid

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

 
