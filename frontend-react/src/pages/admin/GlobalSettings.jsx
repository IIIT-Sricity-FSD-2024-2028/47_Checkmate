/**
 * ADMIN · GLOBAL SETTINGS (pages/admin/GlobalSettings.jsx)
 * Replaces legacy: front-end/pages/admin/admin-settings.html.
 *
 * GET /settings to load, PUT /settings to save (admin/superuser only; the backend
 * validates every field). Each setting is used by the backend:
 *  - commissionRate     -> % taken from every NEW booking (DataService.getCommissionRate)
 *  - minEventBudget     -> smallest budget a new event may have (EventsService.create)
 *  - autoApproveVendors -> vendor applications are approved on arrival (VendorsService)
 *  - maintenanceMode    -> only admins/superusers can change data (MaintenanceGuard)
 */

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import { getSettings, saveSettings } from "../../services";

function GlobalSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load the current settings once, when the page opens.
  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setError("Could not load the settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  // One handler for every field: copy the settings object and change one key.
  const change = (field, value) => {
    setSettings({ ...settings, [field]: value });
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      setSettings(
        await saveSettings({
          commissionRate: Number(settings.commissionRate),
          minEventBudget: Number(settings.minEventBudget),
          autoApproveVendors: settings.autoApproveVendors,
          maintenanceMode: settings.maintenanceMode,
        })
      );
      setSaved(true);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err?.message || "Could not save the settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-global-settings">
      <AdminTopBar title="Global Settings" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}
        {saved && <div className="admin-success">Settings saved. They apply right away.</div>}
        {loading && <div className="admin-empty">Loading...</div>}

        {settings && (
          <form className="card admin-table-card" onSubmit={save}>
            <h3>Money</h3>
            <div className="settings-row">
              <div>
                <strong>Platform commission (%)</strong>
                <span>Taken from each new booking. Bookings that already exist keep their rate.</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={settings.commissionRate}
                onChange={(e) => change("commissionRate", e.target.value)}
              />
            </div>
            <div className="settings-row">
              <div>
                <strong>Minimum event budget (₹)</strong>
                <span>Clients can't request an event below this. 0 means no minimum.</span>
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={settings.minEventBudget}
                onChange={(e) => change("minEventBudget", e.target.value)}
              />
            </div>

            <h3 style={{ marginTop: 20 }}>Platform</h3>
            <div className="settings-row">
              <div>
                <strong>Auto-approve vendors</strong>
                <span>New vendor applications are approved straight away, without review.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveVendors}
                onChange={(e) => change("autoApproveVendors", e.target.checked)}
              />
            </div>
            <div className="settings-row">
              <div>
                <strong>Maintenance mode</strong>
                <span>
                  Everyone can still look around, but only admins can change anything. Every portal shows a
                  maintenance banner.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => change("maintenanceMode", e.target.checked)}
              />
            </div>

            <div className="cell-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
                <Save size={14} /> {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default GlobalSettings;
