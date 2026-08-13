import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, date
import holidays
from apps.bookings.models import Booking
from apps.listings.models import Listing

class SmartPricingEngine:
    _model = None
    _is_trained = False

    @classmethod
    def train_model(cls):
        # Fetch historical bookings
        bookings = Booking.objects.filter(status=Booking.Status.STAYED).select_related('listing', 'listing__pol')
        
        if not bookings.exists():
            return False # Not enough data

        data = []
        gj_holidays = holidays.country_holidays('IN', subdiv='GJ')
        gj_holidays[date(2026, 1, 14)] = 'Uttarayan'
        gj_holidays[date(2025, 1, 14)] = 'Uttarayan'
        gj_holidays[date(2026, 10, 10)] = 'Navratri'
        gj_holidays[date(2026, 11, 8)] = 'Diwali'

        for b in bookings:
            # We want to train on per-night rate, so we approximate
            duration = (b.check_out - b.check_in).days
            if duration <= 0:
                duration = 1
            avg_nightly = float(b.total_price) / duration
            
            is_festival = 1 if b.festival_tag != Booking.FestivalTag.NONE or b.check_in in gj_holidays else 0
            is_weekend = 1 if b.check_in.weekday() >= 5 else 0
            month = b.check_in.month
            
            location_score = 5.0 # default
            if b.listing.pol and b.listing.pol.name:
                # simple mock location score based on name length for variance
                location_score += len(b.listing.pol.name) * 0.1
                
            base_price = float(b.listing.price_per_night)

            data.append({
                'base_price': base_price,
                'is_festival': is_festival,
                'is_weekend': is_weekend,
                'location_score': location_score,
                'month': month,
                'target_price': avg_nightly
            })

        df = pd.DataFrame(data)
        
        X = df[['base_price', 'is_festival', 'is_weekend', 'location_score', 'month']]
        y = df['target_price']
        
        cls._model = RandomForestRegressor(n_estimators=50, random_state=42)
        cls._model.fit(X, y)
        cls._is_trained = True
        return True

    @classmethod
    def suggest_price(cls, listing_id, target_date=None):
        if not cls._is_trained:
            success = cls.train_model()
            if not success:
                # Fallback if no data
                listing = Listing.objects.get(id=listing_id)
                return float(listing.price_per_night) * 1.1

        listing = Listing.objects.get(id=listing_id)
        if not target_date:
            target_date = datetime.now().date()
            
        gj_holidays = holidays.country_holidays('IN', subdiv='GJ')
        gj_holidays[date(target_date.year, 1, 14)] = 'Uttarayan'
        gj_holidays[date(target_date.year, 10, 10)] = 'Navratri'
        gj_holidays[date(target_date.year, 11, 8)] = 'Diwali'
        
        is_festival = 1 if target_date in gj_holidays else 0
        is_weekend = 1 if target_date.weekday() >= 5 else 0
        month = target_date.month
        
        location_score = 5.0
        if listing.pol and listing.pol.name:
            location_score += len(listing.pol.name) * 0.1
            
        base_price = float(listing.price_per_night)
        
        X_pred = pd.DataFrame([{
            'base_price': base_price,
            'is_festival': is_festival,
            'is_weekend': is_weekend,
            'location_score': location_score,
            'month': month
        }])
        
        suggested = cls._model.predict(X_pred)[0]
        return round(float(suggested), 2)
