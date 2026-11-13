function FormInputPassword({
  label,
  type = "password",
  placeholder,
  value,
  setValue,
  setShowPassword,
  error,
}) {
  const isVisible = type === "text";

  const handleToggle = () => {
    if (typeof setShowPassword === "function") {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={error ? { borderColor: "#ef4444" } : {}}
          autoComplete="new-password"
        />

        <button
          type="button"
          className="show-password-button"
          onClick={handleToggle}
          title={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error && (
        <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default FormInputPassword;
