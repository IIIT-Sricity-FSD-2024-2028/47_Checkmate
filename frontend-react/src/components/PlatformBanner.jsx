import React, { useEffect, useState } from "react";
import { Megaphone, Wrench, X } from "lucide-react";
import { getAnnouncements, getSettings } from "../services";
import "../styles/components/banner.css";

/**
 * Strip at the top of every portal (rendered by each layout). Shows:
 *  - a maintenance notice while Global Settings > Maintenance mode is on, and
 *  - the newest announcement meant for this user's role (Coordination Hub).
 * Admins post the announcements, so the admin layout passes showAnnouncements={false}.
 */
function PlatformBanner({ showAnnouncements = true }) {
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [hidden, setHidden] = useState(false);

  // Check once when the portal opens. If either request fails, just show nothing.
  useEffect(() => {
    getSettings()
      .then((settings) => setMaintenance(Boolean(settings?.maintenanceMode)))
      .catch(() => {});
    if (showAnnouncements) {
      getAnnouncements()
        .then((list) => setAnnouncement(list?.[0] || null))
        .catch(() => {});
    }
  }, [showAnnouncements]);

  if (hidden || (!maintenance && !announcement)) return null;

  return (
    <div className="platform-banner">
      <div className="platform-banner__lines">
        {maintenance && (
          <p className="platform-banner__line platform-banner__line--warning">
            <Wrench size={15} /> EventPro is under maintenance. You can look around, but changes are paused for now.
          </p>
        )}
        {announcement && (
          <p className="platform-banner__line">
            <Megaphone size={15} /> <strong>{announcement.title}:</strong> {announcement.message}
          </p>
        )}
      </div>
      <button type="button" className="platform-banner__close" onClick={() => setHidden(true)} aria-label="Hide">
        <X size={16} />
      </button>
    </div>
  );
}

export default PlatformBanner;
