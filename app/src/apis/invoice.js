import { fetchBackend } from "./urlconfig";

// Returns all invoice info from the Invoice table.
export async function getInvoiceDetails(invoiceID) {
  const invoice = await fetchBackend(
    `/invoices/${encodeURIComponent(invoiceID)}/`
  );

  return {
    invoiceNumber: invoice.invoiceID,
    date: invoice.invoiceDate,
    customer: invoice.clientName,
    total: Number(invoice.total),
    items: invoice.items,
  };
}


// Creates an invoice and returns its ID.
// Pass an object containing clientName and items.
export async function createInvoice(invoiceData) {
  const result = await fetchBackend("/invoices/", {
    method: "POST",
    body: JSON.stringify(invoiceData),
  });

  return result.invoiceID;
}


// Returns a list of every active invoice ID.
export async function getInvoiceIDs() {
  return fetchBackend("/invoices/");
}
