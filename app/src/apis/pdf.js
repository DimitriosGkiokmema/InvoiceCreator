import { fetchBackend } from "./urlconfig";

// Return the Estimate/Invoice pdf
export async function getInvoicePDF(invoiceID) {
	const invoice = await fetchBackend(
		`/invoice/${encodeURIComponent(invoiceID)}/pdf/`
	);

	console.log(invoice);
	return {
		'pdf': invoice
	};
}