function PersonalInfo({ formData, handleChange, editing }) {
  const fields = [
    { label: "Name", name: "name" },
    { label: "Email Address", name: "email", type: "email" },
    { label: "Phone Number", name: "phone", type: "tel" },
  ];

  return (
    <section className="profile-section">
      <h2>Personal Information</h2>

      <div className="profile-info-grid">
        {fields.map((field) => (
          <div className="profile-field" key={field.name}>
            <label>{field.label}</label>

            {editing ? (
              <input
                name={field.name}
                type={field.type || "text"}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
              />
            ) : (
              <p>{formData[field.name] || "NA"}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PersonalInfo;