import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const expenseCategories = [
  "Feed",
  "Medication",
  "Vaccination",
  "Veterinary Services",
  "Utilities",
  "Electricity",
  "Water",
  "Labour",
  "Transport",
  "Fuel",
  "Maintenance",
  "Equipment",
  "Farm Supplies",
  "Cleaning Supplies",
  "Disinfectants",
  "Poultry House Repairs",
  "Farm Construction",
  "Land/Rent",
  "Security",
  "Insurance",
  "Licenses & Permits",
  "Communication",
  "Internet",
  "Marketing & Advertising",
  "Packaging",
  "Egg Trays",
  "Sacks & Bags",
  "Stationery",
  "Office Expenses",
  "Bank Charges",
  "Mobile Money Charges",
  "Professional Services",
  "Veterinary Consultation",
  "Waste Management",
  "Pest Control",
  "Depreciation",
  "Loan Interest",
  "Taxes",
  "Training",
  "Miscellaneous",
  "Other",
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit" },
];

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const initialForm = {
  date: getToday(),
  category: "Feed",
  description: "",
  amount: "",
  payment: "cash",
};

const extractList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const extractError = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || "Something went wrong.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(", ")
        : String(messages);

      return `${field}: ${message}`;
    })
    .join(" | ");
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `TZS ${amount.toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  })}`;
};

const getPaymentLabel = (value) => {
  const method = paymentMethods.find((item) => item.value === value);

  return method ? method.label : value || "-";
};

export default function Expenses() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/expenses/");
      setData(extractList(response));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((item) => {
      return (
        String(item.category || "").toLowerCase().includes(keyword) ||
        String(item.description || "").toLowerCase().includes(keyword) ||
        String(item.payment || item.payment_method || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.date || "").toLowerCase().includes(keyword)
      );
    });
  }, [data, search]);

  const totalExpenses = useMemo(() => {
    return data.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);
  }, [data]);

  const visibleExpenses = useMemo(() => {
    return filteredData.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);
  }, [filteredData]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      date: getToday(),
    });

    setEditingId(null);
  };

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.date) {
      setError("Please select the expense date.");
      return;
    }

    if (!form.category) {
      setError("Please select an expense category.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        payment: form.payment,
      };

      if (editingId) {
        await api.patch(`/expenses/${editingId}/`, payload);
        setSuccess("Expense updated successfully.");
      } else {
        await api.post("/expenses/", payload);
        setSuccess("Expense recorded successfully.");
      }

      await loadExpenses();
      resetForm();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const editExpense = (expense) => {
    setEditingId(expense.id);

    setForm({
      date: expense.date || getToday(),
      category: expense.category || "Feed",
      description: expense.description || "",
      amount: expense.amount ?? "",
      payment: expense.payment || expense.payment_method || "cash",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteExpense = async (expense) => {
    const confirmed = window.confirm(
      `Delete this expense?\n\n${expense.description || "Expense"} - ${formatMoney(
        expense.amount
      )}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/expenses/${expense.id}/`);

      if (editingId === expense.id) {
        resetForm();
      }

      await loadExpenses();

      setSuccess("Expense deleted successfully.");
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Track all farm operating expenses."
      />

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <strong>Error:</strong> {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="summary-card">
            <div className="summary-card-icon">
              <i className="bi bi-cash-stack" />
            </div>

            <div>
              <div className="summary-card-label">Total Expenses</div>
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
              <div className="summary-card-label">Expense Records</div>
              <div className="summary-card-value">{data.length}</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="summary-card">
            <div className="summary-card-icon">
              <i className="bi bi-filter-circle" />
            </div>

            <div>
              <div className="summary-card-label">Displayed Amount</div>
              <div className="summary-card-value">
                {formatMoney(visibleExpenses)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingId ? "Edit Expense" : "Record Expense"}
          </h5>

          {editingId && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={resetForm}
            >
              <i className="bi bi-x-lg me-1" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={save}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Date</label>

              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Category</label>

              <select
                className="form-select"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                required
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Description</label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. Feed purchase"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Amount (TZS)</label>

              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Payment Method</label>

              <select
                className="form-select"
                value={form.payment}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment: e.target.value,
                  })
                }
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

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
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i
                      className={`bi ${
                        editingId ? "bi-check-lg" : "bi-plus-lg"
                      } me-2`}
                    />

                    {editingId ? "Update Expense" : "Save Expense"}
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-light ms-2"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
          <div>
            <h5 className="mb-1">Expense Records</h5>
            <small className="text-muted">
              {filteredData.length} record
              {filteredData.length === 1 ? "" : "s"}
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
                onChange={(e) => setSearch(e.target.value)}
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
                  <td colSpan="6" className="text-center py-5">
                    <div
                      className="spinner-border text-success"
                      role="status"
                    />

                    <div className="mt-2 text-muted">
                      Loading expenses...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-receipt fs-2 d-block mb-2" />

                    {search
                      ? "No expenses match your search."
                      : "No expense records found."}
                  </td>
                </tr>
              ) : (
                filteredData.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>

                    <td>
                      <span className="badge bg-light text-dark">
                        {expense.category}
                      </span>
                    </td>

                    <td>
                      <strong>{expense.description || "-"}</strong>
                    </td>

                    <td>
                      <strong>{formatMoney(expense.amount)}</strong>
                    </td>

                    <td>
                      {getPaymentLabel(
                        expense.payment || expense.payment_method
                      )}
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light me-1"
                        title="Edit"
                        onClick={() => editExpense(expense)}
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger"
                        title="Delete"
                        onClick={() => deleteExpense(expense)}
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
    </>
  );
}
