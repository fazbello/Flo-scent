from rest_framework import serializers
from .models import Quote, QuoteItem


class QuoteItemSerializer(serializers.ModelSerializer):
    total = serializers.ReadOnlyField()

    class Meta:
        model = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'notes', 'total']


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    billing_cycle_display = serializers.CharField(source='get_billing_cycle_display', read_only=True)

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['quote_number', 'subtotal', 'total', 'created_at', 'updated_at', 'ai_generated']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        quote.save()  # recalculate total
        return quote

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuoteItem.objects.create(quote=instance, **item_data)
        instance.save()
        return instance


class QuoteListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = ['id', 'quote_number', 'client', 'client_name', 'title',
                  'status', 'status_display', 'total', 'billing_cycle',
                  'valid_until', 'item_count', 'ai_generated', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()
