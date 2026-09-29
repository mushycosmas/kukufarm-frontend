import React from "react";

const FeedMovementForm = ({
  feeds = [],
  flocks = [],
  form,
  editing,
  loading = false,
  saving = false,
  updateForm,
  onSubmit,
  onCancel,
}) => {
  const isConsumption =
    form?.movement_type === "Consumption";

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateForm(name, value);
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              <i className="bi bi-box-seam me-2"></i>
              {editing
                ? "Edit Feed Movement"
                : isConsumption
                ? "Record Feed Consumption"
                : "Add Feed Stock"}
            </h5>

            <small className="text-muted">
              {isConsumption
                ? "Record feed used by a flock."
                : "Record physical feed entering the inventory."}
            </small>
          </div>

          {editing && (
            <span className="badge bg-warning text-dark">
              Editing
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={onSubmit}>
          <div className="row g-3">

            {/* DATE */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Date <span className="text-danger">*</span>
              </label>

              <input
                type="date"
                name="date"
                value={form?.date || ""}
                onChange={handleChange}
                className="form-control"
                required
                disabled={saving}
              />
            </div>

            {/* MOVEMENT TYPE */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Movement Type{" "}
                <span className="text-danger">*</span>
              </label>

              <select
                name="movement_type"
                value={form?.movement_type || "Stock In"}
                onChange={handleChange}
                className="form-select"
                required
                disabled={saving || editing}
              >
                <option value="Stock In">
                  Stock In
                </option>

                <option value="Opening Stock">
                  Opening Stock
                </option>

                <option value="Adjustment">
                  Adjustment
                </option>

                <option value="Consumption">
                  Consumption
                </option>
              </select>
            </div>

            {/* FEED */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Feed{" "}
                <span className="text-danger">*</span>
              </label>

              <select
                name="feed"
                value={form?.feed || ""}
                onChange={handleChange}
                className="form-select"
                required
                disabled={saving || loading}
              >
                <option value="">
                  Select Feed
                </option>

                {feeds.map((feed) => (
                  <option
                    key={feed.id}
                    value={feed.id}
                  >
                    {feed.name ||
                      feed.feed_name ||
                      feed.feed_type ||
                      `Feed #${feed.id}`}
                  </option>
                ))}
              </select>

              {feeds.length === 0 && !loading && (
                <div className="form-text text-danger">
                  No feed items available. Please add a feed item first.
                </div>
              )}
            </div>

            {/* FLOCK - ONLY FOR CONSUMPTION */}
            {isConsumption && (
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Flock{" "}
                  <span className="text-danger">*</span>
                </label>

                <select
                  name="flock"
                  value={form?.flock || ""}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={saving || loading}
                >
                  <option value="">
                    Select Flock
                  </option>

                  {flocks.map((flock) => (
                    <option
                      key={flock.id}
                      value={flock.id}
                    >
                      {flock.name ||
                        flock.flock_name ||
                        flock.code ||
                        `Flock #${flock.id}`}
                    </option>
                  ))}
                </select>

                {flocks.length === 0 && !loading && (
                  <div className="form-text text-danger">
                    No flocks available.
                  </div>
                )}
              </div>
            )}

            {/* QUANTITY */}
            <div
              className={
                isConsumption
                  ? "col-md-6"
                  : "col-md-4"
              }
            >
              <label className="form-label fw-semibold">
                Quantity (Kg){" "}
                <span className="text-danger">*</span>
              </label>

              <div className="input-group">
                <input
                  type="number"
                  name="quantity"
                  value={form?.quantity || ""}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  disabled={saving}
                />

                <span className="input-group-text">
                  Kg
                </span>
              </div>

              <div className="form-text">
                Enter the actual physical quantity in kilograms.
              </div>
            </div>

            {/* REFERENCE - STOCK ONLY */}
            {!isConsumption && (
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Reference
                </label>

                <input
                  type="text"
                  name="reference"
                  value={form?.reference || ""}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. GRN-001, Opening Balance"
                  disabled={saving}
                />

                <div className="form-text">
                  Optional reference number or description.
                </div>
              </div>
            )}

            {/* NOTES */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                Notes
              </label>

              <textarea
                name="notes"
                value={form?.notes || ""}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder={
                  isConsumption
                    ? "Optional notes about feed consumption..."
                    : "Optional notes about this stock movement..."
                }
                disabled={saving}
              />
            </div>
          </div>

          {/* INFORMATION */}
          <div className="mt-4">
            {isConsumption ? (
              <div className="alert alert-info mb-0">
                <div className="d-flex">
                  <i className="bi bi-info-circle-fill me-2 mt-1"></i>

                  <div>
                    <strong>Feed Consumption</strong>

                    <div className="small mt-1">
                      This records feed used by the selected flock.
                      The backend should deduct the quantity from the
                      feed inventory.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-light border mb-0">
                <div className="d-flex">
                  <i className="bi bi-box-arrow-in-down me-2 mt-1"></i>

                  <div>
                    <strong>Feed Stock</strong>

                    <div className="small text-muted mt-1">
                      Use this section to record physical feed entering
                      the inventory, opening stock, or stock adjustments.
                      Purchase cost and supplier information should be
                      recorded separately under Expenses / Purchases.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              <i className="bi bi-x-lg me-1"></i>
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  Saving...
                </>
              ) : (
                <>
                  <i
                    className={
                      editing
                        ? "bi bi-check-lg me-1"
                        : isConsumption
                        ? "bi bi-dash-circle me-1"
                        : "bi bi-plus-circle me-1"
                    }
                  ></i>

                  {editing
                    ? "Update Movement"
                    : isConsumption
                    ? "Record Consumption"
                    : "Add Stock"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedMovementForm;