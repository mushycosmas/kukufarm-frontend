import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim(), password);

      if (result?.success) {
        navigate("/", { replace: true });
        return;
      }

      setError(
        result?.message || "Invalid username or password. Please try again."
      );
    } catch (err) {
      console.error("Login error:", err);

      const responseData = err?.response?.data;

      if (responseData) {
        if (typeof responseData === "string") {
          setError(responseData);
        } else if (responseData.detail) {
          setError(responseData.detail);
        } else if (responseData.message) {
          setError(responseData.message);
        } else if (responseData.non_field_errors) {
          setError(
            Array.isArray(responseData.non_field_errors)
              ? responseData.non_field_errors[0]
              : responseData.non_field_errors
          );
        } else if (responseData.username) {
          setError(
            Array.isArray(responseData.username)
              ? responseData.username[0]
              : responseData.username
          );
        } else if (responseData.password) {
          setError(
            Array.isArray(responseData.password)
              ? responseData.password[0]
              : responseData.password
          );
        } else {
          setError(
            "Unable to sign in. Please check your username and password."
          );
        }
      } else if (err?.request) {
        setError(
          "Unable to connect to the KukuFarm server. Please make sure the Django API is running."
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <div className="login-visual">
        <div className="login-brand">
          <div className="brand-icon">
            <i className="bi bi-egg-fried"></i>
          </div>

          <strong>KukuFarm</strong>
        </div>

        <div className="login-hero">
          <span>SMART POULTRY FARMING</span>

          <h1>
            Manage your farm.
            <br />
            <em>Grow your business.</em>
          </h1>

          <p>
            Track chickens, eggs, feed, health, sales and expenses from one
            simple platform.
          </p>

          <div className="login-features">
            <span>
              <i className="bi bi-check-circle-fill"></i>
              Real-time farm insights
            </span>

            <span>
              <i className="bi bi-check-circle-fill"></i>
              Simple record keeping
            </span>

            <span>
              <i className="bi bi-check-circle-fill"></i>
              Better farm management
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-form-wrap">
        <div className="login-form">
          {/* MOBILE LOGO */}
          <div className="mobile-login-logo">
            <div className="brand-icon">
              <i className="bi bi-egg-fried"></i>
            </div>

            <strong>KukuFarm</strong>
          </div>

          <h2>Welcome back 👋</h2>

          <p>Sign in to your KukuFarm account</p>

          {/* ERROR */}
          {error && (
            <div
              className="alert alert-danger d-flex align-items-start"
              role="alert"
            >
              <i className="bi bi-exclamation-circle-fill me-2 mt-1"></i>

              <div>{error}</div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            {/* USERNAME */}
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>

              <div className="input-icon">
                <i className="bi bi-person"></i>

                <input
                  id="username"
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>

              <div className="input-icon password-input">
                <i className="bi bi-lock"></i>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  <i
                    className={
                      showPassword ? "bi bi-eye-slash" : "bi bi-eye"
                    }
                  ></i>
                </button>
              </div>
            </div>

            {/* REMEMBER / FORGOT */}
            <div className="remember">
              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="#forgot">Forgot password?</a>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="btn btn-success w-100 login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <small>
              Secure access to your KukuFarm management system.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}