from django.core.exceptions import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from .services import BookingService

class BookingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Booking.objects.all().select_related('listing', 'guest')
        # Return bookings where current user is either guest or host
        return Booking.objects.filter(
            guest=user
        ) | Booking.objects.filter(
            listing__host=user
        )

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            booking = BookingService.create_booking_request(
                guest=request.user,
                listing_id=data['listing_id'],
                check_in=data['check_in'],
                check_out=data['check_out'],
                guest_count=data.get('guest_count', 1),
                festival_tag=data.get('festival_tag', 'none'),
            )
            response_serializer = BookingSerializer(booking)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None, *args, **kwargs):
        check_in = request.data.get('check_in')
        check_out = request.data.get('check_out')
        guest_count = request.data.get('guest_count')
        new_status = request.data.get('status')

        try:
            booking = self.get_object()
            if new_status:
                booking.status = new_status
                booking.save()
            if check_in or check_out or guest_count:
                booking = BookingService.update_booking(
                    booking_id=pk,
                    user=request.user,
                    check_in=check_in,
                    check_out=check_out,
                    guest_count=guest_count
                )
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='host-bookings')
    def host_bookings(self, request):
        bookings = Booking.objects.filter(listing__host=request.user).select_related('listing', 'guest')
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'])
    def accept(self, request, pk=None):
        try:
            booking = BookingService.accept_booking(booking_id=pk, host_user=request.user)
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'post'])
    def reject(self, request, pk=None):
        try:
            booking = BookingService.reject_booking(booking_id=pk, host_user=request.user)
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'post'])
    def cancel(self, request, pk=None):
        try:
            booking = BookingService.cancel_booking(booking_id=pk, user=request.user)
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'post'], url_path='check_in')
    def check_in(self, request, pk=None):
        try:
            booking = BookingService.check_in_guest(booking_id=pk, host_user=request.user)
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'post'], url_path='check_out')
    def check_out(self, request, pk=None):
        try:
            booking = BookingService.check_out_guest(booking_id=pk, host_user=request.user)
            return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
