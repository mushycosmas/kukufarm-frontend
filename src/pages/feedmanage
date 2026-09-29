import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  date: today,
  feed: "",
  supplier: "",
  flock: "",
  quantity: "",
  unit_cost: "",
  reference: "",
  notes: "",
};

function normalizeList(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
      />

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>

              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                disabled={loading}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FeedManagement() {
  const [feeds, setFeeds] = useState([]);
  const [stock, setStock] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [flocks, setFlocks] = useState([]);

  const [type, setType] = useState("Consumption");

  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [confirm, setConfirm] = useState({
    show: false,
    item: null,
    type: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        feedsResponse,
        stockResponse,
        purchasesResponse,
        consumptionResponse,
        suppliersResponse,
        flocksResponse,
      ] = await Promise.all([
        api.get("/feed/feeds/"),
        api.get("/feed/stock/"),
        api.get("/feed/purchases/"),
        api.get("/feed/consumption/"),
        api.get("/suppliers/"),
        api.get("/flocks/"),
      ]);

      setFeeds(normalizeList(feedsResponse));
      setStock(normalizeList(stockResponse));
      setPurchases(normalizeList(purchasesResponse));
      setConsumptions(normalizeList(consumptionResponse));
      setSuppliers(normalizeList(suppliersResponse));
      setFlocks(normalizeList(flocksResponse));
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Failed to load feed management data."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setType("Consumption");
  }

  function getErrorMessage(err) {
    const data = err?.response?.data;

    if (!data) {
      return "Operation failed.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    const firstKey = Object.keys(data)[0];

    if (firstKey) {
      const value = data[firstKey];

      if (Array.isArray(value)) {
        return value.join(", ");
      }

      return String(value);
    }

    return "Operation failed.";
  }

  function calculateTotal() {
    const quantity = Number(form.quantity) || 0;
    const unitCost = Number(form.unit_cost) || 0;

    return quantity * unitCost;
  }

  async function saveMovement(e) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (!form.feed) {
        throw new Error("Please select a feed item.");
      }

      if (!form.quantity || Number(form.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (type === "Consumption") {
        if (!form.flock) {
          throw new Error("Please select a flock.");
        }

        const payload = {
          feed: Number(form.feed),
          flock: Number(form.flock),
          date: form.date,
          quantity: Number(form.quantity),
          notes: form.notes || "",
        };

        if (editing) {
          await api.patch(
            `/feed/consumption/${editing.id}/`,
            payload
          );
        } else {
          await api.post(
            "/feed/consumption/",
            payload
          );
        }
      } else {
        const payload = {
          feed: Number(form.feed),
          supplier: form.supplier
            ? Number(form.supplier)
            : null,
          date: form.date,
          quantity: Number(form.quantity),
          unit_cost: Number(form.unit_cost) || 0,
          reference: form.reference || "",
        };

        if (editing) {
          await api.patch(
            `/feed/purchases/${editing.id}/`,
            payload
          );
        } else {
          await api.post(
            "/feed/purchases/",
            payload
          );
        }
      }

      resetForm();

      await loadData();
    } catch (err) {
      console.error(err);

      if (err.message && !err.response) {
        setError(err.message);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item, movementType) {
    setType(movementType);

    if (movementType === "Consumption") {
      setForm({
        date: item.date || today,
        feed: item.feed || "",
        supplier: "",
        flock: item.flock || "",
        quantity: item.quantity || "",
        unit_cost: "",
        reference: "",
        notes: item.notes || "",
      });
    } else {
      setForm({
        date: item.date || today,
        feed: item.feed || "",
        supplier: item.supplier || "",
        flock: "",
        quantity: item.quantity || "",
        unit_cost: item.unit_cost || "",
        reference: item.reference || "",
        notes: "",
      });
    }

    setEditing({
      id: item.id,
      type: movementType,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function askDelete(item, movementType) {
    setConfirm({
      show: true,
      item,
      type: movementType,
    });
  }

  async function confirmDelete() {
    if (!confirm.item) return;

    try {
      setDeleting(true);
      setError("");

      const endpoint =
        confirm.type === "Consumption"
          ? `/feed/consumption/${confirm.item.id}/`
          : `/feed/purchases/${confirm.item.id}/`;

      await api.delete(endpoint);

      setConfirm({
        show: false,
        item: null,
        type: null,
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  const filteredMovements = useMemo(() => {
    const rows = [
      ...consumptions.map((item) => ({
        ...item,
        movement_type: "Consumption",
      })),

      ...purchases.map((item) => ({
        ...item,
        movement_type: "Purchase",
      })),
    ];

    rows.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();

      return dateB - dateA;
    });

    if (!search.trim()) {
      return rows;
    }

    const term = search.toLowerCase();

    return rows.filter((item) => {
      const text = [
        item.feed_name,
        item.flock_name,
        item.flock_code,
        item.supplier_name,
        item.reference,
        item.created_by_name,
        item.movement_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [purchases, consumptions, search]);

  const totalStock = useMemo(() => {
    return stock.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [stock]);

  const lowStockCount = useMemo(() => {
    return stock.filter(
      (item) =>
        item.stock_status === "low_stock" ||
        item.stock_status === "out_of_stock"
    ).length;
  }, [stock]);

  const totalPurchased = useMemo(() => {
    return purchases.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [purchases]);

  const totalConsumed = useMemo(() => {
    return consumptions.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [consumptions]);

  const selectedFeed = feeds.find(
    (item) => Number(item.id) === Number(form.feed)
  );

  return (
    <>
      <PageHeader
        title="Feed Management"
        subtitle="Track feed purchases, stock and consumption."
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Feed Items
              </small>

              <h3 className="mb-0 mt-2">
                {feeds.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Current Stock
              </small>

              <h3 className="mb-0 mt-2">
                {formatNumber(totalStock)}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Total Purchased
              </small>

              <h3 className="mb-0 mt-2">
                {formatNumber(totalPurchased)}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Low Stock Items
              </small>

              <h3 className="mb-0 mt-2 text-warning">
                {lowStockCount}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="two-column">
        <div className="form-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              {editing
                ? `Edit ${type}`
                : "Record Feed Movement"}
            </h5>

            {editing && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={saveMovement}>
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Date
                </label>

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

              <div className="col-md-6">
                <label className="form-label">
                  Type
                </label>

                <select
                  className="form-select"
                  value={type}
                  disabled={!!editing}
                  onChange={(e) => {
                    setType(e.target.value);
                    setForm(emptyForm);
                  }}
                >
                  <option value="Consumption">
                    Consumption
                  </option>

                  <option value="Purchase">
                    Purchase
                  </option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Feed Item
                </label>

                <select
                  className="form-select"
                  value={form.feed}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      feed: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select Feed
                  </option>

                  {feeds
                    .filter((feed) => feed.active)
                    .map((feed) => (
                      <option
                        key={feed.id}
                        value={feed.id}
                      >
                        {feed.name}
                        {feed.unit
                          ? ` (${feed.unit})`
                          : ""}
                      </option>
                    ))}
                </select>
              </div>

              {type === "Consumption" ? (
                <div className="col-md-6">
                  <label className="form-label">
                    Flock
                  </label>

                  <select
                    className="form-select"
                    value={form.flock}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        flock: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Flock
                    </option>

                    {flocks.map((flock) => (
                      <option
                        key={flock.id}
                        value={flock.id}
                      >
                        {flock.code} - {flock.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-md-6">
                  <label className="form-label">
                    Supplier
                  </label>

                  <select
                    className="form-select"
                    value={form.supplier}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supplier: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select Supplier
                    </option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label">
                  Quantity
                  {selectedFeed?.unit
                    ? ` (${selectedFeed.unit})`
                    : ""}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {type === "Purchase" && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">
                      Unit Cost
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={form.unit_cost}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unit_cost: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Reference
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Invoice / receipt number"
                    />
                  </div>

                  <div className="col-12">
                    <div className="alert alert-light border mb-0">
                      <strong>
                        Total:
                      </strong>{" "}
                      {formatNumber(
                        calculateTotal()
                      )}
                    </div>
                  </div>
                </>
              )}

              {type === "Consumption" && (
                <div className="col-12">
                  <label className="form-label">
                    Notes
                  </label>

                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Optional notes..."
                  />
                </div>
              )}

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving || loading}
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Movement"
                    : "Save Movement"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="table-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              Current Stock
            </h5>

            <span className="badge bg-secondary">
              {stock.length} items
            </span>
          </div>

          {stock.length === 0 ? (
            <div className="text-muted">
              No feed stock records found.
            </div>
          ) : (
            stock.map((item) => (
              <div
                className="stock-row d-flex justify-content-between align-items-center"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.feed_name}
                  </strong>

                  <div className="small text-muted">
                    Minimum:{" "}
                    {formatNumber(
                      item.minimum_stock
                    )}{" "}
                    {item.unit}
                  </div>
                </div>

                <div className="text-end">
                  <strong>
                    {formatNumber(item.quantity)}{" "}
                    {item.unit}
                  </strong>

                  <div>
                    {item.stock_status ===
                    "out_of_stock" ? (
                      <span className="badge bg-danger">
                        Out of Stock
                      </span>
                    ) : item.stock_status ===
                      "low_stock" ? (
                      <span className="badge bg-warning text-dark">
                        Low Stock
                      </span>
                    ) : (
                      <span className="badge bg-success">
                        Normal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="table-card mt-4">
        <div className="p-4 pb-2">
          <div className="d-flex justify-content-between align-items-center gap-3">
            <h5 className="mb-0">
              Feed Movements
            </h5>

            <div style={{ maxWidth: "320px", width: "100%" }}>
              <input
                type="search"
                className="form-control"
                placeholder="Search movements..."
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
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Flock</th>
                <th>Supplier</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-4"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-4"
                  >
                    No feed movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item) => (
                  <tr key={`${item.movement_type}-${item.id}`}>
                    <td>
                      {item.date}
                    </td>

                    <td>
                      <strong>
                        {item.feed_name ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status ${
                          item.movement_type ===
                          "Purchase"
                            ? "active"
                            : "warning"
                        }`}
                      >
                        {item.movement_type}
                      </span>
                    </td>

                    <td>
                      {formatNumber(
                        item.quantity
                      )}{" "}
                      {item.feed_unit || ""}
                    </td>

                    <td>
                      {item.movement_type ===
                      "Consumption"
                        ? item.flock_code
                          ? `${item.flock_code} - ${
                              item.flock_name || ""
                            }`
                          : "-"
                        : "-"}
                    </td>

                    <td>
                      {item.movement_type ===
                      "Purchase"
                        ? item.supplier_name ||
                          "-"
                        : "-"}
                    </td>

                    <td>
                      {item.created_by_name ||
                        "-"}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                          onClick={() =>
                            startEdit(
                              item,
                              item.movement_type
                            )
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() =>
                            askDelete(
                              item,
                              item.movement_type
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-muted small">
        Total consumed:{" "}
        <strong>
          {formatNumber(totalConsumed)}
        </strong>
      </div>

      <ConfirmModal
        show={confirm.show}
        title="Delete Feed Movement"
        message="Are you sure you want to delete this feed movement? Stock will be adjusted automatically."
        onConfirm={confirmDelete}
        onCancel={() =>
          setConfirm({
            show: false,
            item: null,
            type: null,
          })
        }
        loading={deleting}
      />
    </>
  );
}
