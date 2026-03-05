import os
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.files.base import ContentFile
from django.http import HttpResponse
from django.utils import timezone
from .models import Proposal
from .serializers import ProposalSerializer, ProposalListSerializer
from .pdf_generator import generate_proposal_pdf


class ProposalListView(generics.ListCreateAPIView):
    queryset = Proposal.objects.select_related('client', 'quote', 'created_by')
    filterset_fields = ['status', 'client', 'ai_generated']
    search_fields = ['proposal_number', 'title', 'client__company_name']
    ordering_fields = ['created_at', 'status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProposalListSerializer
        return ProposalSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProposalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Proposal.objects.select_related('client', 'quote', 'created_by')
    serializer_class = ProposalSerializer


@api_view(['POST'])
def generate_pdf(request, pk):
    try:
        proposal = Proposal.objects.select_related('client', 'quote').prefetch_related(
            'quote__items'
        ).get(pk=pk)
    except Proposal.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        pdf_bytes = generate_proposal_pdf(proposal)
        filename = f'proposal_{proposal.proposal_number}.pdf'
        proposal.pdf_file.save(filename, ContentFile(pdf_bytes), save=True)
        return Response({
            'detail': 'PDF generated successfully.',
            'pdf_url': request.build_absolute_uri(proposal.pdf_file.url)
        })
    except Exception as e:
        return Response({'detail': f'PDF generation failed: {str(e)}'}, status=500)


@api_view(['GET'])
def download_pdf(request, pk):
    try:
        proposal = Proposal.objects.select_related('client', 'quote').prefetch_related(
            'quote__items'
        ).get(pk=pk)
    except Proposal.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    pdf_bytes = generate_proposal_pdf(proposal)
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="proposal_{proposal.proposal_number}.pdf"'
    return response


@api_view(['POST'])
def send_proposal(request, pk):
    try:
        proposal = Proposal.objects.get(pk=pk)
    except Proposal.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    proposal.status = Proposal.SENT
    proposal.sent_at = timezone.now()
    proposal.save()
    # TODO: Send email with PDF attached
    return Response({'detail': f'Proposal {proposal.proposal_number} sent.'})
