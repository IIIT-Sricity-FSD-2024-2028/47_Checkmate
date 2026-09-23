import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";

function SignIn() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="auth-page">

      <AuthBrandPanel />

      <div className="auth-form-section">

        <div className="auth-form-card">

          <h2>Sign in</h2>

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

          <button
            className="signin-button"
            onClick={() => navigate("/client/dashboard")}
          >
            Sign in →
          </button>

          <p className="signup-text">
            No account?{" "}
            <span onClick={() => navigate("/signup")}>
              Create one
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}

export default SignIn;