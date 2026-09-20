import React from 'react';

export default function PageHeader({ title, subtitle, action, icon='bi-grid' }) {
  return (
    <div className="page-header">
      <div>
        <div className="breadcrumb-text"><i className={`bi ${icon}`} /> KukuFarm / {title}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}