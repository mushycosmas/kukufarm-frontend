import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  item: "",
  balance: "",
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
  return `TZS ${Number(value || 0).toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  })}`;
};

export default function Suppliers() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/suppliers/");
      setData(extractList(response));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((supplier) => {
      return (
        String(supplier.name || "").toLowerCase().includes(keyword) ||
        String(supplier.phone || "").toLowerCase().includes(keyword) ||
        String(supplier.item || "").toLowerCase().includes(keyword)
      );
    });
  }, [data, search]);

  const totalSuppliers = data.length;

  const totalBalance = useMemo(() => {
    return data.reduce((sum, supplier) => {
      return sum + Number(supplier.balance || 0);
    }, 0);
  }, [data]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const saveSupplier = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter the supplier name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter the supplier phone number.");
      return;
    }

    if (!form.item.trim()) {
      setError("Please enter the main supplied item.");
      return;
    }

    if (form.balance !== "" && Number(form.balance) < 0) {
      setError("Balance cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        item: form.item.trim(),
        balance: Number(form.balance || 0),
      };

      if (editingId) {
        await api.patch(`/suppliers/${editingId}/`, payload);
        setSuccess("Supplier updated successfully.");
      } else {
        await api.post("/suppliers/", payload);
        setSuccess("Supplier added successfully.");
      }

      await loadSuppliers();
      resetForm();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const editSupplier = (supplier) => {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      item: supplier.item || "",
      balance: supplier.balance ?? "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteSupplier = async (supplier) => {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/suppliers/${supplier.id}/`);

      if (editingId === supplier.id) {
        resetForm();
      }

      await loadSuppliers();

      setSuccess("Supplier deleted successfully.");
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Manage feed, veterinary and other suppliers."
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
              <i className="bi bi-truck" />
            </div>

            <div>
              <div className="summary-card-label">
                Total Suppliers
              </div>

              <div className="summary-card-value">
                {totalSuppliers}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="summary-card">
            <div className="summary-card-icon">
              <i className="bi bi-wallet2" />
            </div>

            <div>
              <div className="summary-card-label">
                Outstanding Balance
              </div>

              <div className="summary-card-value">
                {formatMoney(totalBalance)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="summary-card">
            <div className="summary-card-icon">
              <i className="bi bi-box-seam" />
            </div>

            <div>
              <div className="summary-card-label">
                Displayed Suppliers
              </div>

              <div className="summary-card-value">
                {filteredData.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingId ? "Edit Supplier" : "Add Supplier"}
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

        <form onSubmit={saveSupplier}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">
                Supplier Name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mkulima Feed Suppliers"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Phone
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. 0712 345 678"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Main Item
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. Layer Feed"
                value={form.item}
                onChange={(e) =>
                  setForm({
                    ...form,
                    item: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Balance (TZS)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0"
                value={form.balance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    balance: e.target.value,
                  })
                }
              />
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
                        editingId
                          ? "bi-check-lg"
                          : "bi-plus-lg"
                      } me-2`}
                    />

                    {editingId
                      ? "Update Supplier"
                      : "Save Supplier"}
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
            <h5 className="mb-1">Supplier Records</h5>

            <small className="text-muted">
              {filteredData.length} supplier
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
                placeholder="Search suppliers..."
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
                <th>Supplier</th>
                <th>Phone</th>
                <th>Main Item</th>
                <th>Balance</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div
                      className="spinner-border text-success"
                      role="status"
                    />

                    <div className="mt-2 text-muted">
                      Loading suppliers...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5 text-muted"
                  >
                    <i className="bi bi-truck fs-2 d-block mb-2" />

                    {search
                      ? "No suppliers match your search."
                      : "No suppliers found."}
                  </td>
                </tr>
              ) : (
                filteredData.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <strong>{supplier.name}</strong>
                    </td>

                    <td>{supplier.phone || "-"}</td>

                    <td>{supplier.item || "-"}</td>

                    <td
                      className={
                        Number(supplier.balance || 0) > 0
                          ? "text-danger"
                          : ""
                      }
                    >
                      <strong>
                        {formatMoney(supplier.balance)}
                      </strong>
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light me-1"
                        title="Edit"
                        onClick={() =>
                          editSupplier(supplier)
                        }
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger"
                        title="Delete"
                        onClick={() =>
                          deleteSupplier(supplier)
                        }
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
