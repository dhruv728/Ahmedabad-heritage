import uuid
from django.conf import settings
from django.contrib.postgres.constraints import ExclusionConstraint
from django.db import models
from django.db.models import Func, Q

class Booking(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested (Payment Held)'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CHECKED_IN = 'CHECKED_IN', 'Checked In'
        STAYED = 'STAYED', 'Stayed (Completed)'
        CANCELLED_REFUNDED = 'CANCELLED_REFUNDED', 'Cancelled & Refunded'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        PAYMENT_PENDING = 'PAYMENT_PENDING', 'Payment Pending'
        COMPLETED = 'COMPLETED', 'Completed'

    class FestivalTag(models.TextChoices):
        UTTARAYAN = 'uttarayan', 'Uttarayan'
        NAVRATRI = 'navratri', 'Navratri'
        DIWALI = 'diwali', 'Diwali'
        NONE = 'none', 'None'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='bookings')
    guest = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    guest_count = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.REQUESTED)
    festival_tag = models.CharField(max_length=50, choices=FestivalTag.choices, default=FestivalTag.NONE)
    purpose_of_visit = models.CharField(max_length=100, null=True, blank=True)
    estimated_arrival_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        pass

    def __str__(self):
        listing_title = getattr(self.listing, 'title', 'Stay')
        return f"Booking #{self.id} - {listing_title} ({self.check_in} to {self.check_out})"
