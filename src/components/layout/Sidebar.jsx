import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";
import api from "../../services/api";

const groups = [
  {
    title: "MAIN",
    items: [
      {
        to: "/",
        icon: "bi-grid-1x2-fill",
        label: "Dashboard",
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
      },
      {
        to: "/egg-production",
        icon: "bi-egg",
        label: "Egg Production",
      },
      {
        to: "/feed",
        icon: "bi-basket2-fill",
        label: "Feed Management",
      },
      {
        to: "/health",
        icon: "bi-heart-pulse-fill",
        label: "Health & Vaccination",
      },
      {
        to: "/mortality",
        icon: "bi-clipboard2-x-fill",
        label: "Mortality",
      },
    ],
  },

  {
    title: "BUSINESS",
    items: [
      {
        to: "/sales",
        icon: "bi-cash-stack",
        label: "Sales",
      },
      {
        to: "/customers",
        icon: "bi-people-fill",
        label: "Customers",
      },
      {
        to: "/expenses",
        icon: "bi-wallet2",
        label: "Expenses",
      },
      {
        to: "/suppliers",
        icon: "bi-truck",
        label: "Suppliers",
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
      },
    ],
  },

  {
    title: "ADMINISTRATION",
    items: [
      {
        to: "/users",
        icon: "bi-person-gear",
        label: "Users & Roles",
      },
      {
        to: "/roles",
        icon: "bi-shield-check",
        label: "Roles & Permissions",
      },
      {
        to: "/settings",
        icon: "bi-gear-fill",
        label: "Settings",
      },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const [farmName, setFarmName] = useState("KukuFarm");
  const [loadingFarm, setLoadingFarm] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadFarmSettings = async () => {
      try {
        const response = await api.get("/settings/");

        if (!mounted) return;

        const name = response.data?.farm_name?.trim();

        if (name) {
          setFarmName(name);
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

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "open" : ""}`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <i className="bi bi-egg-fried"></i>
          </div>

          <div>
            <strong>KukuFarm</strong>
            <small>Farm Management</small>
          </div>
        </div>

        {/* Current Farm */}
        <div className="farm-badge">
          <i className="bi bi-house-heart-fill"></i>

          <div className="farm-badge-content">
            <span>Current Farm</span>

            <strong
              title={farmName}
              className={loadingFarm ? "text-muted" : ""}
            >
              {loadingFarm ? "Loading..." : farmName}
            </strong>
          </div>

          <i className="bi bi-chevron-down ms-auto"></i>
        </div>

        {/* Navigation */}
        <nav>
          {groups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

