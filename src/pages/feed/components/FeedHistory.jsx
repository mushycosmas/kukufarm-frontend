import React from "react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  );
}

export default function FeedHistory({
  movements,
  loading,
  search,
  setSearch,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-card">
      <div className="p-4 pb-2">
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <h5 className="mb-1">
              Stock History
            </h5>

            <small className="text-muted">
              Complete record of feed
              entering and leaving
              inventory.
            </small>
          </div>

          <div
            style={{
              maxWidth: "320px",
              width: "100%",
            }}
          >
            <input
              type="search"
              className="form-control"
              placeholder="Search history..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Feed</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Flock</th>
              <th>Reference</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-4"
                >
                  Loading history...
                </td>
              </tr>
            ) : movements.length ===
              0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center text-muted py-4"
                >
                  No stock movements found.
                </td>
              </tr>
            ) : (
              movements.map((item) => {
                const isConsumption =
                  item.movement_type ===
                  "Consumption";

                return (
                  <tr
                    key={`${item.movement_type}-${item.id}`}
                  >
                    <td>
                      {item.date ||
                        "-"}
                    </td>

                    <td>
                      <strong>
                        {item.feed_name ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      {isConsumption ? (
                        <span className="badge bg-warning text-dark">
                          Stock Out
                        </span>
                      ) : item.movement_type ===
                        "Adjustment" ? (
                        <span className="badge bg-info text-dark">
                          Adjustment
                        </span>
                      ) : item.movement_type ===
                        "Opening Stock" ? (
                        <span className="badge bg-secondary">
                          Opening
                        </span>
                      ) : (
                        <span className="badge bg-success">
                          Stock In
                        </span>
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatNumber(
                          item.quantity
                        )}
                      </strong>{" "}
                      {item.feed_unit ||
                        ""}
                    </td>

                    <td>
                      {isConsumption
                        ? item.flock_code
                          ? `${item.flock_code} - ${
                              item.flock_name ||
                              ""
                            }`
                          : item.flock_name ||
                            "-"
                        : "-"}
                    </td>

                    <td>
                      {item.reference ||
                        "-"}
                    </td>

                    <td>
                      {item.created_by_name ||
                        "-"}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                          onClick={() =>
                            onEdit(
                              item,
                              item.movement_type
                            )
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() =>
                            onDelete(
                              item,
                              item.movement_type
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}