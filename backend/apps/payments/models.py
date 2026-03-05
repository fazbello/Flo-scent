from django.db import models
from apps.clients.models import Client
from apps.quotes.models import Quote
from apps.proposals.models import Proposal


class Payment(models.Model):
    PENDING = 'pending'
    PROCESSING = 'processing'
    SUCCEEDED = 'succeeded'
    FAILED = 'failed'
    REFUNDED = 'refunded'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (PENDING, 'Pending'), (PROCESSING, 'Processing'),
        (SUCCEEDED, 'Succeeded'), (FAILED, 'Failed'),
        (REFUNDED, 'Refunded'), (CANCELLED, 'Cancelled'),
    ]

    ONE_TIME = 'one_time'
    SUBSCRIPTION = 'subscription'
    INVOICE = 'invoice'
    TYPE_CHOICES = [
        (ONE_TIME, 'One-time Payment'),
        (SUBSCRIPTION, 'Subscription'),
        (INVOICE, 'Invoice'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='payments')
    quote = models.ForeignKey(Quote, on_delete=models.SET_NULL, null=True, blank=True)
    proposal = models.ForeignKey(Proposal, on_delete=models.SET_NULL, null=True, blank=True)
    payment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=ONE_TIME)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    description = models.CharField(max_length=500, blank=True)

    # Stripe fields
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    stripe_invoice_id = models.CharField(max_length=200, blank=True)
    stripe_subscription_id = models.CharField(max_length=200, blank=True)
    stripe_charge_id = models.CharField(max_length=200, blank=True)
    payment_method_last4 = models.CharField(max_length=4, blank=True)
    payment_method_brand = models.CharField(max_length=50, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.id} – {self.client.company_name} – ${self.amount}'
