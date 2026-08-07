from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(default='traveler')

    class Meta:
        model = User
        fields = ('id', 'username', 'phone', 'full_name', 'email', 'password', 'role')

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if not attrs.get('username') and attrs.get('email'):
            attrs['username'] = attrs['email']
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.get('email')
        if not validated_data.get('username'):
            validated_data['username'] = email
        # Normalize role to lowercase
        if 'role' in validated_data:
            validated_data['role'] = validated_data['role'].lower()
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=False)
    phone_or_email = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get('email') or attrs.get('phone_or_email')
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError({"detail": "Invalid Email or Password", "error": "Invalid Email or Password"})

        user = User.objects.filter(email=identifier).first() or User.objects.filter(username=identifier).first() or User.objects.filter(phone=identifier).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid Email or Password", "error": "Invalid Email or Password"})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled.", "error": "User account is disabled."})

        attrs['user'] = user
        return attrs

class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)

class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        phone = attrs.get('phone')
        otp = attrs.get('otp')

        # Development mock OTP verification (accepts '123456' or any 6-digit code for testing)
        if len(otp) != 6:
            raise serializers.ValidationError({"otp": "OTP must be a 6-digit code."})

        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={'full_name': f"User {phone[-4:]}", 'username': phone, 'is_phone_verified': True}
        )

        if not user.is_phone_verified:
            user.is_phone_verified = True
            user.save()

        refresh = RefreshToken.for_user(user)
        attrs['tokens'] = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        attrs['user'] = user
        return attrs
