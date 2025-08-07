from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re
import random

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name')

    # def validate_password(self, value):
    #     if len(value) < 8:
    #         raise serializers.ValidationError(
    #             _("Password must be at least 8 characters long.")
    #         )
    #     if not any(char.isupper() for char in value):
    #         raise serializers.ValidationError(
    #             _("Password must contain at least one uppercase letter.")
    #         )
    #     if not any(char.islower() for char in value):
    #         raise serializers.ValidationError(
    #             _("Password must contain at least one lowercase letter.")
    #         )
    #     if not any(char.isdigit() for char in value):
    #         raise serializers.ValidationError(
    #             _("Password must contain at least one digit.")
    #         )
    #     if not re.search(r"[!@#$%^&*()_+{}\[\]:;\"'\\|<,>.?/`~-]", value):
    #         raise serializers.ValidationError(
    #             _("Password must contain at least one special character.")
    #         )
    #     validate_password(value)
    #     return value

    def create(self, validated_data):
        full_name = validated_data.get('full_name', '')
        first_name = full_name.split()[0] if full_name else 'user'
        base_username = slugify(first_name)

        while True:
            username = f"{base_username}{random.randint(1000, 9999)}"
            if not User.objects.filter(username=username).exists():
                break

        user = User.objects.create_user(
            email=validated_data['email'],
            username=username,
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            is_active=False
        )
        return user

class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username  # Add username to the token payload
        token['full_name'] = user.full_name
        token['profile_pic'] = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'

        if user.profile_pic:
            token['profile_pic'] = user.profile_pic

        return token
