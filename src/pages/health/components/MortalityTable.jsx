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

export default function MortalityTable({
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
            Mortality Records
          </h5>

          <input
            type="text"
            className="form-control"
            style={{
              maxWidth: "300px",
            }}
            placeholder="Search mortality..."
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
                  <th>Quantity</th>
                  <th>Cause</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No mortality records found.
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
                          <span className="badge bg-danger">
                            {record.quantity} birds
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-secondary">
                            {record.cause ||
                              "Unknown"}
                          </span>
                        </td>

                        <td>
                          {record.notes ||
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