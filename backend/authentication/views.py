from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate, get_user_model
from django.utils.timezone import now
from django.http import HttpResponse
from django.shortcuts import render
from django.shortcuts import redirect
from django.db import transaction
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

from urllib.parse import urlencode
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import timezone
from .serializers import (
    EmailLoginSerializer,
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer
)
from .models import OTP
from .utils import (
    generate_otp,
    generate_username,
    create_otp_token,
    decode_otp_token,
)
import requests as req
import os

User = get_user_model()


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()

                otp = generate_otp()
                OTP.objects.create(user=user, otp=otp, created_at=now())

                try:
                    email_subject = "Confirm your email"
                    email_body = render_to_string(
                        'confirm_email.html', {'email_otp': otp, 'full_name': user.full_name})
                    email = EmailMultiAlternatives(
                        email_subject, '', to=[user.email])
                    email.attach_alternative(email_body, "text/html")
                    email.send()
                    verificationToken = create_otp_token(user.id)

                    response = Response(
                        {"message": "User registration successful. OTP sent to email."},
                        status=status.HTTP_201_CREATED,
                    )
                    response.set_cookie(
                        "verificationToken",
                        verificationToken,
                        httponly=True,  # Makes it inaccessible via JavaScript
                        secure=True,    # Sends it only over HTTPS
                        samesite="None",  # Restricts cross-site cookie usage
                        max_age=60*5
                    )
                    return response

                except Exception as e:
                    user.delete()
                    return Response(
                        {"error": "Failed to send verification email. User registration rolled back."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VerifyToken(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        otp_token = request.COOKIES.get('verificationToken')
        if not otp_token:
            return Response({"error": "No token found."}, status=status.HTTP_400_BAD_REQUEST)

        decoded = decode_otp_token(otp_token)
        if not decoded:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Valid token."}, status=status.HTTP_200_OK)


class VerifyOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        otp = request.data.get('otp')

        # Retrieve the OTP token from cookies
        otp_token = request.COOKIES.get('verificationToken')
        if not otp_token or not otp:
            return Response({"error": "OTP token and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Decode the token
        decoded = decode_otp_token(otp_token)
        if not decoded:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        # Get the user ID from the token
        user_id = decoded.get("user_id")
        try:
            user = User._default_manager.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        otp_instance = user.otps.filter(otp=otp).first()
        if not otp_instance or not otp_instance.is_valid():
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Activate the user and clear OTPs
        user.is_active = True
        user.otps.all().delete()
        user.save()

        # Generate tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access_token = str(refresh.access_token)

        # Set refresh token as an HttpOnly cookie
        response = Response({"access_token": access_token}, status=status.HTTP_200_OK)
        response.delete_cookie(
            key='verificationToken',
            path='/',  # Match the original path
            domain=None,  # Match the original domain, if any
            samesite='None'  # Match the original SameSite policy
        )
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=True,  # Use Secure flag if using HTTPS
            samesite='None',
            max_age=60*60*24,
        )

        return response

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data.get("email")
            password = serializer.validated_data.get("password")

            if not email or not password:
                return Response(
                    {"error": "Email and password are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Attempt to authenticate using Django's built-in method
            user = authenticate(username=email, password=password)

            # If authentication fails, it might be because the account is inactive
            # Check manually if the account is scheduled for deletion
            if not user:
                try:
                    candidate = User.objects.get(email=email)
                except User.DoesNotExist:
                    return Response(
                        {"error": "Invalid email or password."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                # If the account is inactive but has a scheduled deletion in the future,
                # allow login by checking the password manually.
                if (candidate.deletion_scheduled_at and candidate.deletion_scheduled_at > timezone.now() and 
                        candidate.check_password(password)):
                    user = candidate
                else:
                    return Response(
                        {"error": "Invalid email or password."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

            # If the user is still inactive, check if it's due to a scheduled deletion.
            if not user.is_active:
                if user.deletion_scheduled_at and user.deletion_scheduled_at > timezone.now():
                    # Cancel the scheduled deletion and reactivate the account.
                    user.deletion_scheduled_at = None
                    user.is_active = True
                    user.save()
                else:
                    return Response(
                        {"error": "User account is inactive."},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Generate tokens using your custom serializer
            refresh = CustomTokenObtainPairSerializer.get_token(user)
            access = refresh.access_token

            response = Response(
                {"access_token": str(access)},
                status=status.HTTP_200_OK,
            )

            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=True,       # Set to True in production
                samesite="None",   # Adjust based on your requirements
                max_age=60*60*24,
                path='/',
            )

            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLogin(APIView):
    permission_classes = [AllowAny]
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    REDIRECT_URI = 'http://localhost:5173'

    def get(self, request):
        code = request.GET.get('code')
        if not code:
            # No code provided, so build the authorization URL and redirect to Google.
            params = {
                'client_id': self.GOOGLE_CLIENT_ID,
                'redirect_uri': self.REDIRECT_URI,
                'response_type': 'code',
                'scope': 'openid email profile',
                'access_type': 'offline',
                'prompt': 'consent',  # Forces account selection and consent screen.
            }
            auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
            return redirect(auth_url)

        # Exchange code for tokens
        token_data = {
            'code': code,
            'client_id': self.GOOGLE_CLIENT_ID,
            'client_secret': self.GOOGLE_CLIENT_SECRET,
            'redirect_uri': self.REDIRECT_URI,
            'grant_type': 'authorization_code'
        }

        token_response = req.post('https://oauth2.googleapis.com/token', data=token_data)
        token_json = token_response.json()

        if 'error' in token_json:
            return Response({"error": token_json['error']}, status=status.HTTP_400_BAD_REQUEST)

        id_token_jwt = token_json.get('id_token')

        try:
            # Verify the ID token
            # idinfo = id_token.verify_oauth2_token(id_token_jwt, requests.Request(), self.GOOGLE_CLIENT_ID)
            idinfo = id_token.verify_oauth2_token(
                id_token_jwt,
                google_requests.Request(),  # Use Google's Request class
                self.GOOGLE_CLIENT_ID
            )
            email = idinfo.get('email')
            name = idinfo.get('name')
            profile_pic = idinfo.get('picture')

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": generate_username(name), "is_active": True, "profile_pic": profile_pic}
            )

            if created:
                user.is_google_auth = True
                user.did_google_auth = True
                user.save()

            if not user.is_active:
                if user.deletion_scheduled_at and user.deletion_scheduled_at > timezone.now():
                    user.deletion_scheduled_at = None
                    user.is_active = True
                    user.save()

            refresh = CustomTokenObtainPairSerializer.get_token(user)
            access = refresh.access_token

            response = HttpResponse(status=302)  # 302 means temporary redirect
            # response["Location"] = "https://edcluster.com"
            response["Location"] = "https://www.edcluster.com"
            # response["Location"] = "http://localhost:3000"

            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=60 * 60 * 24,  # 1 day
                path="/",
                domain="edcluster.com"
            )

            response.set_cookie(
                key="access_token",
                value=str(access),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=60 * 60 * 24,  # 1 day
                path="/",
                domain="edcluster.com"
            )
            # response.set_cookie(
            #     key="refresh_token",
            #     value=str(refresh),
            #     httponly=False,
            #     secure=False,
            #     samesite="None",
            #     max_age=60 * 60 * 24,  # 1 day
            #     path="/"
            # )
            #
            # response.set_cookie(
            #     key="access_token",
            #     value=str(access),
            #     httponly=False,
            #     secure=False,
            #     samesite="None",
            #     max_age=60 * 60 * 24,  # 1 day
            #     path="/"
            # )


            return response
        except ValueError as e:
            return Response({"error": f"Invalid token: {e}"}, status=status.HTTP_400_BAD_REQUEST)
 
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"detail": "Refresh token missing or malformed."}, status=status.HTTP_400_BAD_REQUEST)

        refresh_token = auth_header.split(" ")[1]
        try:
            # Validate and use the refresh token to generate a new access token
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response({"detail": "Access token refreshed successfully."}, status=status.HTTP_200_OK)


            response.set_cookie(
                key="access_token",
                value=str(access_token),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=60 * 60 * 24,  # 1 day
                path="/",
                domain="edcluster.com"
            )
            response = Response({
                "access_token": access_token,
                "expires": 5
            }, status=status.HTTP_200_OK)
            return response
        except TokenError:
            # Handle invalid or expired refresh tokens
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            # Handle unexpected errors
            return Response(
                {"detail": "An unexpected error occurred while processing the refresh token."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class Test(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = Response(
            {"message": "working"},
            status=status.HTTP_200_OK
        )
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({"error": "Refresh token not found in cookies"}, status=400)

            token = RefreshToken(refresh_token)
            token.blacklist()

            response = Response({"message": "Successfully logged out"}, status=200)
            return response
        except TokenError:
            return Response({"error": "Invalid or expired token"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
