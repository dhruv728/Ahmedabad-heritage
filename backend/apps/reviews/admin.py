from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'reviewer', 'reviewee', 'rating', 'is_visible', 'created_at')
    list_filter = ('rating', 'is_visible')
    search_fields = ('comment', 'reviewer__full_name', 'reviewee__full_name')
    actions = ['make_visible']

    @admin.action(description='Make selected mutual reviews visible')
    def make_visible(self, request, queryset):
        updated = queryset.update(is_visible=True)
        self.message_user(request, f"{updated} reviews made visible.")
