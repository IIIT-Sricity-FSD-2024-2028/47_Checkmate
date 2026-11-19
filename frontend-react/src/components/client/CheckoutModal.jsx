/**
 * ============================================================================
 * CHECKOUT MODAL (CheckoutModal.jsx) — client Billing → Pay Now
 * ============================================================================
 * SIMULATED GATEWAY: no real money is charged, and the popup says so. (Razorpay
 * test mode needs the owner's own API keys; swapping it in later only changes
 * the "gateway answer" step below.)
 *
 * Steps:
 *   1. bill        amount, platform commission inside it, already paid, total due
 *   2. method      UPI / Card / Net banking (with simple format checks)
 *   3. processing  POST /bookings/:id/checkout -> payment "processing",
 *                  ~1.5 s later POST /payments/:id/confirm (the gateway's answer)
 *   4. success     receipt (number, payment id, method, time) + download
 *      failed      reason + "Try again"
 * Test cards: UPI "fail@upi" or card 4000 0000 0000 0002 make the payment FAIL,
 * so the failure screen can be shown in a demo.
 *
 * Props: invoice (row from useClientBillingData, null = closed), onClose, onPaid(payment)
 * ============================================================================
 */

import React, { useState } from "react";
import { CheckCircle2, CreditCard, Download, Landmark, Loader2, ShieldAlert, Smartphone, XCircle } from "lucide-react";
import Modal from "../Modal";
import { confirmPayment, startCheckout } from "../../services/bookingService";
import { describeError, getCurrentUser, money } from "../../utils/clientHelpers";
import "../../styles/checkout.css";

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
const PROCESSING_MS = 1500; // how long the fake gateway "thinks"

// Is the typed method complete? Returns an error text, or "" when OK
function methodError(method, form) {
  if (method === "upi") return /^[\w.-]+@[\w]+$/.test(form.upi.trim()) ? "" : "Enter a UPI id like name@bank.";
  if (method === "card") {
    if (form.cardNumber.replace(/\s/g, "").length !== 16) return "Card number must have 16 digits.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) return "Expiry must look like MM/YY.";
    if (!/^\d{3}$/.test(form.cvv)) return "CVV must be 3 digits.";
    if (!form.cardName.trim()) return "Enter the name on the card.";
    return "";
  }
  return form.bank ? "" : "Choose your bank.";
}

// Short label saved on the payment ("Card •••• 4242", "UPI emily@okbank", "Net banking · HDFC Bank")
function methodLabel(method, form) {
  if (method === "upi") return `UPI ${form.upi.trim()}`;
  if (method === "card") return `Card •••• ${form.cardNumber.replace(/\s/g, "").slice(-4)}`;
  return `Net banking · ${form.bank}`;
}

// The demo test details that make the simulated gateway decline the payment
function shouldFail(method, form) {
  return (method === "upi" && form.upi.trim().toLowerCase() === "fail@upi") ||
    (method === "card" && form.cardNumber.replace(/\s/g, "") === "4000000000000002");
}

