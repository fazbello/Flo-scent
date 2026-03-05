from rest_framework import serializers
from .models import Proposal


class ProposalSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = '__all__'
        read_only_fields = ['proposal_number', 'pdf_file', 'created_at', 'updated_at', 'ai_generated']

    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)


class ProposalListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = ['id', 'proposal_number', 'client', 'client_name', 'title',
                  'status', 'status_display', 'ai_generated', 'has_pdf', 'created_at']

    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)
