const steps = [
  ["Client creates an event request", "Submit event details and requirements"],
  ["Vendor reviews and approves the request", "Vendors evaluate and accept events"],
  ["Resources and staff are assigned", "Allocate necessary resources and team"],
  ["Event progress is tracked until completion", "Monitor every step to success"]
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works fade-in">
      <div className="container">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>A simple 4-step process to bring your events to life</p>
        </div>

        <div className="steps-timeline">
          <div className="timeline-line" />
          {steps.map((step, index) => (
            <div className="step" key={step[0]}>
              <div className="step-num">{index + 1}</div>
              <h3>{step[0]}</h3>
              <p>{step[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
