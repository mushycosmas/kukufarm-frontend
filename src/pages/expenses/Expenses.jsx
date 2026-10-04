import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";

import ExpenseSummary from "./components/ExpenseSummary";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseTable from "./components/ExpenseTable";

import { getInitialForm } from "./constants/expenseConstants";

import api from "../../services/api";

import { extractError } from "./utils/expenseUtils";

export default function Expenses() {
  // =========================================================
  // STATE
  // =========================================================

  const [data, setData] = useState([]);
  const [form, setForm] = useState(getInitialForm());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // PDF report date range
  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");

  // =========================================================
  // LOAD EXPENSES
  // =========================================================

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/expenses/");

      const expenses = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setData(expenses);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((item) => {
      const category = String(
        item.category || ""
      ).toLowerCase();

      const description = String(
        item.description || ""
      ).toLowerCase();

      const payment = String(
        item.payment ||
          item.payment_method ||
          ""
      ).toLowerCase();

      const date = String(
        item.date || ""
      ).toLowerCase();

      return (
        category.includes(keyword) ||
        description.includes(keyword) ||
        payment.includes(keyword) ||
        date.includes(keyword)
      );
    });
  }, [data, search]);

  // =========================================================
  // TOTAL EXPENSES
  // =========================================================

  const totalExpenses = useMemo(() => {
    return data.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [data]);

  // =========================================================
  // VISIBLE EXPENSES
  // =========================================================

  const visibleExpenses = useMemo(() => {
    return filteredData.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [filteredData]);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm(getInitialForm());
    setEditingId(null);
    setError("");
  };

  // =========================================================
  // SAVE EXPENSE
  // =========================================================

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!form.date) {
      setError("Please select the expense date.");
      return;
    }

    if (!form.category) {
      setError("Please select an expense category.");
      return;
    }

    if (!form.description?.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setError("Please enter a valid expense amount.");
      return;
    }

    // ---------------------------------------------------------
    // PAYLOAD
    // ---------------------------------------------------------

    const payload = {
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
      payment: form.payment,
    };

    try {
      setSaving(true);

      // -------------------------------------------------------
      // UPDATE EXPENSE
      // -------------------------------------------------------

      if (editingId) {
        await api.put(
          `/expenses/${editingId}/`,
          payload
        );

        setSuccess(
          "Expense updated successfully."
        );
      }

      // -------------------------------------------------------
      // CREATE EXPENSE
      // -------------------------------------------------------

      else {
        await api.post(
          "/expenses/",
          payload
        );

        setSuccess(
          "Expense recorded successfully."
        );
      }

      // Reload latest data
      await loadExpenses();

      // Reset form
      resetForm();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT EXPENSE
  // =========================================================

  const editExpense = (expense) => {
    setEditingId(expense.id);

    setForm({
      date: expense.date || "",

      category:
        expense.category || "Feed",

      description:
        expense.description || "",

      amount:
        expense.amount ?? "",

      payment:
        expense.payment ||
        expense.payment_method ||
        "cash",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE EXPENSE
  // =========================================================

  const removeExpense = async (expense) => {
    const confirmed = window.confirm(
      `Delete this expense?\n\n${
        expense.description || "Expense"
      }`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/expenses/${expense.id}/`
      );

      // If currently editing the deleted record
      if (editingId === expense.id) {
        resetForm();
      }

      await loadExpenses();

      setSuccess(
        "Expense deleted successfully."
      );
    } catch (err) {
      setError(extractError(err));
    }
  };

  // =========================================================
  // OPEN EXPENSE PDF
  // =========================================================
  //
  // Django generates the PDF.
  //
  // Endpoint:
  //
  // GET /api/reports/expenses/pdf/
  //
  // Parameters:
  //
  // from_date=YYYY-MM-DD
  // to_date=YYYY-MM-DD
  //
  // The PDF is opened in a new browser tab.
  // It is NOT forced to download.
  //
  // =========================================================

  const exportPDF = async () => {
    setError("");
    setSuccess("");

    // ---------------------------------------------------------
    // VALIDATE FROM DATE
    // ---------------------------------------------------------

    if (!reportFromDate) {
      setError(
        "Please select the report start date."
      );
      return;
    }

    // ---------------------------------------------------------
    // VALIDATE TO DATE
    // ---------------------------------------------------------

    if (!reportToDate) {
      setError(
        "Please select the report end date."
      );
      return;
    }

    // ---------------------------------------------------------
    // VALIDATE DATE RANGE
    // ---------------------------------------------------------

    if (reportFromDate > reportToDate) {
      setError(
        "Start date cannot be after the end date."
      );
      return;
    }

    try {
      setExporting(true);

      // -------------------------------------------------------
      // REQUEST PDF FROM DJANGO
      // -------------------------------------------------------

      const response = await api.get(
        "/reports/expenses/pdf/",
        {
          params: {
            from_date: reportFromDate,
            to_date: reportToDate,
          },

          responseType: "blob",
        }
      );

      // -------------------------------------------------------
      // CREATE PDF BLOB
      // -------------------------------------------------------

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      // -------------------------------------------------------
      // CREATE TEMPORARY BLOB URL
      // -------------------------------------------------------

      const pdfUrl =
        window.URL.createObjectURL(blob);

      // -------------------------------------------------------
      // OPEN PDF IN NEW TAB
      // -------------------------------------------------------

      const newWindow = window.open(
        pdfUrl,
        "_blank"
      );

      // -------------------------------------------------------
      // CHECK POPUP BLOCKER
      // -------------------------------------------------------

      if (!newWindow) {
        setError(
          "The PDF could not be opened because your browser blocked the new tab. Please allow pop-ups for this site."
        );

        window.URL.revokeObjectURL(pdfUrl);

        return;
      }

      // -------------------------------------------------------
      // SUCCESS MESSAGE
      // -------------------------------------------------------

      setSuccess(
        "Expense PDF report opened successfully."
      );

      // -------------------------------------------------------
      // CLEANUP
      // -------------------------------------------------------
      //
      // Give the browser enough time to load the PDF before
      // releasing the temporary object URL.
      //
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 30000);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setExporting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="Expenses"
        subtitle="Track all farm operating expenses."
      />

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <strong>Error:</strong>{" "}
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {success && (
        <div
          className="alert alert-success"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>

          {success}
        </div>
      )}

      {/* =====================================================
          EXPENSE SUMMARY
      ====================================================== */}

      <ExpenseSummary
        totalExpenses={totalExpenses}
        recordCount={data.length}
        visibleExpenses={visibleExpenses}
      />

      {/* =====================================================
          EXPENSE FORM
      ====================================================== */}

      <ExpenseForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        onSubmit={save}
        onCancel={resetForm}
      />

      {/* =====================================================
          EXPENSE PDF REPORT
      ====================================================== */}

      <div className="card shadow-sm border-0 mb-4">
        {/* ---------------------------------------------------
            HEADER
        ---------------------------------------------------- */}

        <div className="card-header bg-white">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-1">
                <i className="bi bi-file-earmark-pdf me-2 text-danger"></i>

                Expense Report
              </h5>

              <small className="text-muted">
                Generate a professional PDF report
                for a selected date range.
              </small>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------
            BODY
        ---------------------------------------------------- */}

        <div className="card-body">
          <div className="row g-3 align-items-end">

            {/* =================================================
                FROM DATE
            ================================================= */}

            <div className="col-md-4">
              <label
                htmlFor="reportFromDate"
                className="form-label fw-semibold"
              >
                From Date
              </label>

              <input
                id="reportFromDate"
                type="date"
                className="form-control"
                value={reportFromDate}
                onChange={(e) =>
                  setReportFromDate(
                    e.target.value
                  )
                }
              />
            </div>

            {/* =================================================
                TO DATE
            ================================================= */}

            <div className="col-md-4">
              <label
                htmlFor="reportToDate"
                className="form-label fw-semibold"
              >
                To Date
              </label>

              <input
                id="reportToDate"
                type="date"
                className="form-control"
                value={reportToDate}
                onChange={(e) =>
                  setReportToDate(
                    e.target.value
                  )
                }
              />
            </div>

            {/* =================================================
                OPEN PDF BUTTON
            ================================================= */}

            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={exportPDF}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>

                    Generating PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2"></i>

                    Open Expense PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              REPORT INFORMATION
          ================================================= */}

          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>

              The report is generated by the Django
              backend and opens in a new browser tab.
              It includes expenses recorded between
              the selected dates.
            </small>
          </div>
        </div>
      </div>

      {/* =====================================================
          EXPENSE TABLE
      ====================================================== */}

      <ExpenseTable
        expenses={filteredData}
        loading={loading}
        search={search}
        setSearch={setSearch}
        onEdit={editExpense}
        onDelete={removeExpense}
      />
    </>
  );
}