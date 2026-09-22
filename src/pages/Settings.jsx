import React, { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialSettings = {
  farm_name: "",
  owner_name: "",
  phone: "",
  email: "",
  location: "",
  address: "",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  date_format: "DD/MM/YYYY",

  low_stock_alerts: true,
  mortality_alerts: true,
  vaccination_alerts: true,
  production_alerts: true,

  email_notifications: true,
  sms_notifications: false,
};

const initialPasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function extractError(error) {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || "Something went wrong.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, message]) => {
        const value = Array.isArray(message)
          ? message.join(", ")
          : String(message);

        return `${field}: ${value}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [settings, setSettings] = useState(initialSettings);

  const [passwordForm, setPasswordForm] = useState(
    initialPasswordForm
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * -------------------------------------------------------
   * Load Settings
   * -------------------------------------------------------
   */

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/settings/");

      setSettings({
        ...initialSettings,
        ...(response.data || {}),
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /*
   * -------------------------------------------------------
   * Settings Change
   * -------------------------------------------------------
   */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /*
   * -------------------------------------------------------
   * Save Settings
   * -------------------------------------------------------
   */

  const saveSettings = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setError("");
    setSuccess("");

    if (!settings.farm_name.trim()) {
      setError("Farm name is required.");
      return;
    }

    if (!settings.owner_name.trim()) {
      setError("Owner name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        farm_name: settings.farm_name.trim(),
        owner_name: settings.owner_name.trim(),
        phone: settings.phone.trim(),
        email: settings.email.trim(),
        location: settings.location.trim(),
        address: settings.address.trim(),

        currency: settings.currency,
        timezone: settings.timezone,
        date_format: settings.date_format,

        low_stock_alerts:
          settings.low_stock_alerts,

        mortality_alerts:
          settings.mortality_alerts,

        vaccination_alerts:
          settings.vaccination_alerts,

        production_alerts:
          settings.production_alerts,

        email_notifications:
          settings.email_notifications,

        sms_notifications:
          settings.sms_notifications,
      };

      const response = await api.patch(
        "/settings/",
        payload
      );

      setSettings({
        ...initialSettings,
        ...(response.data || payload),
      });

      setSuccess(
        "Settings saved successfully."
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Password Change
   * -------------------------------------------------------
   */

  const handlePasswordChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!passwordForm.current_password) {
      setError(
        "Current password is required."
      );
      return;
    }

    if (
      passwordForm.new_password.length < 8
    ) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setError(
        "New password and confirmation password do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.post(
        "/accounts/change-password/",
        {
          current_password:
            passwordForm.current_password,

          new_password:
            passwordForm.new_password,
        }
      );

      setPasswordForm(
        initialPasswordForm
      );

      setSuccess(
        "Password changed successfully."
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setChangingPassword(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Farm Profile
   * -------------------------------------------------------
   */

  const renderProfile = () => (
    <div>
      <h5 className="mb-1">
        Farm Profile
      </h5>

      <p className="text-muted">
        Basic information about your poultry farm.
      </p>

      <form onSubmit={saveSettings}>
        <div className="row g-3">

          <div className="col-md-6">
            <label className="form-label">
              Farm Name
              <span className="text-danger">
                {" "}*
              </span>
            </label>

            <input
              type="text"
              name="farm_name"
              className="form-control"
              value={settings.farm_name}
              onChange={handleChange}
              placeholder="Enter farm name"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Owner Name
              <span className="text-danger">
                {" "}*
              </span>
            </label>

            <input
              type="text"
              name="owner_name"
              className="form-control"
              value={settings.owner_name}
              onChange={handleChange}
              placeholder="Enter owner name"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              className="form-control"
              value={settings.phone}
              onChange={handleChange}
              placeholder="+255 700 000 000"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              name="email"
              className="form-control"
              value={settings.email}
              onChange={handleChange}
              placeholder="farm@example.com"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Location
            </label>

            <input
              type="text"
              name="location"
              className="form-control"
              value={settings.location}
              onChange={handleChange}
              placeholder="Dodoma, Tanzania"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Address
            </label>

            <input
              type="text"
              name="address"
              className="form-control"
              value={settings.address}
              onChange={handleChange}
              placeholder="Physical farm address"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">
              Currency
            </label>

            <select
              name="currency"
              className="form-select"
              value={settings.currency}
              onChange={handleChange}
            >
              <option value="TZS">
                TZS - Tanzanian Shilling
              </option>

              <option value="USD">
                USD - US Dollar
              </option>

              <option value="KES">
                KES - Kenyan Shilling
              </option>

              <option value="UGX">
                UGX - Ugandan Shilling
              </option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">
              Timezone
            </label>

            <select
              name="timezone"
              className="form-select"
              value={settings.timezone}
              onChange={handleChange}
            >
              <option value="Africa/Dar_es_Salaam">
                Africa/Dar es Salaam
              </option>

              <option value="Africa/Nairobi">
                Africa/Nairobi
              </option>

              <option value="Africa/Kampala">
                Africa/Kampala
              </option>

              <option value="UTC">
                UTC
              </option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">
              Date Format
            </label>

            <select
              name="date_format"
              className="form-select"
              value={settings.date_format}
              onChange={handleChange}
            >
              <option value="DD/MM/YYYY">
                DD/MM/YYYY
              </option>

              <option value="MM/DD/YYYY">
                MM/DD/YYYY
              </option>

              <option value="YYYY-MM-DD">
                YYYY-MM-DD
              </option>
            </select>
          </div>

          <div className="col-12">
            <hr />

            <button
              type="submit"
              className="btn btn-success"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  /*
   * -------------------------------------------------------
   * Preferences
   * -------------------------------------------------------
   */

  const renderPreferences = () => (
    <div>
      <h5 className="mb-1">
        Preferences
      </h5>

      <p className="text-muted">
        Configure how KukuFarm handles farm alerts.
      </p>

      <div className="row g-3">

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  Low Stock Alerts
                </strong>

                <div className="text-muted small">
                  Notify when feed or stock reaches
                  the minimum level.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="low_stock_alerts"
                  checked={
                    settings.low_stock_alerts
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  Mortality Alerts
                </strong>

                <div className="text-muted small">
                  Enable notifications when mortality
                  records are entered.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="mortality_alerts"
                  checked={
                    settings.mortality_alerts
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  Vaccination Alerts
                </strong>

                <div className="text-muted small">
                  Remind users about upcoming
                  vaccinations.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="vaccination_alerts"
                  checked={
                    settings.vaccination_alerts
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  Production Alerts
                </strong>

                <div className="text-muted small">
                  Enable alerts related to egg
                  production.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="production_alerts"
                  checked={
                    settings.production_alerts
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <hr />

          <button
            type="button"
            className="btn btn-success"
            onClick={() =>
              saveSettings()
            }
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  /*
   * -------------------------------------------------------
   * Security
   * -------------------------------------------------------
   */

  const renderSecurity = () => (
    <div>
      <h5 className="mb-1">
        Security
      </h5>

      <p className="text-muted">
        Manage your KukuFarm account password.
      </p>

      <form onSubmit={changePassword}>
        <div className="row g-3">

          <div className="col-md-8">
            <label className="form-label">
              Current Password
              <span className="text-danger">
                {" "}*
              </span>
            </label>

            <input
              type="password"
              name="current_password"
              className="form-control"
              value={
                passwordForm.current_password
              }
              onChange={
                handlePasswordChange
              }
              required
            />
          </div>

          <div className="col-md-8">
            <label className="form-label">
              New Password
              <span className="text-danger">
                {" "}*
              </span>
            </label>

            <input
              type="password"
              name="new_password"
              className="form-control"
              value={
                passwordForm.new_password
              }
              onChange={
                handlePasswordChange
              }
              minLength={8}
              required
            />

            <small className="text-muted">
              Minimum 8 characters.
            </small>
          </div>

          <div className="col-md-8">
            <label className="form-label">
              Confirm New Password
              <span className="text-danger">
                {" "}*
              </span>
            </label>

            <input
              type="password"
              name="confirm_password"
              className="form-control"
              value={
                passwordForm.confirm_password
              }
              onChange={
                handlePasswordChange
              }
              minLength={8}
              required
            />
          </div>

          <div className="col-12">
            <button
              type="submit"
              className="btn btn-success"
              disabled={
                changingPassword
              }
            >
              {changingPassword ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Changing Password...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-lock me-2"></i>
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  /*
   * -------------------------------------------------------
   * Notifications
   * -------------------------------------------------------
   */

  const renderNotifications = () => (
    <div>
      <h5 className="mb-1">
        Notifications
      </h5>

      <p className="text-muted">
        Configure how KukuFarm sends notifications.
      </p>

      <div className="row g-3">

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  Email Notifications
                </strong>

                <div className="text-muted small">
                  Receive important system
                  notifications by email.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="email_notifications"
                  checked={
                    settings.email_notifications
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>
                  SMS Notifications
                </strong>

                <div className="text-muted small">
                  Receive important system
                  notifications by SMS.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="sms_notifications"
                  checked={
                    settings.sms_notifications
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <hr />

          <button
            type="button"
            className="btn btn-success"
            onClick={() =>
              saveSettings()
            }
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Save Notifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  /*
   * -------------------------------------------------------
   * Main UI
   * -------------------------------------------------------
   */

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure your farm and system preferences."
      />

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>

          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>

          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="form-card text-center py-5">
          <div
            className="spinner-border text-success"
            role="status"
          ></div>

          <div className="mt-2 text-muted">
            Loading settings...
          </div>
        </div>
      ) : (
        <div className="settings-grid">

          {/* Navigation */}
          <div className="settings-nav">

            <button
              type="button"
              className={
                activeTab === "profile"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("profile")
              }
            >
              <i className="bi bi-building me-2"></i>
              Farm Profile
            </button>

            <button
              type="button"
              className={
                activeTab ===
                "preferences"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "preferences"
                )
              }
            >
              <i className="bi bi-sliders me-2"></i>
              Preferences
            </button>

            <button
              type="button"
              className={
                activeTab === "security"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("security")
              }
            >
              <i className="bi bi-shield-lock me-2"></i>
              Security
            </button>

            <button
              type="button"
              className={
                activeTab ===
                "notifications"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "notifications"
                )
              }
            >
              <i className="bi bi-bell me-2"></i>
              Notifications
            </button>
          </div>

          {/* Content */}
          <div className="form-card">

            {activeTab === "profile" &&
              renderProfile()}

            {activeTab ===
              "preferences" &&
              renderPreferences()}

            {activeTab === "security" &&
              renderSecurity()}

            {activeTab ===
              "notifications" &&
              renderNotifications()}
          </div>
        </div>
      )}
    </>
  );
}