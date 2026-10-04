import React from "react";

import {
  Modal,
  Button,
} from "react-bootstrap";

import {
  EGGS_PER_TRAY,
  formatNumber,
  formatTrays,
} from "../utils/eggProductionUtils";

export default function EggProductionModal({
  show,
  saving,
  editingId,
  form,
  flocks,
  calculations,
  formError,
  onClose,
  onChange,
  onSave,
}) {
  return (
    <Modal
      show={show}
      onHide={() =>
        !saving && onClose()
      }
      centered
    >

      <Modal.Header
        closeButton={!saving}
      >
        <Modal.Title>
          {editingId
            ? "Edit Egg Production"
            : "Record Egg Production"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>

        {formError && (
          <div className="alert alert-danger">
            {formError}
          </div>
        )}

        <div className="row g-3">

          <div className="col-md-6">

            <label className="form-label">
              Production Date
            </label>

            <input
              type="date"
              name="date"
              className="form-control"
              value={form.date}
              onChange={onChange}
              disabled={saving}
            />

          </div>

          <div className="col-md-6">

            <label className="form-label">
              Flock
            </label>

            <select
              name="flock"
              className="form-select"
              value={form.flock}
              onChange={onChange}
              disabled={saving}
            >

              <option value="">
                Select Flock
              </option>

              {flocks.map((flock) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.code}

                  {flock.name
                    ? ` - ${flock.name}`
                    : ""}
                </option>
              ))}

            </select>

          </div>

          <div className="col-md-6">

            <label className="form-label">
              Full Trays
            </label>

            <div className="input-group">

              <input
                type="number"
                min="0"
                step="1"
                name="full_trays"
                className="form-control"
                value={form.full_trays}
                onChange={onChange}
                disabled={saving}
                placeholder="e.g. 20"
              />

              <span className="input-group-text">
                trays
              </span>

            </div>

            <div className="form-text">
              1 tray = {EGGS_PER_TRAY} eggs
            </div>

          </div>

          <div className="col-md-6">

            <label className="form-label">
              Loose Eggs
            </label>

            <div className="input-group">

              <input
                type="number"
                min="0"
                max={EGGS_PER_TRAY - 1}
                step="1"
                name="loose_eggs"
                className="form-control"
                value={form.loose_eggs}
                onChange={onChange}
                disabled={saving}
                placeholder="e.g. 15"
              />

              <span className="input-group-text">
                eggs
              </span>

            </div>

            <div className="form-text">
              0–{EGGS_PER_TRAY - 1} eggs
            </div>

          </div>

          {/* CALCULATION */}

          <div className="col-12">

            <div className="border rounded p-3 bg-light">

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">
                  Full trays
                </span>

                <strong>
                  {calculations.fullTrays}
                </strong>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">
                  Loose eggs
                </span>

                <strong>
                  {calculations.looseEggs}
                </strong>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">

                <strong>
                  Good Eggs Collected
                </strong>

                <strong className="text-success fs-5">
                  {formatNumber(
                    calculations.eggsCollected
                  )} eggs
                </strong>

              </div>

              <div className="d-flex justify-content-between">

                <span className="text-muted">
                  Equivalent
                </span>

                <strong>
                  {formatTrays(
                    calculations.equivalentTrays
                  )} trays
                </strong>

              </div>

            </div>

          </div>

          {/* BROKEN */}

          <div className="col-md-6">

            <label className="form-label">
              Broken Eggs
            </label>

            <div className="input-group">

              <input
                type="number"
                min="0"
                step="1"
                name="broken_eggs"
                className="form-control"
                value={form.broken_eggs}
                onChange={onChange}
                disabled={saving}
                placeholder="0"
              />

              <span className="input-group-text">
                eggs
              </span>

            </div>

            <div className="form-text">
              Not added to sellable inventory.
            </div>

          </div>

          {/* REJECTED */}

          <div className="col-md-6">

            <label className="form-label">
              Rejected Eggs
            </label>

            <div className="input-group">

              <input
                type="number"
                min="0"
                step="1"
                name="rejected_eggs"
                className="form-control"
                value={form.rejected_eggs}
                onChange={onChange}
                disabled={saving}
                placeholder="0"
              />

              <span className="input-group-text">
                eggs
              </span>

            </div>

            <div className="form-text">
              Not added to sellable inventory.
            </div>

          </div>

          {/* SUMMARY */}

          <div className="col-12">

            <div className="alert alert-success mb-0">

              <div className="d-flex justify-content-between">
                <span>Good eggs:</span>

                <strong>
                  {formatNumber(
                    calculations.eggsCollected
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between">
                <span>Broken:</span>

                <strong>
                  {formatNumber(
                    calculations.brokenEggs
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between">
                <span>Rejected:</span>

                <strong>
                  {formatNumber(
                    calculations.rejectedEggs
                  )}
                </strong>
              </div>

              <hr />

              <div className="d-flex justify-content-between">

                <strong>
                  Total Eggs Collected
                </strong>

                <strong>
                  {formatNumber(
                    calculations.totalPhysicallyCollected
                  )}
                </strong>

              </div>

            </div>

          </div>

          {/* NOTES */}

          <div className="col-12">

            <label className="form-label">
              Notes
            </label>

            <textarea
              name="notes"
              rows="3"
              className="form-control"
              value={form.notes}
              onChange={onChange}
              placeholder="Optional notes..."
              disabled={saving}
            />

          </div>

        </div>

      </Modal.Body>

      <Modal.Footer>

        <Button
          variant="light"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="success"
          onClick={onSave}
          disabled={
            saving ||
            flocks.length === 0
          }
        >

          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2" />

              {editingId
                ? "Update Record"
                : "Save Record"}
            </>
          )}

        </Button>

      </Modal.Footer>

    </Modal>
  );
}