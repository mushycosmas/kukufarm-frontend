import React from "react";

function getFlockDisplay(flock) {
  if (!flock) return "-";

  return flock.code
    ? `${flock.code}${
        flock.name ? ` - ${flock.name}` : ""
      }`
    : flock.name || `Flock #${flock.id}`;
}

export default function HealthForm({
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
                ? "Edit Health Record"
                : "Add Health Record"}
            </h5>

            <small className="text-muted">
              Record illness, symptoms, treatment and medication.
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
                Condition{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="text"
                name="condition"
                className="form-control"
                placeholder="e.g. Respiratory infection"
                value={form.condition}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Symptoms
              </label>

              <textarea
                name="symptoms"
                className="form-control"
                rows="3"
                placeholder="Describe symptoms..."
                value={form.symptoms}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Treatment
              </label>

              <textarea
                name="treatment"
                className="form-control"
                rows="3"
                placeholder="Treatment given..."
                value={form.treatment}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Medicine
              </label>

              <input
                type="text"
                name="medicine"
                className="form-control"
                placeholder="Medicine name"
                value={form.medicine}
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
                placeholder="e.g. 5ml / bird"
                value={form.dosage}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Veterinarian
              </label>

              <input
                type="text"
                name="veterinarian"
                className="form-control"
                placeholder="Veterinarian name"
                value={form.veterinarian}
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
                  ? "Update Health Record"
                  : "Save Health Record"}
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