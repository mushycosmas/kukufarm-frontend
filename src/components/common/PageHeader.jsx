import React from "react";

export default function PageHeader({
  title,
  subtitle,
  action,
  icon = "bi-grid",
}) {
  return (
    <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      {/* Page title and breadcrumb */}
      <div className="page-header-content">
        <div className="breadcrumb-text mb-2">
          <i className={`bi ${icon} me-2`} />
          <span>KukuFarm</span>
          <i className="bi bi-chevron-right mx-2 small" />
          <span>{title}</span>
        </div>

        <h1 className="page-header-title mb-2">
          {title}
        </h1>

        {subtitle && (
          <p className="page-header-subtitle text-muted mb-0">
            {subtitle}
          </p>
        )}
      </div>

      {/* Optional page action button */}
      {action && (
        <div className="page-header-action d-flex align-items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
