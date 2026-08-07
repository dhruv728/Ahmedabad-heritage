import os
import joblib
import pandas as pd
from pathlib import Path
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import PriceSuggestionInputSerializer

# Path to serialized ML model artifact
MODEL_PATH = Path(__file__).resolve().parent / 'models' / 'price_model.joblib'
_cached_model = None

def get_pricing_model():
    global _cached_model
    if _cached_model is None and MODEL_PATH.exists():
        _cached_model = joblib.load(MODEL_PATH)
    return _cached_model

class SuggestPriceView(APIView):
    """
    Pattern A ML Endpoint: In-process model serving for dynamic homestay pricing suggestions.
    Predicts optimal nightly rates based on Pol cluster, festival demand, room type, and heritage status.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PriceSuggestionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        model = get_pricing_model()
        if model is None:
            return Response(
                {"error": "ML pricing model artifact is currently uninitialized."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Build feature DataFrame matching ML pipeline input schema
        input_df = pd.DataFrame([{
            'pol_name': data['pol_name'],
            'room_type': data['room_type'],
            'max_guests': data['max_guests'],
            'heritage_verified': 1 if data['heritage_verified'] else 0,
            'festival_tag': data['festival_tag'],
            'days_to_event': data['days_to_event'],
        }])

        try:
            predicted_price = float(model.predict(input_df)[0])
            suggested_price = round(max(predicted_price, 500.0), 2)
            price_min = round(suggested_price * 0.90, 2)
            price_max = round(suggested_price * 1.10, 2)

            # Feature multipliers breakdown for host transparency
            festival_multipliers = {'uttarayan': 2.20, 'navratri': 1.80, 'diwali': 1.60, 'none': 1.00}

            return Response({
                "suggested_price_per_night": suggested_price,
                "price_range": {
                    "min": price_min,
                    "max": price_max,
                },
                "currency": "INR",
                "pricing_factors": {
                    "pol_name": data['pol_name'],
                    "room_type": data['room_type'],
                    "festival_tag": data['festival_tag'],
                    "festival_multiplier": festival_multipliers.get(data['festival_tag'], 1.00),
                    "heritage_bonus": 1.15 if data['heritage_verified'] else 1.00,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Model inference failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
