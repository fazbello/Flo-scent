"""
Stripe service layer — all Stripe API calls go through here.
"""
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_or_create_stripe_customer(client):
    """Create or fetch Stripe customer for a Client."""
    if client.stripe_customer_id:
        return stripe.Customer.retrieve(client.stripe_customer_id)

    customer = stripe.Customer.create(
        email=client.primary_contact_email,
        name=client.company_name,
        metadata={'client_id': client.id},
    )
    client.stripe_customer_id = customer.id
    client.save(update_fields=['stripe_customer_id'])
    return customer


def create_payment_intent(amount_cents: int, currency: str, client, description: str = ''):
    """Create a Stripe PaymentIntent and return it."""
    customer = get_or_create_stripe_customer(client)
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency.lower(),
        customer=customer.id,
        description=description,
        automatic_payment_methods={'enabled': True},
        metadata={'client_id': client.id},
    )
    return intent


def create_invoice(client, items: list[dict], description: str = '') -> stripe.Invoice:
    """
    Create and send a Stripe Invoice.
    items: [{'description': str, 'amount_cents': int, 'quantity': int}]
    """
    customer = get_or_create_stripe_customer(client)

    # Create invoice items
    for item in items:
        stripe.InvoiceItem.create(
            customer=customer.id,
            amount=item['amount_cents'],
            currency='usd',
            description=item['description'],
            quantity=item.get('quantity', 1),
        )

    invoice = stripe.Invoice.create(
        customer=customer.id,
        description=description,
        auto_advance=True,
        collection_method='send_invoice',
        days_until_due=30,
    )
    invoice.send_invoice()
    return invoice


def create_subscription(client, price_id: str):
    """Create a Stripe Subscription."""
    customer = get_or_create_stripe_customer(client)
    subscription = stripe.Subscription.create(
        customer=customer.id,
        items=[{'price': price_id}],
        payment_behavior='default_incomplete',
        payment_settings={'save_default_payment_method': 'on_subscription'},
        expand=['latest_invoice.payment_intent'],
    )
    return subscription


def cancel_subscription(subscription_id: str):
    return stripe.Subscription.cancel(subscription_id)


def process_webhook(payload: bytes, sig_header: str):
    """Verify and parse a Stripe webhook event."""
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )


def list_customer_payment_methods(stripe_customer_id: str):
    return stripe.PaymentMethod.list(customer=stripe_customer_id, type='card')


def get_payment_intent(payment_intent_id: str):
    return stripe.PaymentIntent.retrieve(payment_intent_id)
