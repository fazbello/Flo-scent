from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Asset, MaintenanceLog
from .serializers import AssetSerializer, AssetListSerializer, MaintenanceLogSerializer


class AssetListView(generics.ListCreateAPIView):
    queryset = Asset.objects.select_related('client')
    filterset_fields = ['status', 'asset_type', 'client']
    search_fields = ['name', 'serial_number', 'location_description', 'client__company_name']
    ordering_fields = ['created_at', 'next_maintenance', 'status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AssetListSerializer
        return AssetSerializer


class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.select_related('client').prefetch_related('maintenance_logs')
    serializer_class = AssetSerializer


class MaintenanceLogListView(generics.ListCreateAPIView):
    serializer_class = MaintenanceLogSerializer

    def get_queryset(self):
        return MaintenanceLog.objects.filter(asset_id=self.kwargs['asset_pk'])

    def perform_create(self, serializer):
        serializer.save(asset_id=self.kwargs['asset_pk'])


@api_view(['GET'])
def overdue_assets(request):
    today = timezone.now().date()
    assets = Asset.objects.filter(
        next_maintenance__lt=today, status=Asset.ACTIVE
    ).select_related('client')
    serializer = AssetListSerializer(assets, many=True)
    return Response({'count': assets.count(), 'results': serializer.data})
