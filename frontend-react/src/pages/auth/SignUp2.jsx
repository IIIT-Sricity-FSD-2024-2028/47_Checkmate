import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInputPassword from "../../components/auth/FormInputPassword";
import { register } from "../../services/auth/authService";
import { saveAuthSession } from "../../services/auth/authStorage";

const SIGNUP_DRAFT_KEY = "eventpro_signup_draft";

function SignUp2() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step1Data, setStep1Data] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmInput, setPasswordConfirmInput] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const data = location.state || JSON.parse(sessionStorage.getItem(SIGNUP_DRAFT_KEY) || "null");
      if (!data || !data.email || !data.name) {
        setErrorMessage("Registration details are missing. Please complete step 1 first.");
      } else {
        setStep1Data(data);
      }
    } catch {
      setErrorMessage("Could not load registration data. Please return to step 1.");
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    const errors = {};

    if (!step1Data || !step1Data.email || !step1Data.name) {
      setErrorMessage("Registration details are missing. Please return to step 1.");
      return;
    }

    if (!passwordInput) {
      errors.password = "Password is required.";
    } else if (passwordInput.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!passwordConfirmInput) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (passwordInput !== passwordConfirmInput) {
      errors.confirmPassword = "Passwords do not match. Please re-enter your password.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: step1Data.name,
        email: step1Data.email,
        phone: step1Data.phone || undefined,
        password: passwordInput,
        role: "Client", // All accounts created through Create Account are Client accounts only
      };

      const response = await register(payload);

      // Save user session in localStorage and sessionStorage
      saveAuthSession(response);

      // Clear draft
      try {
        sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
      } catch {
        // Ignore
      }

      // Navigate directly into client dashboard
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      console.error("Account creation failed:", err);
      const serverMessage =
        err.data?.message ||
        err.message ||
        "An unexpected error occurred while creating your account. Please try again.";
      setErrorMessage(
        Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    navigate("/signup-details", { state: step1Data });
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card-signup">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <h2 style={{ margin: 0 }}>Create your account</h2>
            <span style={{ fontSize: "12px", color: "var(--pink, #ff2f87)", fontWeight: 700, letterSpacing: "0.5px" }}>
              STEP 2 OF 2
            </span>
          </div>

          {step1Data ? (
            <p style={{ color: "#9295a5", fontSize: "13.5px", margin: "0 0 20px 0", lineHeight: 1.4 }}>
              Creating client account for <strong style={{ color: "#ffffff" }}>{step1Data.name}</strong> ({step1Data.email}).
            </p>
          ) : (
            <p style={{ color: "#9295a5", fontSize: "13.5px", margin: "0 0 20px 0", lineHeight: 1.4 }}>
              Set up a secure password for your client account.
            </p>
          )}

          {errorMessage && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: "20px" }}>
              <AlertCircle size={16} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {(!step1Data || !step1Data.email) && (
            <div style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className="signin-button"
                style={{ background: "#374151", color: "#fff" }}
                onClick={handleBackToStep1}
              >
                ← Back to Step 1
              </button>
            </div>
          )}

          {step1Data && (
            <form onSubmit={handleSubmit} noValidate>
              <FormInputPassword
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={passwordInput}
                setValue={(val) => {
                  setPasswordInput(val);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                  // Live match check if confirm pass already has text
                  if (passwordConfirmInput && val !== passwordConfirmInput) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
                  } else if (passwordConfirmInput && val === passwordConfirmInput) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                setShowPassword={setShowPassword}
                error={fieldErrors.password}
              />

              <FormInputPassword
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={passwordConfirmInput}
                setValue={(val) => {
                  setPasswordConfirmInput(val);
                  if (passwordInput && val !== passwordInput) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: "Passwords do not match.",
                    }));
                  } else {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                setShowPassword={setShowConfirmPassword}
                error={fieldErrors.confirmPassword}
              />

              <button
                type="submit"
                className="signin-button"
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Create Account</span>
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 8px",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff2f87")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Step 1 (Edit Details)</span>
                </button>
              </div>
            </form>
          )}

          <p className="signup-text">
            Already Registered?{" "}
            <span onClick={() => navigate("/signin")}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp2;
