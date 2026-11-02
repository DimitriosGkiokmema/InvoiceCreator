import json

from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST
from weasyprint import HTML

from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from invoice.models import Invoice
from decimal import Decimal


def invoice_pdf_view(request, invoice_id):
    invoice = get_object_or_404(Invoice, invoiceID=invoice_id)

    tax = invoice.total * Decimal("0.13")
    total = invoice.total * Decimal("1.13")
    half = total / 2
    fourtyPercent = total * Decimal("0.4")
    tenPercent = total * Decimal("0.1")
    depositTotal = invoice.depositTotal
    remaining = total - depositTotal

    context = {
        "invoice": invoice,
        "tax": f"{tax:.2f}",
        "totalPrice": f"{total:.2f}",
        "half": f"{half:.2f}",
        "fourtyPercent": f"{fourtyPercent:.2f}",
        "tenPercent": f"{tenPercent:.2f}",
        "depositTotal": f"{depositTotal:.2f}",
        "remaining": f"{remaining:.2f}"
    }
    html_string = render_to_string("invoice/invoice.html", context)
    css_string = render_to_string("invoice/invoice.css")
    html = HTML(string=html_string, base_url=request.build_absolute_uri())
    pdf_bytes = html.write_pdf(
        stylesheets=[CSS(string=css_string)]
    )

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f"inline; filename=invoice_{invoice.invoiceID}.pdf"
    return response
