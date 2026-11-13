/**
 * ============================================================================
 * STAFF ONBOARDING PAGE (StaffOnboarding.jsx)
 * ============================================================================
 * Role: Vendor, route /vendor/staff-onboarding
 *
 * Purpose:
 *   The only way a vendor gains staff. The vendor reviews the people who chose
 *   to work for them, and approving an application immediately creates that
 *   person's staff account under this vendor.
 * ============================================================================
 */

import React, { useCallback, useEffect, useState } from "react";
import { Check, FileText, Mail, Phone, X } from "lucide-react";

import VendorTopBar from "../../components/vendor/VendorTopBar";
import {
  decideStaffApplication,
  downloadApplicationDocument,
  getStaffApplications,
} from "../../services/staffOnboardingService";
import "../../styles/vendor.css";

const TABS = ["pending", "approved", "rejected"];

function StaffOnboarding() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const showToast = useCallback((text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getStaffApplications()
      .then((apps) => isMounted && setApplications(apps))
      .catch((err) => isMounted && showToast(err.message || "Could not load onboarding data.", "danger"))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const decide = async (application, status, note) => {
    setBusyId(application.id);
    try {
      const updated = await decideStaffApplication(application.id, status, note);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setRejecting(null);
      showToast(
        status === "approved"
          ? `${application.name} approved. Their staff account is ready.`
          : `${application.name}'s application was rejected.`,
        status === "approved" ? "success" : "info"
      );
    } catch (err) {
      showToast(err.message || "Could not save this decision.", "danger");
    } finally {
      setBusyId(null);
    }
  };

  const openDocument = async (application, doc) => {
    try {
      await downloadApplicationDocument(application.id, doc);
    } catch (err) {
      showToast(err.message, "danger");
    }
  };

  const visible = applications.filter((a) => a.status === tab);
  const countFor = (status) => applications.filter((a) => a.status === status).length;

  return (
    <div className="dashboard-page">
      <VendorTopBar title="Staff Onboarding" />

      <div className="content">
        {toast && (
          <div className={`toast-feedback toast-feedback--${toast.type}`}>
            <span>{toast.text}</span>
          </div>
        )}

        {/* ── Applications ── */}
        <div className="client-req-card er-card-section">
          <div className="so-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`so-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t} ({countFor(t)})
              </button>
            ))}
          </div>

          {loading && <p className="so-empty">Loading applications...</p>}
          {!loading && visible.length === 0 && <p className="so-empty">No {tab} applications.</p>}

          {visible.map((a) => (
            <div className="so-application" key={a.id}>
              <div className="so-application__main">
                <div className="so-name">
                  {a.name} <span className="so-role">{a.designation}</span>
                </div>
                <div className="so-meta">
                  <Mail size={12} /> {a.email} <Phone size={12} /> {a.phone}
                </div>
                <div className="so-docs">
                  {a.documents.map((doc) => (
                    <button type="button" className="so-doc" key={doc.id} onClick={() => openDocument(a, doc)}>
                      <FileText size={13} /> {doc.name}
                    </button>
                  ))}
                </div>
                {a.note && <div className="so-meta">Note: {a.note}</div>}
              </div>

              {a.status === "pending" && (
                <div className="so-application__actions">
                  <button type="button" className="er-btn-action-assign" disabled={busyId === a.id} onClick={() => decide(a, "approved")}>
                    <Check size={13} /> Approve
                  </button>
                  <button
                    type="button"
                    className="er-btn-action-allocate"
                    disabled={busyId === a.id}
                    onClick={() => {
                      setRejectNote("");
                      setRejecting(a);
                    }}
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {rejecting && (
        <div className="vendor-modal-backdrop" onClick={() => setRejecting(null)}>
          <div className="vendor-modal" role="dialog" aria-modal="true" aria-label="Reject application" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal__header">
              <h3>Reject {rejecting.name}?</h3>
              <button type="button" className="modal-close-btn" onClick={() => setRejecting(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="vendor-modal__body">
              <label className="form-label" htmlFor="rejectNote">Reason (optional, for your records)</label>
              <textarea id="rejectNote" className="form-input" rows="3" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            </div>
            <div className="vendor-modal__footer">
              <button type="button" className="mr-filter-reset-btn" onClick={() => setRejecting(null)}>Cancel</button>
              <button type="button" className="mr-add-btn" disabled={busyId === rejecting.id} onClick={() => decide(rejecting, "rejected", rejectNote.trim() || undefined)}>
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffOnboarding;
