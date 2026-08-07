from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from apps.listings.models import Listing, ListingAvailability
from apps.messaging.models import MessageThread
from .models import Booking

class BookingService:
    @staticmethod
    def create_booking_request(guest, listing_id, check_in, check_out, guest_count=1, festival_tag='none'):
        if check_in >= check_out:
            raise ValidationError("Check-out date must be after check-in date.")

        with transaction.atomic():
            # Acquire row-level lock on the target listing to prevent race conditions
            listing = Listing.objects.select_for_update().get(id=listing_id)

            if str(listing.status).upper() not in ['ACTIVE', 'APPROVED']:
                raise ValidationError("Listing is currently inactive or under review.")

            if guest_count > listing.max_guests:
                raise ValidationError(f"Maximum guest limit for this listing is {listing.max_guests}.")

            # Check existing active bookings for overlapping date ranges
            overlapping_bookings = Booking.objects.filter(
                listing=listing,
                status__in=[
                    Booking.Status.PENDING_APPROVAL,
                    Booking.Status.PAYMENT_PENDING,
                    Booking.Status.CONFIRMED,
                    Booking.Status.REQUESTED
                ]
            ).filter(
                Q(check_in__lt=check_out) & Q(check_out__gt=check_in)
            )

            if overlapping_bookings.exists():
                raise ValidationError("Requested dates overlap with an existing booking.")

            # Calculate total stay price checking date-specific festival surge pricing
            total_days = (check_out - check_in).days
            total_price = 0

            availabilities = ListingAvailability.objects.filter(
                listing=listing,
                date__gte=check_in,
                date__lt=check_out
            )
            availability_map = {avail.date: avail for avail in availabilities}

            current_date = check_in
            while current_date < check_out:
                avail = availability_map.get(current_date)
                if avail and not avail.is_available:
                    raise ValidationError(f"Listing is not available on {current_date}.")
                
                day_price = (avail.custom_price if avail and avail.custom_price is not None else listing.price_per_night)
                total_price += day_price
                current_date += timedelta(days=1)

            # Create booking in REQUESTED state (Upfront Payment executed)
            booking = Booking.objects.create(
                listing=listing,
                guest=guest,
                check_in=check_in,
                check_out=check_out,
                guest_count=guest_count,
                total_price=total_price,
                status=Booking.Status.REQUESTED,
                festival_tag=festival_tag,
            )

            # Initialize messaging thread for guest-host communication
            MessageThread.objects.get_or_create(booking=booking)

            return booking

    @staticmethod
    def accept_booking(booking_id, host_user):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)
            
            if booking.listing.host != host_user and not host_user.is_staff:
                raise ValidationError("Only the host can accept this booking request.")

            if str(booking.status).upper() not in ['REQUESTED', 'PENDING_APPROVAL', 'PAYMENT_PENDING']:
                raise ValidationError(f"Cannot accept booking in '{booking.status}' status.")

            # Requirement 2: Host Accept transitions status to CONFIRMED
            booking.status = Booking.Status.CONFIRMED
            booking.save()
            return booking

    @staticmethod
    def reject_booking(booking_id, host_user):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)

            if booking.listing.host != host_user and not host_user.is_staff:
                raise ValidationError("Only the host can decline this booking request.")

            if str(booking.status).upper() in ['CANCELLED', 'CANCELLED_REFUNDED', 'REJECTED', 'STAYED']:
                raise ValidationError(f"Booking is already {booking.status}.")

            # Requirement 1: Host decline transitions status to CANCELLED_REFUNDED & logs refund
            booking.status = Booking.Status.CANCELLED_REFUNDED
            booking.save()

            from apps.payments.models import Payment
            Payment.objects.filter(booking=booking).update(status=Payment.Status.REFUNDED)
            return booking

    @staticmethod
    def check_in_guest(booking_id, host_user):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)

            if booking.listing.host != host_user and not host_user.is_staff:
                raise ValidationError("Only the host can check-in guests.")

            if str(booking.status).upper() != 'CONFIRMED':
                raise ValidationError(f"Cannot check-in booking in '{booking.status}' status.")

            booking.status = Booking.Status.CHECKED_IN
            booking.save()
            return booking

    @staticmethod
    def check_out_guest(booking_id, host_user):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)

            if booking.listing.host != host_user and not host_user.is_staff:
                raise ValidationError("Only the host can check-out guests.")

            if str(booking.status).upper() != 'CHECKED_IN':
                raise ValidationError(f"Cannot check-out booking in '{booking.status}' status.")

            # Requirement 2: Check-Out sets status to STAYED (Completed)
            booking.status = Booking.Status.STAYED
            booking.save()
            return booking

    @staticmethod
    def cancel_booking(booking_id, user):
        from datetime import date
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)

            if booking.guest != user and booking.listing.host != user and not user.is_staff:
                raise ValidationError("You do not have permission to cancel this booking.")

            # Requirement 3: Cancellation rule (Must be > 48 hours / 2 days prior to check_in date)
            days_until_checkin = (booking.check_in - date.today()).days
            if days_until_checkin < 2:
                raise ValidationError("Cancellations are only allowed at least 48 hours prior to check-in.")

            if str(booking.status).upper() in ['CANCELLED', 'CANCELLED_REFUNDED', 'REJECTED', 'STAYED', 'CHECKED_IN']:
                raise ValidationError(f"Booking cannot be cancelled in '{booking.status}' status.")

            booking.status = Booking.Status.CANCELLED
            booking.save()
            return booking

    @staticmethod
    def update_booking(booking_id, user, check_in=None, check_out=None, guest_count=None):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)

            if booking.guest != user and not user.is_staff:
                raise ValidationError("Only the guest can edit this booking.")

            # Requirement 3: Edit rule (Allowed ONLY while status is REQUESTED)
            if str(booking.status).upper() not in ['REQUESTED', 'PENDING_APPROVAL']:
                raise ValidationError("Editing is only allowed while booking is in REQUESTED status.")

            if check_in:
                booking.check_in = check_in
            if check_out:
                booking.check_out = check_out
            if guest_count:
                booking.guest_count = guest_count

            if booking.check_in >= booking.check_out:
                raise ValidationError("Check-out date must be after check-in date.")

            # Re-calculate price
            total_days = (booking.check_out - booking.check_in).days
            booking.total_price = booking.listing.price_per_night * total_days
            booking.save()
            return booking
