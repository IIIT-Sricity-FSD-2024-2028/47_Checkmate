const features = [
  {
    icon: "ph-calendar-blank",
    title: "Event Planning",
    description: "Create and manage events easily with smart scheduling."
  },
  {
    icon: "ph-cube",
    title: "Vendor Management",
    description: "Connect vendors, allocate resources, and manage services."
  },
  {
    icon: "ph-users",
    title: "Staff Coordination",
    description: "Assign staff tasks and track progress in real time."
  }
];

export default function Features() {
  return (
    <section id="features" className="features fade-in">
      <div className="container">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to manage successful events from start to finish</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="card-icon"><i className={`ph ${feature.icon}`} /></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
