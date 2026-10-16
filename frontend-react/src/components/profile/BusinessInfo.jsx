function BusinessInfo({ formData, handleChange, editing }) {
  const fields = [
    { label: "Address", name: "address" },
    {
      label: "Years of Experience",
      name: "years_experience",
      type: "number",
    },
    { label: "LinkedIn URL", name: "linkedin_url", type: "url" },
    { label: "Website URL", name: "website_url", type: "url" },
  ];

  return (
    <section className="profile-section">
      <h2>Business Information</h2>

      <div className="profile-info-grid">
        {fields.map((field) => (
          <div className="profile-field" key={field.name}>
            <label>{field.label}</label>

            {editing ? (
              <input
                name={field.name}
                type={field.type || "text"}
                min={field.type === "number" ? 0 : undefined}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
              />
            ) : field.type === "url" && formData[field.name] ? (
              <a
                href={formData[field.name]}
                target="_blank"
                rel="noreferrer"
              >
                {formData[field.name]}
              </a>
            ) : (
              <p>{formData[field.name] || "NA"}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default BusinessInfo;