import React from "react";
import { Zap } from "lucide-react";

/**
 * ClientPackageCard Component
 * ----------------------------------------------------------------------------
 * One package in the Browse Packages grid: photo, category pill, name,
 * description, included services, included staff, price, duration/capacity
 * and the "Quick Create" button.
 *
 * Props:
 *  - pkg: the package object
 *  - onQuickCreate: called with the package when the button is clicked
 */

// Same Unsplash photos the old page used, one per category
// (the old birthday photo was deleted from Unsplash, so birthday reuses the party one)
const IMAGES = {
  wedding: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80",
  birthday: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
  corporate: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=600&q=80",
  party: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
};

function ClientPackageCard({ pkg, onQuickCreate }) {
  const cat = (pkg.category || "party").toLowerCase();
  const services = pkg.resources || [];
  const staff = pkg.staff || [];

  return (
    <div className="cl-pkg-card">
      {/* onError: if a photo ever disappears, fall back to the party photo */}
      <img className="cl-pkg-card__img" src={IMAGES[cat] || IMAGES.party} alt={pkg.name}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGES.party; }} />

      <div className="cl-pkg-card__body">
        <span className={`cl-type cl-type--${cat}`}>{pkg.category || "Package"}</span>
        <h3>{pkg.name}</h3>
        <p className="cl-pkg-card__desc">{pkg.desc}</p>

        <div className="cl-pkg-card__lists">
          <h4>Included Services:</h4>
          <ul>
            {services.length === 0 && <li>Standard Setup</li>}
            {services.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <h4>Staff Included:</h4>
          <ul>
            {staff.length === 0 && <li>Event Coordinator</li>}
            {staff.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>

        <div className="cl-pkg-card__footer">
          <div className="cl-pkg-card__price">${(pkg.price || 0).toLocaleString()}</div>
          <div className="cl-muted-text">{pkg.duration || 0} hours • Up to {pkg.capacity || "N/A"} Guests</div>
          <button type="button" className="cl-btn-pink" onClick={() => onQuickCreate(pkg)}>
            <Zap size={16} /> Quick Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientPackageCard;
