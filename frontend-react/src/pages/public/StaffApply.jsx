/**
 * ============================================================================
 * STAFF APPLICATION PAGE (StaffApply.jsx)
 * ============================================================================
 * Role: Public page, route /join-staff
 *
 * Purpose:
 *   Lets someone apply to work for a vendor. The designation list comes from the
 *   vendors on the platform, so the choice also decides who they work for.
 *   Their login only works once that vendor approves the application.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, X } from "lucide-react";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInput from "../../components/auth/FormInput";
import FormInputPassword from "../../components/auth/FormInputPassword";
import { applyAsStaff, getPublicDesignations } from "../../services/staffOnboardingService";
import "../../styles/vendor.css";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const EMPTY_FORM = { name: "", email: "", phone: "", password: "", confirm: "", vendorId: "" };

function validate(form, files) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a valid phone number.";
  if (form.password.length < 8) errors.password = "Password must be at least 8 characters long.";
  if (form.confirm !== form.password) errors.confirm = "Passwords do not match.";
  if (!form.vendorId) errors.vendorId = "Please choose a designation.";
  if (files.length === 0) errors.files = "Attach at least one document, such as an ID proof or resume.";
  return errors;
}

function StaffApply() {
  const [searchParams] = useSearchParams();
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM, vendorId: searchParams.get("vendor") || "" });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    getPublicDesignations()
      .then((list) => setDesignations(Array.isArray(list) ? list : []))
      .catch(() => setGeneralError("Could not load the available work. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = ""; // Lets the same file be picked again after removing it
    const invalid = picked.find((f) => !FILE_TYPES.includes(f.type) || f.size > MAX_FILE_BYTES);
    if (invalid) {
      setErrors((prev) => ({ ...prev, files: `${invalid.name}: use a PDF, PNG or JPG under 5 MB.` }));
      return;
    }
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    const found = validate(form, files);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = new FormData();
    ["name", "email", "phone", "password", "vendorId"].forEach((key) => body.append(key, form[key].trim()));
    files.forEach((file) => body.append("documents", file));

    setSubmitting(true);
    try {
      setSubmitted(await applyAsStaff(body));
    } catch (err) {
      setGeneralError(err.message || "Could not submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card-signup">
          {submitted ? (
            <div className="staff-apply-done">
              <CheckCircle2 size={44} color="#4ade80" />
              <h2>Application submitted</h2>
              <p>
                {submitted.vendorName} will review your application for {submitted.designation}.
                Once approved, you can sign in with {submitted.email} and your password.
              </p>
              <Link to="/" className="staff-apply-back"><ArrowLeft size={15} /> Back to home</Link>
            </div>
          ) : (
            <>
              <h2 style={{ margin: 0 }}>We're hiring</h2>
              <p className="staff-apply-intro">
                Apply to join a vendor's team. Your account is created once the vendor approves you.
              </p>

              {generalError && (
                <div className="auth-error-banner" role="alert" style={{ marginBottom: "20px" }}>
                  <AlertCircle size={16} className="error-icon" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="staffDesignation">Designation</label>
                  <select
                    id="staffDesignation"
                    className="staff-apply-select"
                    value={form.vendorId}
                    onChange={(e) => update("vendorId")(e.target.value)}
                    style={errors.vendorId ? { borderColor: "#ef4444" } : undefined}
                  >
                    <option value="">
                      {loading ? "Loading..." : designations.length ? "Choose your work" : "No work available right now"}
                    </option>
                    {designations.map((d) => (
                      <option key={d.vendorId} value={d.vendorId}>{d.designation} · {d.vendorName}</option>
                    ))}
                  </select>
                  {errors.vendorId && <span className="staff-apply-error">{errors.vendorId}</span>}
                </div>

                <FormInput label="Full Name" placeholder="Your full name" value={form.name} setValue={update("name")} error={errors.name} />
                <FormInput label="Email" type="email" placeholder="you@example.com" value={form.email} setValue={update("email")} error={errors.email} />
                <FormInput label="Phone Number" type="tel" placeholder="9876543210" value={form.phone} setValue={update("phone")} error={errors.phone} />
                <FormInputPassword
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  setValue={update("password")}
                  setShowPassword={setShowPassword}
                  error={errors.password}
                />
                <FormInputPassword
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter it again"
                  value={form.confirm}
                  setValue={update("confirm")}
                  setShowPassword={setShowPassword}
                  error={errors.confirm}
                />

                <div className="form-group">
                  <label htmlFor="staffDocuments">Documents (ID proof, resume)</label>
                  <input
                    id="staffDocuments"
                    className="staff-apply-file"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFiles}
                    disabled={files.length >= MAX_FILES}
                  />
                  <span className="staff-apply-hint">Up to 3 files. PDF, PNG or JPG, 5 MB each.</span>
                  {files.map((file) => (
                    <div className="staff-apply-filerow" key={file.name}>
                      <FileText size={14} />
                      <span>{file.name}</span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {errors.files && <span className="staff-apply-error">{errors.files}</span>}
                </div>

                <button type="submit" className="staff-apply-submit" disabled={submitting || designations.length === 0}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>

              <p className="staff-apply-signin">
                Already approved? <Link to="/signin">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffApply;
