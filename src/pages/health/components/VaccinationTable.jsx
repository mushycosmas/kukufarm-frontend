import React from "react";

const VaccinationTable = ({
  vaccinations = [],
  flocks = [],
  search = "",
  onEdit,
  onDelete,
  formatDate,
  getFlockDisplay,
}) => {
  const getFlockName = (flockValue) => {
    if (getFlockDisplay) {
      return getFlockDisplay(flockValue, flocks);
    }

    const flockId =
      typeof flockValue === "object"
        ? flockValue?.id
        : flockValue;

    const flock = flocks.find(
      (item) => Number(item.id) === Number(flockId)
    );

    if (!flock) {
      return "-";
    }

    return (
      flock.name ||
      flock.flock_name ||
      flock.code ||
      `Flock #${flock.id}`
    );
  };

  const formatDateValue = (value) => {
    if (!value) {
      return "-";
    }

    if (formatDate) {
      return formatDate(value);
    }

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const normalizedSearch = String(search || "")
    .trim()
    .toLowerCase();

  const filteredVaccinations = vaccinations.filter((vaccination) => {
    if (!normalizedSearch) {
      return true;
    }

    const flockName = getFlockName(vaccination.flock);

    const searchableText = [
      vaccination.vaccine,
      vaccination.dosage,
      vaccination.administered_by,
      vaccination.notes,
      flockName,
      vaccination.date,
      vaccination.next_due_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              Vaccination Records
            </h5>

            <small className="text-muted">
              {filteredVaccinations.length} record
              {filteredVaccinations.length === 1 ? "" : "s"}
            </small>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {filteredVaccinations.length === 0 ? (
          <div className="text-center py-5">
            <i
              className="bi bi-shield-check fs-1 text-muted"
              aria-hidden="true"
            />

            <h6 className="mt-3 mb-1">
              No vaccination records found
            </h6>

            <p className="text-muted mb-0">
              There are no vaccination records matching your search.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Flock</th>
                  <th>Vaccine</th>
                  <th>Next Due</th>
                  <th>Dosage</th>
                  <th>Administered By</th>
                  <th>Notes</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVaccinations.map(
                  (vaccination, index) => {
                    return (
                      <tr key={vaccination.id || index}>
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <span className="text-nowrap">
                            {formatDateValue(
                              vaccination.date
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="fw-semibold">
                            {getFlockName(
                              vaccination.flock
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="fw-semibold">
                            {vaccination.vaccine || "-"}
                          </span>
                        </td>

                        <td>
                          {vaccination.next_due_date ? (
                            <span className="text-nowrap">
                              {formatDateValue(
                                vaccination.next_due_date
                              )}
                            </span>
                          ) : (
                            <span className="text-muted">
                              -
                            </span>
                          )}
                        </td>

                        <td>
                          {vaccination.dosage || "-"}
                        </td>

                        <td>
                          {vaccination.administered_by || "-"}
                        </td>

                        <td>
                          {vaccination.notes ? (
                            <span
                              title={vaccination.notes}
                            >
                              {vaccination.notes.length > 40
                                ? `${vaccination.notes.substring(
                                    0,
                                    40
                                  )}...`
                                : vaccination.notes}
                            </span>
                          ) : (
                            <span className="text-muted">
                              -
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Edit vaccination"
                              onClick={() =>
                                onEdit &&
                                onEdit(vaccination)
                              }
                            >
                              <i className="bi bi-pencil" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete vaccination"
                              onClick={() =>
                                onDelete &&
                                onDelete(vaccination)
                              }
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationTable;

