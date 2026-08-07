from rest_framework import serializers

class PriceSuggestionInputSerializer(serializers.Serializer):
    pol_name = serializers.CharField(max_length=150, default='Mangaldas Pol')
    room_type = serializers.ChoiceField(
        choices=['private_room', 'entire_haveli', 'shared_room'],
        default='private_room'
    )
    max_guests = serializers.IntegerField(default=2, min_value=1, max_value=20)
    heritage_verified = serializers.BooleanField(default=False)
    festival_tag = serializers.ChoiceField(
        choices=['uttarayan', 'navratri', 'diwali', 'none'],
        default='none'
    )
    days_to_event = serializers.IntegerField(default=14, min_value=1, max_value=365)
