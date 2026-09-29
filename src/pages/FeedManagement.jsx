import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  date: today,
  feed: "",
  movement_type: "Stock In",
  flock: "",
  quantity: "",
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

function getErrorMessage(err) {
  const data = err?.response?.data;

  if (!data) {
    return err?.message || "Operation failed.";
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

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  return "Operation failed.";
}

function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!show) {
    return null;
  }

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
  const [consumptions, setConsumptions] = useState([]);
  const [flocks, setFlocks] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState("inventory");

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
        consumptionResponse,
        flocksResponse,
      ] = await Promise.all([
        api.get("/feed/feeds/"),
        api.get("/feed/stock/"),
        api.get("/feed/consumption/"),
        api.get("/flocks/"),
      ]);

      setFeeds(normalizeList(feedsResponse));
      setStock(normalizeList(stockResponse));
      setConsumptions(normalizeList(consumptionResponse));
      setFlocks(normalizeList(flocksResponse));
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    });

    setEditing(null);
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddStock() {
    resetForm();

    setForm((previous) => ({
      ...previous,
      movement_type: "Stock In",
    }));

    setActiveTab("stock");
  }

  function openConsumption() {
    resetForm();

    setForm((previous) => ({
      ...previous,
      movement_type: "Consumption",
    }));

    setActiveTab("stock");
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

      /*
       * CONSUMPTION / STOCK OUT
       *
       * Consumption belongs to the flock.
       * Backend should reduce feed stock automatically.
       */
      if (form.movement_type === "Consumption") {
        if (!form.flock) {
          throw new Error(
            "Please select the flock receiving the feed."
          );
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
      }

      /*
       * STOCK IN / OPENING STOCK / ADJUSTMENT
       *
       * These are inventory movements only.
       *
       * There is NO supplier.
       * There is NO unit cost.
       * There is NO purchase expense here.
       */
      else {
        const payload = {
          feed: Number(form.feed),
          date: form.date,
          quantity: Number(form.quantity),
          movement_type: form.movement_type,
          reference: form.reference || "",
          notes: form.notes || "",
        };

        if (editing) {
          await api.patch(
            `/feed/stock/${editing.id}/`,
            payload
          );
        } else {
          await api.post(
            "/feed/stock/",
            payload
          );
        }
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item, movementType) {
    const type =
      movementType === "Consumption"
        ? "Consumption"
        : item.movement_type || "Stock In";

    setForm({
      date: item.date || today,
      feed: item.feed || "",
      movement_type: type,
      flock: item.flock || "",
      quantity: item.quantity || "",
      reference: item.reference || "",
      notes: item.notes || "",
    });

    setEditing({
      id: item.id,
      type,
    });

    setActiveTab("stock");

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
    if (!confirm.item) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      let endpoint = "";

      if (confirm.type === "Consumption") {
        endpoint = `/feed/consumption/${confirm.item.id}/`;
      } else {
        endpoint = `/feed/stock/${confirm.item.id}/`;
      }

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

  /*
   * STOCK MOVEMENTS
   *
   * Current stock endpoint represents inventory
   * movements such as:
   *
   * Stock In
   * Opening Stock
   * Adjustment
   */
  const stockMovements = useMemo(() => {
    return stock.map((item) => ({
      ...item,
      movement_type:
        item.movement_type || "Stock In",
      direction: "IN",
    }));
  }, [stock]);

  /*
   * COMPLETE HISTORY
   *
   * Combines inventory stock movements and
   * consumption movements.
   */
  const movements = useMemo(() => {
    const rows = [
      ...stockMovements,

      ...consumptions.map((item) => ({
        ...item,
        movement_type: "Consumption",
        direction: "OUT",
      })),
    ];

    rows.sort((a, b) => {
      const dateA = new Date(
        a.date || 0
      ).getTime();

      const dateB = new Date(
        b.date || 0
      ).getTime();

      return dateB - dateA;
    });

    return rows;
  }, [stockMovements, consumptions]);

  const filteredMovements = useMemo(() => {
    if (!search.trim()) {
      return movements;
    }

    const term = search.toLowerCase();

    return movements.filter((item) => {
      const text = [
        item.feed_name,
        item.flock_name,
        item.flock_code,
        item.reference,
        item.created_by_name,
        item.movement_type,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [movements, search]);

  /*
   * CURRENT STOCK
   */
  const totalStock = useMemo(() => {
    return stock.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [stock]);

  /*
   * LOW STOCK
   */
  const lowStockCount = useMemo(() => {
    return stock.filter(
      (item) =>
        item.stock_status === "low_stock" ||
        item.stock_status === "out_of_stock"
    ).length;
  }, [stock]);

  /*
   * TOTAL STOCK IN
   *
   * This is physical quantity received/added,
   * not financial purchase value.
   */
  const totalStockIn = useMemo(() => {
    return stockMovements.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [stockMovements]);

  /*
   * TOTAL CONSUMED
   */
  const totalConsumed = useMemo(() => {
    return consumptions.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [consumptions]);

  const selectedFeed = feeds.find(
    (item) =>
      Number(item.id) ===
      Number(form.feed)
  );

  return (
    <>
      <PageHeader
        title="Feed Management"
        subtitle="Manage feed inventory, stock movements and feed consumption."
      />

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================== */}

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

              <small className="text-muted">
                Active feed types
              </small>
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

              <small className="text-muted">
                Across all feed items
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Stock Added
              </small>

              <h3 className="mb-0 mt-2">
                {formatNumber(totalStockIn)}
              </h3>

              <small className="text-muted">
                Total quantity added
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted">
                Low Stock
              </small>

              <h3 className="mb-0 mt-2 text-warning">
                {lowStockCount}
              </h3>

              <small className="text-muted">
                Items requiring attention
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          TABS
      ========================== */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "inventory"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("inventory")
                }
              >
                <i className="bi bi-box-seam me-2" />
                Feed Inventory
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "stock"
                    ? "active"
                    : ""
                }`}
                onClick={openAddStock}
              >
                <i className="bi bi-plus-circle me-2" />
                Add Stock
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "history"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("history")
                }
              >
                <i className="bi bi-clock-history me-2" />
                Stock History
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================
          INVENTORY
      ========================== */}

      {activeTab === "inventory" && (
        <div className="table-card">
          <div className="p-4 pb-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">
                  Feed Inventory
                </h5>

                <small className="text-muted">
                  Current available physical feed stock.
                </small>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={openConsumption}
                >
                  <i className="bi bi-dash-circle me-2" />
                  Record Consumption
                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={openAddStock}
                >
                  <i className="bi bi-plus-lg me-2" />
                  Add Stock
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Feed</th>
                  <th>Category</th>
                  <th>Available Stock</th>
                  <th>Minimum Stock</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4"
                    >
                      Loading inventory...
                    </td>
                  </tr>
                ) : stock.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-4"
                    >
                      No feed inventory found.
                    </td>
                  </tr>
                ) : (
                  stock.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.feed_name || "-"}
                        </strong>
                      </td>

                      <td>
                        {item.category_name || "-"}
                      </td>

                      <td>
                        <strong>
                          {formatNumber(
                            item.quantity
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatNumber(
                          item.minimum_stock
                        )}
                      </td>

                      <td>
                        {item.unit || "-"}
                      </td>

                      <td>
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
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => {
                              resetForm();

                              setForm((previous) => ({
                                ...previous,
                                feed:
                                  item.feed ||
                                  item.feed_id ||
                                  "",
                                movement_type:
                                  "Stock In",
                              }));

                              setActiveTab("stock");
                            }}
                          >
                            <i className="bi bi-plus-lg me-1" />
                            Stock In
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              resetForm();

                              setForm((previous) => ({
                                ...previous,
                                feed:
                                  item.feed ||
                                  item.feed_id ||
                                  "",
                                movement_type:
                                  "Consumption",
                              }));

                              setActiveTab("stock");
                            }}
                          >
                            <i className="bi bi-dash-lg me-1" />
                            Use
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
      )}

      {/* =========================
          STOCK FORM
      ========================== */}

      {activeTab === "stock" && (
        <div className="form-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">
                {editing
                  ? "Edit Stock Movement"
                  : form.movement_type ===
                    "Consumption"
                  ? "Record Feed Consumption"
                  : "Add Feed Stock"}
              </h5>

              <small className="text-muted">
                {form.movement_type ===
                "Consumption"
                  ? "Record feed used by a flock. The available stock will be reduced."
                  : "Add physical feed quantity to the inventory. Purchase costs are managed separately in Expenses."}
              </small>
            </div>

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

              {/* DATE */}
              <div className="col-md-4">
                <label className="form-label">
                  Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) =>
                    updateForm(
                      "date",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* MOVEMENT TYPE */}
              <div className="col-md-4">
                <label className="form-label">
                  Movement Type
                </label>

                <select
                  className="form-select"
                  value={form.movement_type}
                  disabled={!!editing}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setForm((previous) => ({
                      ...previous,
                      movement_type: value,
                      flock:
                        value ===
                        "Consumption"
                          ? previous.flock
                          : "",
                    }));
                  }}
                >
                  <option value="Stock In">
                    Stock In
                  </option>

                  <option value="Opening Stock">
                    Opening Stock
                  </option>

                  <option value="Adjustment">
                    Adjustment
                  </option>

                  <option value="Consumption">
                    Consumption / Stock Out
                  </option>
                </select>
              </div>

              {/* FEED */}
              <div className="col-md-4">
                <label className="form-label">
                  Feed
                </label>

                <select
                  className="form-select"
                  value={form.feed}
                  onChange={(e) =>
                    updateForm(
                      "feed",
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select Feed
                  </option>

                  {feeds
                    .filter(
                      (feed) =>
                        feed.active !==
                          false &&
                        feed.is_active !==
                          false
                    )
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

              {/* FLOCK */}
              {form.movement_type ===
                "Consumption" && (
                <div className="col-md-6">
                  <label className="form-label">
                    Flock
                  </label>

                  <select
                    className="form-select"
                    value={form.flock}
                    onChange={(e) =>
                      updateForm(
                        "flock",
                        e.target.value
                      )
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
                        {flock.code
                          ? `${flock.code} - `
                          : ""}
                        {flock.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* QUANTITY */}
              <div
                className={
                  form.movement_type ===
                  "Consumption"
                    ? "col-md-6"
                    : "col-md-6"
                }
              >
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
                    updateForm(
                      "quantity",
                      e.target.value
                    )
                  }
                  required
                />

                {form.movement_type ===
                  "Consumption" && (
                  <small className="text-muted">
                    This quantity will be deducted
                    from the current feed stock.
                  </small>
                )}
              </div>

              {/* REFERENCE */}
              <div className="col-md-6">
                <label className="form-label">
                  Reference
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.reference}
                  onChange={(e) =>
                    updateForm(
                      "reference",
                      e.target.value
                    )
                  }
                  placeholder={
                    form.movement_type ===
                    "Consumption"
                      ? "Optional reference"
                      : "GRN / delivery / stock reference"
                  }
                />
              </div>

              {/* NOTES */}
              <div className="col-12">
                <label className="form-label">
                  Notes
                </label>

                <textarea
                  className="form-control"
                  rows="3"
                  value={form.notes}
                  onChange={(e) =>
                    updateForm(
                      "notes",
                      e.target.value
                    )
                  }
                  placeholder={
                    form.movement_type ===
                    "Consumption"
                      ? "Example: Morning feeding"
                      : "Example: Feed received and added to store"
                  }
                />
              </div>

              {/* STOCK IN INFORMATION */}
              {form.movement_type ===
                "Stock In" && (
                <div className="col-12">
                  <div className="alert alert-success mb-0">
                    <strong>Stock In</strong>
                    <br />
                    This adds the specified quantity
                    to the feed inventory.
                    <br />
                    <small>
                      Purchase cost should be recorded
                      separately under Expenses/Purchases.
                    </small>
                  </div>
                </div>
              )}

              {/* OPENING STOCK INFORMATION */}
              {form.movement_type ===
                "Opening Stock" && (
                <div className="col-12">
                  <div className="alert alert-info mb-0">
                    <strong>
                      Opening Stock
                    </strong>
                    <br />
                    Use this when entering the existing
                    physical feed balance into the system
                    for the first time.
                  </div>
                </div>
              )}

              {/* ADJUSTMENT INFORMATION */}
              {form.movement_type ===
                "Adjustment" && (
                <div className="col-12">
                  <div className="alert alert-warning mb-0">
                    <strong>
                      Stock Adjustment
                    </strong>
                    <br />
                    Use this when the physical stock
                    differs from the system balance.
                    <br />
                    <small>
                      Add a note explaining the reason
                      for the adjustment.
                    </small>
                  </div>
                </div>
              )}

              {/* CONSUMPTION INFORMATION */}
              {form.movement_type ===
                "Consumption" && (
                <div className="col-12">
                  <div className="alert alert-primary mb-0">
                    <strong>
                      Feed Consumption
                    </strong>
                    <br />
                    This records feed used by the
                    selected flock and reduces the
                    available inventory.
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="col-12">
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={
                      saving || loading
                    }
                  >
                    {saving
                      ? "Saving..."
                      : editing
                      ? "Update Movement"
                      : form.movement_type ===
                        "Consumption"
                      ? "Record Consumption"
                      : "Add Stock"}
                  </button>

                  {editing && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          HISTORY
      ========================== */}

      {activeTab === "history" && (
        <div className="table-card">
          <div className="p-4 pb-2">
            <div className="d-flex justify-content-between align-items-center gap-3">
              <div>
                <h5 className="mb-1">
                  Stock History
                </h5>

                <small className="text-muted">
                  Complete record of feed entering
                  and leaving inventory.
                </small>
              </div>

              <div
                style={{
                  maxWidth: "320px",
                  width: "100%",
                }}
              >
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search history..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
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
                  <th>Feed</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Flock</th>
                  <th>Reference</th>
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
                      Loading history...
                    </td>
                  </tr>
                ) : filteredMovements.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-4"
                    >
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(
                    (item) => (
                      <tr
                        key={`${item.movement_type}-${item.id}`}
                      >
                        <td>
                          {item.date || "-"}
                        </td>

                        <td>
                          <strong>
                            {item.feed_name ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {item.movement_type ===
                          "Consumption" ? (
                            <span className="badge bg-warning text-dark">
                              Stock Out
                            </span>
                          ) : item.movement_type ===
                            "Adjustment" ? (
                            <span className="badge bg-info text-dark">
                              Adjustment
                            </span>
                          ) : item.movement_type ===
                            "Opening Stock" ? (
                            <span className="badge bg-secondary">
                              Opening
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              Stock In
                            </span>
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              item.quantity
                            )}
                          </strong>{" "}
                          {item.feed_unit || ""}
                        </td>

                        <td>
                          {item.movement_type ===
                          "Consumption"
                            ? item.flock_code
                              ? `${item.flock_code} - ${
                                  item.flock_name ||
                                  ""
                                }`
                              : item.flock_name ||
                                "-"
                            : "-"}
                        </td>

                        <td>
                          {item.reference ||
                            "-"}
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
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================
          FOOTER SUMMARY
      ========================== */}

      <div className="mt-3 text-muted small">
        Total feed consumed:{" "}
        <strong>
          {formatNumber(totalConsumed)}
        </strong>
      </div>

      {/* =========================
          DELETE CONFIRMATION
      ========================== */}

      <ConfirmModal
        show={confirm.show}
        title="Delete Feed Movement"
        message={
          confirm.type === "Consumption"
            ? "Are you sure you want to delete this consumption record? The backend should restore the inventory balance."
            : "Are you sure you want to delete this stock movement? The backend should recalculate the inventory balance."
        }
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
