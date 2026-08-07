from django.db.models import Sum, Q
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.listings.models import Listing
from apps.bookings.models import Booking

class AdminDashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_travelers = User.objects.filter(role__iexact='traveler').count()
        total_hosts = User.objects.filter(role__iexact='host').count()
        
        active_listings = Listing.objects.filter(Q(status__iexact='APPROVED') | Q(status__iexact='active')).count()
        pending_approvals = Listing.objects.filter(Q(status__iexact='PENDING') | Q(status__iexact='pending') | Q(status__iexact='under_review')).count()
        
        total_bookings = Booking.objects.count()
        total_revenue = Booking.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0

        return Response({
            "total_travelers": total_travelers,
            "total_hosts": total_hosts,
            "active_listings": active_listings,
            "pending_approvals": pending_approvals,
            "total_bookings": total_bookings,
            "total_revenue": float(total_revenue),
        }, status=status.HTTP_200_OK)
