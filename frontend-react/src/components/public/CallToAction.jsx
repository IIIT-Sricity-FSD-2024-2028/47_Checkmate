export default function CallToAction() {
  return (
    <section id="cta" className="cta fade-in">
      <div className="container">
        <div className="cta-card">
          <i className="ph ph-star cta-icon" />
          <h2>Start Managing Events Smarter Today</h2>
          <p>
            Join thousands of event professionals who trust Event Manager to
            bring their visions to life
          </p>
          <div className="cta-buttons">
            <a href="/signup-details" className="btn-primary">
              Create Account <i className="ph ph-arrow-right" />
            </a>
            <a href="/signin" className="btn-outline-dark">Sign In</a>
          </div>
        </div>
      </div>
    </section>
  );
}
