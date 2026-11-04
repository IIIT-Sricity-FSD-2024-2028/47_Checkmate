import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Clock, Send, RotateCcw } from 'lucide-react';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import VerifyBusinessProfileCard from '../../components/vendor/VerifyBusinessProfileCard';
import VerifyDocUploadCard from '../../components/vendor/VerifyDocUploadCard';

import { getAuthUser } from '../../services/auth/authStorage';

const STORAGE_KEY_DOCS = 'eventpro_vendor_doc_submission_v1';

export default function VerifyDocs() {
  const currentUser = getAuthUser() || {};

  // Business profile form
  const [vendorName, setVendorName] = useState(currentUser.name || 'Sarah Williams');
  const [businessName, setBusinessName] = useState(currentUser.businessName || 'Elite Events Co.');
  const [email, setEmail] = useState(currentUser.email || 'sarah@eliteevents.com');
  const [phone, setPhone] = useState(currentUser.phone || '+1 555-1002');
  const [category, setCategory] = useState('Event Planning & Coordination');

  // Documents
  const [documents, setDocuments] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.documents || {};
      }
    } catch {
      // ignore
    }
    return {
      license: { name: 'elite_events_license_2026.pdf', size: 1024 * 320 },
      taxid: { name: 'gst_ein_certificate.pdf', size: 1024 * 180 },
      insurance: { name: 'liability_insurance_policy.pdf', size: 1024 * 450 },
    };
  });

  // Verification status: 'verified' | 'pending' | 'action_needed'
  const [status, setStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.status || 'verified';
      }
    } catch {
      // ignore
    }
    return 'verified';
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Handlers
  const handleFileUpload = (key, file) => {
    setDocuments((prev) => ({
      ...prev,
      [key]: { name: file.name, size: file.size },
    }));
  };

  const handleFileRemove = (key) => {
    setDocuments((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Reset Form
  const handleReset = () => {
    setVendorName(currentUser.name || 'Sarah Williams');
    setBusinessName(currentUser.businessName || 'Elite Events Co.');
    setEmail(currentUser.email || 'sarah@eliteevents.com');
    setPhone(currentUser.phone || '+1 555-1002');
    setCategory('Event Planning & Coordination');
    setDocuments({});
    setStatus('action_needed');
    localStorage.removeItem(STORAGE_KEY_DOCS);
    setToastMessage({ type: 'info', text: 'Document verification form reset.' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit for Verification
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!documents.license || !documents.taxid) {
      alert('Please upload both Business License and Tax ID certificates.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('pending');
      const payload = {
        vendorName,
        businessName,
        email,
        phone,
        category,
        documents,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(payload));
      } catch {
        // ignore
      }

      setIsSubmitting(false);
      setToastMessage({
        type: 'success',
        text: 'Verification dossier transmitted successfully! Administrator review scheduled within 24 hours.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 800);
  };

  return (
    <div className="vendor-dashboard">
      <VendorTopBar title="Verify Documents" />

      <div className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              background: toastMessage.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
              border: `1px solid ${toastMessage.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)'}`,
              color: toastMessage.type === 'success' ? '#86efac' : '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeUpVendor 0.25s ease-out',
            }}
          >
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Status Banner */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background:
              status === 'verified'
                ? 'rgba(34,197,94,0.10)'
                : status === 'pending'
                ? 'rgba(234,179,8,0.10)'
                : 'rgba(239,68,68,0.10)',
            border:
              status === 'verified'
                ? '1px solid rgba(34,197,94,0.3)'
                : status === 'pending'
                ? '1px solid rgba(234,179,8,0.3)'
                : '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background:
                  status === 'verified'
                    ? 'rgba(34,197,94,0.2)'
                    : status === 'pending'
                    ? 'rgba(234,179,8,0.2)'
                    : 'rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status === 'verified' ? '#22c55e' : status === 'pending' ? '#eab308' : '#ef4444',
                flexShrink: 0,
              }}
            >
              {status === 'verified' ? (
                <ShieldCheck size={22} />
              ) : status === 'pending' ? (
                <Clock size={22} />
              ) : (
                <Clock size={22} />
              )}
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {status === 'verified'
                  ? 'Vendor Credentials Fully Verified'
                  : status === 'pending'
                  ? 'Verification Documents Under Review'
                  : 'Document Submission Action Required'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {status === 'verified'
                  ? 'Your business license and tax certificates are validated by Checkmate Super Admin. Payout clearance enabled.'
                  : status === 'pending'
                  ? 'Your dossier has been transmitted and is currently being validated by our moderation compliance team.'
                  : 'Please upload valid business certificates to unlock automatic financial payouts.'}
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              background:
                status === 'verified'
                  ? 'rgba(34,197,94,0.2)'
                  : status === 'pending'
                  ? 'rgba(234,179,8,0.2)'
                  : 'rgba(239,68,68,0.2)',
              color: status === 'verified' ? '#86efac' : status === 'pending' ? '#fde047' : '#fca5a5',
              border: `1px solid ${
                status === 'verified'
                  ? 'rgba(34,197,94,0.4)'
                  : status === 'pending'
                  ? 'rgba(234,179,8,0.4)'
                  : 'rgba(239,68,68,0.4)'
              }`,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'verified' ? 'Verified Partner' : status === 'pending' ? 'Pending Review' : 'Action Needed'}
          </span>
        </div>

        {/* Business Profile Details Card */}
        <VerifyBusinessProfileCard
          vendorName={vendorName}
          setVendorName={setVendorName}
          businessName={businessName}
          setBusinessName={setBusinessName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          category={category}
          setCategory={setCategory}
        />

        {/* Document Upload Dropzones Card */}
        <VerifyDocUploadCard
          documents={documents}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
        />

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="ri-cancel"
            onClick={handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            className="ri-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Transmitting Documents...' : 'Submit for Verification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

