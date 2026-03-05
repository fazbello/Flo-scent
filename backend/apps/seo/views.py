from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from .models import SEOPage, SitemapEntry
from .serializers import SEOPageSerializer, SitemapEntrySerializer


class SEOPageListView(generics.ListCreateAPIView):
    queryset = SEOPage.objects.all()
    serializer_class = SEOPageSerializer
    filterset_fields = ['page_type', 'is_published', 'ai_generated']
    search_fields = ['title', 'slug', 'keywords']
    ordering_fields = ['updated_at', 'page_type']


class SEOPageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SEOPage.objects.all()
    serializer_class = SEOPageSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def public_seo_page(request, slug):
    """Public endpoint — serves SEO data for a given page slug."""
    try:
        page = SEOPage.objects.get(slug=slug, is_published=True)
        return Response(SEOPageSerializer(page).data)
    except SEOPage.DoesNotExist:
        return Response({'detail': 'Page not found.'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def sitemap_xml(request):
    """Generate an XML sitemap from SitemapEntry records."""
    entries = SitemapEntry.objects.all()
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for entry in entries:
        xml_lines.append(f'''  <url>
    <loc>{entry.url}</loc>
    <lastmod>{entry.last_modified}</lastmod>
    <changefreq>{entry.changefreq}</changefreq>
    <priority>{entry.priority}</priority>
  </url>''')
    xml_lines.append('</urlset>')
    return HttpResponse('\n'.join(xml_lines), content_type='application/xml')


class SitemapEntryListView(generics.ListCreateAPIView):
    queryset = SitemapEntry.objects.all()
    serializer_class = SitemapEntrySerializer


class SitemapEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SitemapEntry.objects.all()
    serializer_class = SitemapEntrySerializer
