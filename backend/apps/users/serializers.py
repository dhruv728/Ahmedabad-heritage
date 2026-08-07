from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'phone', 'profile_photo_url', 'is_id_verified', 'role')

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'phone', 'email', 'profile_photo_url', 'preferred_language', 'is_phone_verified', 'is_id_verified', 'role', 'created_at')
        read_only_fields = ('id', 'username', 'is_phone_verified', 'is_id_verified', 'created_at')
