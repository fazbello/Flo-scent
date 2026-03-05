from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Client, OnboardingForm, ClientNote
from .serializers import (
    ClientSerializer, ClientListSerializer, OnboardingFormSerializer,
    ClientNoteSerializer, PublicOnboardingSerializer
)


class PublicOnboardingView(generics.CreateAPIView):
    """Public endpoint — no auth required. Clients self-onboard."""
    serializer_class = PublicOnboardingSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response({
            'message': 'Thank you! We\'ll be in touch within 24 hours.',
            'client_id': client.id,
        }, status=status.HTTP_201_CREATED)


class ClientListView(generics.ListCreateAPIView):
    queryset = Client.objects.select_related('user', 'assigned_to').prefetch_related('onboarding')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'industry', 'company_size']
    search_fields = ['company_name', 'primary_contact_name', 'primary_contact_email']
    ordering_fields = ['created_at', 'company_name', 'status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClientListSerializer
        return ClientSerializer


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.select_related('user', 'assigned_to').prefetch_related('onboarding')
    serializer_class = ClientSerializer

    def perform_destroy(self, instance):
        # Soft delete — mark inactive instead of deleting
        instance.status = Client.INACTIVE
        instance.save()


@api_view(['PATCH'])
def update_client_status(request, pk):
    try:
        client = Client.objects.get(pk=pk)
    except Client.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    new_status = request.data.get('status')
    if new_status not in dict(Client.STATUS_CHOICES):
        return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
    client.status = new_status
    client.save()
    return Response(ClientSerializer(client).data)


class OnboardingDetailView(generics.RetrieveUpdateAPIView):
    queryset = OnboardingForm.objects.all()
    serializer_class = OnboardingFormSerializer


class ClientNoteListView(generics.ListCreateAPIView):
    serializer_class = ClientNoteSerializer

    def get_queryset(self):
        return ClientNote.objects.filter(client_id=self.kwargs['client_pk'])

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, client_id=self.kwargs['client_pk'])


class ClientNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClientNote.objects.all()
    serializer_class = ClientNoteSerializer
