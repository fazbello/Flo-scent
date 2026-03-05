"""
Claude AI client for Flo-scent.
Handles: proposal writing, quote generation, SEO content, client chat.
"""
import anthropic
from django.conf import settings

_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


BRAND_CONTEXT = """
You are a professional copywriter and business consultant for Flo-scent, a premium scent
marketing company. Flo-scent installs and maintains professional fragrance systems in commercial
spaces to create memorable sensory experiences that increase customer dwell time, brand loyalty,
and revenue for businesses.

Brand voice: Sophisticated, warm, confident, results-driven.
Tagline: "Transform Spaces. Elevate Experiences."
Services include: scent diffuser installation, custom scent development, HVAC-integrated
fragrance systems, monthly scent subscriptions, and ongoing maintenance.
"""


def generate_proposal(client_data: dict, quote_data: dict = None) -> dict:
    """
    Generate a full proposal for a client using Claude.
    Returns a dict with all proposal sections.
    """
    client_info = f"""
    Company: {client_data.get('company_name')}
    Industry: {client_data.get('industry')}
    Size: {client_data.get('company_size')}
    Business Type: {client_data.get('business_type', 'N/A')}
    Number of Locations: {client_data.get('number_of_locations', 1)}
    Square Footage: {client_data.get('total_square_footage', 'Not specified')}
    Goals: {client_data.get('goals', 'Not specified')}
    Scent Preferences: {client_data.get('scent_preferences', 'Not specified')}
    Budget Range: {client_data.get('budget_range', 'Not specified')}
    Timeline: {client_data.get('timeline', 'Not specified')}
    """

    quote_info = ''
    if quote_data:
        quote_info = f"""
    Quote Reference: {quote_data.get('quote_number')}
    Total Investment: ${quote_data.get('total', 0):,.2f} ({quote_data.get('billing_cycle', 'monthly')})
    Services:
    {chr(10).join([f"  - {item['description']}: ${item['unit_price']} x {item['quantity']}" for item in quote_data.get('items', [])])}
    """

    prompt = f"""
{BRAND_CONTEXT}

Generate a professional, persuasive business proposal for the following client:

CLIENT INFORMATION:
{client_info}

{f"QUOTE DETAILS:{quote_info}" if quote_info else ""}

Generate each section of the proposal separately. Use a sophisticated, warm tone.
Make the proposal specific to their industry and goals. Be concrete about ROI.

Return ONLY a JSON object with these exact keys (no markdown, no explanation):
{{
  "executive_summary": "...",
  "problem_statement": "...",
  "our_solution": "...",
  "about_us": "...",
  "services_breakdown": "...",
  "implementation_timeline": "...",
  "pricing_summary": "...",
  "terms_and_conditions": "...",
  "call_to_action": "..."
}}

Each section should be 2-4 paragraphs of professional copy. Use \\n\\n to separate paragraphs.
"""

    client_obj = get_client()
    message = client_obj.messages.create(
        model='claude-opus-4-6',
        max_tokens=4096,
        messages=[{'role': 'user', 'content': prompt}]
    )

    import json
    content = message.content[0].text.strip()
    # Strip any markdown code blocks if present
    if content.startswith('```'):
        content = content.split('```')[1]
        if content.startswith('json'):
            content = content[4:]
    content = content.strip()
    return json.loads(content)


def generate_quote_suggestions(client_data: dict) -> list[dict]:
    """
    Given client onboarding data, suggest quote line items.
    Returns a list of {description, quantity, unit_price, notes} dicts.
    """
    prompt = f"""
{BRAND_CONTEXT}

Based on the following client information, suggest appropriate scent marketing services and pricing.

CLIENT:
Company: {client_data.get('company_name')}
Industry: {client_data.get('industry')}
Business Type: {client_data.get('business_type', 'General')}
Locations: {client_data.get('number_of_locations', 1)}
Square Footage: {client_data.get('total_square_footage', 'Unknown')}
Budget: {client_data.get('budget_range', 'Not specified')}
Goals: {client_data.get('goals', 'Not specified')}
Existing System: {client_data.get('existing_scent_system', False)}

Typical Flo-scent pricing:
- Commercial Scent Diffuser Unit: $299-$599 each (one-time)
- HVAC Integration System: $800-$2,500 (one-time)
- Monthly Scent Subscription (per unit): $79-$199/month
- Installation & Setup: $150-$500 (one-time)
- Custom Scent Development: $500-$2,000 (one-time)
- Quarterly Maintenance Visit: $200-$400/visit

Return ONLY a JSON array of line items (no markdown):
[
  {{"description": "...", "quantity": 1, "unit_price": 299.00, "notes": "..."}}
]
"""

    client_obj = get_client()
    message = client_obj.messages.create(
        model='claude-opus-4-6',
        max_tokens=1024,
        messages=[{'role': 'user', 'content': prompt}]
    )

    import json
    content = message.content[0].text.strip()
    if content.startswith('```'):
        content = content.split('```')[1]
        if content.startswith('json'):
            content = content[4:]
    return json.loads(content.strip())


def generate_seo_content(page_type: str, context: dict) -> dict:
    """
    Generate SEO content for a given page type.
    Returns {title, meta_description, h1, content, keywords}.
    """
    prompt = f"""
{BRAND_CONTEXT}

Generate SEO-optimized content for a "{page_type}" page on the Flo-scent website.

Context: {context}

Return ONLY a JSON object (no markdown):
{{
  "title": "60-char max page title with primary keyword",
  "meta_description": "150-160 char meta description",
  "h1": "Main heading",
  "intro_paragraph": "100-150 word intro paragraph",
  "body_content": "400-600 word body content with natural keyword usage. Use \\n\\n for paragraphs.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}
"""

    client_obj = get_client()
    message = client_obj.messages.create(
        model='claude-opus-4-6',
        max_tokens=2048,
        messages=[{'role': 'user', 'content': prompt}]
    )

    import json
    content = message.content[0].text.strip()
    if content.startswith('```'):
        content = content.split('```')[1]
        if content.startswith('json'):
            content = content[4:]
    return json.loads(content.strip())


def client_chat(message: str, conversation_history: list = None) -> str:
    """
    Answer a potential client's question about Flo-scent services.
    """
    system_prompt = f"""
{BRAND_CONTEXT}

You are the Flo-scent website assistant. Answer questions about scent marketing services,
pricing ranges, installation process, and benefits. Be warm, informative, and guide interested
visitors to book a consultation. Keep answers concise (2-3 paragraphs max).

If asked for specific pricing, give ranges and encourage them to fill out the inquiry form for a
custom quote. Never make commitments beyond what's listed in standard services.
"""

    messages = []
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({'role': 'user', 'content': message})

    client_obj = get_client()
    response = client_obj.messages.create(
        model='claude-haiku-4-5-20251001',  # Haiku for chat (faster, cheaper)
        max_tokens=512,
        system=system_prompt,
        messages=messages
    )

    return response.content[0].text
