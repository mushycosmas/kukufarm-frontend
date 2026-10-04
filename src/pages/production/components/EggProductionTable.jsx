import React from "react";

import {
  formatNumber,
  formatTrays,
  getEggsCollected,
  getBrokenEggs,
  getRejectedEggs,
  getTotalEggs,
  getEquivalentTrays,
  getFlockName,
} from "../utils/eggProductionUtils";

export default function EggProductionTable({
  data,
  flocks,
  loading,
  saving,
  deleting,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-card">

      <div className="table-responsive">

        <table className="table align-middle">

          <thead>
            <tr>
              <th>Date</th>
              <th>Flock</th>
              <th>Good Eggs</th>
              <th>Equivalent Trays</th>
              <th>Broken</th>
              <th>Rejected</th>
              <th>Total Collected</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-5"
                >
                  <div
                    className="spinner-border text-success"
                    role="status"
                  />

                  <div className="mt-2 text-muted">
                    Loading production records...
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              data.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-5"
                  >
                    <i className="bi bi-egg fs-1 d-block mb-2" />

                    No egg production records found.
                  </td>
                </tr>
              )}

            {!loading &&
              data.length > 0 &&
              data.map((record) => (
                <tr key={record.id}>

                  <td>
                    {record.date}
                  </td>

                  <td>
                    <span className="record-link">
                      {getFlockName(
                        record,
                        flocks
                      )}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {formatNumber(
                        getEggsCollected(
                          record
                        )
                      )}
                    </strong>

                    <div className="small text-muted">
                      Good eggs
                    </div>
                  </td>

                  <td>
                    <strong>
                      {formatTrays(
                        getEquivalentTrays(
                          record
                        )
                      )}
                    </strong>

                    <div className="small text-muted">
                      trays
                    </div>
                  </td>

                  <td>
                    {formatNumber(
                      getBrokenEggs(record)
                    )}
                  </td>

                  <td>
                    {formatNumber(
                      getRejectedEggs(record)
                    )}
                  </td>

                  <td>
                    <strong>
                      {formatNumber(
                        getTotalEggs(record)
                      )}
                    </strong>

                    <div className="small text-muted">
                      Good + broken + rejected
                    </div>
                  </td>

                  <td>
                    <div className="action-buttons">

                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        title="Edit"
                        onClick={() =>
                          onEdit(record)
                        }
                        disabled={
                          saving ||
                          deleting
                        }
                      >
                        <i className="bi bi-pencil text-primary" />
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        title="Delete"
                        onClick={() =>
                          onDelete(record.id)
                        }
                        disabled={
                          saving ||
                          deleting
                        }
                      >
                        <i className="bi bi-trash text-danger" />
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