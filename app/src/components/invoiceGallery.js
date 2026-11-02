import { getInvoiceIDs } from "../apis/invoice";
import { useEffect, useState } from "react";
import InvoiceDisplayCard from "./invoiceDisplayCard";

export default function InvoiceGallery() {
	const [invoices, setInvoices] = useState([]);

	useEffect(() => {
		const loadData = (async () => {
			const response = await getInvoiceIDs();
			console.log(response);
			setInvoices(response.invoices);
		});

		loadData();
	}, []);

	return (
		<div>
			{invoices.length > 0 ? (
				invoices.map(id => (
					<InvoiceDisplayCard key={id} invoiceID={id} />
				))
			) : (
				<div>No invoices</div>
			)}
		</div>
	)
}