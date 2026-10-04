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

  // Farm logo
  logo: null,

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

/*
|--------------------------------------------------------------------------
| API Server URL
|--------------------------------------------------------------------------
|
| api.js uses:
|
| http://127.0.0.1:8000/api
|
| We need:
|
| http://127.0.0.1:8000
|
| for Django media files.
|
*/

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000/api";

const API_SERVER_URL = API_BASE_URL.replace(
  /\/api\/?$/,
  ""
);

/*
|--------------------------------------------------------------------------
| Convert Django Logo Path To Browser URL
|--------------------------------------------------------------------------
*/

const getLogoUrl = (logo) => {
  if (!logo) {
    return "";
  }

  const value = String(logo).trim();

  if (!value) {
    return "";
  }

  /*
   * Already a complete URL.
   *
   * Example:
   * http://127.0.0.1:8000/media/farm/logos/logo.png
   *
   * or:
   * https://example.com/media/farm/logos/logo.png
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  /*
   * Local browser preview.
   *
   * Example:
   * blob:http://localhost:3000/xxxxx
   */
  if (value.startsWith("blob:")) {
    return value;
  }

  /*
   * Django media URL.
   *
   * Example:
   * /media/farm/logos/logo.png
   */
  if (value.startsWith("/media/")) {
    return `${API_SERVER_URL}${value}`;
  }

  /*
   * Media URL without leading slash.
   *
   * Example:
   * media/farm/logos/logo.png
   */
  if (value.startsWith("media/")) {
    return `${API_SERVER_URL}/${value}`;
  }

  /*
   * Django ImageField may return:
   *
   * farm/logos/logo.png
   *
   * Convert it to:
   *
   * http://127.0.0.1:8000/media/farm/logos/logo.png
   */
  return `${API_SERVER_URL}/media/${value.replace(
    /^\/+/,
    ""
  )}`;
};

