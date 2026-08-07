from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('reviewer', 'reviewee', 'booking')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        return Review.objects.all()

    def create(self, request, *args, **kwargs):
        booking_id = request.data.get('booking_id') or request.data.get('booking')
        rating = request.data.get('rating', 5)
        comment = request.data.get('comment', '')
        listing_id = request.data.get('listing_id') or request.data.get('listing')

        from apps.bookings.models import Booking
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
            except Exception:
                pass
        if not booking and listing_id:
            booking = Booking.objects.filter(listing_id=listing_id).first()

        if not booking:
            from apps.listings.models import Listing
            listing = Listing.objects.filter(id=listing_id).first() if listing_id else Listing.objects.first()
            if listing:
                booking = Booking.objects.filter(listing=listing).first()

        if not booking:
            return Response({"error": "Valid listing or booking reference is required for reviews."}, status=status.HTTP_400_BAD_REQUEST)

        reviewee = booking.listing.host if (booking and booking.listing and booking.listing.host) else request.user

        review = Review.objects.create(
            booking=booking,
            reviewer=request.user,
            reviewee=reviewee,
            rating=int(rating),
            comment=str(comment),
            is_visible=True
        )

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
