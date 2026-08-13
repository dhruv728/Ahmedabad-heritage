from django.db import models
from django.db.models import Q
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import PolSector, Listing
from .serializers import PolSectorSerializer, ListingSerializer, ListingCreateSerializer
from .ml_engine import SmartPricingEngine
import datetime

class PolSectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PolSector.objects.all()  # type: ignore
    serializer_class = PolSectorSerializer
    permission_classes = [permissions.AllowAny]

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().select_related('host', 'pol').prefetch_related('photos', 'availabilities')  # type: ignore
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['pol_name', 'room_type', 'heritage_verified']
    search_fields = ['title', 'description', 'pol_name', 'heritage_story']
    ordering_fields = ['price_per_night', 'created_at']

    def get_queryset(self):
        qs = Listing.objects.all().select_related('host', 'pol').prefetch_related('photos', 'availabilities')  # type: ignore
        status_param = self.request.query_params.get('status')
        if status_param:
            status_param_upper = status_param.upper()
            if status_param_upper == 'APPROVED':
                qs = qs.filter(Q(status__iexact='APPROVED') | Q(status__iexact='active') | Q(heritage_verified=True))  # type: ignore
            elif status_param_upper == 'PENDING':
                qs = qs.filter(Q(status__iexact='PENDING') | Q(status__iexact='pending') | Q(status__iexact='under_review'))  # type: ignore
            elif status_param_upper != 'ALL':
                qs = qs.filter(status__iexact=status_param)
        else:
            # Default for Traveler view / Search: return approved listings so unapproved pending properties are not shown to public travelers
            user = self.request.user
            is_admin_or_staff = user.is_authenticated and (user.is_staff or getattr(user, 'role', '').lower() == 'admin')
            if not is_admin_or_staff:
                qs = qs.filter(Q(status__iexact='APPROVED') | Q(status__iexact='active') | Q(heritage_verified=True))  # type: ignore
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ListingCreateSerializer
        return ListingSerializer

    def perform_create(self, serializer):
        serializer.save(host=self.request.user, status=Listing.Status.PENDING)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def approve(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.APPROVED
        listing.heritage_verified = True
        listing.save()
        serializer = self.get_serializer(listing)
        return Response({"message": "Listing approved successfully", "listing": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def reverify(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.PENDING
        listing.heritage_verified = False
        listing.save()
        serializer = self.get_serializer(listing)
        return Response({"message": "Listing status set to pending re-verification", "listing": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def suggested_price(self, request, pk=None):
        try:
            target_date_str = request.query_params.get('date')
            target_date = None
            if target_date_str:
                target_date = datetime.datetime.strptime(target_date_str, '%Y-%m-%d').date()
                
            suggested_price = SmartPricingEngine.suggest_price(listing_id=pk, target_date=target_date)
            return Response({"suggested_price": suggested_price}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
