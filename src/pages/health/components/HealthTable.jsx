import React from "react";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getFlockDisplay(flock) {
  if (!flock) return "-";

  return flock.code
    ? `${flock.code}${
        flock.name ? ` - ${flock.name}` : ""
      }`
    : flock.name || `Flock #${flock.id}`;
}

function getFlockById(flocks, id) {
  return flocks.find(
    (flock) =>
      Number(flock.id) === Number(id)
  );
}

export default function HealthTable({
  records,
  flocks,
  loading,
  search,
  setSearch,
  onEdit,
  onDelete,
}) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            Health Records
          </h5>

          <input
            type="text"
            className="form-control"
            style={{
              maxWidth: "300px",
            }}
            placeholder="Search records..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            Loading...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Flock</th>
                  <th>Condition</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Veterinarian</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-4"
                    >
                      No health records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const flock =
                      getFlockById(
                        flocks,
                        record.flock
                      );

                    return (
                      <tr key={record.id}>
                        <td>
                          {formatDate(
                            record.date
                          )}
                        </td>

                        <td>
                          {getFlockDisplay(
                            flock
                          )}
                        </td>

                        <td>
                          <strong>
                            {record.condition ||
                              "-"}
                          </strong>

                          {record.symptoms && (
                            <div className="small text-muted">
                              {record.symptoms}
                            </div>
                          )}
                        </td>

                        <td>
                          {record.medicine ||
                            "-"}
                        </td>

                        <td>
                          {record.dosage ||
                            "-"}
                        </td>

                        <td>
                          {record.veterinarian ||
                            "-"}
                        </td>

                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() =>
                                onEdit(record)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() =>
                                onDelete(
                                  record.id
                                )
                              }
                            >
                              Delete
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
        )}
      </div>
    </div>
  );
}