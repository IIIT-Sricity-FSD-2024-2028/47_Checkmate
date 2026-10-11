function FormInput({label,type = "text", placeholder, value, setValue}) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default FormInput