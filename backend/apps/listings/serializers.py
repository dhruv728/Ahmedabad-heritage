from rest_framework import serializers
from apps.users.serializers import UserPublicSerializer
from .models import PolSector, Listing, ListingPhoto, ListingAvailability

class PolSectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolSector
        fields = '__all__'

class ListingPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingPhoto
        fields = ('id', 'photo_url', 'display_order')

class ListingAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingAvailability
        fields = ('id', 'date', 'is_available', 'custom_price')

class ListingSerializer(serializers.ModelSerializer):
    host = UserPublicSerializer(read_only=True)
    pol = PolSectorSerializer(read_only=True)
    photos = ListingPhotoSerializer(many=True, read_only=True)
    availabilities = ListingAvailabilitySerializer(many=True, read_only=True)
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            'id', 'host', 'pol', 'pol_name', 'title', 'description',
            'heritage_story', 'address_line', 'latitude', 'longitude',
            'price_per_night', 'max_guests', 'room_type', 'amenities',
            'heritage_verified', 'status', 'photos', 'availabilities',
            'rating', 'review_count',
            'created_at', 'updated_at'
        )

    def get_rating(self, obj):
        from apps.reviews.models import Review
        from django.db.models import Avg
        avg = Review.objects.filter(booking__listing=obj, is_visible=True).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else 4.9

    def get_review_count(self, obj):
        from apps.reviews.models import Review
        return Review.objects.filter(booking__listing=obj, is_visible=True).count()

class ListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = (
            'pol', 'pol_name', 'title', 'description', 'heritage_story',
            'address_line', 'latitude', 'longitude', 'price_per_night',
            'max_guests', 'room_type', 'amenities'
        )

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)
