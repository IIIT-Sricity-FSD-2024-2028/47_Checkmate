const stats = [
  ["12,500+", "Events Managed"],
  ["98.5%", "Completion Rate"],
  ["850+", "Active Vendors"],
  ["45,000+", "Satisfied Clients"],
];

export default function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <h2>Trusted By Thousands</h2>

        <div className="stats-box">
          <div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-item" key={stat[1]}>
                <h3>{stat[0]}</h3>
                <p>{stat[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
