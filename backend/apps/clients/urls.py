from django.urls import path
from . import views

urlpatterns = [
    path('onboard/', views.PublicOnboardingView.as_view(), name='public-onboard'),
    path('', views.ClientListView.as_view(), name='client-list'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client-detail'),
    path('<int:pk>/status/', views.update_client_status, name='client-status'),
    path('<int:pk>/onboarding/', views.OnboardingDetailView.as_view(), name='onboarding-detail'),
    path('<int:client_pk>/notes/', views.ClientNoteListView.as_view(), name='client-notes'),
    path('<int:client_pk>/notes/<int:pk>/', views.ClientNoteDetailView.as_view(), name='client-note-detail'),
]
