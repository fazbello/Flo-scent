from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Quote, QuoteItem
from .serializers import QuoteSerializer, QuoteListSerializer, QuoteItemSerializer


class QuoteListView(generics.ListCreateAPIView):
    queryset = Quote.objects.select_related('client', 'created_by').prefetch_related('items')
    filterset_fields = ['status', 'billing_cycle', 'client', 'ai_generated']
    search_fields = ['quote_number', 'title', 'client__company_name']
    ordering_fields = ['created_at', 'total', 'status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return QuoteListSerializer
        return QuoteSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quote.objects.select_related('client', 'created_by').prefetch_related('items')
    serializer_class = QuoteSerializer


@api_view(['POST'])
def send_quote(request, pk):
    try:
        quote = Quote.objects.get(pk=pk)
    except Quote.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if quote.status not in [Quote.DRAFT, Quote.SENT]:
        return Response({'detail': 'Only draft or sent quotes can be resent.'}, status=400)

    quote.status = Quote.SENT
    quote.sent_at = timezone.now()
    quote.save()

    # TODO: Send email with quote PDF
    return Response({'detail': f'Quote {quote.quote_number} sent successfully.'})


@api_view(['POST'])
def accept_quote(request, pk):
    try:
        quote = Quote.objects.get(pk=pk)
    except Quote.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    quote.status = Quote.ACCEPTED
    quote.accepted_at = timezone.now()
    quote.save()
    return Response({'detail': 'Quote accepted.'})


@api_view(['POST'])
def decline_quote(request, pk):
    try:
        quote = Quote.objects.get(pk=pk)
    except Quote.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    quote.status = Quote.DECLINED
    quote.save()
    return Response({'detail': 'Quote declined.'})


@api_view(['POST'])
def duplicate_quote(request, pk):
    try:
        original = Quote.objects.prefetch_related('items').get(pk=pk)
    except Quote.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    items = list(original.items.all())
    original.pk = None
    original.quote_number = ''
    original.status = Quote.DRAFT
    original.sent_at = None
    original.accepted_at = None
    original.ai_generated = False
    original.save()

    for item in items:
        item.pk = None
        item.quote = original
        item.save()

    original.save()  # recalculate
    return Response(QuoteSerializer(original).data, status=status.HTTP_201_CREATED)
