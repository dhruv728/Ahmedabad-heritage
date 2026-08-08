import uuid
from django.conf import settings
from django.db import models

class PolSector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    heritage_notes = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return str(self.name)

class Listing(models.Model):
    class RoomType(models.TextChoices):
        PRIVATE_ROOM = 'private_room', 'Private Room'
        ENTIRE_HAVELI = 'entire_haveli', 'Entire Haveli'
        SHARED_ROOM = 'shared_room', 'Shared Room'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        UNDER_REVIEW = 'under_review', 'Under Review'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    pol = models.ForeignKey(PolSector, on_delete=models.SET_NULL, null=True, blank=True, related_name='listings')
    pol_name = models.CharField(max_length=150)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    heritage_story = models.TextField(blank=True)
    address_line = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    max_guests = models.IntegerField(default=1)
    room_type = models.CharField(max_length=50, choices=RoomType.choices, default=RoomType.PRIVATE_ROOM)
    amenities = models.JSONField(default=dict, blank=True)
    heritage_verified = models.BooleanField(default=False)
    property_document_url = models.CharField(max_length=500, null=True, blank=True)
    property_document_type = models.CharField(max_length=100, default='Rental Agreement / Tax Receipt')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.pol_name}"

class ListingPhoto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='photos')
    photo_url = models.URLField(max_length=500)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"Photo {self.display_order} for {self.listing.title}"

class ListingAvailability(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    is_available = models.BooleanField(default=True)
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('listing', 'date')
        verbose_name_plural = 'Listing Availabilities'

    def __str__(self):
        return f"{self.listing.title} - {self.date} ({'Available' if self.is_available else 'Blocked'})"
