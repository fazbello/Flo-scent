from rest_framework import serializers
from .models import Asset, MaintenanceLog


class MaintenanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceLog
        fields = '__all__'
        read_only_fields = ['created_at']


class AssetSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    asset_type_display = serializers.CharField(source='get_asset_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    maintenance_logs = MaintenanceLogSerializer(many=True, read_only=True)
    is_overdue_maintenance = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_is_overdue_maintenance(self, obj):
        from django.utils import timezone
        if obj.next_maintenance:
            return obj.next_maintenance < timezone.now().date()
        return False


class AssetListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    asset_type_display = serializers.CharField(source='get_asset_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue_maintenance = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = ['id', 'name', 'client', 'client_name', 'asset_type', 'asset_type_display',
                  'serial_number', 'location_description', 'status', 'status_display',
                  'next_maintenance', 'is_overdue_maintenance', 'created_at']

    def get_is_overdue_maintenance(self, obj):
        from django.utils import timezone
        if obj.next_maintenance:
            return obj.next_maintenance < timezone.now().date()
        return False
