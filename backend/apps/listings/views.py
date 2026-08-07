from django.db import models
from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import PolSector, Listing
from .serializers import PolSectorSerializer, ListingSerializer, ListingCreateSerializer

class PolSectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PolSector.objects.all()
    serializer_class = PolSectorSerializer
    permission_classes = [permissions.AllowAny]

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().select_related('host', 'pol').prefetch_related('photos', 'availabilities')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['pol_name', 'room_type', 'heritage_verified']
    search_fields = ['title', 'description', 'pol_name', 'heritage_story']
    ordering_fields = ['price_per_night', 'created_at']

    def get_queryset(self):
        qs = Listing.objects.all().select_related('host', 'pol').prefetch_related('photos', 'availabilities')
        status_param = self.request.query_params.get('status')
        if status_param:
            status_param_upper = status_param.upper()
            if status_param_upper == 'APPROVED':
                qs = qs.filter(models.Q(status__iexact='APPROVED') | models.Q(status__iexact='active'))
            elif status_param_upper == 'PENDING':
                qs = qs.filter(models.Q(status__iexact='PENDING') | models.Q(status__iexact='pending') | models.Q(status__iexact='under_review'))
            else:
                qs = qs.filter(status__iexact=status_param)
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

    from rest_framework.decorators import action
    from rest_framework.response import Response
    from rest_framework import status

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def approve(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.APPROVED
        listing.heritage_verified = True
        listing.save()
        serializer = self.get_serializer(listing)
        return Response({"message": "Listing approved successfully", "listing": serializer.data}, status=status.HTTP_200_OK)
