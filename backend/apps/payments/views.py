from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.bookings.models import Booking
from .models import Payment
from .serializers import PaymentSerializer, CreateOrderSerializer, WebhookSerializer

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(booking__guest=user) | Payment.objects.filter(booking__listing__host=user)

    @action(detail=False, methods=['post'], url_path='create-order')
    def create_order(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking_id = serializer.validated_data['booking_id']

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.guest != request.user and not request.user.is_staff:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Mock Razorpay / Stripe Order Creation
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'amount': booking.total_price,
                'gateway_order_id': f"order_mock_{booking.id.hex[:12]}",
                'status': Payment.Status.PENDING,
            }
        )

        return Response({
            "order_id": payment.gateway_order_id,
            "amount": float(payment.amount),
            "currency": "INR",
            "key_id": "rzp_test_mock_key",
            "payment_id": str(payment.id),
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='process')
    def process_payment(self, request):
        booking_id = request.data.get('booking_id')
        payment_method = request.data.get('payment_method', 'upi')

        if not booking_id:
            return Response({"error": "booking_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.guest != request.user and not request.user.is_staff:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        import uuid
        txn_id = f"TXN-AHHE-{uuid.uuid4().hex[:10].upper()}"

        payment, _ = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'amount': booking.total_price,
                'gateway_order_id': f"order_{booking.id.hex[:10]}",
                'gateway_payment_id': txn_id,
                'status': Payment.Status.CAPTURED,
            }
        )
        payment.status = Payment.Status.CAPTURED
        payment.gateway_payment_id = txn_id
        payment.save()

        booking.status = Booking.Status.REQUESTED
        booking.save()

        return Response({
            "status": "success",
            "transaction_id": txn_id,
            "booking_status": "REQUESTED",
            "amount": float(booking.total_price),
            "payment_method": payment_method
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='webhook')
    def webhook(self, request):
        serializer = WebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.validated_data['event']
        payload = serializer.validated_data['payload']

        if event == 'payment.captured':
            payment_id = payload.get('payment_id')
            if payment_id:
                Payment.objects.filter(id=payment_id).update(status=Payment.Status.CAPTURED)

        return Response({"status": "received"}, status=status.HTTP_200_OK)
