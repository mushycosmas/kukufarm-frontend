import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import SalesExpenseChart from "../components/dashboard/SalesExpenseChart";
import EggProductionChart from "../components/dashboard/EggProductionChart";
import api from "../services/api";

const toArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const getDate = (item) => {
  return (
    item?.production_date ||
    item?.sale_date ||
    item?.expense_date ||
    item?.date ||
    item?.record_date ||
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
      item?.grand_total ??
      item?.net_amount ??
      item?.total ??
      0
  );
};

const getEggQuantity = (item) => {
  return toNumber(
    item?.total_eggs ??
      item?.eggs_collected ??
      item?.egg_count ??
      item?.quantity ??
      item?.total ??
      0
  );
};

const getFlockId = (item) => {
  if (item?.flock_id !== undefined && item?.flock_id !== null) {
    return String(item.flock_id);
  }

  if (
    item?.flock?.id !== undefined &&
    item?.flock?.id !== null
  ) {
    return String(item.flock.id);
  }

  return null;
};

const getFlockName = (flock) => {
  return (
    flock?.name ||
    flock?.code ||
    flock?.flock_code ||
    `Flock #${flock?.id || ""}`
  );
};

const formatCurrency = (value) => {
  const number = toNumber(value);

  if (number >= 1000000) {
    const millions = number / 1000000;

    return `TZS ${millions % 1 === 0
      ? millions.toFixed(0)
      : millions.toFixed(2)}M`;
  }

  if (number >= 1000) {
    const thousands = number / 1000;

    return `TZS ${thousands % 1 === 0
      ? thousands.toFixed(0)
      : thousands.toFixed(1)}K`;
  }

  return `TZS ${number.toLocaleString()}`;
};

