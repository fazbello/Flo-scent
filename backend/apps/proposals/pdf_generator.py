"""
PDF generation for proposals using ReportLab.
Produces a branded Flo-scent proposal PDF.
"""
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Brand colors
BRAND_BLACK = colors.HexColor('#0A0A0A')
BRAND_GOLD = colors.HexColor('#C9A84C')
BRAND_LIGHT = colors.HexColor('#F5F2ED')
BRAND_GRAY = colors.HexColor('#6B6B6B')
WHITE = colors.white


def _build_styles():
    styles = getSampleStyleSheet()
    custom = {
        'cover_title': ParagraphStyle(
            'cover_title', fontSize=32, textColor=WHITE,
            fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=12
        ),
        'cover_sub': ParagraphStyle(
            'cover_sub', fontSize=14, textColor=BRAND_GOLD,
            fontName='Helvetica', alignment=TA_CENTER, spaceAfter=6
        ),
        'section_heading': ParagraphStyle(
            'section_heading', fontSize=16, textColor=BRAND_BLACK,
            fontName='Helvetica-Bold', spaceBefore=18, spaceAfter=8,
            borderPad=4
        ),
        'body': ParagraphStyle(
            'body', fontSize=11, textColor=BRAND_GRAY,
            fontName='Helvetica', leading=16, spaceAfter=8
        ),
        'price_total': ParagraphStyle(
            'price_total', fontSize=14, textColor=BRAND_BLACK,
            fontName='Helvetica-Bold', alignment=TA_RIGHT
        ),
        'footer': ParagraphStyle(
            'footer', fontSize=9, textColor=BRAND_GRAY,
            fontName='Helvetica', alignment=TA_CENTER
        ),
    }
    return {**{k: styles[k] for k in styles.byName}, **custom}


def generate_proposal_pdf(proposal) -> bytes:
    """Generate a PDF for a Proposal instance and return bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.75 * inch, bottomMargin=0.75 * inch
    )
    styles = _build_styles()
    story = []

    # ── Cover Page ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph('FLO-SCENT', styles['cover_title']))
    story.append(Paragraph('Transform Spaces. Elevate Experiences.', styles['cover_sub']))
    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width='100%', color=BRAND_GOLD, thickness=1))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(proposal.title, ParagraphStyle(
        'ptitle', fontSize=22, textColor=BRAND_BLACK, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceAfter=8
    )))
    story.append(Paragraph(
        f'Prepared for: <b>{proposal.client.company_name}</b>',
        ParagraphStyle('prep', fontSize=13, textColor=BRAND_GRAY,
                       fontName='Helvetica', alignment=TA_CENTER)
    ))
    if proposal.quote:
        story.append(Spacer(1, 0.15 * inch))
        story.append(Paragraph(
            f'Reference Quote: {proposal.quote.quote_number}',
            ParagraphStyle('ref', fontSize=10, textColor=BRAND_GRAY,
                           fontName='Helvetica', alignment=TA_CENTER)
        ))
    story.append(PageBreak())

    # ── Content Sections ─────────────────────────────────────────────────────
    sections = [
        ('Executive Summary', proposal.executive_summary),
        ('The Challenge', proposal.problem_statement),
        ('Our Solution', proposal.our_solution),
        ('About Flo-scent', proposal.about_us),
        ('Services & Deliverables', proposal.services_breakdown),
        ('Implementation Timeline', proposal.implementation_timeline),
        ('Investment Summary', proposal.pricing_summary),
        ('Terms & Conditions', proposal.terms_and_conditions),
        ('Next Steps', proposal.call_to_action),
    ]

    for heading, content in sections:
        if not content:
            continue
        story.append(Paragraph(heading, styles['section_heading']))
        story.append(HRFlowable(width='100%', color=BRAND_GOLD, thickness=0.5))
        story.append(Spacer(1, 0.1 * inch))
        for para in content.split('\n\n'):
            para = para.strip()
            if para:
                story.append(Paragraph(para, styles['body']))
        story.append(Spacer(1, 0.2 * inch))

    # ── Quote Items Table (if linked quote) ─────────────────────────────────
    if proposal.quote and proposal.quote.items.exists():
        story.append(Paragraph('Pricing Breakdown', styles['section_heading']))
        story.append(HRFlowable(width='100%', color=BRAND_GOLD, thickness=0.5))
        story.append(Spacer(1, 0.1 * inch))

        table_data = [['Description', 'Qty', 'Unit Price', 'Total']]
        for item in proposal.quote.items.all():
            table_data.append([
                item.description,
                str(item.quantity),
                f'${item.unit_price:,.2f}',
                f'${item.total:,.2f}',
            ])

        q = proposal.quote
        table_data.append(['', '', 'Subtotal', f'${q.subtotal:,.2f}'])
        if q.discount_percent > 0:
            table_data.append(['', '', f'Discount ({q.discount_percent}%)',
                               f'-${q.subtotal * q.discount_percent / 100:,.2f}'])
        if q.tax_percent > 0:
            table_data.append(['', '', f'Tax ({q.tax_percent}%)', ''])
        table_data.append(['', '', 'TOTAL', f'${q.total:,.2f}'])

        t = Table(table_data, colWidths=[3.5 * inch, 0.6 * inch, 1.5 * inch, 1.2 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_BLACK),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -3), [WHITE, BRAND_LIGHT]),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('BACKGROUND', (0, -1), (-1, -1), BRAND_GOLD),
            ('TEXTCOLOR', (0, -1), (-1, -1), WHITE),
            ('GRID', (0, 0), (-1, -4), 0.5, colors.HexColor('#E0E0E0')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    # ── Footer note ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5 * inch))
    story.append(HRFlowable(width='100%', color=BRAND_GOLD, thickness=0.5))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        'Flo-scent | hello@floscent.com | www.floscent.com',
        styles['footer']
    ))
    story.append(Paragraph(
        f'Proposal #{proposal.proposal_number} | Confidential',
        styles['footer']
    ))

    doc.build(story)
    return buffer.getvalue()
