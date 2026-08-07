import uuid
from django.db import models

class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CAPTURED = 'captured', 'Captured'
        REFUNDED = 'refunded', 'Refunded'
        FAILED = 'failed', 'Failed'

    class PayoutStatus(models.TextChoices):
        HELD = 'held', 'Held'
        RELEASED = 'released', 'Released'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    gateway_order_id = models.CharField(max_length=150, null=True, blank=True)
    gateway_payment_id = models.CharField(max_length=150, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payout_status = models.CharField(max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.HELD)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} - ₹{self.amount} ({self.status})"
