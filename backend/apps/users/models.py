import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        HOST = 'host', 'Host'
        TRAVELER = 'traveler', 'Traveler'
        ADMIN = 'admin', 'Admin'

    class VerificationStatus(models.TextChoices):
        VERIFIED = 'VERIFIED', 'Verified'
        PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
        REVERIFICATION_REQUIRED = 'REVERIFICATION_REQUIRED', 'Re-verification Required'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    profile_photo_url = models.URLField(max_length=500, null=True, blank=True)
    home_city = models.CharField(max_length=100, null=True, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    is_phone_verified = models.BooleanField(default=False)
    is_id_verified = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING_VERIFICATION
    )
    id_document_url = models.CharField(max_length=500, null=True, blank=True)
    resubmitted_at = models.DateTimeField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.TRAVELER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ['full_name']

    def save(self, *args, **kwargs):
        if not self.email:
            self.email = None  # type: ignore
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.phone}"
