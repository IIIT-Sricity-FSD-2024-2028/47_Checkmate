/**
 * ============================================================================
 * CLIENT BILLING & INVOICES (Billing.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/Billing.jsx
 *
 * Purpose:
 *   Comprehensive financial management for clients:
 *     - Summary KPI metrics (Outstanding Balance, Total Paid, Active Invoices)
 *     - Interactive Billing & Invoices Table with live search
 *     - "Pay Now" simulation with animated modal/toast and status transition
 *     - PDF invoice download simulation
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Receipt,
  Download,
  CreditCard,
  Search,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

import '../../styles/client.css';

export default function ClientBilling() {
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2026-081',
      eventName: 'Annual Corporate Gala 2026',
      issueDate: 'Mar 28, 2026',
      dueDate: 'Apr 10, 2026',
      amount: 4500,
      status: 'pending',
    },
    {
      id: 'INV-2026-042',
      eventName: 'Sarah & Mike Wedding (Deposit)',
      issueDate: 'Jan 15, 2026',
      dueDate: 'Jan 30, 2026',
      amount: 8000,
      status: 'paid',
    },
    {
      id: 'INV-2026-018',
      eventName: 'Tech Summit 2026 (Final Payout)',
      issueDate: 'Dec 20, 2025',
      dueDate: 'Jan 05, 2026',
      amount: 6200,
      status: 'paid',
    },
    {
      id: 'INV-2025-199',
      eventName: 'Birthday Celebration Special',
      issueDate: 'Oct 05, 2025',
      dueDate: 'Oct 20, 2025',
      amount: 4000,
      status: 'paid',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [paymentToast, setPaymentToast] = useState(null);

  // Compute KPI statistics
  const { outstandingBalance, totalPaid, activeInvoicesCount } = useMemo(() => {
    let outstanding = 0;
    let paid = 0;
    let active = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'pending') {
        outstanding += inv.amount;
        active++;
      } else if (inv.status === 'paid') {
        paid += inv.amount;
      }
    });

    return {
      outstandingBalance: outstanding,
      totalPaid: paid,
      activeInvoicesCount: active,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.eventName.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  // Handle Pay Now simulation
  const handlePayNow = (invoice) => {
    setPayingInvoiceId(invoice.id);
    setPaymentToast({
      text: `Processing secure payment of $${invoice.amount.toLocaleString()}.00...`,
      type: 'processing',
    });

    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoice.id ? { ...inv, status: 'paid' } : inv))
      );
      setPayingInvoiceId(null);
      setPaymentToast({
        text: `✓ Payment Successful! Invoice ${invoice.id} paid in full.`,
        type: 'success',
      });

      setTimeout(() => {
        setPaymentToast(null);
      }, 3500);
    }, 1800);
  };

  const handleDownloadPDF = (invoice) => {
    const dummyContent = `EVENTPRO INVOICE
Invoice #: ${invoice.id}
Event: ${invoice.eventName}
Issue Date: ${invoice.issueDate}
Amount: $${invoice.amount.toLocaleString()}
Status: ${invoice.status.toUpperCase()}
Generated on: ${new Date().toLocaleString()}`;

    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="client-content-wrap">
      {/* Toast Notification */}
      {paymentToast && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${paymentToast.type === 'success' ? '#22c55e' : 'var(--pink)'}`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            padding: '14px 24px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 9999,
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {paymentToast.type === 'processing' ? (
            <div className="live-dot-pulse" style={{ background: 'var(--pink)' }} />
          ) : (
            <CheckCircle2 size={18} color="#22c55e" />
          )}
          <span>{paymentToast.text}</span>
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Billing & Invoices
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Inspect upcoming payment milestones, invoice statements, and receipts.
        </p>
      </div>

      {/* 3 KPI Metric Cards */}
      <div className="stats-grid mb-6">
        <div
          className="stat-card"
          style={{
            background: 'rgba(233,30,140,0.06)',
            borderColor: 'rgba(233,30,140,0.25)',
          }}
        >
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--purple" style={{ background: 'var(--pink)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-value" style={{ color: 'var(--text-primary)' }}>
            ${outstandingBalance.toLocaleString()}
            <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>.00</span>
          </div>
          <div className="stat-desc" style={{ color: 'var(--pink)', fontWeight: 600 }}>
            {outstandingBalance > 0 ? 'Due across active bookings' : 'All accounts settled'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-label">Total Paid</div>
          <div className="stat-value">
            ${totalPaid.toLocaleString()}
            <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>.00</span>
          </div>
          <div className="stat-desc">Across completed & locked event milestones</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--blue">
              <Receipt size={18} />
            </div>
          </div>
          <div className="stat-label">Active Invoices</div>
          <div className="stat-value">{activeInvoicesCount}</div>
          <div className="stat-desc">Awaiting settlement</div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <FileText size={18} className="text-pink" />
            <span>Billing History</span>
          </div>

          <div className="search-box" style={{ width: '280px' }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search Invoice # or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="er-table-wrap">
          <table className="er-table invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Event</th>
                <th>Issue Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td className="col-id" style={{ fontWeight: 600 }}>
                      {inv.id}
                    </td>
                    <td style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {inv.eventName}
                    </td>
                    <td>{inv.issueDate}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${inv.amount.toLocaleString()}.00
                    </td>
                    <td>
                      {inv.status === 'paid' ? (
                        <span className="status-badge approved" style={{ color: '#22c55e', fontSize: '11px', padding: '2px 8px' }}>
                          Paid in Full
                        </span>
                      ) : (
                        <span className="status-badge pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          Pending Payment
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Download Statement"
                          onClick={() => handleDownloadPDF(inv)}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          <Download size={13} style={{ marginRight: '4px' }} /> PDF
                        </button>

                        {inv.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={payingInvoiceId === inv.id}
                            onClick={() => handlePayNow(inv)}
                            style={{
                              padding: '5px 14px',
                              fontSize: '12px',
                              background: 'linear-gradient(135deg, var(--pink), #db2777)',
                            }}
                          >
                            <CreditCard size={13} style={{ marginRight: '4px' }} />
                            {payingInvoiceId === inv.id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
