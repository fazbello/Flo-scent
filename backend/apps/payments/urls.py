from django.urls import path
from . import views

urlpatterns = [
    path('', views.PaymentListView.as_view(), name='payment-list'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('create-intent/', views.create_payment_intent_view, name='create-payment-intent'),
    path('create-invoice/', views.create_invoice_view, name='create-invoice'),
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
]
