const events = [
  {
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600&h=400",
    title: "Weddings",
    description: "Elegant ceremonies and celebrations"
  },
  {
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600&h=400",
    title: "Corporate Events",
    description: "Professional conferences and meetings"
  },
  {
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600&h=400",
    title: "Special Events",
    description: "Birthdays, parties, and celebrations"
  }
];

export default function Events() {
  return (
    <section id="events" className="events fade-in">
      <div className="container">
        <div className="section-header">
          <h2>Events We Manage</h2>
          <p>From weddings to conferences, we handle it all</p>
        </div>

        <div className="events-grid">
          {events.map((event) => (
            <div className="event-card" key={event.title}>
              <img src={event.image} alt={event.title} />
              <div className="event-card-content">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
