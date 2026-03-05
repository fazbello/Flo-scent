from django.urls import path
from . import views

urlpatterns = [
    path('', views.QuoteListView.as_view(), name='quote-list'),
    path('<int:pk>/', views.QuoteDetailView.as_view(), name='quote-detail'),
    path('<int:pk>/send/', views.send_quote, name='quote-send'),
    path('<int:pk>/accept/', views.accept_quote, name='quote-accept'),
    path('<int:pk>/decline/', views.decline_quote, name='quote-decline'),
    path('<int:pk>/duplicate/', views.duplicate_quote, name='quote-duplicate'),
]
