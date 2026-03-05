import json
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Payment
from .serializers import PaymentSerializer, CreatePaymentIntentSerializer, CreateInvoiceSerializer
from .stripe_service import (
    create_payment_intent, create_invoice, process_webhook, get_payment_intent
)
from apps.clients.models import Client
from apps.quotes.models import Quote


class PaymentListView(generics.ListAPIView):
    queryset = Payment.objects.select_related('client', 'quote')
    serializer_class = PaymentSerializer
    filterset_fields = ['status', 'payment_type', 'client']
    search_fields = ['client__company_name', 'description']
    ordering_fields = ['created_at', 'amount', 'status']


class PaymentDetailView(generics.RetrieveAPIView):
    queryset = Payment.objects.select_related('client', 'quote')
    serializer_class = PaymentSerializer


@api_view(['POST'])
def create_payment_intent_view(request):
    serializer = CreatePaymentIntentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        client = Client.objects.get(pk=data['client_id'])
    except Client.DoesNotExist:
        return Response({'detail': 'Client not found.'}, status=404)

    amount_cents = int(data['amount'] * 100)
    intent = create_payment_intent(amount_cents, data.get('currency', 'usd'), client, data.get('description', ''))

    payment = Payment.objects.create(
        client=client,
        quote_id=data.get('quote_id'),
        payment_type=Payment.ONE_TIME,
        amount=data['amount'],
        currency=data.get('currency', 'USD'),
        status=Payment.PENDING,
        description=data.get('description', ''),
        stripe_payment_intent_id=intent.id,
    )

    return Response({
        'client_secret': intent.client_secret,
        'payment_id': payment.id,
        'publishable_key': __import__('django.conf', fromlist=['settings']).settings.STRIPE_PUBLISHABLE_KEY,
    })


@api_view(['POST'])
def create_invoice_view(request):
    serializer = CreateInvoiceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        client = Client.objects.get(pk=data['client_id'])
    except Client.DoesNotExist:
        return Response({'detail': 'Client not found.'}, status=404)

    quote = None
    items = []
    if data.get('quote_id'):
        try:
            quote = Quote.objects.prefetch_related('items').get(pk=data['quote_id'])
            for item in quote.items.all():
                items.append({
                    'description': item.description,
                    'amount_cents': int(item.unit_price * 100),
                    'quantity': item.quantity,
                })
        except Quote.DoesNotExist:
            return Response({'detail': 'Quote not found.'}, status=404)

    if not items:
        return Response({'detail': 'No items to invoice.'}, status=400)

    invoice = create_invoice(client, items, data.get('description', ''))

    payment = Payment.objects.create(
        client=client,
        quote=quote,
        payment_type=Payment.INVOICE,
        amount=quote.total if quote else 0,
        currency='USD',
        status=Payment.PROCESSING,
        description=data.get('description', ''),
        stripe_invoice_id=invoice.id,
    )

    return Response({'invoice_id': invoice.id, 'payment_id': payment.id, 'status': invoice.status})


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = process_webhook(payload, sig_header)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

    # Handle payment_intent.succeeded
    if event['type'] == 'payment_intent.succeeded':
        pi = event['data']['object']
        Payment.objects.filter(stripe_payment_intent_id=pi['id']).update(
            status=Payment.SUCCEEDED,
            paid_at=timezone.now(),
            stripe_charge_id=pi.get('latest_charge', ''),
        )

    # Handle invoice.paid
    elif event['type'] == 'invoice.paid':
        inv = event['data']['object']
        Payment.objects.filter(stripe_invoice_id=inv['id']).update(
            status=Payment.SUCCEEDED,
            paid_at=timezone.now(),
        )

    # Handle payment_intent.payment_failed
    elif event['type'] == 'payment_intent.payment_failed':
        pi = event['data']['object']
        Payment.objects.filter(stripe_payment_intent_id=pi['id']).update(status=Payment.FAILED)

    return Response({'status': 'ok'})
