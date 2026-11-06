import React, { useState, useEffect, useMemo } from 'react';
import { 
  IndianRupee, CheckCircle2, Clock, Search, 
  ArrowUpRight, RefreshCcw, ShieldCheck, AlertCircle, Eye, X
} from 'lucide-react';
import { getBookingsCommissions, settleBookingPayout } from '../../services/bookingService';
import '../../styles/admin.css';

export default function FinancialPayouts() {
  const [data, setData] = useState({ commissions: [], aggregates: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBookingsCommissions();
      setData(res || { commissions: [], aggregates: {} });
    } catch (err) {
      console.error('Failed to load payout data:', err);
      setError('Failed to fetch financial commissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const commissions = data.commissions || [];
  const aggregates = data.aggregates || {};

  const pendingBookings = useMemo(() => {
    return commissions.filter((b) => (b.payoutStatus || 'pending').toLowerCase() === 'pending');
  }, [commissions]);

  const completedBookings = useMemo(() => {
    return commissions.filter((b) => (b.payoutStatus || '').toLowerCase() === 'settled' || (b.payoutStatus || '').toLowerCase() === 'completed');
  }, [commissions]);

  const displayedList = useMemo(() => {
    const list = activeTab === 'pending' ? pendingBookings : completedBookings;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter((b) =>
      (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.vendorName && b.vendorName.toLowerCase().includes(q)) ||
      (b.eventName && b.eventName.toLowerCase().includes(q)) ||
      (b.eventId && b.eventId.toLowerCase().includes(q))
    );
  }, [activeTab, pendingBookings, completedBookings, searchTerm]);

  const handleSettle = async (bookingId) => {
    if (!window.confirm(`Release net payout for booking ${bookingId}?`)) return;
    try {
      setActionLoading(true);
      await settleBookingPayout(bookingId, { note: 'Admin verified and released' });
      await fetchPayouts();
    } catch (err) {
      console.error('Failed to settle payout:', err);
      alert('Failed to settle payout.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Financial Payouts & Settlement</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Escrow clearance, platform commission ledger, and vendor revenue distribution.
          </p>
        </div>

        <button
          onClick={fetchPayouts}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Refresh Ledger
        </button>
      </div>

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pending Clearance</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#f59e0b', marginTop: '10px' }}>
            ₹{Number(aggregates.pendingPayoutTotal || pendingBookings.reduce((a, b) => a + (Number(b.netPayout) || Number(b.amount) * 0.9 || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pendingBookings.length} bookings awaiting release
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Settled Payouts</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#00e676', marginTop: '10px' }}>
            ₹{Number(aggregates.settledPayoutTotal || completedBookings.reduce((a, b) => a + (Number(b.netPayout) || Number(b.amount) * 0.9 || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {completedBookings.length} vendors disbursed
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Commission Retained</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            ₹{Number(aggregates.totalCommission || commissions.reduce((a, b) => a + (Number(b.commissionAmount) || Number(b.amount) * 0.1 || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#ec4899', marginTop: '4px' }}>
            10% platform revenue share
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'pending' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'pending' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Pending Clearance ({pendingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'completed' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'completed' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Settled History ({completedBookings.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search booking ID, event, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading financial ledger...
          </div>
        ) : displayedList.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {activeTab === 'pending' ? 'No pending payouts requiring release.' : 'No settled payout history found.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Booking Ref</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Event & Date</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Vendor</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Total Gross</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Fee (10%)</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Net Payout (90%)</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map((b) => {
                const bId = b.id || b.bookingId;
                const totalGross = Number(b.amount || b.totalAmount || 0);
                const fee = Number(b.commissionAmount || totalGross * 0.1);
                const net = Number(b.netPayout || totalGross * 0.9);
                const isSettled = (b.payoutStatus || '').toLowerCase() === 'settled' || (b.payoutStatus || '').toLowerCase() === 'completed';

                return (
                  <tr key={bId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{bId}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{b.eventName || b.event || b.eventId}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.date || b.createdAt ? new Date(b.date || b.createdAt).toLocaleDateString() : 'Active'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {b.vendorName || b.vendorId || 'Elite Events Co.'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#fff', fontWeight: '500' }}>
                      ₹{totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#ec4899', fontWeight: '500' }}>
                      -₹{fee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#00e676', fontWeight: '700' }}>
                      ₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={13} />
                        </button>

                        {!isSettled ? (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleSettle(bId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              background: '#00e676',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#000',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <IndianRupee size={13} /> Release Payout
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#00e676', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}>
                            <CheckCircle2 size={13} /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payout Details Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              background: '#12141c',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '550px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBooking(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Booking Details</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                {selectedBooking.id || selectedBooking.bookingId}
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 16px 0' }}>
              {selectedBooking.eventName || selectedBooking.eventId}
            </h2>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vendor</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{selectedBooking.vendorName || selectedBooking.vendorId || 'Elite Events Co.'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Client Paid Gross</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  ₹{Number(selectedBooking.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform Fee (10%)</span>
                <span style={{ color: '#ec4899', fontWeight: '600' }}>
                  -₹{Number(selectedBooking.commissionAmount || (selectedBooking.amount || 0) * 0.1).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Net Disbursed</span>
                <span style={{ color: '#00e676', fontWeight: '700' }}>
                  ₹{Number(selectedBooking.netPayout || (selectedBooking.amount || 0) * 0.9).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

