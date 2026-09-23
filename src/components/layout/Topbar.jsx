import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();

  // --------------------------------------------------
  // Get user full name
  // --------------------------------------------------
  const getUserName = () => {
    if (!user) {
      return "Kelvin";
    }

    const fullName = [
      user.first_name,
      user.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      user.name ||
      user.username ||
      "User"
    );
  };

  // --------------------------------------------------
  // Get user role
  // --------------------------------------------------
  const getUserRole = () => {
    if (!user) {
      return "";
    }

    /*
     * New backend response:
     *
     * role: {
     *   id: 1,
     *   name: "Administrator",
     *   code: "admin"
     * }
     */

    if (
      user.role &&
      typeof user.role === "object"
    ) {
      return (
        user.role.name ||
        user.role.code ||
        ""
      );
    }

    // Fallback if role is still a string
    if (
      typeof user.role === "string"
    ) {
      return user.role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
    }

    // Fallback for older profile structure
    if (
      user.profile?.role &&
      typeof user.profile.role === "object"
    ) {
      return (
        user.profile.role.name ||
        user.profile.role.code ||
        ""
      );
    }

    if (
      typeof user.profile?.role === "string"
    ) {
      return user.profile.role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
    }

    // Final fallback using role_id
    if (user.role_id) {
      return `Role #${user.role_id}`;
    }

    return "";
  };

  // --------------------------------------------------
  // Get avatar initial
  // --------------------------------------------------
  const getInitial = () => {
    const name = getUserName();

    return name
      ? name.charAt(0).toUpperCase()
      : "U";
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  };

  return (
    <header className="topbar">

      {/* --------------------------------------------
          Mobile Menu
          -------------------------------------------- */}
      <button
        type="button"
        className="mobile-menu btn btn-light"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <i className="bi bi-list"></i>
      </button>

      {/* --------------------------------------------
          Search
          -------------------------------------------- */}
      <div className="topbar-search">
        <i className="bi bi-search"></i>

        <input
          type="search"
          placeholder="Search anything..."
          aria-label="Search"
        />
      </div>

      {/* --------------------------------------------
          Actions
          -------------------------------------------- */}
      <div className="topbar-actions">

        {/* Notifications */}
        <button
          type="button"
          className="icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <i className="bi bi-bell"></i>

          <span className="notification-dot"></span>
        </button>

        {/* ----------------------------------------
            User
            ---------------------------------------- */}
        <div className="user-menu">

          {/* Avatar */}
          <div
            className="avatar"
            title={getUserName()}
          >
            {getInitial()}
          </div>

          {/* User information */}
          <div className="user-info">

            <strong>
              {getUserName()}
            </strong>

            <small>
              {getUserRole()}
            </small>

          </div>

          {/* Logout */}
          <button
            type="button"
            className="dropdown-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>

        </div>
      </div>
    </header>
  );
}