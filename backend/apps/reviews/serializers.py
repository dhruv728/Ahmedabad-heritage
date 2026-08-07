from rest_framework import serializers
from apps.users.serializers import UserPublicSerializer
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserPublicSerializer(read_only=True)
    reviewee = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'booking', 'reviewer', 'reviewee', 'rating', 'comment', 'is_visible', 'created_at')

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('booking', 'reviewee', 'rating', 'comment')
