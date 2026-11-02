from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
	path('invoice/<str:invoice_id>/pdf/', views.invoice_pdf_view, name='invoice_pdf'),
]