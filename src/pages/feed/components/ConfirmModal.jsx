import React from "react";

export default function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{
          zIndex: 1050,
        }}
      />

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{
          zIndex: 1060,
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {title}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                disabled={loading}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0">
                {message}
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}