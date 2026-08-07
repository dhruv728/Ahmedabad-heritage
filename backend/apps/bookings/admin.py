from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'listing', 'guest', 'check_in', 'check_out',
        'guest_count', 'total_price', 'status', 'festival_tag', 'created_at'
    )
    list_filter = ('status', 'festival_tag', 'check_in')
    search_fields = ('id', 'listing__title', 'guest__full_name', 'guest__phone')
