from django.db import models
from apps.clients.models import Client


class Asset(models.Model):
    # Types
    DIFFUSER = 'diffuser'
    HVAC_SYSTEM = 'hvac_system'
    CARTRIDGE = 'cartridge'
    STANDALONE = 'standalone'
    OTHER = 'other'
    TYPE_CHOICES = [
        (DIFFUSER, 'Scent Diffuser'),
        (HVAC_SYSTEM, 'HVAC Integration System'),
        (CARTRIDGE, 'Scent Cartridge'),
        (STANDALONE, 'Standalone Unit'),
        (OTHER, 'Other Equipment'),
    ]

    # Statuses
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    MAINTENANCE = 'maintenance'
    RETIRED = 'retired'
    STATUS_CHOICES = [
        (ACTIVE, 'Active'), (INACTIVE, 'Inactive'),
        (MAINTENANCE, 'Under Maintenance'), (RETIRED, 'Retired'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=200)
    asset_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    serial_number = models.CharField(max_length=100, unique=True, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    location_description = models.CharField(max_length=300, help_text='Where is this unit installed?')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    last_maintenance = models.DateField(null=True, blank=True)
    next_maintenance = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.client.company_name})'


class MaintenanceLog(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_logs')
    performed_by = models.CharField(max_length=200)
    maintenance_date = models.DateField()
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    next_maintenance = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-maintenance_date']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the asset's maintenance dates
        self.asset.last_maintenance = self.maintenance_date
        if self.next_maintenance:
            self.asset.next_maintenance = self.next_maintenance
        self.asset.save()
