from django.db import models

class Invoice(models.Model):
    invoiceID = models.CharField(max_length=20, unique=True)
    invoiceDate = models.DateField(auto_now_add=True)
    clientName = models.CharField(max_length=200)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    depositTotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    isArchived = models.BooleanField(default=False)

    def __str__(self):
        return f"Invoice {self.invoiceID} - {self.clientName}"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    squareFeet = models.IntegerField(null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    itemPrice = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.itemPrice

    def __str__(self):
        return f"{self.description} ({self.quantity} × {self.itemPrice})"

class DepositItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()