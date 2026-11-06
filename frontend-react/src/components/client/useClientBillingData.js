/**
 * ============================================================================
 * CLIENT BILLING DATA HOOK (useClientBillingData.js)
 * ============================================================================
 * Role: Custom Data Retrieval Hook (Client Billing page)
 * Location: src/components/client/useClientBillingData.js
 *
 * Purpose:
 *   1. Loads the client's bookings (one booking = one invoice) and event dates.
 *   2. Computes the 3 summary numbers: outstanding balance (+ next due date),
 *      total paid, and how many invoices still have a balance.
 *   3. Search (invoice #, event, status) and a Paid / Unpaid filter.
 *   4. "Pay Now": a simulated payment, exactly like the original page.
 *   5. "Invoice" download: builds a text invoice in the browser.
 *
 * Connected Backend Endpoints:
 *   - GET /api/bookings -> this client's bookings (getMyBookings)
 *   - GET /api/events   -> event dates, to show when the next balance is due
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { getMyBookings } from "../../services/bookingService";
import { getMyEvents } from "../../services/eventService";
import { describeError, formatDate, getCurrentUser, money } from "../../utils/clientHelpers";

/** Turns a booking into an invoice row */
function toInvoice(booking) {
  const amount = Number(booking.cost || 0);
  const paid = Number(booking.advancePaid || 0);
  return {
    id: booking.id,
    number: `INV-${booking.id}`,
    eventId: booking.eventId,
    eventName: booking.eventName || "Event",
    issued: booking.created,
    amount,
    paid,
    balance: Math.max(0, amount - paid),
  };
}

/** Status pill text + colour for an invoice */
export function invoiceStatus(invoice) {
  if (invoice.balance === 0) return { text: "Paid in Full", cls: "approved" };
  if (invoice.paid > 0) return { text: "Partially Paid", cls: "pending" };
  return { text: "Pending Payment", cls: "pending" };
}

/**
 * Builds a plain-text invoice and makes the browser download it.
 * FACULTY MAY ASK: How does the download work without a server?
 * HOW TO CHANGE: A Blob is a file made in memory; createObjectURL gives it a
 * temporary link, and clicking a hidden <a download> link saves it.
 */
export function downloadInvoice(invoice) {
  const user = getCurrentUser();
  const lines = [
    "EventPro — Invoice",
    "==================",
    `Invoice #:   ${invoice.number}`,
    `Billed to:   ${user.name} (${user.email})`,
    `Event:       ${invoice.eventName}`,
    `Issued:      ${formatDate(invoice.issued)}`,
    "",
    `Amount:      ${money(invoice.amount)}`,
    `Paid:        ${money(invoice.paid)}`,
    `Balance due: ${money(invoice.balance)}`,
    `Status:      ${invoiceStatus(invoice).text}`,
  ];
  const file = new Blob([lines.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `${invoice.number}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function useClientBillingData() {
  const [invoices, setInvoices] = useState([]);
  const [eventDates, setEventDates] = useState({}); // { eventId: "2026-05-18" }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payingId, setPayingId] = useState(null);
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 1. LOAD BOOKINGS + EVENT DATES
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [bookings, events] = await Promise.all([getMyBookings(), getMyEvents()]);
        if (!isMounted) return;
        setInvoices(bookings.map(toInvoice));
        const dates = {};
        events.forEach((e) => { dates[e.id] = e.date; });
        setEventDates(dates);
      } catch (err) {
        if (isMounted) setError(describeError(err, "your invoices"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. SUMMARY NUMBERS
  // --------------------------------------------------------------------------
  const summary = useMemo(() => {
    const unpaid = invoices.filter((i) => i.balance > 0);
    // Earliest event date among unpaid invoices = when the next payment is due
    const dueDates = unpaid.map((i) => eventDates[i.eventId]).filter(Boolean).sort();
    return {
      outstanding: unpaid.reduce((sum, i) => sum + i.balance, 0),
      totalPaid: invoices.reduce((sum, i) => sum + i.paid, 0),
      unpaidCount: unpaid.length,
      invoiceCount: invoices.length,
      nextDue: dueDates[0] || null,
    };
  }, [invoices, eventDates]);

  // --------------------------------------------------------------------------
  // 3. SEARCH + PAID/UNPAID FILTER
  // --------------------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return invoices.filter((i) => {
      const matchesSearch = !query ||
        [i.number, i.eventName, invoiceStatus(i).text].some((t) => t.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" ||
        (statusFilter === "paid" ? i.balance === 0 : i.balance > 0);
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // --------------------------------------------------------------------------
  // 4. PAY NOW (simulated)
  // FACULTY MAY ASK: Is the payment saved to the backend?
  // HOW TO CHANGE: No — like the original page it is a simulated payment gateway.
  // The backend only lets vendors/admins edit bookings, so a real version would
  // call patchBooking() from a payment webhook on the server instead.
  // --------------------------------------------------------------------------
  const payNow = (invoice) => {
    setPayingId(invoice.id);
    setToast({ type: "info", text: `Processing payment of ${money(invoice.balance)}...` });

    setTimeout(() => {
      setInvoices((current) => current.map((i) => (i.id === invoice.id ? { ...i, paid: i.amount, balance: 0 } : i)));
      setPayingId(null);
      setToast({ type: "success", text: "Payment Successful! Thank you." });
      setTimeout(() => setToast(null), 3500);
    }, 2000);
  };

  return {
    loading, error, summary, filteredInvoices,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    payNow, payingId, toast, setToast,
  };
}

export default useClientBillingData;
