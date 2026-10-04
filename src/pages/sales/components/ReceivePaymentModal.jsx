// ============================================================
// RECEIVE PAYMENT MODAL
// ============================================================

import React from "react";

// ============================================================
// LOCAL MONEY FORMATTER
// ============================================================

const formatMoney = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  });
};

// ============================================================
// HELPERS
// ============================================================

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const getInvoiceNumber = (sale) => {
  if (!sale) {
    return "-";
  }

  return (
    sale.invoice_no ||
    sale.invoice ||
    sale.invoice_number ||
    `SALE-${sale.id || "-"}`
  );
};

const getCustomerName = (sale) => {
  if (!sale) {
    return "Walk-in Customer";
  }

  if (sale.customer_name) {
    return sale.customer_name;
  }

  if (
    sale.customer &&
    typeof sale.customer === "object"
  ) {
    return (
      sale.customer.name ||
      sale.customer.full_name ||
      "Walk-in Customer"
    );
  }

  if (
    typeof sale.customer === "string"
  ) {
    return sale.customer;
  }

  return "Walk-in Customer";
};

// ============================================================
// COMPONENT
// ============================================================

export default function ReceivePaymentModal({
  paymentSale = null,
  paymentForm = {},
  savingPayment = false,

  onClose,
  onChange,
  onSubmit,

  getSalePaid,
  getSaleBalance,
}) {
  // ----------------------------------------------------------
  // Do not render if no sale selected
  // ----------------------------------------------------------

  if (!paymentSale) {
    return null;
  }

  // ----------------------------------------------------------
  // Sale values
  // ----------------------------------------------------------

  const saleTotal = toNumber(
    paymentSale.total ??
      paymentSale.grand_total ??
      paymentSale.total_amount
  );

  const paid =
    typeof getSalePaid === "function"
      ? toNumber(
          getSalePaid(paymentSale)
        )
      : toNumber(
          paymentSale.amount_paid
        );

  const balance =
    typeof getSaleBalance ===
    "function"
      ? Math.max(
          0,
          toNumber(
            getSaleBalance(paymentSale)
          )
        )
      : Math.max(
          0,
          saleTotal - paid
        );

  const enteredAmount = toNumber(
    paymentForm?.amount
  );

  const remainingAfterPayment =
    Math.max(
      0,
      balance - enteredAmount
    );

  const invoiceNumber =
    getInvoiceNumber(paymentSale);

  const customerName =
    getCustomerName(paymentSale);

  // ----------------------------------------------------------
  // Form change helper
  // ----------------------------------------------------------

  const handleChange = (event) => {
    if (typeof onChange === "function") {
      onChange(event);
    }
  };

  // ----------------------------------------------------------
  // Submit helper
  // ----------------------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      typeof onSubmit === "function"
    ) {
      onSubmit(event);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{
        backgroundColor:
          "rgba(0, 0, 0, 0.55)",
        zIndex: 1055,
      }}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        role="document"
      >
        <div className="modal-content border-0 shadow">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-cash-coin me-2"></i>

                Receive Payment
              </h5>

              <div className="small text-muted mt-1">
                {invoiceNumber} ·{" "}
                {customerName}
              </div>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              disabled={savingPayment}
              onClick={onClose}
            ></button>
          </div>

          {/* ==================================================
              BODY
          ================================================== */}

          <form
            onSubmit={handleSubmit}
          >
            <div className="modal-body">
              {/* ================================================
                  SALE SUMMARY
              ================================================= */}

              <div className="row g-3 mb-4">
                {/* Sale Total */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 bg-light">
                    <div className="card-body">
                      <small className="text-muted d-block">
                        Sale Total
                      </small>

                      <h5 className="mb-0 fw-bold">
                        TZS{" "}
                        {formatMoney(
                          saleTotal
                        )}
                      </h5>
                    </div>
                  </div>
                </div>

                {/* Paid */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 bg-success-subtle">
                    <div className="card-body">
                      <small className="text-muted d-block">
                        Already Paid
                      </small>

                      <h5 className="mb-0 fw-bold text-success">
                        TZS{" "}
                        {formatMoney(
                          paid
                        )}
                      </h5>
                    </div>
                  </div>
                </div>

                {/* Outstanding */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 bg-danger-subtle">
                    <div className="card-body">
                      <small className="text-muted d-block">
                        Outstanding
                      </small>

                      <h5 className="mb-0 fw-bold text-danger">
                        TZS{" "}
                        {formatMoney(
                          balance
                        )}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================
                  PAYMENT DETAILS
              ================================================= */}

              <div className="row g-3">
                {/* Date */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={
                      paymentForm?.date ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      savingPayment
                    }
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    className="form-select"
                    value={
                      paymentForm?.payment_method ||
                      "cash"
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      savingPayment
                    }
                    required
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
                  </select>
                </div>

                {/* Amount */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Payment Amount
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">
                      TZS
                    </span>

                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      value={
                        paymentForm?.amount ??
                        ""
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      max={balance}
                      step="0.01"
                      placeholder="Enter payment amount"
                      disabled={
                        savingPayment
                      }
                      required
                    />
                  </div>

                  <small className="text-muted">
                    Maximum payment:
                    {" "}
                    TZS{" "}
                    {formatMoney(
                      balance
                    )}
                  </small>
                </div>

                {/* Reference */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Reference
                    <span className="text-muted fw-normal">
                      {" "}
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    name="reference"
                    className="form-control"
                    value={
                      paymentForm?.reference ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Transaction reference"
                    disabled={
                      savingPayment
                    }
                  />
                </div>

                {/* Notes */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Notes
                    <span className="text-muted fw-normal">
                      {" "}
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    name="notes"
                    className="form-control"
                    rows="3"
                    value={
                      paymentForm?.notes ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Payment notes..."
                    disabled={
                      savingPayment
                    }
                  ></textarea>
                </div>
              </div>

              {/* ================================================
                  PAYMENT PREVIEW
              ================================================= */}

              {enteredAmount > 0 && (
                <div className="alert alert-info mt-4 mb-0">
                  <div className="d-flex justify-content-between">
                    <span>
                      Payment:
                    </span>

                    <strong>
                      TZS{" "}
                      {formatMoney(
                        enteredAmount
                      )}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mt-1">
                    <span>
                      Remaining balance:
                    </span>

                    <strong>
                      TZS{" "}
                      {formatMoney(
                        remainingAfterPayment
                      )}
                    </strong>
                  </div>
                </div>
              )}

              {/* Full payment warning */}
              {enteredAmount > 0 &&
                enteredAmount >=
                  balance && (
                  <div className="alert alert-success mt-3 mb-0">
                    <i className="bi bi-check-circle me-2"></i>

                    This payment will fully
                    settle the outstanding
                    balance.
                  </div>
                )}
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={
                  savingPayment
                }
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-success"
                disabled={
                  savingPayment ||
                  balance <= 0 ||
                  enteredAmount <= 0 ||
                  enteredAmount > balance
                }
              >
                {savingPayment ? (
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
                    <i className="bi bi-check-circle me-1"></i>

                    Receive Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}