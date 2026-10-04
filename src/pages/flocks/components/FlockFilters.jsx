import React from "react";

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "sold",
    label: "Sold",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

export default function FlockFilters({
  search = "",
  setSearch,
  statusFilter = "",
  setStatusFilter,
}) {
  return (
    <div className="filter-card">
      {/* SEARCH */}
      <div className="search-box">
        <i className="bi bi-search"></i>

        <input
          type="text"
          placeholder="Search flocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* STATUS */}
      <select
        className="form-select"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>

        {STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}