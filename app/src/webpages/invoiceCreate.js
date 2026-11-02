import { useForm } from "react-hook-form";
import { useState } from "react";
import { FORM_DEFAULTS } from "../constants";
import { BackButton } from "../components/navigation";
import { createInvoice } from "../apis/invoice";
import XIcon from "../assets/x-icon.svg"
import "./invoiceCreate.css"

export function InvoiceCreate() {
  const { register, handleSubmit } = useForm();
  const [invoiceItems, setInvoiceItems] = useState(FORM_DEFAULTS);
  const [deposits, setDeposits] = useState(['DEPOSIT-1']);
  const [customPopup, setCustomPopup] = useState(false);
  const [incompletePairs, setIncompletePairs] = useState([])

  function saveInvoiceInfo(data) {
    let badFields = false;

    const missingInventoryFields = missingPrice(data);
    const missingDepositFields = incompleteDeposits(data);

    // Check company name not empty
    if (data["clientName"] === "") {
      missingInventoryFields.push("clientName");
    }

    setIncompletePairs(missingInventoryFields.concat(missingDepositFields));
    console.log(incompletePairs)

    // Check no incomplete pairs exist
    if (missingInventoryFields.length > 0) badFields = true;

    // Filter out unfilled fields
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== "")
    );

    // Check if data is not just name
    const fieldKeys = Object.keys(filteredData)
    if (fieldKeys.length <= 1 && fieldKeys[0] === 'name') badFields = true;

    // If data good here, send to backend
    if (!badFields) {
      const invoiceData = formatInvoiceData(filteredData);

      const logInvoice = async () => {
        console.log(invoiceData)
        const res = await createInvoice(invoiceData);
        console.log(res)
      }

      logInvoice();
    }
  }

  const missingPrice = (data) => Object.entries(data)
    .filter(([key, value]) => {
      return key.endsWith("-price") && value === "";
    })
    .map(([key]) => {
      return key;
    });
  
  const incompleteDeposits = (data) => Object.entries(data)
    .filter(([key, value]) => {
      return key.startsWith("DEPOSIT-") && value === "";
    })
    .map(([key]) => {
      return key;
    });

  function addCustomField(data) {
    setCustomPopup(false)

    setInvoiceItems([
      ...invoiceItems,
      data.customField
    ])
  }

  function createNewDeposit() {
    const depositID = `DEPOSIT-${deposits.length + 1}`;

    setDeposits([
      ...deposits,
      depositID
    ])
  }

  function formatInvoiceData(formData) {
    const itemsMap = {};
    const depositsMap = {};

    // Inventory formatting
    for (const [key, value] of Object.entries(formData)) {
      if (key === "clientName" || key.startsWith('DEPOSIT-')) continue;

      // Split the field into its description and type
      const separatorIndex = key.lastIndexOf("-");
      const description = key.slice(0, separatorIndex);
      const type = key.slice(separatorIndex + 1);

      if (!itemsMap[description]) {
        itemsMap[description] = {};
      }

      itemsMap[description][type] = value;
    }

    const items = Object.entries(itemsMap)
      .map(([description, fields]) => ({
        description,
        quantity: fields.unit == null || String(fields.unit).trim() === ""
          ? null
          : Number(fields.unit),
        squareFeet: fields.sf == null || String(fields.sf).trim() === ""
          ? null
          : Number(fields.sf),
        itemPrice: Number(fields.price).toFixed(2),
      }));

    // Deposit formatting
    for (const [key, value] of Object.entries(formData)) {
      if (!key.startsWith('DEPOSIT-')) continue;

      // Split the field into its description and type
      const separatorIndex = key.lastIndexOf("-");
      const id = key.slice(0, separatorIndex);
      const type = key.slice(separatorIndex + 1);

      if (!depositsMap[id]) {
        depositsMap[id] = {};
      }

      depositsMap[id][type] = value;
    }

    const deposits = Object.entries(depositsMap)
      .map(([id, fields]) => ({
        date: fields.date == null || String(fields.date).trim() === ""
          ? null
          : fields.date,
        amount: fields.amount == null || String(fields.amount).trim() === ""
          ? null
          : Number(fields.amount).toFixed(2)
      }));

    const tdy = new Date().toLocaleDateString('en-CA');
    return {
      clientName: formData.clientName,
      items,
      deposits,
      date: tdy
    };
  }

	return (
		<div>
      <BackButton />

			<h1 className="page-title">Invoice Creation</h1>

      {customPopup && (
        <div className="custom-entry-overlay">
          <div className="custom-entry-message-container">
            <CustomEntryMessage addCustomField={addCustomField} closePopup={() => setCustomPopup(false)} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(saveInvoiceInfo)} className="form-container">
        <div className={`company-input-field ${incompletePairs.includes("clientName") ? 'missing' : ''}`}>
          <label htmlFor="company-name">Company name:</label>
          <input type="text" id="company-name" name="company-name" {...register("clientName")}></input>
        </div>

        {invoiceItems.map((item) => {
          const incompletePair = incompletePairs.filter((key) => key.includes(item));
          const missingUnit = incompletePair.includes(item + '-unit');
          const missingPrice = incompletePair.includes(item + '-price');
          const missingSquareFeet = incompletePair.includes(item + '-sf');

          return (
            <InvoiceItemField
              key={item}
              label={item}
              register={register}
              missingUnit={missingUnit}
              missingPrice={missingPrice}
              missingSquareFeet={missingSquareFeet}
            />
          )
        })}

        <button
          className="create-field-btn"
          onClick={() => setCustomPopup(true)}
        >
          Add Item
        </button>

        {deposits.map((id) => {
          const incompletePair = incompletePairs.filter((key) => key.includes(id));
          const missingDate = incompletePair.includes(id + "-date");
          const missingAmount = incompletePair.includes(id + "-amount");

          return (
            <DepositField
              key={id}
              label={id}
              register={register}
              missingDate={missingDate}
              missingAmount={missingAmount}
            />
          )
        })}

        <button
          className="create-field-btn"
          onClick={createNewDeposit}
        >
          Add Deposit
        </button>

        <input className="submit-btn" type="submit" value="Submit"></input>
      </form>
		</div>
	)
}

