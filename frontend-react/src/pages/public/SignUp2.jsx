import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";

function SignUp2() {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmInput, setPasswordConfirmInput] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="auth-page">

      <AuthBrandPanel />

      <div className="auth-form-section">

        <div className="auth-form-card-signup">

          <h2>Create your acount</h2>

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

          <div className="form-group">
            <label>Confirm Password</label>

            <div className="password-input-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={passwordConfirmInput}
                onChange={(e) => setPasswordConfirmInput(e.target.value)}
              />

              <button
                type="button"
                className="show-password-button"
                onPointerDown={() => setShowConfirmPassword(true)}
                onPointerUp={() => setShowConfirmPassword(false)}
                onPointerLeave={() => setShowConfirmPassword(false)}
              >
                Show
              </button>

            </div>
          </div>

          <button
            className="signin-button"
            onClick={() => navigate("/client/dashboard")}
          >
            Confirm →
          </button>

          <p className="signup-text">
            Already Registered?{" "}
            <span onClick={() => navigate("/signin")}>
              Sign In
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}

export default SignUp2;