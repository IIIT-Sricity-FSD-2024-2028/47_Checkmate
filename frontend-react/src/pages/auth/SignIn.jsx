import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { login } from "../../services/auth/authService";
import {
  saveAuthSession,
  getAuthToken,
  getAuthRole,
} from "../../services/auth/authStorage";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInput from "../../components/auth/FormInput";
import FormInputPassword from "../../components/auth/FormInputPassword";
import AccountRecoveryModal from "../../components/auth/AccountRecoveryModal";

function SignIn() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Account Recovery Modal
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState("password");

  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated with a valid session, automatically redirect to user's dashboard
  useEffect(() => {
    const token = getAuthToken();
    const role = getAuthRole();
    if (token && role) {
      navigate(`/${role.toLowerCase()}/dashboard`, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !passwordInput) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await login(cleanEmail, passwordInput);

      // Save credentials in session and local storage across the app
      saveAuthSession(data);

      const normalizedRole = (
        data.role ||
        data.user?.role ||
        "client"
      ).toLowerCase();

      // If user attempted to navigate to a protected URL earlier, return them there
      const returnPath = location.state?.from?.pathname;
      const targetDestination =
        returnPath && returnPath.startsWith(`/${normalizedRole}`)
          ? returnPath
          : `/${normalizedRole}/dashboard`;

      navigate(targetDestination, { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      const serverMessage =
        error.data?.message ||
        error.message ||
        "Invalid email or password. Please verify your credentials.";
      setErrorMessage(
        Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecovery = (tab) => {
    setRecoveryTab(tab);
    setIsRecoveryOpen(true);
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card">
          <h2>Sign in</h2>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon">
                <AlertCircle size={17} />
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label="Email address"
              type="email"
              placeholder="user@example.com"
              value={emailInput}
              setValue={(val) => {
                setEmailInput(val);
                if (errorMessage) setErrorMessage("");
              }}
            />

            <FormInputPassword
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={passwordInput}
              setValue={(val) => {
                setPasswordInput(val);
                if (errorMessage) setErrorMessage("");
              }}
              setShowPassword={setShowPassword}
            />

            {/* Forgot Password Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-4px", marginBottom: "12px" }}>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => handleOpenRecovery("password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--pink, #e91e8c)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "opacity 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="signin-button"
              disabled={loading}
              title="Sign in to your account"
            >
              {loading ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" /> Signing in...
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Sign in <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="signup-text">
            No account?{" "}
            <span onClick={() => navigate("/signup-details")}>Create one</span>
          </p>

          <p className="signup-text" style={{ marginTop: "8px", fontSize: "12.5px" }}>
            Forgot your login ID?{" "}
            <span onClick={() => handleOpenRecovery("email")}>Find account</span>
          </p>
        </div>
      </div>

      {/* Unified Account Recovery Modal */}
      <AccountRecoveryModal
        isOpen={isRecoveryOpen}
        defaultTab={recoveryTab}
        onClose={() => setIsRecoveryOpen(false)}
        onEmailFound={(foundEmail) => {
          setEmailInput(foundEmail);
          setErrorMessage("");
        }}
      />
    </div>
  );
}

export default SignIn;