function InvoiceItemField({ label, register, missingUnit, missingPrice, missingSquareFeet }) {
	return (
		<div className="form-entry-container">
      <div className="form-entry-title">{label}</div>

      <div className="form-entry-item-data-container">
        <div className={`form-entry-item-data-field ${missingSquareFeet ? 'missing' : ''}`}>
          <label htmlFor={label + '-sf'}>Square Feet:</label>
          <input type="number" id={label + '-sf'} name={label} {...register(label + '-sf')}></input>
        </div>

        <div className={`form-entry-item-data-field ${missingUnit ? 'missing' : ''}`}>
          <label htmlFor={label + '-unit'}>Quantity:</label>
          <input type="number" id={label + '-unit'} name={label} {...register(label + '-unit')}></input>
        </div>

        <div className={`form-entry-item-data-field ${missingPrice ? 'missing' : ''}`}>
          <label htmlFor={label + '-price'}>Price:</label>
          <input type="number" id={label + '-price'} name={label} {...register(label + '-price')}></input>
        </div>
      </div>
		</div>
	)
}

function DepositField({ label, register, missingDate, missingAmount }) {  
  return (
    <div className="deposit-entry-container">
      <div className={`deposit-entry-field ${missingDate ? 'missing' : ''}`} >
        <label htmlFor={label + '-date'}>Date</label>
        <input type="date" id={label + '-date'} name={label} {...register(label + '-date')}></input>
      </div>

      <div className={`deposit-entry-field ${missingAmount ? 'missing' : ''}`} >
        <label htmlFor={label + '-amount'}>Amount</label>
        <input type="number" id={label + '-amount'} name={label} {...register(label + '-amount')}></input>
      </div>
    </div>
  )
}

function CustomEntryMessage({ addCustomField, closePopup }) {
  const { register, handleSubmit } = useForm();

  return (
    <div className="custom-entry-container">
      <form onSubmit={handleSubmit(addCustomField)} className="custom-field-message-container">
        <label htmlFor='custom-item'>Enter name of the invoice item:</label>
        <input type="text" id='custom-item' name='custom-item' {...register('customField')}></input>
        <input type="submit" value="Add item"></input>
      </form>

      <div className="close-icon-container">
        <img
          className="close-icon"
          src={XIcon}
          alt="Close custom entry popup"
          onClick={closePopup}
        ></img>
      </div>
    </div>
  )
}