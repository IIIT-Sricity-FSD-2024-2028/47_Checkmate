import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInputPassword from "../../components/auth/FormInputPassword";

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

          <FormInputPassword
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={passwordInput}
              setValue={setPasswordInput}
              setShowPassword={setShowPassword}
            ></FormInputPassword>

            <FormInputPassword
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={showConfirmPassword}
              setValue={setPasswordConfirmInput}
              setShowPassword={setShowConfirmPassword}
            ></FormInputPassword>

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