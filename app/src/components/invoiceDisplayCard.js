import { getInvoiceDetails } from "../apis/invoice";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import "./invoiceDisplayCard.css"

export default function InvoiceDisplayCard({ invoiceID }) {
  const navigate = useNavigate();
	const [details, setDetails] = useState({});

  function viewInvoice() {
    console.log('Invoice ', invoiceID, ' was clicked, going to invoice page')
    navigate(`/invoice/${invoiceID}`)
  }

	useEffect(() => {
		const loadData = (async () => {
			const response = await getInvoiceDetails(invoiceID);
			console.log(response)
			setDetails(response);
		})

		loadData();
	}, [invoiceID]);

	return (
		<div className="invoice-card-container" onClick={viewInvoice}>
			<div className="invoice-card-left-side">
				<div className="invoice-card-customer-name">{details.customer}</div>
				<div className="invoice-card-customer-date">{details.date}</div>
			</div>

			<div className="invoice-card-right-side">
				<div className="invoice-card-job-price">${details.total}</div>
			</div>
		</div>
	)
}