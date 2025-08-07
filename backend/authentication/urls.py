from django.urls import path
from .views import (
    UserLoginView, 
    UserRegistrationView,
    VerifyToken,
    VerifyOTP,
    GoogleLogin,
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('verify-otp-token/', VerifyToken.as_view(), name='verify-token'),
    path('verify-otp/', VerifyOTP.as_view(), name='verify-otp'),
    path('google/', GoogleLogin.as_view(), name='google-login')
]
