import React from "react";

function getFlockDisplay(flock) {
  if (!flock) return "-";

  return flock.code
    ? `${flock.code}${
        flock.name ? ` - ${flock.name}` : ""
      }`
    : flock.name || `Flock #${flock.id}`;
}

export default function VaccinationForm({
  form,
  setForm,
  flocks,
  saving,
  editingId,
  onSubmit,
  onCancel,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">
              {editingId
                ? "Edit Vaccination"
                : "Add Vaccination"}
            </h5>

            <small className="text-muted">
              Record vaccines administered to each flock.
            </small>
          </div>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={submit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                Flock{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <select
                name="flock"
                className="form-select"
                value={form.flock}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select flock
                </option>

                {flocks.map((flock) => (
                  <option
                    key={flock.id}
                    value={flock.id}
                  >
                    {getFlockDisplay(flock)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Vaccine{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="text"
                name="vaccine"
                className="form-control"
                placeholder="e.g. Newcastle"
                value={form.vaccine}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Date{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Next Due Date
              </label>

              <input
                type="date"
                name="next_due_date"
                className="form-control"
                value={form.next_due_date}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Dosage
              </label>

              <input
                type="text"
                name="dosage"
                className="form-control"
                placeholder="e.g. 1 dose / bird"
                value={form.dosage}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Administered By
              </label>

              <input
                type="text"
                name="administered_by"
                className="form-control"
                placeholder="Name"
                value={form.administered_by}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="2"
                placeholder="Additional notes..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-success"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Vaccination"
                  : "Save Vaccination"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={onCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}