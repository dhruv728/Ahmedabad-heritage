from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from apps.listings.models import PolSector, Listing, ListingAvailability
from apps.bookings.models import Booking
from apps.bookings.services import BookingService

User = get_user_model()

class BookingEngineTestCase(TestCase):
    def setUp(self):
        self.host = User.objects.create_user(
            username='host_user',
            phone='+919876543210',
            email='host@ahhe.org',
            full_name='Ramesh Shah',
            role=User.Role.HOST
        )
        self.guest = User.objects.create_user(
            username='guest_user',
            phone='+919876543211',
            email='guest@ahhe.org',
            full_name='Anita Sharma',
            role=User.Role.TRAVELER
        )
        self.pol = PolSector.objects.create(name='Mangaldas Ni Pol')
        self.listing = Listing.objects.create(
            host=self.host,
            pol=self.pol,
            pol_name='Mangaldas Ni Pol',
            title='Traditional Heritage Haveli Room',
            price_per_night=2500.00,
            max_guests=3,
            status=Listing.Status.ACTIVE
        )

    def test_successful_booking_creation(self):
        check_in = date.today() + timedelta(days=5)
        check_out = date.today() + timedelta(days=7)

        booking = BookingService.create_booking_request(
            guest=self.guest,
            listing_id=self.listing.id,
            check_in=check_in,
            check_out=check_out,
            guest_count=2,
            festival_tag='uttarayan'
        )

        self.assertEqual(booking.status, Booking.Status.REQUESTED)
        self.assertEqual(booking.total_price, 5000.00)
        self.assertEqual(booking.guest, self.guest)
        self.assertEqual(booking.listing, self.listing)

    def test_double_booking_prevention(self):
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)

        # Create initial booking
        BookingService.create_booking_request(
            guest=self.guest,
            listing_id=self.listing.id,
            check_in=check_in,
            check_out=check_out
        )

        # Attempt overlapping booking (partially overlapping dates)
        overlap_check_in = date.today() + timedelta(days=12)
        overlap_check_out = date.today() + timedelta(days=18)

        another_guest = User.objects.create_user(
            username='another_guest',
            phone='+919876543212',
            full_name='Vijay Patel'
        )

        with self.assertRaises(ValidationError) as cm:
            BookingService.create_booking_request(
                guest=another_guest,
                listing_id=self.listing.id,
                check_in=overlap_check_in,
                check_out=overlap_check_out
            )

        self.assertIn("Requested dates overlap with an existing booking", str(cm.exception))

    def test_festival_surge_pricing_calculation(self):
        check_in = date.today() + timedelta(days=20)
        check_out = date.today() + timedelta(days=22)

        # Set custom festival surge price for check_in date
        ListingAvailability.objects.create(
            listing=self.listing,
            date=check_in,
            is_available=True,
            custom_price=4500.00
        )

        booking = BookingService.create_booking_request(
            guest=self.guest,
            listing_id=self.listing.id,
            check_in=check_in,
            check_out=check_out
        )

        # Day 1: 4500.00 (surge), Day 2: 2500.00 (base price) -> Total: 7000.00
        self.assertEqual(booking.total_price, 7000.00)

    def test_booking_host_accept_and_reject_flow(self):
        check_in = date.today() + timedelta(days=30)
        check_out = date.today() + timedelta(days=32)

        booking = BookingService.create_booking_request(
            guest=self.guest,
            listing_id=self.listing.id,
            check_in=check_in,
            check_out=check_out
        )

        # Host accepts booking
        confirmed_booking = BookingService.accept_booking(booking.id, self.host)
        self.assertEqual(confirmed_booking.status, Booking.Status.CONFIRMED)

        # Attempting to accept again should fail
        with self.assertRaises(ValidationError):
            BookingService.accept_booking(booking.id, self.host)
