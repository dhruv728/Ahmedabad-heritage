from rest_framework import serializers
from apps.listings.serializers import ListingSerializer
from apps.users.serializers import UserPublicSerializer
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    guest = UserPublicSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'listing', 'guest', 'check_in', 'check_out',
            'guest_count', 'total_price', 'status', 'festival_tag',
            'purpose_of_visit', 'estimated_arrival_time',
            'created_at', 'updated_at'
        )

class PriceCalculationSerializer(serializers.Serializer):
    listing_id = serializers.UUIDField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    guest_count = serializers.IntegerField(default=1)

class BookingCreateSerializer(serializers.Serializer):
    listing_id = serializers.UUIDField(required=False, allow_null=True)
    listing = serializers.UUIDField(required=False, allow_null=True)
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    guest_count = serializers.IntegerField(default=1, required=False)
    guests_count = serializers.IntegerField(required=False, allow_null=True)
    festival_tag = serializers.ChoiceField(choices=Booking.FestivalTag.choices, default=Booking.FestivalTag.NONE)
    purpose_of_visit = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    estimated_arrival_time = serializers.TimeField(required=False, allow_null=True)

    def validate(self, attrs):
        # Flexible resolution for listing_id from either listing_id or listing
        if not attrs.get('listing_id') and attrs.get('listing'):
            attrs['listing_id'] = attrs['listing']

        if not attrs.get('listing_id'):
            raise serializers.ValidationError({"listing_id": ["This field is required."]})

        if attrs.get('guests_count') and not attrs.get('guest_count'):
            attrs['guest_count'] = attrs['guests_count']

        if not attrs.get('guest_count'):
            attrs['guest_count'] = 1

        if attrs.get('check_in') and attrs.get('check_out'):
            if attrs['check_in'] >= attrs['check_out']:
                raise serializers.ValidationError({"check_out": ["Check-out date must be after check-in date."]})

        return attrs
