from django.core.management.base import BaseCommand
from apps.bookings.models import Booking
from apps.listings.models import Listing
from apps.users.models import User
import random
from datetime import timedelta, date
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds the database with 120+ historical bookings for analytics purposes'

    def handle(self, *args, **kwargs):
        listings = list(Listing.objects.all())
        users = list(User.objects.all())

        if not listings or not users:
            self.stdout.write(self.style.ERROR('Please ensure you have listings and users in the database before running this command.'))
            return

        self.stdout.write('Seeding 120+ historical bookings...')

        # Let's create bookings from Jan 2024 to Dec 2026
        start_date = date(2024, 1, 1)
        end_date = date(2026, 12, 31)
        delta_days = (end_date - start_date).days

        # Possible festival tags
        festivals = [
            (Booking.FestivalTag.UTTARAYAN, 1),
            (Booking.FestivalTag.NAVRATRI, 10),
            (Booking.FestivalTag.DIWALI, 11),
            (Booking.FestivalTag.NONE, -1)
        ]

        purposes = ['Heritage Walk', 'Festival', 'Business', 'Family', 'Tourism']
        
        # Pre-assign home cities to users if not present
        cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Surat', 'Vadodara', 'Chennai', 'Hyderabad']
        for u in users:
            if not u.home_city:
                u.home_city = random.choice(cities)
                u.save()

        bookings_created = 0

        for _ in range(125):
            listing = random.choice(listings)
            guest = random.choice(users)
            
            # Avoid host booking their own listing
            while guest == listing.host:
                guest = random.choice(users)

            random_days = random.randint(0, delta_days - 10)
            check_in = start_date + timedelta(days=random_days)
            duration = random.randint(1, 5)
            check_out = check_in + timedelta(days=duration)
            
            guest_count = random.randint(1, listing.max_guests)
            
            # Pick a festival tag based on month to be roughly accurate
            month = check_in.month
            festival_tag = Booking.FestivalTag.NONE
            if month == 1 and random.random() < 0.5:
                festival_tag = Booking.FestivalTag.UTTARAYAN
            elif month == 10 and random.random() < 0.5:
                festival_tag = Booking.FestivalTag.NAVRATRI
            elif month == 11 and random.random() < 0.5:
                festival_tag = Booking.FestivalTag.DIWALI

            base_rate = float(listing.price_per_night)
            total = base_rate * duration
            
            if festival_tag != Booking.FestivalTag.NONE:
                total *= 1.45 # Surge
            if check_in.weekday() >= 5:
                total *= 1.15 # Weekend
                
            total_price = Decimal(total).quantize(Decimal('0.00'))

            Booking.objects.create(
                listing=listing,
                guest=guest,
                check_in=check_in,
                check_out=check_out,
                guest_count=guest_count,
                total_price=total_price,
                status=Booking.Status.STAYED, # Use STAYED for historical data
                festival_tag=festival_tag,
                purpose_of_visit=random.choice(purposes)
            )
            bookings_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {bookings_created} historical bookings.'))
