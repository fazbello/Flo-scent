from django.db import models
from apps.users.models import User


class Client(models.Model):
    LEAD = 'lead'
    ONBOARDING = 'onboarding'
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    STATUS_CHOICES = [
        (LEAD, 'Lead'), (ONBOARDING, 'Onboarding'),
        (ACTIVE, 'Active'), (INACTIVE, 'Inactive'),
    ]

    SMALL = 'small'
    MEDIUM = 'medium'
    LARGE = 'large'
    ENTERPRISE = 'enterprise'
    SIZE_CHOICES = [
        (SMALL, 'Small (1-10 employees)'),
        (MEDIUM, 'Medium (11-50 employees)'),
        (LARGE, 'Large (51-200 employees)'),
        (ENTERPRISE, 'Enterprise (200+ employees)'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile', null=True, blank=True)
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    company_size = models.CharField(max_length=20, choices=SIZE_CHOICES, default=SMALL)
    website = models.URLField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='United States')
    zip_code = models.CharField(max_length=20, blank=True)
    primary_contact_name = models.CharField(max_length=200)
    primary_contact_email = models.EmailField()
    primary_contact_phone = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=LEAD)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_clients'
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.company_name


class OnboardingForm(models.Model):
    HOTEL = 'hotel'
    RETAIL = 'retail'
    OFFICE = 'office'
    RESTAURANT = 'restaurant'
    GYM = 'gym'
    SPA = 'spa'
    HEALTHCARE = 'healthcare'
    OTHER = 'other'
    BUSINESS_TYPE_CHOICES = [
        (HOTEL, 'Hotel / Hospitality'), (RETAIL, 'Retail'),
        (OFFICE, 'Office / Corporate'), (RESTAURANT, 'Restaurant / Food & Beverage'),
        (GYM, 'Gym / Fitness'), (SPA, 'Spa / Wellness'),
        (HEALTHCARE, 'Healthcare'), (OTHER, 'Other'),
    ]

    BUDGET_UNDER_500 = 'under_500'
    BUDGET_500_1500 = '500_1500'
    BUDGET_1500_5000 = '1500_5000'
    BUDGET_OVER_5000 = 'over_5000'
    BUDGET_CHOICES = [
        (BUDGET_UNDER_500, 'Under $500/month'),
        (BUDGET_500_1500, '$500 – $1,500/month'),
        (BUDGET_1500_5000, '$1,500 – $5,000/month'),
        (BUDGET_OVER_5000, '$5,000+/month'),
    ]

    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='onboarding')
    business_type = models.CharField(max_length=30, choices=BUSINESS_TYPE_CHOICES)
    number_of_locations = models.PositiveIntegerField(default=1)
    total_square_footage = models.PositiveIntegerField(null=True, blank=True)
    scent_preferences = models.TextField(help_text='Describe preferred scent profiles (e.g., fresh, woody, floral)')
    existing_scent_system = models.BooleanField(default=False)
    existing_system_details = models.TextField(blank=True)
    goals = models.TextField(help_text='What do you hope to achieve with scent marketing?')
    budget_range = models.CharField(max_length=20, choices=BUDGET_CHOICES)
    timeline = models.CharField(max_length=200, help_text='When do you need this in place?')
    additional_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Onboarding: {self.client.company_name}'


class ClientNote(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='client_notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Note on {self.client.company_name}'