/*
|--------------------------------------------------------------------------
| Extract API Error
|--------------------------------------------------------------------------
*/

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
  const [activeTab, setActiveTab] =
    useState("profile");

  const [settings, setSettings] = useState(
    initialSettings
  );

  const [passwordForm, setPasswordForm] =
    useState(initialPasswordForm);

  /*
   * Actual uploaded File object.
   */
  const [logoFile, setLogoFile] = useState(null);

  /*
   * URL displayed by the browser.
   *
   * Can be:
   *
   * http://127.0.0.1:8000/media/...
   *
   * or:
   *
   * blob:http://localhost:3000/...
   */
  const [logoPreview, setLogoPreview] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Settings
  |--------------------------------------------------------------------------
  */

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/settings/");

      /*
       * Depending on your ViewSet configuration,
       * Django may return either:
       *
       * {
       *   id: 1,
       *   farm_name: "...",
       *   logo: "..."
       * }
       *
       * or:
       *
       * [
       *   {
       *     id: 1,
       *     farm_name: "...",
       *     logo: "..."
       *   }
       * ]
       */

      let data = response.data || {};

      if (Array.isArray(data)) {
        data = data[0] || {};
      }

      console.log(
        "Farm settings:",
        data
      );

      console.log(
        "Django logo:",
        data.logo
      );

      console.log(
        "Browser logo URL:",
        getLogoUrl(data.logo)
      );

      setSettings({
        ...initialSettings,
        ...data,
      });

      /*
       * IMPORTANT:
       *
       * Convert Django's logo path into
       * a URL that the browser can load.
       */
      setLogoPreview(
        getLogoUrl(data.logo)
      );

      setLogoFile(null);
    } catch (err) {
      console.error(
        "Failed to load settings:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Settings Change
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | Logo Change
  |--------------------------------------------------------------------------
  */

  const handleLogoChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    /*
     * Validate file type.
     */
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        "Logo must be a JPG, JPEG, PNG, or WEBP image."
      );

      event.target.value = "";

      return;
    }

    /*
     * Maximum 5 MB.
     */
    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Logo size must not exceed 5 MB."
      );

      event.target.value = "";

      return;
    }

    /*
     * Revoke previous blob URL.
     */
    if (
      logoPreview &&
      logoPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    /*
     * Create local preview.
     */
    const previewUrl =
      URL.createObjectURL(file);

    /*
     * Store actual File object.
     */
    setLogoFile(file);

    /*
     * Display local preview.
     */
    setLogoPreview(previewUrl);
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Selected Logo
  |--------------------------------------------------------------------------
  */

  const removeLogoSelection = () => {
    /*
     * Revoke temporary blob URL.
     */
    if (
      logoPreview &&
      logoPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    /*
     * Remove newly selected file.
     */
    setLogoFile(null);

    /*
     * Restore existing server logo.
     */
    setLogoPreview(
      getLogoUrl(settings.logo)
    );

    /*
     * Clear file input.
     */
    const fileInput =
      document.getElementById(
        "farm-logo-input"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Save Settings
  |--------------------------------------------------------------------------
  */

  const saveSettings = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setError("");
    setSuccess("");

    if (
      !settings.farm_name.trim()
    ) {
      setError(
        "Farm name is required."
      );

      return;
    }

    if (
      !settings.owner_name.trim()
    ) {
      setError(
        "Owner name is required."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * FormData is required because
       * the request may contain an image.
       */
      const formData =
        new FormData();

      /*
       * Farm Profile.
       */
      formData.append(
        "farm_name",
        settings.farm_name.trim()
      );

      formData.append(
        "owner_name",
        settings.owner_name.trim()
      );

      formData.append(
        "phone",
        settings.phone.trim()
      );

      formData.append(
        "email",
        settings.email.trim()
      );

      formData.append(
        "location",
        settings.location.trim()
      );

      formData.append(
        "address",
        settings.address.trim()
      );

      /*
       * System Preferences.
       */
      formData.append(
        "currency",
        settings.currency
      );

      formData.append(
        "timezone",
        settings.timezone
      );

      formData.append(
        "date_format",
        settings.date_format
      );

      /*
       * Alert Preferences.
       */
      formData.append(
        "low_stock_alerts",
        settings.low_stock_alerts
          ? "true"
          : "false"
      );

      formData.append(
        "mortality_alerts",
        settings.mortality_alerts
          ? "true"
          : "false"
      );

      formData.append(
        "vaccination_alerts",
        settings.vaccination_alerts
          ? "true"
          : "false"
      );

      formData.append(
        "production_alerts",
        settings.production_alerts
          ? "true"
          : "false"
      );

      /*
       * Notification Preferences.
       */
      formData.append(
        "email_notifications",
        settings.email_notifications
          ? "true"
          : "false"
      );

      formData.append(
        "sms_notifications",
        settings.sms_notifications
          ? "true"
          : "false"
      );

      /*
       * IMPORTANT:
       *
       * Only send logo when a real File
       * was selected.
       */
      if (
        logoFile instanceof File
      ) {
        formData.append(
          "logo",
          logoFile
        );
      }

      /*
       * Send request.
       *
       * api.js must NOT globally force
       * Content-Type: application/json.
       */
      const response =
        await api.patch(
          "/settings/",
          formData
        );

      let data =
        response.data || {};

      if (Array.isArray(data)) {
        data = data[0] || {};
      }

      console.log(
        "Saved settings:",
        data
      );

      console.log(
        "Saved logo:",
        data.logo
      );

      /*
       * Update settings.
       */
      setSettings({
        ...initialSettings,
        ...data,
      });

      /*
       * Update logo preview.
       *
       * This is the important fix.
       */
      if (data.logo) {
        setLogoPreview(
          getLogoUrl(data.logo)
        );
      } else {
        setLogoPreview("");
      }

      /*
       * File is now saved on server.
       */
      setLogoFile(null);

      /*
       * Clear file input.
       */
      const fileInput =
        document.getElementById(
          "farm-logo-input"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "Settings saved successfully."
      );
    } catch (err) {
      console.error(
        "Save settings error:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Password Change
  |--------------------------------------------------------------------------
  */

  const handlePasswordChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  const changePassword = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !passwordForm.current_password
    ) {
      setError(
        "Current password is required."
      );

      return;
    }

    if (
      passwordForm.new_password
        .length < 8
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
      setError(
        extractError(err)
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Farm Profile
  |--------------------------------------------------------------------------
  */

  const renderProfile = () => (
    <div>
      <h5 className="mb-1">
        Farm Profile
      </h5>

      <p className="text-muted">
        Basic information about your poultry farm.
      </p>

      <form
        onSubmit={saveSettings}
      >
        <div className="row g-3">

          {/* Farm Logo */}
          <div className="col-12">
            <label className="form-label">
              Farm Logo
            </label>

            <div className="border rounded p-3">

              <div className="row align-items-center g-4">

                {/* Logo Preview */}
                <div className="col-md-3">
                  <div className="text-center">

                    {logoPreview ? (
                      <div>
                        <img
                          src={logoPreview}
                          alt={
                            settings.farm_name ||
                            "Farm Logo"
                          }
                          className="img-fluid rounded border"
                          style={{
                            width: "160px",
                            height: "160px",
                            objectFit:
                              "contain",
                            backgroundColor:
                              "#ffffff",
                            padding: "8px",
                          }}
                          onError={(
                            event
                          ) => {
                            console.error(
                              "Logo image failed to load:",
                              logoPreview
                            );

                            event.currentTarget.style.display =
                              "none";
                          }}
                        />

                        <div className="small text-muted mt-2 text-break">
                          {logoFile
                            ? "New logo preview"
                            : "Current farm logo"}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border rounded d-flex align-items-center justify-content-center text-muted"
                        style={{
                          width: "160px",
                          height: "160px",
                          margin:
                            "0 auto",
                          backgroundColor:
                            "#f8f9fa",
                        }}
                      >
                        <div>
                          <i className="bi bi-image fs-1"></i>

                          <div className="small mt-1">
                            No Logo
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Upload */}
                <div className="col-md-9">

                  <label
                    htmlFor="farm-logo-input"
                    className="form-label"
                  >
                    Upload Farm Logo
                  </label>

                  <input
                    id="farm-logo-input"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleLogoChange
                    }
                  />

                  <div className="form-text">
                    Accepted formats:
                    JPG, JPEG, PNG and
                    WEBP. Maximum size:
                    5 MB.
                  </div>

                  {logoFile && (
                    <div className="mt-3">

                      <div className="alert alert-success py-2 mb-2">
                        <i className="bi bi-check-circle me-2"></i>

                        New logo selected:

                        <strong className="ms-1">
                          {logoFile.name}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={
                          removeLogoSelection
                        }
                      >
                        <i className="bi bi-x-circle me-1"></i>

                        Cancel New Logo
                      </button>

                    </div>
                  )}

                  {!logoFile &&
                    settings.logo && (
                      <div className="mt-3 text-success small">
                        <i className="bi bi-check-circle me-1"></i>

                        Current farm logo
                        is active.
                      </div>
                    )}

                </div>

              </div>
            </div>
          </div>

          {/* Farm Name */}
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
              value={
                settings.farm_name
              }
              onChange={handleChange}
              placeholder="Enter farm name"
              required
            />
          </div>

          {/* Owner Name */}
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
              value={
                settings.owner_name
              }
              onChange={handleChange}
              placeholder="Enter owner name"
              required
            />
          </div>

          {/* Phone */}
          <div className="col-md-6">
            <label className="form-label">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              className="form-control"
              value={
                settings.phone
              }
              onChange={handleChange}
              placeholder="+255 700 000 000"
            />
          </div>

          {/* Email */}
          <div className="col-md-6">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              name="email"
              className="form-control"
              value={
                settings.email
              }
              onChange={handleChange}
              placeholder="farm@example.com"
            />
          </div>

          {/* Location */}
          <div className="col-md-6">
            <label className="form-label">
              Location
            </label>

            <input
              type="text"
              name="location"
              className="form-control"
              value={
                settings.location
              }
              onChange={handleChange}
              placeholder="Dodoma, Tanzania"
            />
          </div>

          {/* Address */}
          <div className="col-md-6">
            <label className="form-label">
              Address
            </label>

            <input
              type="text"
              name="address"
              className="form-control"
              value={
                settings.address
              }
              onChange={handleChange}
              placeholder="Physical farm address"
            />
          </div>

          {/* Currency */}
          <div className="col-md-4">
            <label className="form-label">
              Currency
            </label>

            <select
              name="currency"
              className="form-select"
              value={
                settings.currency
              }
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

          {/* Timezone */}
          <div className="col-md-4">
            <label className="form-label">
              Timezone
            </label>

            <select
              name="timezone"
              className="form-select"
              value={
                settings.timezone
              }
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

          {/* Date Format */}
          <div className="col-md-4">
            <label className="form-label">
              Date Format
            </label>

            <select
              name="date_format"
              className="form-select"
              value={
                settings.date_format
              }
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

          {/* Save */}
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
  |--------------------------------------------------------------------------
  | Preferences
  |--------------------------------------------------------------------------
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

        {/* Low Stock */}
        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">

              <div>
                <strong>
                  Low Stock Alerts
                </strong>

                <div className="text-muted small">
                  Notify when feed or stock
                  reaches the minimum level.
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* Mortality */}
        <div className="col-12">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center">

              <div>
                <strong>
                  Mortality Alerts
                </strong>

                <div className="text-muted small">
                  Enable notifications when
                  mortality records are entered.
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* Vaccination */}
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* Production */}
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* Save */}
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
  |--------------------------------------------------------------------------
  | Security
  |--------------------------------------------------------------------------
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

          {/* Current Password */}
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

          {/* New Password */}
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

          {/* Confirm */}
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

          {/* Submit */}
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
  |--------------------------------------------------------------------------
  | Notifications
  |--------------------------------------------------------------------------
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

        {/* Email */}
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* SMS */}
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
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        {/* Save */}
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
  |--------------------------------------------------------------------------
  | Main UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure your farm and system preferences."
      />

      {/* Error */}
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
            onClick={() =>
              setError("")
            }
          ></button>
        </div>
      )}

      {/* Success */}
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
            onClick={() =>
              setSuccess("")
            }
          ></button>
        </div>
      )}

      {/* Loading */}
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

          {/* Settings Navigation */}
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
                activeTab ===
                "security"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "security"
                )
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