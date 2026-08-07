from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'amount', 'status', 'payout_status', 'created_at')
    list_filter = ('status', 'payout_status')
    search_fields = ('gateway_order_id', 'gateway_payment_id')
    actions = ['release_payout']

    @admin.action(description='Release payout to host for selected payments')
    def release_payout(self, request, queryset):
        updated = queryset.update(payout_status=Payment.PayoutStatus.RELEASED)
        self.message_user(request, f"{updated} payouts marked as released.")
