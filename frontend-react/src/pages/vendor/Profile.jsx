/**
 * ============================================================================
 * VENDOR PROFILE MANAGEMENT PAGE (Profile.jsx)
 * ============================================================================
 * Role: Account Settings & Vendor Identity Portal
 * Location: src/pages/vendor/Profile.jsx
 *
 * Purpose:
 *   Enables authenticated vendors to view and update their business and personal details:
 *     1. Fetches current profile data from the backend userService on component mount.
 *     2. Formats personal identity info (Name, Email, Phone, Bio, Experience).
 *     3. Formats corporate business info (Business Name, Address, Location, Links).
 *     4. Provides interactive Edit Mode toggle with input validation and cancellation rollback.
 *     5. Submits updated payload to the API and synchronizes updated state.
 *
 * Connected Services:
 *   - getProfile(): Fetches authenticated vendor account details
 *   - updateProfile(payload): Submits modified profile data to backend
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../services/userService";
import PersonalInfo from "../../components/profile/PersonalInfo";
import BusinessInfo from "../../components/profile/BusinessInfo";

function Profile() {
  // --------------------------------------------------------------------------
  // 1. COMPONENT STATE MANAGEMENT
  // --------------------------------------------------------------------------
  // Original user record loaded from backend
  const [user, setUser] = useState(null);
  // Staging form state during active editing session
  const [formData, setFormData] = useState({});
  // Toggle flag between view mode and edit mode
  const [editing, setEditing] = useState(false);
  // Loading indicator during initial profile fetch
  const [loading, setLoading] = useState(true);
  // Saving indicator during API update submission
  const [saving, setSaving] = useState(false);
  // Error feedback message
  const [error, setError] = useState("");
  // Success feedback message
  const [message, setMessage] = useState("");

  // --------------------------------------------------------------------------
  // 2. PROFILE DATA RETRIEVAL (MOUNT EFFECT)
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setUser(data);
        setFormData(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // --------------------------------------------------------------------------
  // 3. FORM INPUT & INTERACTION HANDLERS
  // --------------------------------------------------------------------------
  /**
   * Updates state on change in any profile input field.
   * Dynamically maps target input's 'name' attribute to key in formData.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /**
   * Discards uncommitted form edits and exits editing mode.
   * Resets formData back to original pristine 'user' object and clears any alerts.
   */
  function handleCancel() {
    setFormData(user);
    setEditing(false);
    setError("");
    setMessage("");
  }

  /**
   * Submits modified profile data to backend via userService.
   * Normalizes numeric fields (e.g. years_experience), validates response,
   * updates active user state, and displays success/error feedback.
   */
  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      // Construct sanitized payload matching backend DTO contract
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.location,
        bio: formData.bio,
        years_experience:
          formData.years_experience === "" ||
          formData.years_experience == null
            ? ""
            : Number(formData.years_experience),
        linkedin_url: formData.linkedin_url,
        website_url: formData.website_url,
      };

      // Dispatch update request to API
      const result = await updateProfile(payload);
      const updatedUser =
        result && typeof result === "object"
          ? { ...formData, ...(result.data ?? result) }
          : formData;

      // Synchronize both local view state and committed user record
      setUser(updatedUser);
      setFormData(updatedUser);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // 4. CONDITIONAL RENDER GUARDS (Loading & Missing Data States)
  // --------------------------------------------------------------------------
  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>{error || "Profile not found."}</p>;

  // --------------------------------------------------------------------------
  // 5. MAIN PROFILE VIEW & FORM RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="profile-page">
      {/* --- Page Header & Mode Switch Button --- */}
      <div className="profile-header">
        <h1>My Profile</h1>

        {!editing && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={() => {
              setFormData(user);
              setEditing(true);
              setMessage("");
              setError("");
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* --- Profile Data Form --- */}
      <form onSubmit={handleSave}>
        {/* Section 1: Vendor Personal Identity & Contact Information */}
        <PersonalInfo
          formData={editing ? formData : user}
          handleChange={handleChange}
          editing={editing}
        />

        {/* Section 2: Vendor Business Identity, Bio & Social Links */}
        <BusinessInfo
          formData={editing ? formData : user}
          handleChange={handleChange}
          editing={editing}
        />

        {/* Section 3: Save / Cancel Controls (Displayed only during Edit mode) */}
        {editing && (
          <div className="profile-actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Section 4: User Notification & Error Feedback */}
        {message && <p className="profile-success">{message}</p>}
        {error && <p className="profile-error">{error}</p>}
      </form>
    </div>
  );
}

export default Profile;