from django.db import models
from django.utils.text import slugify


class SEOPage(models.Model):
    SERVICE = 'service'
    BLOG = 'blog'
    LANDING = 'landing'
    LOCATION = 'location'
    PAGE_TYPE_CHOICES = [
        (SERVICE, 'Service Page'), (BLOG, 'Blog Post'),
        (LANDING, 'Landing Page'), (LOCATION, 'Location Page'),
    ]

    page_type = models.CharField(max_length=20, choices=PAGE_TYPE_CHOICES, default=SERVICE)
    slug = models.SlugField(max_length=200, unique=True)
    title = models.CharField(max_length=70, help_text='SEO title tag (max 60 chars ideal)')
    meta_description = models.CharField(max_length=165, help_text='Meta description (150-160 chars)')
    h1 = models.CharField(max_length=200, blank=True, help_text='Main page heading')
    keywords = models.JSONField(default=list, help_text='List of target keywords')
    intro_paragraph = models.TextField(blank=True)
    body_content = models.TextField(blank=True)
    canonical_url = models.URLField(blank=True)
    og_title = models.CharField(max_length=100, blank=True, help_text='Open Graph title')
    og_description = models.CharField(max_length=200, blank=True)
    og_image = models.ImageField(upload_to='seo/og/', null=True, blank=True)
    schema_markup = models.JSONField(default=dict, blank=True, help_text='JSON-LD schema markup')
    is_published = models.BooleanField(default=False)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.page_type}: {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.og_title:
            self.og_title = self.title
        if not self.og_description:
            self.og_description = self.meta_description
        super().save(*args, **kwargs)


class SitemapEntry(models.Model):
    url = models.CharField(max_length=500, unique=True)
    priority = models.FloatField(default=0.5)
    changefreq = models.CharField(max_length=20, default='monthly',
                                   choices=[(v, v) for v in
                                            ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']])
    last_modified = models.DateField(auto_now=True)

    def __str__(self):
        return self.url
