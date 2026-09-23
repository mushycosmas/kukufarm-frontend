import React, { useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getDate = (item) => {
  return (
    item?.sale_date ||
    item?.expense_date ||
    item?.date ||
    item?.transaction_date ||
    item?.created_at ||
    item?.created ||
    null
  );
};

const getAmount = (item) => {
  return toNumber(
    item?.total_amount ??
      item?.amount ??
      item?.total ??
      item?.grand_total ??
      item?.net_amount ??
      item?.price ??
      0
  );
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatMonth = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
};

const formatTZS = (value) => {
  return `TZS ${Number(value || 0).toLocaleString()}`;
};

const formatAxisValue = (value) => {
  const number = Number(value || 0);

  if (number >= 1000000) {
    const millions = number / 1000000;

    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }

  if (number >= 1000) {
    const thousands = number / 1000;

    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K`;
  }

  return number.toLocaleString();
};

export default function SalesExpenseChart({
  sales = [],
  expenses = [],
}) {
  const [period, setPeriod] = useState("7");

  const chartData = useMemo(() => {
    const days = Number(period);
    const today = new Date();

    const result = [];

    /*
     * Create one entry for every day in the selected period.
     */
    for (let index = days - 1; index >= 0; index--) {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - index);

      result.push({
        date: formatDateKey(date),
        month: formatMonth(date),
        sales: 0,
        expenses: 0,
      });
    }

    /*
     * Add sales to their respective dates.
     */
    sales.forEach((item) => {
      const transactionDate = getDate(item);

      if (!transactionDate) {
        return;
      }

      const date = new Date(transactionDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dateKey = formatDateKey(date);

      const target = result.find(
        (entry) => entry.date === dateKey
      );

      if (!target) {
        return;
      }

      target.sales += getAmount(item);
    });

    /*
     * Add expenses to their respective dates.
     */
    expenses.forEach((item) => {
      const transactionDate = getDate(item);

      if (!transactionDate) {
        return;
      }

      const date = new Date(transactionDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dateKey = formatDateKey(date);

      const target = result.find(
        (entry) => entry.date === dateKey
      );

      if (!target) {
        return;
      }

      target.expenses += getAmount(item);
    });

    return result;
  }, [sales, expenses, period]);

  const totalSales = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + item.sales,
      0
    );
  }, [chartData]);

  const totalExpenses = useMemo(() => {
    return chartData.reduce(
      (total, item) => total + item.expenses,
      0
    );
  }, [chartData]);

  const netAmount = totalSales - totalExpenses;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div
        className="bg-white border rounded shadow-sm px-3 py-2"
        style={{ minWidth: "180px" }}
      >
        <div className="fw-semibold mb-2">
          {label}
        </div>

        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="d-flex justify-content-between gap-3"
          >
            <span>{item.name}</span>

            <strong>
              {formatTZS(item.value)}
            </strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <h5>Sales vs Expenses</h5>

          <span>
            Daily financial performance for the last{" "}
            {period} days
          </span>
        </div>

        <select
          className="form-select form-select-sm"
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value)
          }
          style={{ width: "150px" }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      <div className="d-flex gap-4 mb-3">
        <div>
          <small className="text-muted d-block">
            Total Sales
          </small>

          <strong>
            {formatTZS(totalSales)}
          </strong>
        </div>

        <div>
          <small className="text-muted d-block">
            Total Expenses
          </small>

          <strong>
            {formatTZS(totalExpenses)}
          </strong>
        </div>

        <div>
          <small className="text-muted d-block">
            Net
          </small>

          <strong
            className={
              netAmount >= 0
                ? "text-success"
                : "text-danger"
            }
          >
            {formatTZS(netAmount)}
          </strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 15,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisValue}
          />

          <Tooltip
            content={<CustomTooltip />}
          />

          <Legend />

          <Bar
            dataKey="sales"
            name="Sales"
            fill="#198754"
            radius={[5, 5, 0, 0]}
          />

          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#dc3545"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}