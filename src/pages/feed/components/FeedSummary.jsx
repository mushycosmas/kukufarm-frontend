import React from "react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  );
}

export default function FeedSummary({
  feeds,
  totalStock,
  totalStockIn,
  lowStockCount,
}) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted">
              Feed Items
            </small>

            <h3 className="mb-0 mt-2">
              {feeds.length}
            </h3>

            <small className="text-muted">
              Active feed types
            </small>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted">
              Current Stock
            </small>

            <h3 className="mb-0 mt-2">
              {formatNumber(
                totalStock
              )}
            </h3>

            <small className="text-muted">
              Across all feed items
            </small>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted">
              Stock Added
            </small>

            <h3 className="mb-0 mt-2">
              {formatNumber(
                totalStockIn
              )}
            </h3>

            <small className="text-muted">
              Total quantity added
            </small>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted">
              Low Stock
            </small>

            <h3 className="mb-0 mt-2 text-warning">
              {lowStockCount}
            </h3>

            <small className="text-muted">
              Items requiring attention
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}