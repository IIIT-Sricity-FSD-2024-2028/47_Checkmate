import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/auth/authService";
import { saveAuthSession } from "../../services/auth/authStorage";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";

function SignIn() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await login(emailInput, passwordInput);

      saveAuthSession(data);

      console.log("Login successful:", data);
      navigate(`/${data.role}/dashboard`);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card">
          <h2>Sign in</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                placeholder="user@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />

                <button
                  type="button"
                  className="show-password-button"
                  onPointerDown={() => setShowPassword(true)}
                  onPointerUp={() => setShowPassword(false)}
                  onPointerLeave={() => setShowPassword(false)}
                >
                  Show
                </button>
              </div>
            </div>
            <button type="submit" className="signin-button">
              Sign in →
            </button>
          </form>

          <p className="signup-text">
            No account?{" "}
            <span onClick={() => navigate("/signup-details")}>Create one</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
