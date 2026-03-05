from rest_framework import serializers
from .models import Client, OnboardingForm, ClientNote
from apps.users.serializers import UserSerializer


class OnboardingFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingForm
        fields = '__all__'
        read_only_fields = ['submitted_at']


class ClientNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = ClientNote
        fields = ['id', 'client', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['author', 'created_at']

    def get_author_name(self, obj):
        return obj.author.full_name if obj.author else 'Unknown'


class ClientSerializer(serializers.ModelSerializer):
    onboarding = OnboardingFormSerializer(read_only=True)
    has_onboarding = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'stripe_customer_id']

    def get_has_onboarding(self, obj):
        return hasattr(obj, 'onboarding')


class ClientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_onboarding = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'company_name', 'industry', 'primary_contact_name',
                  'primary_contact_email', 'status', 'status_display',
                  'has_onboarding', 'created_at']

    def get_has_onboarding(self, obj):
        return hasattr(obj, 'onboarding')


class PublicOnboardingSerializer(serializers.Serializer):
    """Used by the public-facing onboarding form (creates both Client and OnboardingForm)."""
    # Client fields
    company_name = serializers.CharField(max_length=200)
    industry = serializers.CharField(max_length=100)
    company_size = serializers.ChoiceField(choices=Client.SIZE_CHOICES)
    website = serializers.URLField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, default='United States')
    primary_contact_name = serializers.CharField(max_length=200)
    primary_contact_email = serializers.EmailField()
    primary_contact_phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    # Onboarding fields
    business_type = serializers.ChoiceField(choices=OnboardingForm.BUSINESS_TYPE_CHOICES)
    number_of_locations = serializers.IntegerField(min_value=1, default=1)
    total_square_footage = serializers.IntegerField(required=False, allow_null=True)
    scent_preferences = serializers.CharField()
    existing_scent_system = serializers.BooleanField(default=False)
    existing_system_details = serializers.CharField(required=False, allow_blank=True)
    goals = serializers.CharField()
    budget_range = serializers.ChoiceField(choices=OnboardingForm.BUDGET_CHOICES)
    timeline = serializers.CharField(max_length=200)
    additional_notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        onboarding_fields = [
            'business_type', 'number_of_locations', 'total_square_footage',
            'scent_preferences', 'existing_scent_system', 'existing_system_details',
            'goals', 'budget_range', 'timeline', 'additional_notes'
        ]
        onboarding_data = {k: validated_data.pop(k) for k in onboarding_fields if k in validated_data}
        client = Client.objects.create(status=Client.ONBOARDING, **validated_data)
        OnboardingForm.objects.create(client=client, **onboarding_data)
        return client
