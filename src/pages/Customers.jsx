import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  location: "",
  balance: "",
};

function getList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  return [];
}

function extractError(error) {
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

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : value;

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-TZ");
}

export default function Customers() {
  const [data, setData] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/customers/");
      setData(getList(response));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      balance: Number(form.balance || 0),
    };

    try {
      if (editingId) {
        await api.patch(
          `/customers/${editingId}/`,
          payload
        );

        showSuccess(
          "Customer updated successfully."
        );
      } else {
        await api.post(
          "/customers/",
          payload
        );

        showSuccess(
          "Customer added successfully."
        );
      }

      resetForm();
      await loadCustomers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const editCustomer = (customer) => {
    setError("");
    setSuccess("");

    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      location: customer.location || "",
      balance: customer.balance ?? "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteCustomer = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/customers/${id}/`
      );

      showSuccess(
        "Customer deleted successfully."
      );

      if (editingId === id) {
        resetForm();
      }

      await loadCustomers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((customer) => {
      return (
        String(customer.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer.phone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer.location || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search]);

  const totalOutstanding = useMemo(() => {
    return data.reduce(
      (sum, customer) =>
        sum + Number(customer.balance || 0),
      0
    );
  }, [data]);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage your farm customers and outstanding balances."
        action={
          !showForm && (
            <button
              className="btn btn-success"
              onClick={openAddForm}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Customer
            </button>
          )
        }
      />

      {/* ALERTS */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="form-card h-100">
            <small className="text-muted">
              Total Customers
            </small>

            <h4 className="mb-0 mt-1">
              {data.length.toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="col-md-6">
          <div className="form-card h-100">
            <small className="text-muted">
              Outstanding Balance
            </small>

            <h4 className="mb-0 mt-1 text-danger">
              TZS{" "}
              {formatMoney(
                totalOutstanding
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div className="form-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              {editingId
                ? "Edit Customer"
                : "Add Customer"}
            </h5>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={resetForm}
            >
              <i className="bi bi-x-lg me-1"></i>
              Cancel
            </button>
          </div>

          <form onSubmit={save}>
            <div className="row g-3">
              {/* NAME */}
              <div className="col-md-4">
                <label className="form-label">
                  Customer Name
                </label>

                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              {/* PHONE */}
              <div className="col-md-4">
                <label className="form-label">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 0712 345 678"
                />
              </div>

              {/* LOCATION */}
              <div className="col-md-4">
                <label className="form-label">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Dodoma"
                />
              </div>

              {/* BALANCE */}
              <div className="col-md-4">
                <label className="form-label">
                  Opening Balance (TZS)
                </label>

                <input
                  type="number"
                  name="balance"
                  className="form-control"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={handleChange}
                  placeholder="0"
                />

                <small className="text-muted">
                  Leave 0 if the customer has no
                  outstanding balance.
                </small>
              </div>

              {/* BUTTON */}
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-success me-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>
                      {editingId
                        ? "Update Customer"
                        : "Save Customer"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOMERS TABLE */}
      <div className="table-card">
        <div className="d-flex justify-content-between align-items-center p-3">
          <div>
            <h5 className="mb-1">
              Customer Records
            </h5>

            <small className="text-muted">
              {filteredCustomers.length} customer
              {filteredCustomers.length !== 1
                ? "s"
                : ""}
            </small>
          </div>

          <div
            style={{
              maxWidth: "320px",
              width: "100%",
            }}
          >
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search customers..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5"
                  >
                    <div className="spinner-border text-success"></div>

                    <div className="mt-2 text-muted">
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-5 text-muted"
                  >
                    <i className="bi bi-people fs-2 d-block mb-2"></i>

                    {search
                      ? "No customers match your search."
                      : "No customers found."}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => {
                    const balance =
                      Number(
                        customer.balance ||
                          0
                      );

                    return (
                      <tr
                        key={
                          customer.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              customer.name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            customer.phone ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            customer.location ||
                            "-"
                          }
                        </td>

                        <td
                          className={
                            balance > 0
                              ? "text-danger"
                              : ""
                          }
                        >
                          TZS{" "}
                          {formatMoney(
                            balance
                          )}
                        </td>

                        <td>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                editCustomer(
                                  customer
                                )
                              }
                              title="Edit customer"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() =>
                                deleteCustomer(
                                  customer.id
                                )
                              }
                              disabled={
                                deletingId ===
                                customer.id
                              }
                              title="Delete customer"
                            >
                              {deletingId ===
                              customer.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
