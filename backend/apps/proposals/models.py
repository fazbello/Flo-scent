from django.db import models
from apps.clients.models import Client
from apps.quotes.models import Quote
from apps.users.models import User


class Proposal(models.Model):
    DRAFT = 'draft'
    SENT = 'sent'
    VIEWED = 'viewed'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    STATUS_CHOICES = [
        (DRAFT, 'Draft'), (SENT, 'Sent'), (VIEWED, 'Viewed'),
        (ACCEPTED, 'Accepted'), (DECLINED, 'Declined'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='proposals')
    quote = models.ForeignKey(Quote, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals')
    title = models.CharField(max_length=300)
    proposal_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)

    # Content sections (can be AI-generated or manually written)
    executive_summary = models.TextField(blank=True)
    problem_statement = models.TextField(blank=True)
    our_solution = models.TextField(blank=True)
    about_us = models.TextField(blank=True)
    services_breakdown = models.TextField(blank=True)
    implementation_timeline = models.TextField(blank=True)
    pricing_summary = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    call_to_action = models.TextField(blank=True)

    pdf_file = models.FileField(upload_to='proposals/', null=True, blank=True)
    ai_generated = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.proposal_number} – {self.client.company_name}'

    def save(self, *args, **kwargs):
        if not self.proposal_number:
            import datetime
            count = Proposal.objects.count() + 1
            self.proposal_number = f'PR-{datetime.date.today().year}-{count:04d}'
        super().save(*args, **kwargs)
