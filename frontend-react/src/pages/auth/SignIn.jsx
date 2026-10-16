import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/auth/authService";
import { saveAuthSession } from "../../services/auth/authStorage";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInput from "../../components/auth/FormInput";
import FormInputPassword from "../../components/auth/FormInputPassword";

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
            <FormInput
              label="Email address"
              placeholder="user@example.com"
              value={emailInput}
              setValue={setEmailInput}
            ></FormInput>

            <FormInputPassword
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={passwordInput}
              setValue={setPasswordInput}
              setShowPassword={setShowPassword}
            ></FormInputPassword>

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
