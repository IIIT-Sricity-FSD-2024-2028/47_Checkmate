import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";
import FormInput from "../../components/auth/FormInput";

function SignUp1() {
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNamrInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");

  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <AuthBrandPanel />

      <div className="auth-form-section">
        <div className="auth-form-card-signup">
          <h2>Create your acount</h2>

          <FormInput
            label="First Name"
            placeholder="First Name"
            value={firstNameInput}
            setValue={setFirstNameInput}
          ></FormInput>

          <FormInput
            label="Last Name"
            placeholder="Last Name"
            value={lastNameInput}
            setValue={setLastNamrInput}
          ></FormInput>

          <FormInput
            label="Email address"
            type="email"
            placeholder="user@example.com"
            value={emailInput}
            setValue={setEmailInput}
          ></FormInput>

          <FormInput
            label="Phone Number"
            placeholder="Enter your phone"
            value={phoneNumberInput}
            setValue={setPhoneNumberInput}
          ></FormInput>

          <button
            className="signin-button"
            onClick={() => navigate("/signup-password")}
          >
            Continue →
          </button>

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
