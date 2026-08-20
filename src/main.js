
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FilePlus2, History, Printer, ReceiptText, Search, Settings, Trash2, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./styles.css";

const STORAGE_KEY = "spmw_bills_v1";

const blankBill = {
  id: "",
  billNo: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  status: "DUE",
  client: { name: "", company: "", phone: "", email: "", address: "" },
  items: [{ description: "", qty: 1, rate: 0 }],
  discount: 0,
  paidDate: "",
  paymentRef: "",
  notes: "Thank you for choosing SP Media Works."
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function nextBillNo(bills) {
  const max = bills.reduce((n, b) => {
    const m = String(b.billNo || "").match(/(\d+)$/);
    return Math.max(n, m ? Number(m[1]) : 0);
  }, 0);
  return `SPMW-${String(max + 1).padStart(4, "0")}`;
}

function App() {
  const [bills, setBills] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  const [bill, setBill] = useState(() => ({ ...blankBill, billNo: nextBillNo(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")) }));
  const [view, setView] = useState("new");
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  }, [bills]);

  const subtotal = useMemo(
    () => bill.items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0),
    [bill.items]
  );
  const total = Math.max(0, subtotal - (Number(bill.discount) || 0));

  const update = (path, value) => {
    setBill(prev => {
      const copy = structuredClone(prev);
      let target = copy;
      const parts = path.split(".");
      const key = parts.pop();
      for (const part of parts) target = target[part];
      target[key] = value;
      return copy;
    });
  };

  const addItem = () => setBill(prev => ({ ...prev, items: [...prev.items, { description: "", qty: 1, rate: 0 }] }));
  const removeItem = (i) => setBill(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, key, value) => {
    setBill(prev => {
      const items = prev.items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
      return { ...prev, items };
    });
  };

  const saveBill = () => {
    const saved = { ...bill, id: bill.id || crypto.randomUUID() };
    setBills(prev => {
      const exists = prev.some(x => x.id === saved.id);
      return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev];
    });
    setBill(saved);
    setView("new");
  };

  const markPaid = () => {
    const paid = { ...bill, status: "PAID", paidDate: new Date().toISOString().slice(0, 10) };
    setBill(paid);
    setBills(prev => prev.map(x => x.id === paid.id ? paid : x));
  };

  const newBill = () => {
    setBill({
      ...blankBill,
      id: "",
      billNo: nextBillNo(bills),
      date: new Date().toISOString().slice(0, 10)
    });
    setView("new");
  };

  const loadBill = (b) => {
    setBill(structuredClone(b));
    setView("new");
  };

  const deleteBill = (id) => {
    if (!confirm("Delete this bill?")) return;
    setBills(prev => prev.filter(b => b.id !== id));
    if (bill.id === id) newBill();
  };

  const filteredBills = bills.filter(b =>
    `${b.billNo} ${b.client?.name || ""} ${b.client?.company || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const downloadPdf = async () => {
    const node = document.getElementById("invoice");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const ratio = Math.min(pageWidth / (canvas.width / 2), pageHeight / (canvas.height / 2));
    const w = (canvas.width / 2) * ratio;
    const h = (canvas.height / 2) * ratio;
    pdf.addImage(img, "PNG", (pageWidth - w) / 2, 8, w, h);
    pdf.save(`${bill.billNo}-${bill.status === "PAID" ? "paid" : "payment-due"}.pdf`);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="/sp-logo.jpg" alt="SP Media Works" />
          <div><strong>SP MEDIA WORKS</strong><span>Bill Generator</span></div>
        </div>
        <button className={view === "new" ? "nav active" : "nav"} onClick={newBill}><FilePlus2 size={18}/> New Bill</button>
        <button className={view === "history" ? "nav active" : "nav"} onClick={() => setView("history")}><History size={18}/> Bill History</button>
        <div className="sidebar-spacer"/>
        <div className="sidebar-note"><ReceiptText size={18}/><span>Frontend-only<br/>Local storage</span></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">SP MEDIA WORKS</div>
            <h1>{view === "history" ? "Bill History" : "Bill Generator"}</h1>
          </div>
          <button className="primary" onClick={newBill}><FilePlus2 size={18}/> Create Bill</button>
        </header>

        {view === "history" ? (
          <section className="history-page">
            <div className="searchbar"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by bill number or client..." /></div>
            <div className="bill-list">
              {filteredBills.length === 0 && <div className="empty">No bills saved yet.</div>}
              {filteredBills.map(b => {
                const t = b.items.reduce((s, x) => s + (Number(x.qty)||0)*(Number(x.rate)||0), 0) - (Number(b.discount)||0);
                return <div className="bill-row" key={b.id}>
                  <div><strong>{b.billNo}</strong><span>{b.client?.name || "Unnamed client"} {b.client?.company ? `• ${b.client.company}` : ""}</span></div>
                  <div className="row-total">{money(t)}</div>
                  <span className={`status ${b.status.toLowerCase()}`}>{b.status === "PAID" ? "PAID" : "PAYMENT DUE"}</span>
                  <button className="ghost" onClick={() => loadBill(b)}>Open</button>
                  <button className="icon-btn danger" onClick={() => deleteBill(b.id)}><Trash2 size={17}/></button>
                </div>
              })}
            </div>
          </section>
        ) : (
          <section className="workspace">
            <div className="editor">
              <div className="card">
                <div className="card-title"><span>01</span> Client & Bill Details</div>
                <div className="grid two">
                  <label>Client name<input value={bill.client.name} onChange={e => update("client.name", e.target.value)} placeholder="Client Name"/></label>
                  <label>Company / Business<input value={bill.client.company} onChange={e => update("client.company", e.target.value)} placeholder="Company name"/></label>
                  <label>Phone<input value={bill.client.phone} onChange={e => update("client.phone", e.target.value)} placeholder="+91 XXXXX XXXXX"/></label>
                  <label>Email<input value={bill.client.email} onChange={e => update("client.email", e.target.value)} placeholder="client@email.com"/></label>
                  <label>Invoice number<input value={bill.billNo} onChange={e => update("billNo", e.target.value)}/></label>
                  <label>Invoice date<input type="date" value={bill.date} onChange={e => update("date", e.target.value)}/></label>
                  <label>Due date<input type="date" value={bill.dueDate} onChange={e => update("dueDate", e.target.value)}/></label>
                  <label>Address<input value={bill.client.address} onChange={e => update("client.address", e.target.value)} placeholder="City, State"/></label>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><span>02</span> Services</div>
                <div className="service-editor">
                  <div className="service-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span></div>
                  {bill.items.map((item, i) => (
                    <div className="service-line" key={i}>
                      <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Service / description"/>
                      <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)}/>
                      <input type="number" min="0" value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)}/>
                      <strong>{money((Number(item.qty)||0)*(Number(item.rate)||0))}</strong>
                      <button className="icon-btn danger" onClick={() => removeItem(i)} disabled={bill.items.length === 1}><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
                <button className="add-line" onClick={addItem}>+ Add service</button>
                <div className="totals-edit">
                  <label>Discount<input type="number" min="0" value={bill.discount} onChange={e => update("discount", e.target.value)}/></label>
                  <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div><span>Total</span><strong className="orange">{money(total)}</strong></div>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><span>03</span> Payment & Notes</div>
                <div className="grid two">
                  <label>UPI ID<input placeholder="yourupi@upi" /></label>
                  <label>Payment reference (optional)<input value={bill.paymentRef} onChange={e => update("paymentRef", e.target.value)} placeholder="Transaction / UTR"/></label>
                  <label className="wide">Notes<textarea value={bill.notes} onChange={e => update("notes", e.target.value)} /></label>
                </div>
              </div>

              <div className="actions">
                <button className="secondary" onClick={saveBill}>Save Bill</button>
                {bill.status !== "PAID" && <button className="paid-btn" onClick={() => { saveBill(); markPaid(); }}><CheckCircle2 size={18}/> Mark as Paid</button>}
                <button className="primary" onClick={downloadPdf}><Download size={18}/> Download PDF</button>
                <button className="secondary" onClick={() => window.print()}><Printer size={18}/> Print</button>
              </div>
            </div>

            <div className="preview-wrap">
              <div className="preview-label">LIVE PREVIEW</div>
              <div id="invoice" className="invoice">
                <div className="invoice-top">
                  <div className="invoice-brand">
                    <img src="/sp-logo.jpg" alt="" />
                    <div><h2>SP MEDIA WORKS</h2><p>MEDIA • DESIGN • DIGITAL</p></div>
                  </div>
                  <div className="invoice-meta"><div className="invoice-title">{bill.status === "PAID" ? "PAYMENT RECEIPT" : "PAYMENT BILL"}</div><strong>#{bill.billNo}</strong><span>{bill.date || "—"}</span></div>
                </div>

                <div className="orange-rule"/>
                <div className="invoice-info">
                  <div><small>BILL TO</small><h3>{bill.client.name || "Client Name"}</h3><p>{bill.client.company || "Company / Business"}</p><p>{bill.client.phone || "+91 XXXXX XXXXX"}</p><p>{bill.client.address || "City, State"}</p></div>
                  <div className="right-meta"><p><span>Issue date</span><strong>{bill.date || "—"}</strong></p><p><span>Due date</span><strong>{bill.dueDate || "—"}</strong></p><p><span>Status</span><b className={`status ${bill.status.toLowerCase()}`}>{bill.status === "PAID" ? "PAID" : "PAYMENT DUE"}</b></p></div>
                </div>

                <table className="invoice-table">
                  <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                  <tbody>{bill.items.map((item, i) => <tr key={i}><td>{String(i+1).padStart(2,"0")}</td><td><strong>{item.description || "Service description"}</strong></td><td>{item.qty || 0}</td><td>{money(item.rate)}</td><td>{money((Number(item.qty)||0)*(Number(item.rate)||0))}</td></tr>)}</tbody>
                </table>

                <div className="invoice-total"><span>Subtotal</span><strong>{money(subtotal)}</strong><span>Discount</span><strong className="orange">- {money(bill.discount)}</strong><div></div><b>TOTAL</b><b className="grand">{money(total)}</b></div>

                <div className="payment-box">
                  <div><small>PAYMENT DETAILS</small><h4>UPI PAYMENT</h4><p>Scan & pay using any UPI app.</p><div className="qr-placeholder">QR</div></div>
                  <div><small>TERMS & NOTES</small><p>{bill.notes || "Thank you for choosing SP Media Works."}</p><p>Payment status: <strong>{bill.status === "PAID" ? "Received" : "Pending"}</strong></p></div>
                </div>

                <div className={`invoice-footer ${bill.status === "PAID" ? "paid-footer" : ""}`}>
                  <strong>{bill.status === "PAID" ? "✓ PAYMENT RECEIVED" : "PAYMENT DUE"}</strong>
                  <span>{bill.status === "PAID" ? `Paid on ${bill.paidDate || "—"}` : "Please complete payment using the provided UPI details."}</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
