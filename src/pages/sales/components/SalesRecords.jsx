import React from "react";
import {
  formatMoney,
  getPaymentStatusClass,
  getPaymentStatusLabel,
} from "../utils/salesHelpers";

const EGGS_PER_TRAY = 30;

/**
 * Safely convert a value to a number.
 */
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/**
 * Calculate egg quantity for a sale item.
 *
 * Supports:
 * - piece
 * - tray
 *
 * 1 tray = 30 eggs
 */
const calculateEggQuantity = (item) => {
  if (!item || !item.is_egg) {
    return 0;
  }

  const quantity = toNumber(item.quantity);

  if (item.unit === "tray") {
    return quantity * EGGS_PER_TRAY;
  }

  return quantity;
};

/**
 * Safely calculate item total.
 */
const calculateItemTotal = (item) => {
  if (!item) return 0;

  const quantity = toNumber(item.quantity);
  const unitPrice = toNumber(item.unit_price);

  return quantity * unitPrice;
};

/**
 * Get sale items safely.
 */
const getSaleItems = (sale) => {
  if (!sale) return [];

  if (Array.isArray(sale.items)) {
    return sale.items;
  }

  if (Array.isArray(sale.sale_items)) {
    return sale.sale_items;
  }

  if (Array.isArray(sale.details)) {
    return sale.details;
  }

  return [];
};

/**
 * Get product name safely.
 */
const getProductName = (item) => {
  if (!item) return "-";

  if (typeof item.product === "string") {
    return item.product;
  }

  if (item.product_name) {
    return item.product_name;
  }

  if (item.product?.name) {
    return item.product.name;
  }

  if (item.name) {
    return item.name;
  }

  return "-";
};

/**
 * Get sale invoice number safely.
 */
const getInvoiceNumber = (sale) => {
  return (
    sale?.invoice_no ||
    sale?.invoice ||
    sale?.invoice_number ||
    `SALE-${sale?.id || "-"}`
  );
};

/**
 * Get customer display name safely.
 */
const getCustomerDisplayName = (sale, getCustomerName) => {
  if (typeof getCustomerName === "function") {
    return getCustomerName(sale);
  }

  if (sale?.customer_name) {
    return sale.customer_name;
  }

  if (sale?.customer?.name) {
    return sale.customer.name;
  }

  if (typeof sale?.customer === "string") {
    return sale.customer;
  }

  return "Walk-in Customer";
};

/**
 * Get sale total safely.
 */
const getSaleTotal = (sale) => {
  if (!sale) return 0;

  if (sale.total !== undefined && sale.total !== null) {
    return toNumber(sale.total);
  }

  if (sale.grand_total !== undefined && sale.grand_total !== null) {
    return toNumber(sale.grand_total);
  }

  if (sale.total_amount !== undefined && sale.total_amount !== null) {
    return toNumber(sale.total_amount);
  }

  const items = getSaleItems(sale);

  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const discount = toNumber(sale.discount);

  return Math.max(0, subtotal - discount);
};

/**
 * Get sale date safely.
 */
