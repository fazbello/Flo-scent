from rest_framework import serializers
from .models import SEOPage, SitemapEntry


class SEOPageSerializer(serializers.ModelSerializer):
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = SEOPage
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'ai_generated']


class SitemapEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SitemapEntry
        fields = '__all__'
