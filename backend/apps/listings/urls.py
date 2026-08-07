from rest_framework.routers import DefaultRouter
from .views import PolSectorViewSet, ListingViewSet

app_name = 'listings'

router = DefaultRouter()
router.register(r'pols', PolSectorViewSet, basename='pol')
router.register(r'', ListingViewSet, basename='listing')

urlpatterns = router.urls
