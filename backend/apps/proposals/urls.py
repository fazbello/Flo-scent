from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProposalListView.as_view(), name='proposal-list'),
    path('<int:pk>/', views.ProposalDetailView.as_view(), name='proposal-detail'),
    path('<int:pk>/generate-pdf/', views.generate_pdf, name='proposal-generate-pdf'),
    path('<int:pk>/download-pdf/', views.download_pdf, name='proposal-download-pdf'),
    path('<int:pk>/send/', views.send_proposal, name='proposal-send'),
]
