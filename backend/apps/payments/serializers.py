from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = [
            'stripe_payment_intent_id', 'stripe_invoice_id', 'stripe_subscription_id',
            'stripe_charge_id', 'payment_method_last4', 'payment_method_brand',
            'paid_at', 'created_at', 'updated_at'
        ]


class CreatePaymentIntentSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default='USD', max_length=3)
    description = serializers.CharField(required=False, allow_blank=True)
    quote_id = serializers.IntegerField(required=False, allow_null=True)


class CreateInvoiceSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    quote_id = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
