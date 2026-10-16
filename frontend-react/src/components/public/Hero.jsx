export default function Hero() {
  return (
    <section id="home" className="hero fade-in">
      <div className="hero-bg">
        <div className="overlay" />
        <div className="glow" />
      </div>

      <div className="container hero-content">
        <div className="hero-icon"><i className="ph-fill ph-calendar-blank" /></div>
        <h1>Manage Events With<br /><span className="highlight">Precision</span></h1>
        <p>
          A smart platform that connects clients, vendors, and staff to organize
          events efficiently
        </p>
        <div className="hero-buttons">
          <a href="/signup-details" className="btn-primary">
            Get Started <i className="ph ph-arrow-right" />
          </a>
          <a href="/signin" className="btn-outline">
            Sign In <i className="ph ph-caret-right" />
          </a>
        </div>
      </div>
    </section>
  );
}
