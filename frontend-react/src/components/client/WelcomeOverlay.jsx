/**
 * COMPONENT: WelcomeOverlay.jsx
 * WHAT IT DOES:
 *   Popup shown once per browser session after login: "Welcome back, Emily!"
 *   plus a one-line summary of how many events are in progress.
 *   Port of the old scripts/welcome-overlay.js.
 *
 * APIS USED:
 *   - GET /api/events -> counts this client's live + confirmed events
 */

import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import { getMyEvents } from "../../services/eventService";
import { getCurrentUser } from "../../utils/clientHelpers";

// sessionStorage is cleared when the tab closes, so the popup shows again next visit
const SHOWN_KEY = "welcome_shown";

function WelcomeOverlay() {
    const user = getCurrentUser();
    const [visible, setVisible] = useState(() => !sessionStorage.getItem(SHOWN_KEY) && user.id !== "");
    const [summary, setSummary] = useState("Welcome to your dashboard.");

    useEffect(() => {
        if (!visible) return;
        sessionStorage.setItem(SHOWN_KEY, "true");
        getMyEvents()
            .then((events) => {
                const inProgress = events.filter((e) => e.status === "live" || e.status === "confirmed").length;
                setSummary(`You have ${inProgress} events currently in progress or confirmed.`);
            })
            .catch(() => {}); // keep the default text
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="cl-modal-overlay" onClick={() => setVisible(false)}>
            <div className="cl-welcome" onClick={(e) => e.stopPropagation()}>
                <div className="cl-welcome__icon"><Hand size={30} /></div>
                <h2>Welcome back, {user.name.split(" ")[0]}!</h2>
                <p>{summary}</p>
                <button type="button" className="cl-btn-pink cl-btn-block" onClick={() => setVisible(false)}>
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}

export default WelcomeOverlay;
