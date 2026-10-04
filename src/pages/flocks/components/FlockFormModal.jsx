import React from "react";
import {
  Modal,
  Button,
  Spinner,
} from "react-bootstrap";

// ============================================================
// BREED OPTIONS
// ============================================================

const BREED_OPTIONS = [
  {
    value: "Layers",
    label: "Layers",
  },
  {
    value: "Broilers",
    label: "Broilers",
  },
  {
    value: "Local",
    label: "Local",
  },
];

// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "sold",
    label: "Sold",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

// ============================================================
// FLOCK FORM MODAL
// ============================================================

export default function FlockFormModal({
  show = false,
  form = {},
  formError = "",
  saving = false,
  onHide,
  onChange,
  onSave,
}) {
  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onHide}
      centered
      size="lg"
      backdrop="static"
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <Modal.Header
        closeButton={!saving}
      >
        <Modal.Title>
          <i className="bi bi-egg-fried me-2"></i>

          Add Flock
        </Modal.Title>
      </Modal.Header>

      {/* ====================================================
          BODY
      ==================================================== */}

      <Modal.Body>
        {/* --------------------------------------------------
            FORM ERROR
        -------------------------------------------------- */}

        {formError && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle me-2"></i>

            {formError}
          </div>
        )}

        <div className="row g-3">
          {/* =================================================
              FLOCK CODE
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-code"
              className="form-label"
            >
              Flock Code
              <span className="text-danger">
                {" "}
                *
              </span>
            </label>

            <input
              id="flock-code"
              type="text"
              name="code"
              className="form-control"
              placeholder="e.g. FLK-001"
              value={form.code || ""}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              FLOCK NAME
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-name"
              className="form-label"
            >
              Flock Name
              <span className="text-danger">
                {" "}
                *
              </span>
            </label>

            <input
              id="flock-name"
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Layer House A"
              value={form.name || ""}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              BREED
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-breed"
              className="form-label"
            >
              Breed
            </label>

            <select
              id="flock-breed"
              name="breed"
              className="form-select"
              value={
                form.breed || "Layers"
              }
              onChange={onChange}
              disabled={saving}
            >
              {BREED_OPTIONS.map(
                (breed) => (
                  <option
                    key={breed.value}
                    value={breed.value}
                  >
                    {breed.label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              SOURCE
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-source"
              className="form-label"
            >
              Source
            </label>

            <input
              id="flock-source"
              type="text"
              name="source"
              className="form-control"
              placeholder="e.g. Supplier / Hatchery"
              value={form.source || ""}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              ARRIVAL DATE
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-arrival-date"
              className="form-label"
            >
              Arrival Date
              <span className="text-danger">
                {" "}
                *
              </span>
            </label>

            <input
              id="flock-arrival-date"
              type="date"
              name="arrival_date"
              className="form-control"
              value={
                form.arrival_date || ""
              }
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              INITIAL QUANTITY
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-initial-quantity"
              className="form-label"
            >
              Initial Quantity
              <span className="text-danger">
                {" "}
                *
              </span>
            </label>

            <input
              id="flock-initial-quantity"
              type="number"
              name="initial_quantity"
              className="form-control"
              min="0"
              step="1"
              placeholder="e.g. 1000"
              value={
                form.initial_quantity ??
                ""
              }
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              CURRENT QUANTITY
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-current-quantity"
              className="form-label"
            >
              Current Quantity
            </label>

            <input
              id="flock-current-quantity"
              type="number"
              name="current_quantity"
              className="form-control"
              min="0"
              step="1"
              placeholder="Leave empty to use initial quantity"
              value={
                form.current_quantity ??
                ""
              }
              onChange={onChange}
              disabled={saving}
            />

            <small className="text-muted">
              Leave empty to automatically use
              the initial quantity.
            </small>
          </div>

          {/* =================================================
              AGE
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-age"
              className="form-label"
            >
              Age (Weeks)
            </label>

            <input
              id="flock-age"
              type="number"
              name="age_weeks"
              className="form-control"
              min="0"
              step="1"
              placeholder="e.g. 18"
              value={
                form.age_weeks ?? ""
              }
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              HOUSE
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-house"
              className="form-label"
            >
              House
            </label>

            <input
              id="flock-house"
              type="text"
              name="house"
              className="form-control"
              placeholder="e.g. House A"
              value={form.house || ""}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          <div className="col-md-6">
            <label
              htmlFor="flock-status"
              className="form-label"
            >
              Status
            </label>

            <select
              id="flock-status"
              name="status"
              className="form-select"
              value={
                form.status || "active"
              }
              onChange={onChange}
              disabled={saving}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          <div className="col-12">
            <label
              htmlFor="flock-notes"
              className="form-label"
            >
              Notes
            </label>

            <textarea
              id="flock-notes"
              name="notes"
              className="form-control"
              rows="3"
              placeholder="Additional information about this flock..."
              value={form.notes || ""}
              onChange={onChange}
              disabled={saving}
            />
          </div>
        </div>
      </Modal.Body>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                className="me-2"
              />

              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>

              Save Flock
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}