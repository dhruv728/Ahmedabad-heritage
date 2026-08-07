from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'booking', 'amount', 'gateway_order_id', 'gateway_payment_id', 'status', 'payout_status', 'created_at')

class CreateOrderSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()

class WebhookSerializer(serializers.Serializer):
    event = serializers.CharField()
    payload = serializers.JSONField()
