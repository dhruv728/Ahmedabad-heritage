from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class MLPriceSuggestionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_suggest_price_endpoint_regular_day(self):
        payload = {
            "pol_name": "Mangaldas Pol",
            "room_type": "private_room",
            "max_guests": 2,
            "heritage_verified": True,
            "festival_tag": "none",
            "days_to_event": 30
        }
        response = self.client.post('/api/v1/ml/suggest-price/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("suggested_price_per_night", data)
        self.assertIn("price_range", data)
        self.assertEqual(data["currency"], "INR")
        self.assertGreater(data["suggested_price_per_night"], 1000.0)

    def test_suggest_price_endpoint_uttarayan_festival_surge(self):
        regular_payload = {
            "pol_name": "Mangaldas Pol",
            "room_type": "private_room",
            "max_guests": 2,
            "heritage_verified": True,
            "festival_tag": "none",
            "days_to_event": 30
        }
        regular_res = self.client.post('/api/v1/ml/suggest-price/', regular_payload, format='json')
        regular_price = regular_res.json()["suggested_price_per_night"]

        festival_payload = {
            "pol_name": "Mangaldas Pol",
            "room_type": "private_room",
            "max_guests": 2,
            "heritage_verified": True,
            "festival_tag": "uttarayan",
            "days_to_event": 5
        }
        festival_res = self.client.post('/api/v1/ml/suggest-price/', festival_payload, format='json')
        self.assertEqual(festival_res.status_code, status.HTTP_200_OK)
        festival_price = festival_res.json()["suggested_price_per_night"]

        # Festival surge price during Uttarayan must be substantially higher than regular rate
        self.assertGreater(festival_price, regular_price * 1.5)
