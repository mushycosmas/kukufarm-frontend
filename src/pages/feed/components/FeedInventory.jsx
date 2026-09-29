import React from "react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  );
}

export default function FeedInventory({
  stock,
  loading,
  onAddStock,
  onConsumption,
}) {
  return (
    <div className="table-card">
      <div className="p-4 pb-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              Feed Inventory
            </h5>

            <small className="text-muted">
              Current available physical
              feed stock.
            </small>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() =>
                onConsumption()
              }
            >
              <i className="bi bi-dash-circle me-2" />
              Record Consumption
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={() =>
                onAddStock()
              }
            >
              <i className="bi bi-plus-lg me-2" />
              Add Stock
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Feed</th>
              <th>Category</th>
              <th>Available Stock</th>
              <th>Minimum Stock</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-4"
                >
                  Loading inventory...
                </td>
              </tr>
            ) : stock.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center text-muted py-4"
                >
                  No feed inventory found.
                </td>
              </tr>
            ) : (
              stock.map((item) => {
                const feedId =
                  item.feed ||
                  item.feed_id;

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.feed_name ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      {item.category_name ||
                        "-"}
                    </td>

                    <td>
                      <strong>
                        {formatNumber(
                          item.quantity
                        )}
                      </strong>
                    </td>

                    <td>
                      {formatNumber(
                        item.minimum_stock
                      )}
                    </td>

                    <td>
                      {item.unit || "-"}
                    </td>

                    <td>
                      {item.stock_status ===
                      "out_of_stock" ? (
                        <span className="badge bg-danger">
                          Out of Stock
                        </span>
                      ) : item.stock_status ===
                        "low_stock" ? (
                        <span className="badge bg-warning text-dark">
                          Low Stock
                        </span>
                      ) : (
                        <span className="badge bg-success">
                          Normal
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() =>
                            onAddStock(
                              feedId
                            )
                          }
                        >
                          <i className="bi bi-plus-lg me-1" />
                          Stock In
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            onConsumption(
                              feedId
                            )
                          }
                        >
                          <i className="bi bi-dash-lg me-1" />
                          Use
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