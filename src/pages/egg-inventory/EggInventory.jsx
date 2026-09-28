import React, { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/dashboard/StatCard";
import api from "../../services/api";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-TZ");
}

export default function EggInventory() {
  const [inventory, setInventory] = useState({
    total_collected: 0,
    total_broken: 0,
    total_rejected: 0,
    total_sold: 0,
    available_eggs: 0,
    total_trays: 0,
    total_eggs: 0,
    current_stock: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/egg-inventory/");

      const data = response.data || {};

      setInventory({
        total_collected: Number(
          data.total_collected || 0
        ),

        total_broken: Number(
          data.total_broken || 0
        ),

        total_rejected: Number(
          data.total_rejected || 0
        ),

        total_sold: Number(
          data.total_sold || 0
        ),

        available_eggs: Number(
          data.available_eggs ??
            data.current_stock ??
            0
        ),

        total_trays: Number(
          data.total_trays || 0
        ),

        total_eggs: Number(
          data.total_eggs || 0
        ),

        current_stock: Number(
          data.current_stock ??
            data.available_eggs ??
            0
        ),
      });
    } catch (err) {
      console.error(
        "Failed to load egg inventory:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.detail ||
          "Failed to load egg inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Egg Inventory"
        subtitle="Monitor egg production, sales and current stock."
        action={
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={loadInventory}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Loading...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Refresh
              </>
            )}
          </button>
        }
      />

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadInventory}
          >
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="stats-grid">

        <StatCard
          title="Current Egg Stock"
          value={formatNumber(
            inventory.current_stock
          )}
          subtitle="Available good eggs"
          icon="bi-box-seam"
          className="egg"
        />

        <StatCard
          title="Eggs Collected"
          value={formatNumber(
            inventory.total_collected
          )}
          subtitle="Usable eggs collected"
          icon="bi-egg"
        />

        <StatCard
          title="Eggs Sold"
          value={formatNumber(
            inventory.total_sold
          )}
          subtitle="Eggs deducted from stock"
          icon="bi-cart-check-fill"
          className="profit"
        />

        <StatCard
          title="Broken Eggs"
          value={formatNumber(
            inventory.total_broken
          )}
          subtitle="Recorded broken eggs"
          icon="bi-x-circle-fill"
          className="mortality"
        />

        <StatCard
          title="Rejected Eggs"
          value={formatNumber(
            inventory.total_rejected
          )}
          subtitle="Recorded rejected eggs"
          icon="bi-exclamation-circle-fill"
        />

        <StatCard
          title="Total Trays"
          value={formatNumber(
            inventory.total_trays
          )}
          subtitle="Recorded production trays"
          icon="bi-grid-3x3-gap-fill"
        />
      </div>

      {/* INVENTORY INFORMATION */}
      <div className="table-card mt-4">
        <div className="p-4">

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div>
              <h5 className="mb-1">
                Egg Inventory Summary
              </h5>

              <small className="text-muted">
                Current stock is calculated from
                egg production and egg sales.
              </small>
            </div>

            <span className="badge bg-success">
              Live Summary
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5">

              <div
                className="spinner-border text-success"
                role="status"
              />

              <div className="mt-2 text-muted">
                Loading egg inventory...
              </div>

            </div>
          ) : (
            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>
                  <tr>
                    <th>
                      Inventory Item
                    </th>

                    <th className="text-end">
                      Quantity
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {/* CURRENT STOCK */}
                  <tr>
                    <td>
                      <strong>
                        Good Eggs Available
                      </strong>
                    </td>

                    <td className="text-end">
                      <strong className="text-success">
                        {formatNumber(
                          inventory.current_stock
                        )}
                      </strong>
                    </td>

                    <td>
                      {inventory.current_stock > 0 ? (
                        <span className="badge bg-success">
                          Available
                        </span>
                      ) : (
                        <span className="badge bg-danger">
                          Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* COLLECTED */}
                  <tr>
                    <td>
                      Eggs Collected
                    </td>

                    <td className="text-end">
                      {formatNumber(
                        inventory.total_collected
                      )}
                    </td>

                    <td>
                      <span className="badge bg-primary">
                        Production
                      </span>
                    </td>
                  </tr>

                  {/* SOLD */}
                  <tr>
                    <td>
                      Eggs Sold
                    </td>

                    <td className="text-end">
                      <strong className="text-danger">
                        {formatNumber(
                          inventory.total_sold
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="badge bg-danger">
                        Deducted
                      </span>
                    </td>
                  </tr>

                  {/* BROKEN */}
                  <tr>
                    <td>
                      Broken Eggs
                    </td>

                    <td className="text-end">
                      {formatNumber(
                        inventory.total_broken
                      )}
                    </td>

                    <td>
                      <span className="badge bg-danger">
                        Damaged
                      </span>
                    </td>
                  </tr>

                  {/* REJECTED */}
                  <tr>
                    <td>
                      Rejected Eggs
                    </td>

                    <td className="text-end">
                      {formatNumber(
                        inventory.total_rejected
                      )}
                    </td>

                    <td>
                      <span className="badge bg-warning text-dark">
                        Rejected
                      </span>
                    </td>
                  </tr>

                  {/* TRAYS */}
                  <tr>
                    <td>
                      Total Trays
                    </td>

                    <td className="text-end">
                      {formatNumber(
                        inventory.total_trays
                      )}
                    </td>

                    <td>
                      <span className="badge bg-secondary">
                        Production
                      </span>
                    </td>
                  </tr>

                  {/* TOTAL PRODUCTION */}
                  <tr>
                    <td>
                      <strong>
                        Total Egg Production
                      </strong>
                    </td>

                    <td className="text-end">
                      <strong>
                        {formatNumber(
                          inventory.total_eggs
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="badge bg-primary">
                        Total
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* STOCK CALCULATION */}
      <div className="alert alert-success mt-4">

        <div className="d-flex">

          <i className="bi bi-calculator-fill me-2 mt-1" />

          <div>

            <strong>
              Current Stock Calculation
            </strong>

            <div className="small mt-1">

              {formatNumber(
                inventory.total_collected
              )}{" "}
              collected −{" "}
              {formatNumber(
                inventory.total_sold
              )}{" "}
              sold ={" "}

              <strong>
                {formatNumber(
                  inventory.current_stock
                )}{" "}
                eggs available
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* INFORMATION */}
      <div className="alert alert-info mt-4">

        <div className="d-flex">

          <i className="bi bi-info-circle-fill me-2 mt-1" />

          <div>

            <strong>
              How egg inventory works
            </strong>

            <div className="small mt-1">

              Egg production records add usable eggs
              to inventory. When an egg sale is
              recorded with{" "}
              <strong>Egg Item = Yes</strong>, the
              sold quantity is automatically deducted
              from the available egg stock.

              <br />

              <span className="d-block mt-1">
                <strong>Tray:</strong> 1 tray = 30 eggs.
              </span>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}