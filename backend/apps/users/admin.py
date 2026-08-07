from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'username', 'full_name', 'phone', 'email', 'role',
        'is_phone_verified', 'is_id_verified', 'is_staff'
    )
    list_filter = ('role', 'is_phone_verified', 'is_id_verified', 'is_staff', 'is_superuser')
    search_fields = ('username', 'full_name', 'phone', 'email')
    actions = ['verify_identity']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('AHHE Profile Details', {
            'fields': ('full_name', 'phone', 'role', 'profile_photo_url', 'preferred_language', 'is_phone_verified', 'is_id_verified')
        }),
    )

    @admin.action(description='Verify government ID for selected users')
    def verify_identity(self, request, queryset):
        updated = queryset.update(is_id_verified=True)
        self.message_user(request, f"{updated} users marked as ID-verified.")
