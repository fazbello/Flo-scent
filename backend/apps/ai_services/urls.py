from django.urls import path
from . import views

urlpatterns = [
    path('generate-proposal/', views.ai_generate_proposal, name='ai-generate-proposal'),
    path('generate-quote/', views.ai_generate_quote, name='ai-generate-quote'),
    path('generate-seo/', views.ai_generate_seo, name='ai-generate-seo'),
    path('chat/', views.ai_chat, name='ai-chat'),
]
