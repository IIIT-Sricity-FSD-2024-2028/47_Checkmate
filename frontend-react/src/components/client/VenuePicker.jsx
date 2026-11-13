/**
 * Venue dropdown shared by Create Event, Quick Create and Edit Event.
 * Listed venues share one exact name, so clash checks can match them. "Other"
 * keeps the option of a venue the client has arranged themselves.
 */

import React, { useEffect, useState } from "react";
import { getVenues } from "../../services/stateService";

const OTHER = "__other";

function VenuePicker({ value = "", onChange }) {
  const [venues, setVenues] = useState([]);
  const [isOther, setIsOther] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getVenues()
      .then((list) => {
        if (isMounted && Array.isArray(list)) setVenues(list.filter((v) => v.status === "AVAILABLE"));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const isListed = venues.some((v) => v.name === value);
  const showOther = isOther || (Boolean(value) && value !== "TBD" && !isListed);

  const handleSelect = (e) => {
    const selected = e.target.value;
    setIsOther(selected === OTHER);
    onChange(selected === OTHER ? "" : selected);
  };

  return (
    <>
      <select className="cl-input" aria-label="Venue" value={showOther ? OTHER : isListed ? value : ""} onChange={handleSelect}>
        <option value="">Let the vendor suggest one</option>
        {venues.map((v) => (
          <option key={v.id} value={v.name}>
            {v.name} · up to {v.capacity} guests
          </option>
        ))}
        <option value={OTHER}>Other (my own venue)</option>
      </select>
      {showOther && (
        <input
          className="cl-input"
          type="text"
          aria-label="Your venue"
          placeholder="Enter your venue name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}

export default VenuePicker;
