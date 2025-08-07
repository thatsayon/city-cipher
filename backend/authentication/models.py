from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import uuid
from django.conf import settings


class CustomAccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The email must be set"))

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)

class UserAccount(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField(_("email address"), unique=True)
    username = models.CharField(_("username"), max_length=30, unique=True)
    full_name = models.CharField(_("full name"), max_length=50)
    profile_pic = models.URLField(_("profile picture"), blank=True, null=True)

    gender = models.CharField(max_length=1, choices=[
        ('m', 'Male'),
        ('f', 'Female'),
        ('o', 'Other')
    ], blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    is_google_auth = models.BooleanField(default=False)
    did_google_auth = models.BooleanField(default=False)
    deletion_scheduled_at = models.DateTimeField(null=True, blank=True)

    username_update_count = models.PositiveIntegerField(default=0)
    last_username_update = models.DateTimeField(null=True, blank=True)
    new_email = models.EmailField(_("new email address"), unique=True, blank=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='useraccount_groups',
        blank=True,
        help_text=_('The groups this user belongs to.'),
        verbose_name=_('groups'),
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='useraccount_permissions',
        blank=True,
        help_text=_('Specific permissions for this user.'),
        verbose_name=_('user permissions'),
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "full_name"]

    objects = CustomAccountManager()

    def __str__(self):
        return f"{self.username} ({self.email})"

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.username

    class Meta:
        verbose_name = _("User Account")
        verbose_name_plural = _("User Accounts")

class OTP(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, unique=True
    )
    user = models.ForeignKey(
        'UserAccount',  # or your full user model reference
        on_delete=models.CASCADE,
        related_name='otps',
        verbose_name=_("User")
    )
    otp = models.CharField(_("otp"), max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        expiry_duration = getattr(settings, 'OTP_VALIDITY_DURATION', 5)  # minutes
        return timezone.now() <= self.created_at + timezone.timedelta(minutes=expiry_duration)

    def __str__(self):
        return f"OTP({self.otp}) for {self.user.email}"

    class Meta:
        verbose_name = _("One-Time Password")
        verbose_name_plural = _("One-Time Passwords")
        indexes = [
            models.Index(fields=['created_at']),  # speeds up deletion queries
        ]
