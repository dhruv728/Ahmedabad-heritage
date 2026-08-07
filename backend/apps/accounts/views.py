from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            role_str = str(user.role).upper()
            return Response({
                "message": "User registered successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone or '',
                    "role": role_str,
                    "username": user.username,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        errors = serializer.errors
        err_msg = "Registration failed."
        if "email" in errors:
            err_msg = errors["email"][0] if isinstance(errors["email"], list) else str(errors["email"])
        elif "password" in errors:
            err_msg = errors["password"][0] if isinstance(errors["password"], list) else str(errors["password"])
        elif isinstance(errors, dict) and len(errors) > 0:
            first_key = list(errors.keys())[0]
            err_msg = errors[first_key][0] if isinstance(errors[first_key], list) else str(errors[first_key])
        return Response({"detail": err_msg, "error": errors}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            role_str = str(user.role).upper()
            return Response({
                "message": "Login successful.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone or '',
                    "role": role_str,
                    "username": user.username,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        return Response({"detail": "Invalid Email or Password", "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_str = str(user.role).upper()
        return Response({
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone or '',
            "role": role_str,
            "username": user.username,
            "is_staff": user.is_staff,
        })

class OTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            # Mock OTP dispatch hook (e.g. Twilio / MSG91)
            return Response({
                "message": f"OTP successfully dispatched to {phone}.",
                "mock_otp": "123456"
            }, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            tokens = serializer.validated_data['tokens']
            user = serializer.validated_data['user']
            return Response({
                "message": "OTP verification successful.",
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "role": user.role,
                },
                "tokens": tokens
            }, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(SimpleJWTTokenRefreshView):
    permission_classes = [AllowAny]
