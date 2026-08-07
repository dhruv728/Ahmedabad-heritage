from django.urls import path
from .views import SuggestPriceView

app_name = 'analytics_ml'

urlpatterns = [
    path('suggest-price/', SuggestPriceView.as_view(), name='suggest_price'),
]
