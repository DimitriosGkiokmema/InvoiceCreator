import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getInvoicePDF } from "../apis/pdf";
import { BackButton } from "../components/navigation";
import "./invoiceView.css";

export function InvoiceViewPage() {
  const { invoiceID } = useParams();
  const [pdf, setPdf] = useState();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!invoiceID) return;
    
    let objectUrl;
    
    const loadData = (async () => {
      try {
        setPdf(null);
        setError(null);

        const res = await getInvoicePDF(invoiceID);
        const blob = res?.pdf;
        console.log("Returned value:", blob);
      console.log("Is Blob:", blob instanceof Blob);
        objectUrl = URL.createObjectURL(blob);
        console.log("URL: ", objectUrl)
        setPdf(objectUrl);
      } catch (err) {
        setError(err.message || "Failed to load invoice PDF.");
      }
    })

    loadData();
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoiceID]);


  const printPdf = () => {
    if (!pdf) return;

    const pdfWindow = window.open(pdf, "_blank");
    if (!pdfWindow) {
      alert("Please allow pop-ups to print the invoice.");
    }
  };

  const downloadPdf = () => {
    if (!pdf) return;

    const link = document.createElement("a");
    link.href = pdf;
    link.download = `invoice_${invoiceID}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const sharePdf = async () => {
    if (!pdf) return;

    try {
      const response = await fetch(pdf);
      const blob = await response.blob();

      const file = new File(
        [blob],
        `invoice_${invoiceID}.pdf`,
        { type: "application/pdf" }
      );

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file] });
      } else {
        downloadPdf();
      }
    } catch (err) {
      console.error("Failed to share PDF:", err);
    }
  };

  console.log(pdf)
  if (!invoiceID) {
    return <Navigate to="/" />;
  }
	return (
		<div>
      <BackButton />

      <h1 className="page-title">
        Invoice Viewer
      </h1>

      <div className="pdf-options-container">
        <button onClick={printPdf} disabled={!pdf}>Print</button>
        <button onClick={downloadPdf} disabled={!pdf}>Download</button>
        <button onClick={sharePdf} disabled={!pdf}>Share</button>
      </div>

      <div className="pdf-viewer-container">
        {error ? (
          <p>{error}</p>
        ) : pdf ? (
          <iframe
            title="Invoice PDF"
            src={pdf}
            className="pdf-viewer"
          />
        ) : (
          <p>Loading invoice PDF...</p>
        )}
      </div>
    </div>
	)
}