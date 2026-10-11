function FormInputPassword({
  label,
  type = "text",
  placeholder,
  value,
  setValue,
  setShowPassword,
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
  );
}

export default FormInputPassword;
