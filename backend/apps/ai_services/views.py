from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .claude_client import generate_proposal, generate_quote_suggestions, generate_seo_content, client_chat
from apps.clients.models import Client
from apps.quotes.models import Quote
from apps.proposals.models import Proposal
from apps.quotes.serializers import QuoteSerializer
from apps.proposals.serializers import ProposalSerializer


@api_view(['POST'])
def ai_generate_proposal(request):
    """Generate a full AI proposal for a client (optionally linked to a quote)."""
    client_id = request.data.get('client_id')
    quote_id = request.data.get('quote_id')
    title = request.data.get('title', 'Scent Marketing Proposal')

    try:
        client = Client.objects.select_related('onboarding').get(pk=client_id)
    except Client.DoesNotExist:
        return Response({'detail': 'Client not found.'}, status=404)

    # Build client_data from onboarding if available
    client_data = {
        'company_name': client.company_name,
        'industry': client.industry,
        'company_size': client.get_company_size_display(),
    }
    if hasattr(client, 'onboarding'):
        ob = client.onboarding
        client_data.update({
            'business_type': ob.get_business_type_display(),
            'number_of_locations': ob.number_of_locations,
            'total_square_footage': ob.total_square_footage,
            'goals': ob.goals,
            'scent_preferences': ob.scent_preferences,
            'budget_range': ob.get_budget_range_display(),
            'timeline': ob.timeline,
            'existing_scent_system': ob.existing_scent_system,
        })

    quote_data = None
    quote_obj = None
    if quote_id:
        try:
            quote_obj = Quote.objects.prefetch_related('items').get(pk=quote_id)
            quote_data = {
                'quote_number': quote_obj.quote_number,
                'total': float(quote_obj.total),
                'billing_cycle': quote_obj.get_billing_cycle_display(),
                'items': [
                    {'description': i.description, 'quantity': i.quantity, 'unit_price': float(i.unit_price)}
                    for i in quote_obj.items.all()
                ]
            }
        except Quote.DoesNotExist:
            pass

    try:
        sections = generate_proposal(client_data, quote_data)
    except Exception as e:
        return Response({'detail': f'AI generation failed: {str(e)}'}, status=500)

    proposal = Proposal.objects.create(
        client=client,
        quote=quote_obj,
        title=title,
        ai_generated=True,
        created_by=request.user,
        **sections
    )

    return Response(ProposalSerializer(proposal).data, status=201)


@api_view(['POST'])
def ai_generate_quote(request):
    """Generate suggested quote line items for a client."""
    client_id = request.data.get('client_id')

    try:
        client = Client.objects.select_related('onboarding').get(pk=client_id)
    except Client.DoesNotExist:
        return Response({'detail': 'Client not found.'}, status=404)

    client_data = {
        'company_name': client.company_name,
        'industry': client.industry,
        'company_size': client.get_company_size_display(),
    }
    if hasattr(client, 'onboarding'):
        ob = client.onboarding
        client_data.update({
            'business_type': ob.get_business_type_display(),
            'number_of_locations': ob.number_of_locations,
            'total_square_footage': ob.total_square_footage,
            'goals': ob.goals,
            'scent_preferences': ob.scent_preferences,
            'budget_range': ob.get_budget_range_display(),
            'existing_scent_system': ob.existing_scent_system,
        })

    try:
        items = generate_quote_suggestions(client_data)
        return Response({'items': items})
    except Exception as e:
        return Response({'detail': f'AI generation failed: {str(e)}'}, status=500)


@api_view(['POST'])
def ai_generate_seo(request):
    """Generate SEO content for a given page type."""
    page_type = request.data.get('page_type', 'service page')
    context = request.data.get('context', {})
    try:
        content = generate_seo_content(page_type, context)
        return Response(content)
    except Exception as e:
        return Response({'detail': f'AI generation failed: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chat(request):
    """Public-facing AI chat for website visitors."""
    message = request.data.get('message', '').strip()
    history = request.data.get('history', [])

    if not message:
        return Response({'detail': 'Message is required.'}, status=400)
    if len(message) > 1000:
        return Response({'detail': 'Message too long.'}, status=400)

    try:
        reply = client_chat(message, history)
        return Response({'reply': reply})
    except Exception as e:
        return Response({'detail': f'Chat failed: {str(e)}'}, status=500)
