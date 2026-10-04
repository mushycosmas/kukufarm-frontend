import React from "react";
import { PAYMENT_METHODS } from "../constants/expenseConstants";
import {
  formatMoney,
  getPaymentLabel,
} from "../utils/expenseUtils";

export default function ExpenseTable({
  expenses,
  loading,
  search,
  setSearch,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-card">

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">

        <div>
          <h5 className="mb-1">
            Expense Records
          </h5>

          <small className="text-muted">
            {expenses.length} record
            {expenses.length === 1 ? "" : "s"}
          </small>
        </div>

        <div style={{ minWidth: "280px" }}>
          <div className="input-group">

            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>

            <input
              type="text"
              className="form-control"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearch("")}
              >
                <i className="bi bi-x-lg" />
              </button>
            )}

          </div>
        </div>

      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0">

          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Payment</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-5"
                >
                  <div className="spinner-border text-success" />
                  <div className="mt-2 text-muted">
                    Loading expenses...
                  </div>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-5 text-muted"
                >
                  <i className="bi bi-receipt fs-2 d-block mb-2" />
                  {search
                    ? "No expenses match your search."
                    : "No expense records found."}
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>

                  <td>{expense.date}</td>

                  <td>
                    <span className="badge bg-light text-dark">
                      {expense.category}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {expense.description || "-"}
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {formatMoney(expense.amount)}
                    </strong>
                  </td>

                  <td>
                    {getPaymentLabel(
                      expense.payment ||
                        expense.payment_method,
                      PAYMENT_METHODS
                    )}
                  </td>

                  <td className="text-end">

                    <button
                      type="button"
                      className="btn btn-sm btn-light me-1"
                      onClick={() => onEdit(expense)}
                    >
                      <i className="bi bi-pencil" />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => onDelete(expense)}
                    >
                      <i className="bi bi-trash" />
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}