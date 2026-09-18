import { useState } from "react";

function SignIn() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <h1>SignIn</h1>
      <label>Email</label>
      <input
        type="text"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
      ></input>
      <label>Password</label>
      <input
        type={showPassword ? "text" : "password"}
        value={passwordInput}
        onChange={(e) => setPasswordInput(e.target.value)}
      ></input>
      <button
        onPointerDown={() => setShowPassword(true)}
        onPointerUp={() => setShowPassword(false)}
        onPointerLeave={() => setShowPassword(false)}
      >
        Show Password
      </button>
      <h1>{emailInput}</h1>
    </>
  );
}

export default SignIn;
