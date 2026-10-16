export default function FinalHero() {
  return (
    <section id="final-hero" className="final-hero fade-in">
      <div className="final-hero-bg"><div className="overlay" /></div>
      <div className="container final-hero-content">
        <div className="final-icon"><i className="ph ph-sparkle" /></div>
        <h2>Ready to Plan Your<br /><span className="highlight">Next Event?</span></h2>
        <p>
          Transform your event vision into reality with our comprehensive
          management platform
        </p>
        <div className="final-buttons">
          <a href="/signup-details" className="btn-primary">
            Get Started <i className="ph ph-arrow-right" />
          </a>
          <a href="mailto:contact@example.com" className="btn-outline">
            Contact Us <i className="ph ph-caret-right" />
          </a>
        </div>
      </div>
    </section>
  );
}
