import React from "react";
import { Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import {
  formatNumber,
  formatStatus,
  getStatusClass,
} from "../utils/flockUtils";

export default function FlockTable({
  flocks,
  loading,
  search,
  statusFilter,
  deleting,
  onAdd,
  onDelete,
}) {
  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="table-card">
        <div className="table-responsive">
          <div className="text-center py-5">

            <Spinner
              animation="border"
              variant="success"
            />

            <div className="mt-3 text-muted">
              Loading flocks...
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // EMPTY
  // =========================================================

  if (flocks.length === 0) {
    return (
      <div className="table-card">
        <div className="table-responsive">

          <div className="text-center py-5">

            <i
              className="bi bi-egg"
              style={{
                fontSize: "2.5rem",
              }}
            ></i>

            <h5 className="mt-3">
              No flocks found
            </h5>

            <p className="text-muted mb-3">
              {search || statusFilter
                ? "Try changing your search or filter."
                : "You have not added any flocks yet."}
            </p>

            {!search && !statusFilter && (
              <button
                className="btn btn-success"
                onClick={onAdd}
              >
                <i className="bi bi-plus-lg me-2"></i>

                Add New Flock
              </button>
            )}

          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // TABLE
  // =========================================================

  return (
    <div className="table-card">
      <div className="table-responsive">

        <table className="table align-middle">

          <thead>
            <tr>
              <th>Flock</th>
              <th>Breed</th>
              <th>Start Date</th>
              <th>Chickens</th>
              <th>Age</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {flocks.map((flock) => (
              <tr key={flock.id}>

                {/* FLOCK */}
                <td>
                  <Link
                    className="record-link"
                    to={`/flocks/${flock.id}`}
                  >
                    {flock.code}
                  </Link>

                  {flock.name && (
                    <div className="small text-muted">
                      {flock.name}
                    </div>
                  )}
                </td>

                {/* BREED */}
                <td>
                  {flock.breed || "-"}
                </td>

                {/* DATE */}
                <td>
                  {flock.arrival_date || "-"}
                </td>

                {/* CHICKENS */}
                <td>
                  <strong>
                    {formatNumber(
                      flock.current_quantity
                    )}
                  </strong>

                  <div className="small text-muted">
                    Initial:{" "}
                    {formatNumber(
                      flock.initial_quantity
                    )}
                  </div>
                </td>

                {/* AGE */}
                <td>
                  {formatNumber(
                    flock.age_weeks
                  )}{" "}
                  weeks
                </td>

                {/* STATUS */}
                <td>
                  <span
                    className={getStatusClass(
                      flock.status
                    )}
                  >
                    {formatStatus(
                      flock.status
                    )}
                  </span>
                </td>

                {/* ACTIONS */}
                <td>
                  <div className="action-buttons">

                    <Link
                      to={`/flocks/${flock.id}`}
                      className="btn btn-sm btn-light"
                      title="View flock"
                    >
                      <i className="bi bi-eye"></i>
                    </Link>

                    <button
                      className="btn btn-sm btn-light"
                      onClick={() =>
                        onDelete(flock)
                      }
                      disabled={deleting}
                      title="Delete flock"
                    >
                      <i className="bi bi-trash text-danger"></i>
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}