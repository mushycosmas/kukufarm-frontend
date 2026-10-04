import React from "react";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "../constants/expenseConstants";

export default function ExpenseForm({
  form,
  setForm,
  editingId,
  saving,
  onSubmit,
  onCancel,
}) {
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="form-card mb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          {editingId ? "Edit Expense" : "Record Expense"}
        </h5>

        {editingId && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            <i className="bi bi-x-lg me-1" />
            Cancel Edit
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit}>
        <div className="row g-3">

          {/* Date */}
          <div className="col-md-3">
            <label className="form-label">
              Date
            </label>

            <input
              type="date"
              className="form-control"
              value={form.date}
              onChange={(e) =>
                updateField("date", e.target.value)
              }
              required
              disabled={saving}
            />
          </div>

          {/* Category */}
          <div className="col-md-3">
            <label className="form-label">
              Category
            </label>

            <select
              className="form-select"
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value)
              }
              required
              disabled={saving}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-md-3">
            <label className="form-label">
              Description
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. Feed purchase"
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value
                )
              }
              required
              disabled={saving}
            />
          </div>

          {/* Amount */}
          <div className="col-md-3">
            <label className="form-label">
              Amount (TZS)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              placeholder="0"
              value={form.amount}
              onChange={(e) =>
                updateField(
                  "amount",
                  e.target.value
                )
              }
              required
              disabled={saving}
            />
          </div>

          {/* Payment Method */}
          <div className="col-md-3">
            <label className="form-label">
              Payment Method
            </label>

            <select
              className="form-select"
              value={form.payment}
              onChange={(e) =>
                updateField(
                  "payment",
                  e.target.value
                )
              }
              disabled={saving}
            >
              {PAYMENT_METHODS.map((method) => (
                <option
                  key={method.value}
                  value={method.value}
                >
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="col-12">
            <button
              type="submit"
              className="btn btn-success"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <i
                    className={`bi ${
                      editingId
                        ? "bi-check-lg"
                        : "bi-plus-lg"
                    } me-2`}
                  />

                  {editingId
                    ? "Update Expense"
                    : "Save Expense"}
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-light ms-2"
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
  );
}