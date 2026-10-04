import React from "react";
import {
  formatMoney,
  getTransactionPaymentMethodLabel,
} from "../utils/salesHelpers";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDate = (date) => {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

const getInvoiceNumber = (sale) => {
  return (
    sale?.invoice_no ||
    sale?.invoice ||
    sale?.invoice_number ||
    `SALE-${sale?.id || "-"}`
  );
};

const getCustomerName = (sale) => {
  if (!sale) return "Walk-in Customer";

  if (sale.customer_name) {
    return sale.customer_name;
  }

  if (sale.customer?.name) {
    return sale.customer.name;
  }

  if (typeof sale.customer === "string") {
    return sale.customer;
  }

  return "Walk-in Customer";
};

export default function PaymentHistoryModal({
  paymentHistorySale = null,
  paymentHistory = [],
  loadingPaymentHistory = false,
  totalPaid = 0,
  outstanding = 0,
  onClose,
  onReceivePayment,
}) {
  if (!paymentHistorySale) {
    return null;
  }

  const safePayments = Array.isArray(paymentHistory)
    ? paymentHistory
    : [];

  const saleTotal = toNumber(
    paymentHistorySale.total ??
      paymentHistorySale.grand_total ??
      paymentHistorySale.total_amount
  );

  const safeTotalPaid = toNumber(totalPaid);
  const safeOutstanding = Math.max(0, toNumber(outstanding));

  const invoiceNumber = getInvoiceNumber(paymentHistorySale);
  const customerName = getCustomerName(paymentHistorySale);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 1055,
      }}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        role="document"
      >
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-clock-history me-2"></i>
                Payment History
              </h5>

              <div className="small text-muted mt-1">
                {invoiceNumber} · {customerName}
              </div>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          {/* Summary */}
          <div className="modal-body">
            <div className="row g-3 mb-4">
              {/* Sale Total */}
              <div className="col-md-4">
                <div className="card h-100 border-0 bg-light">
                  <div className="card-body">
                    <small className="text-muted d-block">
                      Sale Total
                    </small>

                    <h5 className="mb-0 fw-bold">
                      {formatMoney(saleTotal)}
                    </h5>
                  </div>
                </div>
              </div>

              {/* Total Paid */}
              <div className="col-md-4">
                <div className="card h-100 border-0 bg-success-subtle">
                  <div className="card-body">
                    <small className="text-muted d-block">
                      Total Paid
                    </small>

                    <h5 className="mb-0 fw-bold text-success">
                      {formatMoney(safeTotalPaid)}
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
                      {formatMoney(safeOutstanding)}
                    </h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">
                Payment Transactions
              </h6>

              {safeOutstanding > 0 && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={onReceivePayment}
                >
                  <i className="bi bi-cash-coin me-1"></i>
                  Receive Payment
                </button>
              )}
            </div>

            {loadingPaymentHistory ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>

                <div className="text-muted mt-2">
                  Loading payment history...
                </div>
              </div>
            ) : safePayments.length === 0 ? (
              <div className="text-center py-5 border rounded">
                <i className="bi bi-cash-stack display-6 text-muted"></i>

                <h6 className="mt-3 text-muted">
                  No payment transactions found
                </h6>

                <p className="text-muted mb-0 small">
                  No recorded payment transactions are available
                  for this sale.
                </p>

                {safeOutstanding > 0 && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-3"
                    onClick={onReceivePayment}
                  >
                    <i className="bi bi-cash-coin me-1"></i>
                    Receive Payment
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive border rounded">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      <th>Reference</th>
                      <th>Notes</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {safePayments.map((payment, index) => {
                      const amount = toNumber(payment.amount);

                      return (
                        <tr
                          key={
                            payment.id ||
                            `payment-${paymentHistorySale.id}-${index}`
                          }
                        >
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {formatDate(payment.date)}
                          </td>

                          <td>
                            <span className="badge bg-light text-dark border">
                              {getTransactionPaymentMethodLabel(
                                payment.payment_method
                              )}
                            </span>
                          </td>

                          <td>
                            {payment.reference ? (
                              <span className="text-muted">
                                {payment.reference}
                              </span>
                            ) : (
                              <span className="text-muted">
                                -
                              </span>
                            )}
                          </td>

                          <td>
                            {payment.notes ? (
                              <span className="text-muted">
                                {payment.notes}
                              </span>
                            ) : (
                              <span className="text-muted">
                                -
                              </span>
                            )}
                          </td>

                          <td className="text-end">
                            <span className="fw-semibold text-success">
                              {formatMoney(amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="table-light">
                    <tr>
                      <th
                        colSpan="5"
                        className="text-end"
                      >
                        Total Recorded Payments:
                      </th>

                      <th className="text-end text-success">
                        {formatMoney(safeTotalPaid)}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-lg me-1"></i>
              Close
            </button>

            {safeOutstanding > 0 && (
              <button
                type="button"
                className="btn btn-success"
                onClick={onReceivePayment}
              >
                <i className="bi bi-cash-coin me-1"></i>
                Receive Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}