from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    OTPRequestView,
    OTPVerifyView,
    TokenRefreshView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/', LoginView.as_view(), name='token'),
    path('me/', CurrentUserView.as_view(), name='me'),
    path('otp/request/', OTPRequestView.as_view(), name='otp_request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
