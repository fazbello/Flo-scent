from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta

from apps.clients.models import Client
from apps.quotes.models import Quote
from apps.proposals.models import Proposal
from apps.assets.models import Asset
from apps.payments.models import Payment


@api_view(['GET'])
def dashboard_stats(request):
    """Main admin dashboard statistics."""
    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)
    ninety_days_ago = today - timedelta(days=90)

    # Client stats
    total_clients = Client.objects.count()
    new_clients_30d = Client.objects.filter(created_at__date__gte=thirty_days_ago).count()
    active_clients = Client.objects.filter(status=Client.ACTIVE).count()
    onboarding_clients = Client.objects.filter(status=Client.ONBOARDING).count()

    # Quote stats
    total_quotes = Quote.objects.count()
    accepted_quotes = Quote.objects.filter(status=Quote.ACCEPTED).count()
    pending_quotes = Quote.objects.filter(status__in=[Quote.SENT, Quote.VIEWED]).count()
    quotes_value = Quote.objects.filter(status=Quote.ACCEPTED).aggregate(
        total=Sum('total')
    )['total'] or 0
    quote_acceptance_rate = (
        round(accepted_quotes / total_quotes * 100, 1) if total_quotes > 0 else 0
    )

    # Proposal stats
    total_proposals = Proposal.objects.count()
    accepted_proposals = Proposal.objects.filter(status=Proposal.ACCEPTED).count()

    # Payment / Revenue stats
    total_revenue = Payment.objects.filter(status=Payment.SUCCEEDED).aggregate(
        total=Sum('amount')
    )['total'] or 0
    revenue_30d = Payment.objects.filter(
        status=Payment.SUCCEEDED, paid_at__date__gte=thirty_days_ago
    ).aggregate(total=Sum('amount'))['total'] or 0
    revenue_90d = Payment.objects.filter(
        status=Payment.SUCCEEDED, paid_at__date__gte=ninety_days_ago
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Asset stats
    total_assets = Asset.objects.count()
    active_assets = Asset.objects.filter(status=Asset.ACTIVE).count()
    overdue_maintenance = Asset.objects.filter(
        next_maintenance__lt=today, status=Asset.ACTIVE
    ).count()

    # Recent activity
    recent_clients = list(
        Client.objects.order_by('-created_at')[:5].values(
            'id', 'company_name', 'industry', 'status', 'created_at'
        )
    )
    recent_quotes = list(
        Quote.objects.order_by('-created_at')[:5].values(
            'id', 'quote_number', 'title', 'total', 'status', 'created_at'
        )
    )
    recent_payments = list(
        Payment.objects.filter(status=Payment.SUCCEEDED).order_by('-paid_at')[:5].values(
            'id', 'amount', 'currency', 'description', 'paid_at', 'client__company_name'
        )
    )

    # Monthly revenue chart (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        month_start = today.replace(day=1) - timedelta(days=i * 30)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        rev = Payment.objects.filter(
            status=Payment.SUCCEEDED,
            paid_at__date__gte=month_start,
            paid_at__date__lt=month_end,
        ).aggregate(total=Sum('amount'))['total'] or 0
        monthly_revenue.append({
            'month': month_start.strftime('%b %Y'),
            'revenue': float(rev),
        })

    # Client status breakdown
    client_status_breakdown = list(
        Client.objects.values('status').annotate(count=Count('id'))
    )

    return Response({
        'clients': {
            'total': total_clients,
            'new_30d': new_clients_30d,
            'active': active_clients,
            'onboarding': onboarding_clients,
        },
        'quotes': {
            'total': total_quotes,
            'accepted': accepted_quotes,
            'pending': pending_quotes,
            'accepted_value': float(quotes_value),
            'acceptance_rate': quote_acceptance_rate,
        },
        'proposals': {
            'total': total_proposals,
            'accepted': accepted_proposals,
        },
        'revenue': {
            'total': float(total_revenue),
            'last_30d': float(revenue_30d),
            'last_90d': float(revenue_90d),
            'monthly_chart': monthly_revenue,
        },
        'assets': {
            'total': total_assets,
            'active': active_assets,
            'overdue_maintenance': overdue_maintenance,
        },
        'recent_clients': recent_clients,
        'recent_quotes': recent_quotes,
        'recent_payments': recent_payments,
        'client_status_breakdown': client_status_breakdown,
    })
