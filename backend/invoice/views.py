
import json
from decimal import Decimal, InvalidOperation

from django.contrib import admin
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from datetime import date, datetime

from .models import Invoice, InvoiceItem, DepositItem

# Register models to admin
admin.site.register(Invoice)
admin.site.register(InvoiceItem)

@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})

def getNewID():
    invoice = Invoice.objects.all()
    numRows = invoice.count()
    nextEntry = numRows + 1

    return f"INV-{nextEntry:03d}"

def parse_body(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None

    return data if isinstance(data, dict) else None


def save_items(invoice, items):
    if not isinstance(items, list):
        raise ValueError("'items' must be a list.")

    total = Decimal("0.00")

    # Replace the invoice's existing items.
    invoice.items.all().delete()

    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Each item must be an object.")

        description = item.get("description")
        if not isinstance(description, str) or not description.strip():
            raise ValueError("Each item needs a description.")

        quantity = item.get("quantity")
        square_feet = item.get("squareFeet")

        if quantity is not None:
            if type(quantity) is not int or quantity < 0:
                raise ValueError("Quantity must be a non-negative integer.")

        if square_feet is not None:
            if type(square_feet) is not int or square_feet < 0:
                raise ValueError("Square feet must be a non-negative integer.")

        try:
            itemPrice = Decimal(str(item["itemPrice"]))
        except (KeyError, InvalidOperation, TypeError, ValueError):
            raise ValueError("Each item needs a valid itemPrice.")

        if not itemPrice.is_finite() or itemPrice < 0:
            raise ValueError("Unit price must be a non-negative number.")

        total += itemPrice

        InvoiceItem.objects.create(
            invoice=invoice,
            description=description.strip(),
            squareFeet=square_feet,
            quantity=quantity,
            itemPrice=itemPrice,
        )

    invoice.total = total.quantize(Decimal("0.01"))
    invoice.save(update_fields=["total"])

    return invoice.total


def save_deposits(invoice, deposits):
    if not isinstance(deposits, list):
        raise ValueError("'items' must be a list.")

    depositTotal = Decimal("0.00")

    # Replace the invoice's existing deposits.
    invoice.deposits.all().delete()

    for deposit in deposits:
        if not isinstance(deposit, dict):
            raise ValueError("Each deposit must be an object.")

        date_string = deposit.get("date")

        if not isinstance(date_string, str) or not date_string.strip():
            return JsonResponse({"error": "Date is required."}, status=400)

        dateInput = datetime.strptime(date_string, "%Y-%m-%d")

        try:
            amount = Decimal(str(deposit["amount"]))
        except (KeyError, InvalidOperation, TypeError, ValueError):
            raise ValueError("Each deposit needs a valid amount.")

        if not amount.is_finite() or amount < 0:
            raise ValueError("Deposit amount must be a non-negative number.")
        
        depositTotal += amount

        DepositItem.objects.create(
            invoice=invoice,
            amount=amount,
            date=dateInput
        )

    invoice.depositTotal = depositTotal.quantize(Decimal("0.01"))
    invoice.save(update_fields=["depositTotal"])

    return invoice.depositTotal

@require_http_methods(["GET" ,"POST"])
def create_invoice(request):
    if request.method == "GET":
        invoices = Invoice.objects.filter(isArchived=False)

        return JsonResponse({
            "invoices": [
                invoice.invoiceID for invoice in invoices
            ]
        })
    
    data = parse_body(request)

    if data is None:
        return JsonResponse({"error": "Invalid JSON object."}, status=400)

    invoice_id = getNewID()
    client_name = data.get("clientName")
    date_string = data.get("date")
    items = data.get("items", [])

    if not isinstance(client_name, str) or not client_name.strip():
        return JsonResponse({"error": "clientName is required."}, status=400)

    if not isinstance(date_string, str) or not date_string.strip():
            return JsonResponse({"error": "Date is required."}, status=400)

    dateInput = datetime.strptime(date_string, "%Y-%m-%d")

    deposits = data.get("deposits", [])

    if items == []:
        return JsonResponse({"error": "items are required."}, status=400)

    try:
        with transaction.atomic():
            invoice = Invoice.objects.create(
                invoiceID=invoice_id.strip(),
                invoiceDate=dateInput,
                clientName=client_name.strip(),
                total=Decimal("0.00"),
                depositTotal=Decimal("0.00")
            )
            save_items(invoice, items)
            save_deposits(invoice, deposits)

    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    except Exception as error:
        # A duplicate invoiceID is one possible cause.
        from django.db import IntegrityError

        if isinstance(error, IntegrityError):
            return JsonResponse(
                {"error": "invoiceID already exists."},
                status=409,
            )
        raise

    return JsonResponse(
        {
            "message": "Invoice created.",
            "invoiceID": invoice.invoiceID,
            "total": str(invoice.total),
        },
        status=201,
    )

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def manage_invoice(request, invoice_id):
    invoice = Invoice.objects.filter(
        invoiceID=invoice_id,
        isArchived=False,
    ).first()
    
    if invoice is None:
        return JsonResponse({"error": "Invoice not found."}, status=404)
    
    if request.method == "GET":
        print([item.squareFeet for item in invoice.items.all()])
        return JsonResponse({
            "invoiceID": invoice.invoiceID,
            "invoiceDate": invoice.invoiceDate.isoformat(),
            "clientName": invoice.clientName,
            "total": str(invoice.total),
            "items": [
                {
                    "description": item.description,
                    "squareFeet": item.squareFeet,
                    "quantity": item.quantity,
                    "itemPrice": str(item.itemPrice),
                }
                for item in invoice.items.all()
            ],
            "deposits": [
                {
                    "amount": deposit.amount,
                    "date": deposit.date
                }
                for deposit in invoice.deposits.all()
            ]
        })

    if request.method == "DELETE":
        invoice.isArchived = True
        invoice.save(update_fields=["isArchived"])

        return JsonResponse({"message": "Invoice archived."})

    data = parse_body(request)

    if data is None:
        return JsonResponse({"error": "Invalid JSON object."}, status=400)

    items = data.get("items", [])
    deposits = data.get("deposits", [])

    if items == []:
        return JsonResponse({"error": "items are required."}, status=400)

    try:
        save_items(invoice, items)

        if deposits != []:
            save_deposits(invoice, deposits)

    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    return JsonResponse(
        {
            "message": "Invoice updated.",
            "invoiceID": invoice.invoiceID,
            "total": str(invoice.total),
            "depositTotal": str(invoice.depositTotal)
        }
    )
