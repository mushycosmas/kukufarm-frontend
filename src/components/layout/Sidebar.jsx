import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import "../../styles/sidebar.css";
import api from "../../services/api";

// Permission codes must match the permissions returned by Django.
const navigationGroups = [
  {
    title: "MAIN",
    items: [
      {
        to: "/",
        icon: "bi-grid-1x2-fill",
        label: "Dashboard",
        permissions: [
          "flocks.view_flock",
          "production.view_eggproduction",
          "feed.view_feed",
          "health.view_healthrecord",
          "sales.view_sale",
          "customers.view_customer",
          "expenses.view_expense",
          "suppliers.view_supplier",
          "settings.view_farmsettings",
        ],
        requireAll: false,
      },
    ],
  },
  {
    title: "FARM MANAGEMENT",
    items: [
      {
        to: "/flocks",
        icon: "bi-egg-fried",
        label: "Flocks",
        permissions: ["flocks.view_flock"],
      },
      {
        to: "/egg-production",
        icon: "bi-egg",
        label: "Egg Production",
        permissions: ["production.view_eggproduction"],
      },
      {
        to: "/egg-inventory",
        icon: "bi-box-seam-fill",
        label: "Egg Inventory",
        permissions: ["production.view_eggproduction"],
      },
      {
        to: "/feed",
        icon: "bi-basket2-fill",
        label: "Feed Management",
        permissions: ["feed.view_feed"],
      },
      {
        to: "/health",
        icon: "bi-heart-pulse-fill",
        label: "Health & Vaccination",
        permissions: [
          "health.view_healthrecord",
          "health.view_vaccination",
        ],
        requireAll: false,
      },
      {
        to: "/mortality",
        icon: "bi-clipboard2-x-fill",
        label: "Mortality",
        permissions: ["health.view_mortality"],
      },
    ],
  },
  {
    title: "SALES & BUSINESS",
    items: [
      {
        to: "/sales",
        icon: "bi-cash-stack",
        label: "Sales",
        permissions: ["sales.view_sale"],
      },
      {
        to: "/customers",
        icon: "bi-people-fill",
        label: "Customers",
        permissions: ["customers.view_customer"],
      },
      {
        to: "/expenses",
        icon: "bi-wallet2",
        label: "Expenses",
        permissions: ["expenses.view_expense"],
      },
      {
        to: "/suppliers",
        icon: "bi-truck",
        label: "Suppliers",
        permissions: ["suppliers.view_supplier"],
      },
    ],
  },
  {
    title: "REPORTING",
    items: [
      {
        to: "/reports",
        icon: "bi-bar-chart-fill",
        label: "Reports",
        permissions: [
          "production.view_eggproduction",
          "sales.view_sale",
          "expenses.view_expense",
          "feed.view_feed",
          "customers.view_customer",
        ],
        requireAll: false,
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        to: "/users",
        icon: "bi-people",
        label: "Users",
        permissions: ["auth.view_user"],
      },
      {
        to: "/roles",
        icon: "bi-shield-check",
        label: "Roles & Permissions",
        permissions: ["accounts.view_role"],
      },
      {
        to: "/settings",
        icon: "bi-gear-fill",
        label: "Settings",
        permissions: ["settings.view_farmsettings"],
      },
    ],
  },
];

const getStoredUser = () => {
  // Adjust these keys if your authentication context uses
  // a different storage key for the logged-in user.
  const possibleKeys = [
    "kukufarm_user",
    "user",
    "currentUser",
  ];

  for (const key of possibleKeys) {
    try {
      const storedValue = localStorage.getItem(key);

      if (storedValue) {
        const user = JSON.parse(storedValue);

        if (user && typeof user === "object") {
          return user;
        }
      }
    } catch (error) {
      console.error(`Unable to read stored user from ${key}`, error);
    }
  }

  return null;
};

export default function Sidebar({ mobileOpen, onClose }) {
  const [farmName, setFarmName] = useState("KukuFarm");
  const [loadingFarm, setLoadingFarm] = useState(true);

  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    let mounted = true;

    const loadFarmSettings = async () => {
      try {
        const response = await api.get("/settings/");

        if (!mounted) {
          return;
        }

        const name = response.data?.farm_name;

        if (typeof name === "string" && name.trim()) {
          setFarmName(name.trim());
        }
      } catch (error) {
        console.error("Failed to load farm settings:", error);
      } finally {
        if (mounted) {
          setLoadingFarm(false);
        }
      }
    };

    loadFarmSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Keep permissions in sync when the stored user changes.
  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("kukufarm-user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("kukufarm-user-updated", syncUser);
    };
  }, []);

  const userPermissions = useMemo(
    () => new Set(user?.permissions ?? []),
    [user]
  );

  const hasPermission = (permission) => {
    return userPermissions.has(permission);
  };

  const canAccessItem = (item) => {
    // Items without permission requirements are visible to all users.
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }

    if (item.requireAll) {
      return item.permissions.every(hasPermission);
    }

    // Default behavior: any listed permission grants visibility.
    return item.permissions.some(hasPermission);
  };

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canAccessItem),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavigation = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleNavigation}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="brand">
          <div className="brand-icon">
            <i className="bi bi-egg-fried" />
          </div>

          <div className="brand-text">
            <strong>KukuFarm</strong>
            <small>Farm Management</small>
          </div>
        </div>

        <div className="farm-badge">
          <div className="farm-badge-icon">
            <i className="bi bi-house-heart-fill" />
          </div>

          <div className="farm-badge-content">
            <span>Current Farm</span>

            <strong
              title={farmName}
              className={loadingFarm ? "text-muted" : ""}
            >
              {loadingFarm ? "Loading..." : farmName}
            </strong>
          </div>

          <i className="bi bi-chevron-down farm-chevron" />
        </div>

        <nav
          className="sidebar-navigation"
          aria-label="Farm management navigation"
        >
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>

              <div className="nav-items">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      [
                        "nav-item",
                        isActive ? "active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                    aria-label={item.label}
                  >
                    <span className="nav-icon">
                      <i
                        className={`bi ${item.icon}`}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="nav-label">
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {visibleGroups.length === 0 && (
            <div className="p-3 text-muted small">
              No navigation items are available for this account.
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
