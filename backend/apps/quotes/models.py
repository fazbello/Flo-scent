from django.db import models
from apps.clients.models import Client
from apps.users.models import User


class QuoteItem(models.Model):
    quote = models.ForeignKey('Quote', on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=500)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.CharField(max_length=500, blank=True)

    @property
    def total(self):
        return self.quantity * self.unit_price


class Quote(models.Model):
    DRAFT = 'draft'
    SENT = 'sent'
    VIEWED = 'viewed'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    EXPIRED = 'expired'
    STATUS_CHOICES = [
        (DRAFT, 'Draft'), (SENT, 'Sent'), (VIEWED, 'Viewed'),
        (ACCEPTED, 'Accepted'), (DECLINED, 'Declined'), (EXPIRED, 'Expired'),
    ]

    MONTHLY = 'monthly'
    QUARTERLY = 'quarterly'
    ANNUAL = 'annual'
    ONE_TIME = 'one_time'
    BILLING_CHOICES = [
        (MONTHLY, 'Monthly'), (QUARTERLY, 'Quarterly'),
        (ANNUAL, 'Annual'), (ONE_TIME, 'One-time'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='quotes')
    title = models.CharField(max_length=300)
    quote_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CHOICES, default=MONTHLY)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    valid_until = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    ai_generated = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quote_number} – {self.client.company_name}'

    def save(self, *args, **kwargs):
        if not self.quote_number:
            import datetime
            count = Quote.objects.count() + 1
            self.quote_number = f'QT-{datetime.date.today().year}-{count:04d}'
        self.recalculate_total()
        super().save(*args, **kwargs)

    def recalculate_total(self):
        self.subtotal = sum(item.total for item in self.items.all())
        discount = self.subtotal * (self.discount_percent / 100)
        after_discount = self.subtotal - discount
        tax = after_discount * (self.tax_percent / 100)
        self.total = after_discount + tax
