function FormInput({ label, type = "text", placeholder, value, setValue, error }) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={error ? { borderColor: "#ef4444" } : {}}
      />
      {error && (
        <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default FormInput;