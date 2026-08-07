from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.listings.models import PolSector, Listing, ListingPhoto

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial heritage listings matching screen1.jpg documentation"

    def handle(self, *args, **kwargs):
        host, _ = User.objects.get_or_create(
            username="mangaldas_host",
            defaults={
                "phone": "+919876543299",
                "full_name": "Seth Mangaldas Family",
                "role": User.Role.HOST,
                "is_id_verified": True,
            }
        )

        pols_data = [
            {"name": "Mangaldas Pol", "description": "Iconic central Pol famous for ornate carved wooden facades."},
            {"name": "Dhal ni Pol", "description": "Known for heritage walks, historic swing courtyards, and artisan crafts."},
            {"name": "Manek Chowk Pol", "description": "Vibrant heritage neighborhood near the historical night market."},
        ]

        pols = {}
        for pd in pols_data:
            pol_obj, _ = PolSector.objects.get_or_create(name=pd["name"], defaults={"description": pd["description"]})
            pols[pd["name"]] = pol_obj

        listings_data = [
            {
                "title": "The Mangaldas Haveli",
                "pol_name": "Mangaldas Pol",
                "pol": pols["Mangaldas Pol"],
                "description": "A magnificent 150-year-old wooden haveli in the heart of the walled city, featuring authentic heirloom furnishings and rooftop sunset views.",
                "price_per_night": 2500.00,
                "max_guests": 4,
                "room_type": "entire_haveli",
                "heritage_verified": True,
                "status": "active",
                "amenities": {"terrace_access": True, "gujarati_thali": True},
                "photo": "/images/mangaldas_room.png"
            },
            {
                "title": "Dhal ni Pol Retreat",
                "pol_name": "Dhal ni Pol",
                "pol": pols["Dhal ni Pol"],
                "description": "Experience serene mornings on a traditional swing in this beautifully restored inner courtyard home.",
                "price_per_night": 1800.00,
                "max_guests": 2,
                "room_type": "private_room",
                "heritage_verified": True,
                "status": "active",
                "amenities": {"morning_chai": True, "guided_walk": True},
                "photo": "/images/dhal_ni_pol.png"
            },
            {
                "title": "Heritage Corner House",
                "pol_name": "Manek Chowk Pol",
                "pol": pols["Manek Chowk Pol"],
                "description": "A majestic multi-story structure offering panoramic views of the old city rooftops, night food tours, and bird tower views.",
                "price_per_night": 3200.00,
                "max_guests": 6,
                "room_type": "entire_haveli",
                "heritage_verified": True,
                "status": "active",
                "amenities": {"historic_tour": True, "rooftop_dining": True},
                "photo": "/images/heritage_lane.png"
            },
        ]

        for ld in listings_data:
            photo_url = ld.pop("photo")
            listing, created = Listing.objects.get_or_create(
                title=ld["title"],
                defaults={**ld, "host": host}
            )
            if created or not listing.photos.exists():
                ListingPhoto.objects.get_or_create(listing=listing, photo_url=photo_url, display_order=1)

        self.stdout.write(self.style.SUCCESS("Successfully seeded listings matching screen1.jpg design!"))
