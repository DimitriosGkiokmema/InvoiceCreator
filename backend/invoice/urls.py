
from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf_token, name="csrf_token"),
    path("invoices/", views.create_invoice, name="create_invoice"),
    path("invoices/<str:invoice_id>/", views.manage_invoice, name="manage_invoice"),
]
