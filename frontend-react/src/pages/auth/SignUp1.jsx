import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInput from "../../components/auth/FormInput";

const SIGNUP_DRAFT_KEY = "eventpro_signup_draft";

function SignUp1() {
  const navigate = useNavigate();
  const location = useLocation();

  // Prepopulate from location state or draft storage if returning from Step 2
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    try {
      const savedDraft = location.state || JSON.parse(sessionStorage.getItem(SIGNUP_DRAFT_KEY) || "null");
      if (savedDraft) {
        if (savedDraft.firstName) setFirstNameInput(savedDraft.firstName);
        if (savedDraft.lastName) setLastNameInput(savedDraft.lastName);
        if (savedDraft.email) setEmailInput(savedDraft.email);
        if (savedDraft.phone) setPhoneNumberInput(savedDraft.phone);
      }
    } catch (e) {
      // Ignore parse error
    }
  }, [location.state]);

  const handleContinue = (e) => {
    if (e) e.preventDefault();
    setGeneralError("");
    const errors = {};

    const cleanFirst = firstNameInput.trim();
    const cleanLast = lastNameInput.trim();
    const cleanEmail = emailInput.trim();
    const cleanPhone = phoneNumberInput.trim();

    if (!cleanFirst) {
      errors.firstName = "First name is required.";
    } else if (cleanFirst.length < 2) {
      errors.firstName = "First name must be at least 2 characters.";
    }

    if (!cleanLast) {
      errors.lastName = "Last name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = "Please enter a valid email address (e.g. user@example.com).";
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required.";
    } else if (digitsOnly.length < 7) {
      errors.phone = "Please enter a valid phone number with at least 7 digits.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError("Please resolve the highlighted errors before continuing.");
      return;
    }

    const draftData = {
      firstName: cleanFirst,
      lastName: cleanLast,
      name: `${cleanFirst} ${cleanLast}`,
      email: cleanEmail.toLowerCase(),
      phone: cleanPhone,
    };

    try {
      sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draftData));
    } catch {
      // Ignore storage error
    }

    navigate("/signup-password", { state: draftData });
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card-signup">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <h2 style={{ margin: 0 }}>Create your account</h2>
            <span style={{ fontSize: "12px", color: "var(--pink, #ff2f87)", fontWeight: 700, letterSpacing: "0.5px" }}>
              STEP 1 OF 2
            </span>
          </div>

          <p style={{ color: "#9295a5", fontSize: "13.5px", margin: "0 0 24px 0", lineHeight: 1.4 }}>
            Enter your details below to create your client account.
          </p>

          {generalError && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: "20px" }}>
              <AlertCircle size={16} className="error-icon" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleContinue} noValidate>
            <FormInput
              label="First Name"
              placeholder="e.g. Emily"
              value={firstNameInput}
              setValue={(val) => {
                setFirstNameInput(val);
                if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: "" }));
              }}
              error={fieldErrors.firstName}
            />

            <FormInput
              label="Last Name"
              placeholder="e.g. Carter"
              value={lastNameInput}
              setValue={(val) => {
                setLastNameInput(val);
                if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: "" }));
              }}
              error={fieldErrors.lastName}
            />

            <FormInput
              label="Email address"
              type="email"
              placeholder="client@example.com"
              value={emailInput}
              setValue={(val) => {
                setEmailInput(val);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={fieldErrors.email}
            />

            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="e.g. +1 555-1004"
              value={phoneNumberInput}
              setValue={(val) => {
                setPhoneNumberInput(val);
                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              error={fieldErrors.phone}
            />

            <button
              type="submit"
              className="signin-button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="signup-text">
            Already Registered?{" "}
            <span onClick={() => navigate("/signin")}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp1;
