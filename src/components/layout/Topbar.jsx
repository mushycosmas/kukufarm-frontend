import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();

  const getUserName = () => {
    if (!user) return "Kelvin";

    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || user.name || user.username;
  };

  const getUserRole = () => {
    if (!user) return "";

    if (typeof user.role === "string") {
      return user.role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return user.profile?.role
      ?.replace(/_/g, " ")
      ?.replace(/\b\w/g, (char) => char.toUpperCase()) || "";
  };

  const getInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="topbar">
      {/* Mobile Menu */}
      <button
        type="button"
        className="mobile-menu btn btn-light"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Search */}
      <div className="topbar-search">
        <i className="bi bi-search"></i>

        <input
          type="search"
          placeholder="Search anything..."
          aria-label="Search"
        />
      </div>

      {/* Actions */}
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

        {/* User */}
        <div className="user-menu">
          <div className="avatar" title={getUserName()}>
            {getInitial()}
          </div>

          <div className="user-info">
            <strong>{getUserName()}</strong>
            <small>{getUserRole()}</small>
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
