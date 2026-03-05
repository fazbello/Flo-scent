from django.urls import path
from . import views

urlpatterns = [
    path('', views.AssetListView.as_view(), name='asset-list'),
    path('overdue/', views.overdue_assets, name='asset-overdue'),
    path('<int:pk>/', views.AssetDetailView.as_view(), name='asset-detail'),
    path('<int:asset_pk>/maintenance/', views.MaintenanceLogListView.as_view(), name='maintenance-logs'),
]