const formatSaleDate = (date) => {
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

export default function SalesRecords({
  loading = false,
  sales = [],
  search = "",
  onSearchChange,

  getCustomerName,
  getSalePaid,
  getSaleBalance,
  getSaleStatus,

  onReceivePayment,
  onPaymentHistory,
  onEdit,
  onDelete,

  deletingId = null,
  editingId = null,
}) {
  const safeSales = Array.isArray(sales) ? sales : [];

  /**
   * Calculate total eggs sold across a sale.
   */
  const getSaleEggQuantity = (sale) => {
    const items = getSaleItems(sale);

    return items.reduce(
      (total, item) => total + calculateEggQuantity(item),
      0
    );
  };

  /**
   * Calculate total trays sold across a sale.
   */
  const getSaleTrays = (sale) => {
    const items = getSaleItems(sale);

    return items.reduce((total, item) => {
      if (!item?.is_egg) return total;

      const quantity = toNumber(item.quantity);

      if (item.unit === "tray") {
        return total + quantity;
      }

      return total + quantity / EGGS_PER_TRAY;
    }, 0);
  };

  return (
    <div className="card border-0 shadow-sm">
      {/* Header */}
      <div className="card-header bg-white border-bottom">
        <div className="row align-items-center g-3">
          <div className="col-md-6">
            <h5 className="mb-1 fw-bold">
              <i className="bi bi-receipt me-2"></i>
              Sales Records
            </h5>

            <small className="text-muted">
              {safeSales.length} sale
              {safeSales.length === 1 ? "" : "s"} found
            </small>
          </div>

          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search invoice, customer, product..."
                value={search || ""}
                onChange={(e) => {
                  if (typeof onSearchChange === "function") {
                    onSearchChange(e.target.value);
                  }
                }}
              />

              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    if (typeof onSearchChange === "function") {
                      onSearchChange("");
                    }
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
            aria-hidden="true"
          ></div>

          <div className="mt-3 text-muted">
            Loading sales records...
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && safeSales.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-receipt display-4 text-muted"></i>
          </div>

          <h5 className="text-muted">No sales records found</h5>

          {search ? (
            <p className="text-muted mb-0">
              No sales match your search.
            </p>
          ) : (
            <p className="text-muted mb-0">
              Create your first sale using the form above.
            </p>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && safeSales.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Eggs</th>
                <th className="text-end">Total</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {safeSales.map((sale) => {
                const items = getSaleItems(sale);

                const total = getSaleTotal(sale);

                const paid =
                  typeof getSalePaid === "function"
                    ? toNumber(getSalePaid(sale))
                    : toNumber(sale.amount_paid);

                const balance =
                  typeof getSaleBalance === "function"
                    ? toNumber(getSaleBalance(sale))
                    : Math.max(0, total - paid);

                const status =
                  typeof getSaleStatus === "function"
                    ? getSaleStatus(sale)
                    : sale.payment_status ||
                      (balance <= 0
                        ? "paid"
                        : paid > 0
                        ? "partial"
                        : "unpaid");

                const customer = getCustomerDisplayName(
                  sale,
                  getCustomerName
                );

                const eggQuantity = getSaleEggQuantity(sale);

                const trays = getSaleTrays(sale);

                return (
                  <tr key={sale.id}>
                    {/* Date */}
                    <td>
                      <span className="text-nowrap">
                        {formatSaleDate(sale.date)}
                      </span>
                    </td>

                    {/* Invoice */}
                    <td>
                      <span className="fw-semibold">
                        {getInvoiceNumber(sale)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="fw-semibold">
                        {customer}
                      </div>

                      {sale.customer?.phone && (
                        <small className="text-muted">
                          {sale.customer.phone}
                        </small>
                      )}
                    </td>

                    {/* Products */}
                    <td>
                      {items.length === 0 ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <div>
                          {items.map((item, index) => {
                            const itemQuantity = toNumber(item.quantity);

                            return (
                              <div
                                key={
                                  item.id ||
                                  `${sale.id}-item-${index}`
                                }
                                className="mb-1"
                              >
                                <span className="fw-medium">
                                  {getProductName(item)}
                                </span>

                                <small className="text-muted ms-1">
                                  ({itemQuantity}{" "}
                                  {item.unit || "piece"})
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Eggs */}
                    <td>
                      {eggQuantity > 0 ? (
                        <div>
                          <span className="fw-semibold">
                            {eggQuantity.toLocaleString()}
                          </span>

                          <small className="text-muted d-block">
                            eggs
                            {trays > 0 && (
                              <>
                                {" "}
                                ·{" "}
                                {trays % 1 === 0
                                  ? trays
                                  : trays.toFixed(2)}{" "}
                                trays
                              </>
                            )}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="text-end">
                      <span className="fw-semibold text-nowrap">
                        {formatMoney(total)}
                      </span>
                    </td>

                    {/* Paid */}
                    <td className="text-end">
                      <span className="text-success text-nowrap">
                        {formatMoney(paid)}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="text-end">
                      <span
                        className={
                          balance > 0
                            ? "text-danger fw-semibold text-nowrap"
                            : "text-success text-nowrap"
                        }
                      >
                        {formatMoney(balance)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`badge ${getPaymentStatusClass(
                          status
                        )}`}
                      >
                        {getPaymentStatusLabel(status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* Receive payment */}
                        {balance > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="Receive Payment"
                            onClick={() => {
                              if (
                                typeof onReceivePayment ===
                                "function"
                              ) {
                                onReceivePayment(sale);
                              }
                            }}
                          >
                            <i className="bi bi-cash-coin"></i>
                          </button>
                        )}

                        {/* Payment history */}
                        <button
                          type="button"
                          className="btn btn-outline-info"
                          title="Payment History"
                          onClick={() => {
                            if (
                              typeof onPaymentHistory ===
                              "function"
                            ) {
                              onPaymentHistory(sale);
                            }
                          }}
                        >
                          <i className="bi bi-clock-history"></i>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="Edit Sale"
                          disabled={
                            editingId === sale.id ||
                            deletingId === sale.id
                          }
                          onClick={() => {
                            if (
                              typeof onEdit === "function"
                            ) {
                              onEdit(sale);
                            }
                          }}
                        >
                          {editingId === sale.id ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : (
                            <i className="bi bi-pencil"></i>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Delete Sale"
                          disabled={
                            deletingId === sale.id ||
                            editingId === sale.id
                          }
                          onClick={() => {
                            if (
                              typeof onDelete === "function"
                            ) {
                              onDelete(sale);
                            }
                          }}
                        >
                          {deletingId === sale.id ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile-friendly footer */}
      {!loading && safeSales.length > 0 && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {safeSales.length} sale
              {safeSales.length === 1 ? "" : "s"}
            </small>

            <small className="text-muted">
              1 tray = {EGGS_PER_TRAY} eggs
            </small>
          </div>
        </div>
      )}
    </div>
  );
}