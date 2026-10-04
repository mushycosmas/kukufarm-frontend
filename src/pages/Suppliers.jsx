import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  active: true,
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

export default function Suppliers() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [reportFromDate, setReportFromDate] =
    useState("");

  const [reportToDate, setReportToDate] =
    useState("");

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
      return [
        supplier.name,
        supplier.contact_person,
        supplier.phone,
        supplier.email,
        supplier.address,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword)
        );
    });
  }, [data, search]);

  const totalSuppliers = data.length;

  const activeSuppliers = useMemo(() => {
    return data.filter(
      (supplier) => supplier.active !== false
    ).length;
  }, [data]);

  const displayedSuppliers = filteredData.length;

  const resetForm = () => {
    setForm({
      ...initialForm,
    });

    setEditingId(null);
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
      setError(
        "Please enter the supplier phone number."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        contact_person:
          form.contact_person.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        active: Boolean(form.active),
      };

      if (editingId) {
        await api.patch(
          `/suppliers/${editingId}/`,
          payload
        );

        setSuccess(
          "Supplier updated successfully."
        );
      } else {
        await api.post(
          "/suppliers/",
          payload
        );

        setSuccess(
          "Supplier added successfully."
        );
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
      contact_person:
        supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      active: supplier.active !== false,
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

      await api.delete(
        `/suppliers/${supplier.id}/`
      );

      if (editingId === supplier.id) {
        resetForm();
      }

      await loadSuppliers();

      setSuccess(
        "Supplier deleted successfully."
      );
    } catch (err) {
      setError(extractError(err));
    }
  };

  const generateSupplierReport = async () => {
    setError("");
    setSuccess("");

    if (!reportFromDate) {
      setError(
        "Please select the report start date."
      );
      return;
    }

    if (!reportToDate) {
      setError(
        "Please select the report end date."
      );
      return;
    }

    if (reportFromDate > reportToDate) {
      setError(
        "Start date cannot be after end date."
      );
      return;
    }

    try {
      setExporting(true);

      const response = await api.get(
        "/reports/suppliers/pdf/",
        {
          params: {
            from_date: reportFromDate,
            to_date: reportToDate,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const pdfUrl =
        window.URL.createObjectURL(blob);

      const newWindow = window.open(
        pdfUrl,
        "_blank"
      );

      if (!newWindow) {
        setError(
          "The PDF could not be opened because your browser blocked the new tab. Please allow pop-ups for this site."
        );

        window.URL.revokeObjectURL(
          pdfUrl
        );

        return;
      }

      setSuccess(
        "Supplier PDF report opened successfully."
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(
          pdfUrl
        );
      }, 30000);
    } catch (err) {
      console.error(
        "Supplier PDF export error:",
        err
      );

      if (
        err?.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          const parsed =
            JSON.parse(text);

          if (parsed?.detail) {
            setError(parsed.detail);
            return;
          }
        } catch {
          // Ignore blob parsing errors.
        }
      }

      setError(extractError(err));
    } finally {
      setExporting(false);
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
          <strong>Error:</strong>{" "}
          {error}

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

      {/* SUMMARY */}
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
              <i className="bi bi-person-check" />
            </div>

            <div>
              <div className="summary-card-label">
                Active Suppliers
              </div>

              <div className="summary-card-value">
                {activeSuppliers}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="summary-card">
            <div className="summary-card-icon">
              <i className="bi bi-list-ul" />
            </div>

            <div>
              <div className="summary-card-label">
                Displayed Suppliers
              </div>

              <div className="summary-card-value">
                {displayedSuppliers}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUPPLIER REPORT */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                Supplier Report
              </h5>

              <p className="text-muted mb-0 small">
                Generate a professional PDF report
                containing supplier information and
                supplier records.
              </p>
            </div>

            <i className="bi bi-file-earmark-pdf fs-2 text-danger" />
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">
                From Date
              </label>

              <input
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

            <div className="col-md-4">
              <label className="form-label">
                To Date
              </label>

              <input
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

            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-success w-100"
                onClick={
                  generateSupplierReport
                }
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />

                    Generating PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2" />

                    Generate PDF Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUPPLIER FORM */}
      <div className="form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingId
              ? "Edit Supplier"
              : "Add Supplier"}
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
            <div className="col-md-4">
              <label className="form-label">
                Supplier Name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mkulima Feed Suppliers"
                value={form.name}
                onChange={(e) =>
                  handleFormChange(
                    "name",
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Contact Person
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Mwita"
                value={form.contact_person}
                onChange={(e) =>
                  handleFormChange(
                    "contact_person",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Phone
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="e.g. 0712 345 678"
                value={form.phone}
                onChange={(e) =>
                  handleFormChange(
                    "phone",
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                className="form-control"
                placeholder="supplier@example.com"
                value={form.email}
                onChange={(e) =>
                  handleFormChange(
                    "email",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="col-md-5">
              <label className="form-label">
                Address
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Supplier physical address"
                value={form.address}
                onChange={(e) =>
                  handleFormChange(
                    "address",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Status
              </label>

              <select
                className="form-select"
                value={
                  form.active
                    ? "active"
                    : "inactive"
                }
                onChange={(e) =>
                  handleFormChange(
                    "active",
                    e.target.value ===
                      "active"
                  )
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
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
                      aria-hidden="true"
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

      {/* SUPPLIER TABLE */}
      <div className="table-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
          <div>
            <h5 className="mb-1">
              Supplier Records
            </h5>

            <small className="text-muted">
              {filteredData.length} supplier
              {filteredData.length === 1
                ? ""
                : "s"}
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setSearch("")
                  }
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
                <th>#</th>
                <th>Supplier</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th className="text-end">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-5"
                  >
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
                    colSpan="8"
                    className="text-center py-5 text-muted"
                  >
                    <i className="bi bi-truck fs-2 d-block mb-2" />

                    {search
                      ? "No suppliers match your search."
                      : "No suppliers found."}
                  </td>
                </tr>
              ) : (
                filteredData.map(
                  (supplier, index) => (
                    <tr
                      key={supplier.id}
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <strong>
                          {supplier.name ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {supplier.contact_person ||
                          "-"}
                      </td>

                      <td>
                        {supplier.phone ||
                          "-"}
                      </td>

                      <td>
                        {supplier.email ||
                          "-"}
                      </td>

                      <td>
                        {supplier.address ||
                          "-"}
                      </td>

                      <td>
                        {supplier.active !==
                        false ? (
                          <span className="badge bg-success">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-light me-1"
                          title="Edit"
                          onClick={() =>
                            editSupplier(
                              supplier
                            )
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger"
                          title="Delete"
                          onClick={() =>
                            deleteSupplier(
                              supplier
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}