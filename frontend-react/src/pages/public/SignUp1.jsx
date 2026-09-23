import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../../components/auth/AuthBrandPanel";

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

          <div className="form-group-signup">
            <label>First Name</label>

            <input
              type="text"
              placeholder="First Name"
              value={firstNameInput}
              onChange={(e) => setFirstNameInput(e.target.value)}
            />
          </div>

          <div className="form-group-signup">
            <label>Last Name</label>

            <input
              type="text"
              placeholder="Last Name"
              value={lastNameInput}
              onChange={(e) => setLastNamrInput(e.target.value)}
            />
          </div>

          <div className="form-group-signup">
            <label>Email address</label>

            <input
              type="email"
              placeholder="user@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>

          <div className="form-group-signup">
            <label>Phone Number</label>

            <input
              type="text"
              placeholder="Enter your phone"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
            />
          </div>

          <button
            className="signin-button"
            onClick={() => navigate("/signup-password")}
          >
            Continue →
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

export default SignUp1;