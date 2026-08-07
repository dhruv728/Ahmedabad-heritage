from django.contrib import admin
from .models import PolSector, Listing, ListingPhoto, ListingAvailability

class ListingPhotoInline(admin.TabularInline):
    model = ListingPhoto
    extra = 1

class ListingAvailabilityInline(admin.TabularInline):
    model = ListingAvailability
    extra = 1

@admin.register(PolSector)
class PolSectorAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'created_at')
    search_fields = ('name', 'description', 'heritage_notes')

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'host', 'pol_name', 'price_per_night',
        'room_type', 'heritage_verified', 'status', 'created_at'
    )
    list_filter = ('status', 'heritage_verified', 'room_type', 'pol_name')
    search_fields = ('title', 'description', 'pol_name', 'host__full_name', 'host__phone')
    inlines = [ListingPhotoInline, ListingAvailabilityInline]
    actions = ['approve_heritage_authenticity', 'reject_listing', 'mark_under_review']

    @admin.action(description='Approve Heritage Authenticity & Activate Listing')
    def approve_heritage_authenticity(self, request, queryset):
        updated = queryset.update(heritage_verified=True, status=Listing.Status.ACTIVE)
        self.message_user(request, f"{updated} listings successfully approved and activated.")

    @admin.action(description='Reject & Deactivate selected listings')
    def reject_listing(self, request, queryset):
        updated = queryset.update(heritage_verified=False, status=Listing.Status.INACTIVE)
        self.message_user(request, f"{updated} listings marked as inactive.")

    @admin.action(description='Mark selected listings Under Review')
    def mark_under_review(self, request, queryset):
        updated = queryset.update(status=Listing.Status.UNDER_REVIEW)
        self.message_user(request, f"{updated} listings marked as under review.")
