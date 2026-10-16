import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../services/userService";
import PersonalInfo from "../../components/profile/PersonalInfo";

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setUser(data);
        setFormData(data);
      } catch (err) {
        console.error(err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCancel() {
    setFormData(user);
    setEditing(false);
    setError("");
    setMessage("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      const result = await updateProfile(payload);
      const updatedUser =
        result && typeof result === "object"
          ? { ...formData, ...(result.data ?? result) }
          : formData;

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

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>{error || "Profile not found."}</p>;

  return (
    <div className="profile-page">
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

      <form onSubmit={handleSave}>
        <PersonalInfo
          formData={editing ? formData : user}
          handleChange={handleChange}
          editing={editing}
        />

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

        {message && <p className="profile-success">{message}</p>}
        {error && <p className="profile-error">{error}</p>}
      </form>
    </div>
  );
}

export default Profile;