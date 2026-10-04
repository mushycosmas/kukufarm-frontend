import React from "react";
import { formatMoney } from "../utils/expenseUtils";

export default function ExpenseSummary({
  totalExpenses,
  recordCount,
  visibleExpenses,
}) {
  return (
    <div className="row g-3 mb-4">

      <div className="col-md-4">
        <div className="summary-card">
          <div className="summary-card-icon">
            <i className="bi bi-cash-stack" />
          </div>

          <div>
            <div className="summary-card-label">
              Total Expenses
            </div>

            <div className="summary-card-value">
              {formatMoney(totalExpenses)}
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="summary-card">
          <div className="summary-card-icon">
            <i className="bi bi-receipt" />
          </div>

          <div>
            <div className="summary-card-label">
              Expense Records
            </div>

            <div className="summary-card-value">
              {recordCount}
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="summary-card">
          <div className="summary-card-icon">
            <i className="bi bi-filter-circle" />
          </div>

          <div>
            <div className="summary-card-label">
              Displayed Amount
            </div>

            <div className="summary-card-value">
              {formatMoney(visibleExpenses)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}