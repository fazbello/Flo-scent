from django.urls import path
from . import views

urlpatterns = [
    path('', views.SEOPageListView.as_view(), name='seo-page-list'),
    path('sitemap.xml', views.sitemap_xml, name='sitemap'),
    path('sitemap-entries/', views.SitemapEntryListView.as_view(), name='sitemap-entries'),
    path('sitemap-entries/<int:pk>/', views.SitemapEntryDetailView.as_view(), name='sitemap-entry-detail'),
    path('pages/<slug:slug>/', views.public_seo_page, name='public-seo-page'),
    path('<int:pk>/', views.SEOPageDetailView.as_view(), name='seo-page-detail'),
]
