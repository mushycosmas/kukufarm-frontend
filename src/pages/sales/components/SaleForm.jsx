import React from "react";

import {
  calculateItemTotal,
  formatMoney,
  getPaymentStatusLabel,
} from "../utils/salesHelpers";

export default function SaleForm({
  form = {},
  editingId,
  customers = [],
  loadingCustomers = false,
  saving = false,

  subtotal = 0,
  discount = 0,
  total = 0,
  amountPaid = 0,
  balance = 0,
  paymentStatus = "unpaid",

  totalEggsInForm = 0,
  eggStock = 0,
  eggStockError = "",
  hasEnoughEggStock = true,
  remainingEggStock = 0,

  onFormChange,
  onPaymentMethodChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onReset,
}) {
  // IMPORTANT:
  // Never call .map() directly on form.items.
  // This prevents the "Cannot read properties of undefined" error.
  const items = Array.isArray(form?.items)
    ? form.items
    : [];

  const safeCustomers = Array.isArray(customers)
    ? customers
    : [];

  const safeForm = {
    date: form?.date || "",
    customer: form?.customer || "",
    invoice_no: form?.invoice_no || "",
    payment_method:
      form?.payment_method || "cash",
    amount_paid: form?.amount_paid ?? "",
    discount: form?.discount ?? "",
    notes: form?.notes || "",
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              {editingId
                ? "Edit Sale"
                : "Create New Sale"}
            </h5>

            <small className="text-muted">
              Record farm products, eggs,
              payments and customer balances.
            </small>
          </div>

          {editingId && (
            <span className="badge bg-warning text-dark">
              Editing Sale
            </span>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="card-body">
          {/* ==================================================
              BASIC SALE INFORMATION
          ================================================== */}

          <div className="row g-3 mb-4">
            {/* Date */}

            <div className="col-md-3">
              <label className="form-label">
                Sale Date
                <span className="text-danger">
                  {" "}
                  *
                </span>
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={safeForm.date}
                onChange={onFormChange}
                required
              />
            </div>

            {/* Invoice */}

            <div className="col-md-3">
              <label className="form-label">
                Invoice
              </label>

              <input
                type="text"
                className="form-control"
                value={
                  safeForm.invoice_no ||
                  "Auto-generated"
                }
                disabled
                readOnly
              />
            </div>

            {/* Customer */}

            <div className="col-md-3">
              <label className="form-label">
                Customer
              </label>

              <select
                name="customer"
                className="form-select"
                value={safeForm.customer}
                onChange={onFormChange}
              >
                <option value="">
                  Walk-in Customer
                </option>

                {loadingCustomers ? (
                  <option disabled>
                    Loading customers...
                  </option>
                ) : (
                  safeCustomers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name ||
                          customer.customer_name ||
                          `Customer #${customer.id}`}
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            {/* Payment Method */}

            <div className="col-md-3">
              <label className="form-label">
                Payment Method
              </label>

              <select
                name="payment_method"
                className="form-select"
                value={
                  safeForm.payment_method
                }
                onChange={
                  onPaymentMethodChange
                }
              >
                <option value="cash">
                  Cash
                </option>

                <option value="mobile">
                  Mobile Money
                </option>

                <option value="bank">
                  Bank
                </option>

                <option value="credit">
                  Credit
                </option>
              </select>
            </div>
          </div>

          {/* ==================================================
              SALE ITEMS
          ================================================== */}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="mb-1">
                Sale Items
              </h6>

              <small className="text-muted">
                Add eggs, chicken or other
                farm products.
              </small>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={onAddItem}
            >
              <i className="bi bi-plus-circle me-1" />
              Add Item
            </button>
          </div>

          <div className="table-responsive mb-3">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: "220px" }}>
                    Product
                  </th>

                  <th style={{ minWidth: "120px" }}>
                    Egg Item
                  </th>

                  <th style={{ minWidth: "120px" }}>
                    Unit
                  </th>

                  <th style={{ minWidth: "120px" }}>
                    Quantity
                  </th>

                  <th style={{ minWidth: "150px" }}>
                    Unit Price
                  </th>

                  <th style={{ minWidth: "150px" }}>
                    Total
                  </th>

                  <th
                    style={{
                      width: "60px",
                    }}
                  >
                    #
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-4"
                    >
                      No sale items added.
                      Click{" "}
                      <strong>
                        Add Item
                      </strong>{" "}
                      to add a product.
                    </td>
                  </tr>
                ) : (
                  items.map(
                    (item, index) => {
                      const safeItem =
                        item || {};

                      return (
                        <tr
                          key={
                            safeItem.id ||
                            index
                          }
                        >
                          {/* Product */}

                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Eggs"
                              value={
                                safeItem.product ||
                                ""
                              }
                              onChange={(event) =>
                                onItemChange(
                                  index,
                                  "product",
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          {/* Egg Item */}

                          <td>
                            <select
                              className="form-select"
                              value={
                                safeItem.is_egg
                                  ? "yes"
                                  : "no"
                              }
                              onChange={(event) =>
                                onItemChange(
                                  index,
                                  "is_egg",
                                  event.target.value ===
                                    "yes"
                                )
                              }
                            >
                              <option value="no">
                                No
                              </option>

                              <option value="yes">
                                Yes
                              </option>
                            </select>
                          </td>

                          {/* Unit */}

                          <td>
                            <select
                              className="form-select"
                              value={
                                safeItem.unit ||
                                "piece"
                              }
                              onChange={(event) =>
                                onItemChange(
                                  index,
                                  "unit",
                                  event.target.value
                                )
                              }
                            >
                              <option value="piece">
                                Piece
                              </option>

                              <option value="tray">
                                Tray
                              </option>
                            </select>
                          </td>

                          {/* Quantity */}

                          <td>
                            <input
                              type="number"
                              min="0"
                              step={
                                safeItem.unit ===
                                "tray"
                                  ? "1"
                                  : "0.01"
                              }
                              className="form-control"
                              value={
                                safeItem.quantity ??
                                ""
                              }
                              onChange={(event) =>
                                onItemChange(
                                  index,
                                  "quantity",
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          {/* Unit Price */}

                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control"
                              value={
                                safeItem.unit_price ??
                                ""
                              }
                              onChange={(event) =>
                                onItemChange(
                                  index,
                                  "unit_price",
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          {/* Total */}

                          <td className="text-end fw-semibold">
                            TZS{" "}
                            {formatMoney(
                              calculateItemTotal(
                                safeItem
                              )
                            )}
                          </td>

                          {/* Remove */}

                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                onRemoveItem(
                                  index
                                )
                              }
                              disabled={
                                items.length ===
                                1
                              }
                              title="Remove item"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              EGG STOCK WARNING
          ================================================== */}

          {totalEggsInForm > 0 && (
            <div
              className={`alert ${
                hasEnoughEggStock
                  ? "alert-success"
                  : "alert-danger"
              }`}
            >
              <div className="d-flex align-items-start">
                <i
                  className={`bi ${
                    hasEnoughEggStock
                      ? "bi-check-circle-fill"
                      : "bi-exclamation-triangle-fill"
                  } me-2 fs-5`}
                />

                <div>
                  <div className="fw-semibold">
                    Egg Stock Validation
                  </div>

                  <div className="small">
                    Requested:{" "}
                    <strong>
                      {formatMoney(
                        totalEggsInForm
                      )}
                    </strong>{" "}
                    eggs
                  </div>

                  <div className="small">
                    Available:{" "}
                    <strong>
                      {formatMoney(
                        eggStock
                      )}
                    </strong>{" "}
                    eggs
                  </div>

                  {hasEnoughEggStock ? (
                    <div className="small">
                      Remaining after sale:{" "}
                      <strong>
                        {formatMoney(
                          remainingEggStock
                        )}
                      </strong>{" "}
                      eggs
                    </div>
                  ) : (
                    <div className="small fw-semibold">
                      Insufficient egg stock.
                      This sale cannot be
                      saved.
                    </div>
                  )}

                  {eggStockError && (
                    <div className="small text-danger mt-1">
                      {eggStockError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              DISCOUNT / PAYMENT
          ================================================== */}

          <div className="row g-3">
            {/* Discount */}

            <div className="col-md-4">
              <label className="form-label">
                Discount
              </label>

              <input
                type="number"
                name="discount"
                min="0"
                step="0.01"
                className="form-control"
                value={safeForm.discount}
                onChange={onFormChange}
                placeholder="0"
              />
            </div>

            {/* Initial Payment */}

            <div className="col-md-4">
              <label className="form-label">
                Initial Amount Paid
              </label>

              <input
                type="number"
                name="amount_paid"
                min="0"
                step="0.01"
                className="form-control"
                value={safeForm.amount_paid}
                onChange={onFormChange}
                disabled={
                  Boolean(editingId) ||
                  safeForm.payment_method ===
                    "credit"
                }
                placeholder="0"
              />

              {editingId && (
                <div className="form-text">
                  Use Receive Payment to
                  record additional payments.
                </div>
              )}

              {!editingId &&
                safeForm.payment_method ===
                  "credit" && (
                  <div className="form-text">
                    Credit sales start with
                    zero initial payment.
                  </div>
                )}
            </div>

            {/* Payment Status */}

            <div className="col-md-4">
              <label className="form-label">
                Payment Status
              </label>

              <div className="form-control bg-light">
                <span
                  className={`badge ${
                    paymentStatus === "paid"
                      ? "bg-success"
                      : paymentStatus ===
                        "partial"
                      ? "bg-warning text-dark"
                      : "bg-danger"
                  }`}
                >
                  {getPaymentStatusLabel(
                    paymentStatus
                  )}
                </span>
              </div>
            </div>

            {/* Notes */}

            <div className="col-12">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="3"
                value={safeForm.notes}
                onChange={onFormChange}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* ==================================================
              TOTALS
          ================================================== */}

          <div className="row justify-content-end mt-4">
            <div className="col-md-5">
              <div className="border rounded p-3 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    TZS{" "}
                    {formatMoney(
                      subtotal
                    )}
                  </strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>
                    Discount
                  </span>

                  <strong className="text-danger">
                    - TZS{" "}
                    {formatMoney(
                      discount
                    )}
                  </strong>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold">
                    Total
                  </span>

                  <strong className="fs-5">
                    TZS{" "}
                    {formatMoney(
                      total
                    )}
                  </strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>
                    Paid
                  </span>

                  <strong className="text-success">
                    TZS{" "}
                    {formatMoney(
                      amountPaid
                    )}
                  </strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="fw-bold">
                    Balance
                  </span>

                  <strong
                    className={
                      balance > 0
                        ? "text-danger"
                        : "text-success"
                    }
                  >
                    TZS{" "}
                    {formatMoney(
                      balance
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="card-footer bg-white d-flex justify-content-end gap-2 py-3">
          <button
            type="button"
            className="btn btn-light border"
            onClick={onReset}
            disabled={saving}
          >
            <i className="bi bi-x-circle me-1" />
            Clear
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              saving ||
              !hasEnoughEggStock
            }
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
                <i className="bi bi-save me-1" />

                {editingId
                  ? "Update Sale"
                  : "Save Sale"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}