/** Builds a printable HTML receipt and makes the browser download it. */
export function downloadReceipt(payment, invoice) {
  const user = getCurrentUser();
  const row = (k, v) => `<tr><td style="padding:6px 12px;color:#555">${k}</td><td style="padding:6px 12px"><b>${v}</b></td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${payment.receiptNo}</title></head>
<body style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto">
<h2>EventPro — Payment Receipt</h2>
<p style="color:#b45309">Simulated payment gateway (test mode): no real money was charged.</p>
<table style="border-collapse:collapse">
${row("Receipt #", payment.receiptNo)}${row("Payment ID", payment.id)}${row("Gateway ref", payment.gatewayRef || "-")}
${row("Paid by", `${user.name} (${user.email})`)}${row("Event", invoice.eventName)}${row("Invoice", invoice.number)}
${row("Amount", money(payment.amount))}${row("Method", payment.methodLabel || payment.method)}
${row("Paid at", new Date(payment.completedAt).toLocaleString())}${row("Status", "PAID")}
</table></body></html>`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  link.download = `${payment.receiptNo}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function CheckoutModal({ invoice, onClose, onPaid }) {
  // "bill" | "method" | "processing" | "success" | "failed"
  const [step, setStep] = useState("bill");

  // Chosen method and what was typed for it
  const [method, setMethod] = useState("upi");
  const [form, setForm] = useState({ upi: "", cardNumber: "", expiry: "", cvv: "", cardName: "", bank: "" });

  // Validation / backend error, and the finished payment record
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  // Updates one field of the method form
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Closes and resets for the next time
  function handleClose() {
    setStep("bill");
    setError("");
    setPayment(null);
    onClose();
  }

  // Runs the checkout: start (processing) -> wait -> gateway answer
  async function handlePay() {
    const problem = methodError(method, form);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep("processing");
    try {
      const started = await startCheckout(invoice.id, { method, amount: invoice.balance, methodLabel: methodLabel(method, form) });
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));
      const result = await confirmPayment(started.id, shouldFail(method, form) ? "failure" : "success");
      setPayment(result);
      setStep(result.status === "paid" ? "success" : "failed");
      if (result.status === "paid") onPaid(result);
    } catch (err) {
      setError(describeError(err));
      setStep("failed");
    }
  }

  if (!invoice) return null;
  const commissionPct = Math.round(Number(invoice.commissionRate || 0) * 100);

  return (
    <Modal open={Boolean(invoice)} title={`Checkout · ${invoice.number}`} onClose={step === "processing" ? () => {} : handleClose} width={520}>
      <div className="co-banner"><ShieldAlert size={14} /> Simulated payment gateway (test mode) — no real money is charged.</div>

      {step === "bill" && (
        <div className="co-step" data-step="bill">
          <div className="co-row"><span>Event</span><b>{invoice.eventName}</b></div>
          <div className="co-row"><span>Event price</span><b>{money(invoice.amount)}</b></div>
          <div className="co-row co-sub"><span>includes platform commission ({commissionPct}%)</span><span>{money(invoice.commission)}</span></div>
          <div className="co-row co-sub"><span>goes to the vendor</span><span>{money(invoice.amount - invoice.commission)}</span></div>
          <div className="co-row"><span>Already paid</span><span>{money(invoice.paid)}</span></div>
          <div className="co-row co-total"><span>Total to pay now</span><b>{money(invoice.balance)}</b></div>
          <button type="button" className="co-btn" onClick={() => setStep("method")}>Continue to payment</button>
        </div>
      )}

      {step === "method" && (
        <div className="co-step" data-step="method">
          <div className="co-methods">
            {[["upi", "UPI", Smartphone], ["card", "Card", CreditCard], ["netbanking", "Net banking", Landmark]].map(([id, label, Icon]) => (
              <label key={id} className={`co-method ${method === id ? "co-method--on" : ""}`}>
                <input type="radio" name="co-method" value={id} checked={method === id} onChange={() => { setMethod(id); setError(""); }} />
                <Icon size={16} /> {label}
              </label>
            ))}
          </div>
          {method === "upi" && (
            <input className="co-input" placeholder="UPI id, e.g. emily@okbank" value={form.upi} onChange={(e) => update("upi", e.target.value)} />
          )}
          {method === "card" && (
            <div className="co-card">
              <input className="co-input" placeholder="Card number" maxLength={19} value={form.cardNumber}
                onChange={(e) => update("cardNumber", e.target.value.replace(/[^\d]/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19))} />
              <div className="co-card-row">
                <input className="co-input" placeholder="MM/YY" maxLength={5} value={form.expiry} onChange={(e) => update("expiry", e.target.value)} />
                <input className="co-input" placeholder="CVV" maxLength={3} type="password" value={form.cvv} onChange={(e) => update("cvv", e.target.value.replace(/\D/g, ""))} />
              </div>
              <input className="co-input" placeholder="Name on card" value={form.cardName} onChange={(e) => update("cardName", e.target.value)} />
            </div>
          )}
          {method === "netbanking" && (
            <select className="co-input" value={form.bank} onChange={(e) => update("bank", e.target.value)}>
              <option value="">Choose your bank</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <p className="co-hint">Test mode: UPI <code>fail@upi</code> or card <code>4000 0000 0000 0002</code> makes the payment fail.</p>
          {error && <div className="co-error">{error}</div>}
          <div className="co-actions">
            <button type="button" className="co-btn co-btn--ghost" onClick={() => setStep("bill")}>Back</button>
            <button type="button" className="co-btn" onClick={handlePay}>Pay {money(invoice.balance)}</button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="co-step co-center" data-step="processing">
          <Loader2 size={36} className="co-spin" />
          <div>Processing... please don't close this window.</div>
        </div>
      )}

      {step === "success" && payment && (
        <div className="co-step co-center" data-step="success">
          <CheckCircle2 size={42} color="#22c55e" />
          <h3>Payment successful</h3>
          <div className="co-row"><span>Receipt #</span><b>{payment.receiptNo}</b></div>
          <div className="co-row"><span>Payment ID</span><span>{payment.id}</span></div>
          <div className="co-row"><span>Amount</span><b>{money(payment.amount)}</b></div>
          <div className="co-row"><span>Method</span><span>{payment.methodLabel}</span></div>
          <div className="co-row"><span>Time</span><span>{new Date(payment.completedAt).toLocaleString()}</span></div>
          <div className="co-actions">
            <button type="button" className="co-btn co-btn--ghost" onClick={() => downloadReceipt(payment, invoice)}><Download size={14} /> Download receipt</button>
            <button type="button" className="co-btn" onClick={handleClose}>Done</button>
          </div>
        </div>
      )}

      {step === "failed" && (
        <div className="co-step co-center" data-step="failed">
          <XCircle size={42} color="#ef4444" />
          <h3>Payment failed</h3>
          <div className="co-error">{error || payment?.failureReason || "The payment did not go through."}</div>
          <div className="co-actions">
            <button type="button" className="co-btn co-btn--ghost" onClick={handleClose}>Close</button>
            <button type="button" className="co-btn" onClick={() => { setError(""); setStep("method"); }}>Try again</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CheckoutModal;
