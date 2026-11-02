import { useNavigate } from 'react-router-dom';
import InvoiceGallery from '../components/invoiceGallery';

export function HomePage() {
  const navigate = useNavigate();

  function createInvoice() {
    navigate(`/create`)
  }

  return (
    <div>
      <h1>Invoice Creator</h1>
      <button onClick={createInvoice}>New Invoice</button>
      <InvoiceGallery></InvoiceGallery>
    </div>
  );
}
