import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";
import api from "../../services/api";

const navigationGroups = [
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
        to: "/egg-inventory",
        icon: "bi-box-seam-fill",
        label: "Egg Inventory",
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
    title: "SALES & BUSINESS",
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
        icon: "bi-people",
        label: "Users",
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

        if (!mounted) {
          return;
        }

        const name = response.data?.farm_name;

        if (
          typeof name === "string" &&
          name.trim().length > 0
        ) {
          setFarmName(name.trim());
        }
      } catch (error) {
        console.error(
          "Failed to load farm settings:",
          error
        );
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

  const handleNavigation = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleNavigation}
          aria-hidden="true"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`sidebar ${
          mobileOpen ? "open" : ""
        }`}
        aria-label="Main navigation"
      >

        {/* ===================================================
            BRAND
        ==================================================== */}
        <div className="brand">

          <div className="brand-icon">
            <i className="bi bi-egg-fried"></i>
          </div>

          <div className="brand-text">
            <strong>KukuFarm</strong>
            <small>Farm Management</small>
          </div>

        </div>

        {/* ===================================================
            CURRENT FARM
        ==================================================== */}
        <div className="farm-badge">

          <div className="farm-badge-icon">
            <i className="bi bi-house-heart-fill"></i>
          </div>

          <div className="farm-badge-content">

            <span>
              Current Farm
            </span>

            <strong
              title={farmName}
              className={
                loadingFarm
                  ? "text-muted"
                  : ""
              }
            >
              {loadingFarm
                ? "Loading..."
                : farmName}
            </strong>

          </div>

          <i className="bi bi-chevron-down farm-chevron"></i>

        </div>

        {/* ===================================================
            NAVIGATION
        ==================================================== */}
        <nav
          className="sidebar-navigation"
          aria-label="Farm management navigation"
        >

          {navigationGroups.map(
            (group) => (
              <div
                className="nav-group"
                key={group.title}
              >

                {/* Group title */}
                <div className="nav-title">
                  {group.title}
                </div>

                {/* Group items */}
                <div className="nav-items">

                  {group.items.map(
                    (item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={
                          item.to === "/"
                        }
                        onClick={
                          handleNavigation
                        }
                        className={({
                          isActive,
                        }) =>
                          [
                            "nav-item",
                            isActive
                              ? "active"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                        aria-label={
                          item.label
                        }
                      >

                        <span className="nav-icon">
                          <i
                            className={`bi ${item.icon}`}
                            aria-hidden="true"
                          ></i>
                        </span>

                        <span className="nav-label">
                          {item.label}
                        </span>

                      </NavLink>
                    )
                  )}

                </div>

              </div>
            )
          )}

        </nav>

      </aside>
    </>
  );
}