const getMonthKey = (date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const getCurrentMonth = () => {
  const today = new Date();

  return getMonthKey(today);
};

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [eggProduction, setEggProduction] = useState([]);
  const [flocks, setFlocks] = useState([]);

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [selectedFlock, setSelectedFlock] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Load report data.
   */
  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          salesResponse,
          expensesResponse,
          productionResponse,
          flocksResponse,
        ] = await Promise.allSettled([
          api.get("/sales/"),
          api.get("/expenses/"),
          api.get("/production/"),
          api.get("/flocks/"),
        ]);

        if (!mounted) {
          return;
        }

        if (
          salesResponse.status === "fulfilled"
        ) {
          setSales(toArray(salesResponse.value));
        }

        if (
          expensesResponse.status === "fulfilled"
        ) {
          setExpenses(
            toArray(expensesResponse.value)
          );
        }

        if (
          productionResponse.status === "fulfilled"
        ) {
          setEggProduction(
            toArray(productionResponse.value)
          );
        }

        if (
          flocksResponse.status === "fulfilled"
        ) {
          setFlocks(
            toArray(flocksResponse.value)
          );
        }

        const failedRequests = [
          salesResponse,
          expensesResponse,
          productionResponse,
          flocksResponse,
        ].filter(
          (request) =>
            request.status === "rejected"
        );

        if (failedRequests.length > 0) {
          setError(
            "Some report data could not be loaded. Please check the relevant API module."
          );
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Reports loading error:",
          err
        );

        setError(
          "Unable to load report data."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Generate available months from the actual
   * sales, expenses and production data.
   */
  const availableMonths = useMemo(() => {
    const months = new Set();

    [
      ...sales,
      ...expenses,
      ...eggProduction,
    ].forEach((item) => {
      const dateValue = getDate(item);

      if (!dateValue) {
        return;
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      months.add(getMonthKey(date));
    });

    /*
     * Always include the current month.
     */
    months.add(getCurrentMonth());

    return Array.from(months).sort(
      (a, b) => b.localeCompare(a)
    );
  }, [
    sales,
    expenses,
    eggProduction,
  ]);

  /*
   * Filter sales by selected month and flock.
   */
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const dateValue = getDate(item);

      if (!dateValue) {
        return false;
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (
        getMonthKey(date) !== selectedMonth
      ) {
        return false;
      }

      if (selectedFlock === "all") {
        return true;
      }

      return (
        getFlockId(item) ===
        String(selectedFlock)
      );
    });
  }, [
    sales,
    selectedMonth,
    selectedFlock,
  ]);

  /*
   * Filter expenses by selected month and flock.
   */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const dateValue = getDate(item);

      if (!dateValue) {
        return false;
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (
        getMonthKey(date) !== selectedMonth
      ) {
        return false;
      }

      if (selectedFlock === "all") {
        return true;
      }

      return (
        getFlockId(item) ===
        String(selectedFlock)
      );
    });
  }, [
    expenses,
    selectedMonth,
    selectedFlock,
  ]);

  /*
   * Filter egg production.
   */
  const filteredProduction = useMemo(() => {
    return eggProduction.filter((item) => {
      const dateValue = getDate(item);

      if (!dateValue) {
        return false;
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (
        getMonthKey(date) !== selectedMonth
      ) {
        return false;
      }

      if (selectedFlock === "all") {
        return true;
      }

      return (
        getFlockId(item) ===
        String(selectedFlock)
      );
    });
  }, [
    eggProduction,
    selectedMonth,
    selectedFlock,
  ]);

  /*
   * Financial summary.
   */
  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce(
      (total, item) =>
        total + getAmount(item),
      0
    );

    const totalExpenses =
      filteredExpenses.reduce(
        (total, item) =>
          total + getAmount(item),
        0
      );

    const netProfit =
      totalSales - totalExpenses;

    const profitMargin =
      totalSales > 0
        ? (netProfit / totalSales) * 100
        : 0;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      profitMargin,
    };
  }, [
    filteredSales,
    filteredExpenses,
  ]);

  /*
   * Export report.
   *
   * This currently exports the filtered report
   * as CSV so it works without requiring another
   * backend endpoint.
   */
  const handleExport = () => {
    const rows = [
      [
        "KukuFarm Report",
        "",
        "",
      ],
      [
        "Period",
        formatMonthLabel(selectedMonth),
        "",
      ],
      [
        "Flock",
        selectedFlock === "all"
          ? "All Flocks"
          : flocks.find(
              (flock) =>
                String(flock.id) ===
                String(selectedFlock)
            )?.name ||
            flocks.find(
              (flock) =>
                String(flock.id) ===
                String(selectedFlock)
            )?.code ||
            `Flock #${selectedFlock}`,
        "",
      ],
      [],
      [
        "Metric",
        "Amount",
      ],
      [
        "Total Sales",
        summary.totalSales,
      ],
      [
        "Total Expenses",
        summary.totalExpenses,
      ],
      [
        "Net Profit",
        summary.netProfit,
      ],
      [
        "Profit Margin",
        `${summary.profitMargin.toFixed(2)}%`,
      ],
      [],
      [
        "Egg Production",
        "Eggs",
      ],
      [
        "Total Eggs",
        filteredProduction.reduce(
          (total, item) =>
            total + getEggQuantity(item),
          0
        ),
      ],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text =
              value === null ||
              value === undefined
                ? ""
                : String(value);

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `kukufarm-report-${selectedMonth}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analyze farm production and financial performance."
        action={
          <button
            type="button"
            className="btn btn-success"
            onClick={handleExport}
            disabled={loading}
          >
            <i className="bi bi-download me-2" />
            Export Report
          </button>
        }
      />

      {error && (
        <div
          className="alert alert-warning d-flex align-items-center"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />

          <span>{error}</span>
        </div>
      )}

      <div className="report-filters">
        <select
          className="form-select"
          value={selectedMonth}
          onChange={(event) =>
            setSelectedMonth(
              event.target.value
            )
          }
          disabled={loading}
        >
          {availableMonths.map(
            (month) => (
              <option
                key={month}
                value={month}
              >
                {formatMonthLabel(month)}
              </option>
            )
          )}
        </select>

        <select
          className="form-select"
          value={selectedFlock}
          onChange={(event) =>
            setSelectedFlock(
              event.target.value
            )
          }
          disabled={loading}
        >
          <option value="all">
            All Flocks
          </option>

          {flocks.map((flock) => (
            <option
              key={flock.id}
              value={flock.id}
            >
              {getFlockName(flock)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-success"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="text-muted mt-3 mb-0">
            Loading reports...
          </p>
        </div>
      ) : (
        <>
          <div className="charts-grid">
            <EggProductionChart
              data={filteredProduction}
            />

            <SalesExpenseChart
              sales={filteredSales}
              expenses={filteredExpenses}
            />
          </div>

          <div className="report-summary">
            <div>
              <span>Total Sales</span>

              <strong>
                {formatCurrency(
                  summary.totalSales
                )}
              </strong>
            </div>

            <div>
              <span>Total Expenses</span>

              <strong>
                {formatCurrency(
                  summary.totalExpenses
                )}
              </strong>
            </div>

            <div>
              <span>Net Profit</span>

              <strong
                className={
                  summary.netProfit >= 0
                    ? "text-success"
                    : "text-danger"
                }
              >
                {formatCurrency(
                  summary.netProfit
                )}
              </strong>
            </div>

            <div>
              <span>Profit Margin</span>

              <strong
                className={
                  summary.profitMargin >= 0
                    ? "text-success"
                    : "text-danger"
                }
              >
                {summary.profitMargin.toFixed(
                  1
                )}
                %
              </strong>
            </div>
          </div>
        </>
      )}
    </>
  );
}