import React from "react";

export default function FeedTabs({
  activeTab,
  setActiveTab,
  onAddStock,
}) {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body pb-0">
        <ul className="nav nav-tabs">

          {/* INVENTORY */}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${
                activeTab === "inventory"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("inventory")
              }
            >
              <i className="bi bi-box-seam me-2" />
              Feed Inventory
            </button>
          </li>

          {/* ADD STOCK */}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${
                activeTab === "stock"
                  ? "active"
                  : ""
              }`}
              onClick={onAddStock}
            >
              <i className="bi bi-plus-circle me-2" />
              Add Stock
            </button>
          </li>

          {/* HISTORY */}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${
                activeTab === "history"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("history")
              }
            >
              <i className="bi bi-clock-history me-2" />
              Stock History
            </button>
          </li>

          {/* FEED TYPES */}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${
                activeTab === "feed-types"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("feed-types")
              }
            >
              <i className="bi bi-tags me-2" />
              Feed Types
            </button>
          </li>

        </ul>
      </div>
    </div>
  );
}