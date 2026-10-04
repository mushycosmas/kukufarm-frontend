import React from "react";

const mortalityCauses = [
  "Natural",
  "Disease",
  "Accident",
  "Predation",
  "Heat Stress",
  "Cold Stress",
  "Injury",
  "Cannibalism",
  "Unknown",
  "Other",
];

function getFlockDisplay(flock) {
  if (!flock) return "-";

  return flock.code
    ? `${flock.code}${
        flock.name ? ` - ${flock.name}` : ""
      }`
    : flock.name || `Flock #${flock.id}`;
}

export default function MortalityForm({
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
                ? "Edit Mortality Record"
                : "Add Mortality Record"}
            </h5>

            <small className="text-muted">
              Record bird deaths and update flock quantity.
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
                    {flock.current_quantity !==
                      undefined &&
                      ` — ${flock.current_quantity} birds`}
                  </option>
                ))}
              </select>
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
                Quantity{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="number"
                name="quantity"
                className="form-control"
                min="1"
                step="1"
                placeholder="Number of birds"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Cause{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <select
                name="cause"
                className="form-select"
                value={form.cause}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select mortality cause
                </option>

                {mortalityCauses.map(
                  (cause) => (
                    <option
                      key={cause}
                      value={cause}
                    >
                      {cause}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="2"
                placeholder="Additional information..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Mortality"
                  : "Save Mortality"}
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