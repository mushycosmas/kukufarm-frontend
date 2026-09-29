import React, {
  useEffect,
  useState,
} from "react";
import api from "../../../services/api";

const emptyForm = {
  name: "",
  description: "",
  unit: "Kg",
  minimum_stock: "",
  active: true,
};

function getErrorMessage(err) {
  const data = err?.response?.data;

  if (!data) {
    return (
      err?.message ||
      "Operation failed."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey =
    Object.keys(data)[0];

  if (firstKey) {
    const value = data[firstKey];

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (
      typeof value === "object"
    ) {
      return JSON.stringify(value);
    }

    return String(value);
  }

  return "Operation failed.";
}

export default function FeedTypes() {
  const [feeds, setFeeds] = useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadFeeds() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/feed/feeds/"
        );

      const data =
        response?.data;

      if (Array.isArray(data)) {
        setFeeds(data);
      } else if (
        Array.isArray(
          data?.results
        )
      ) {
        setFeeds(data.results);
      } else {
        setFeeds([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeeds();
  }, []);

  function updateForm(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
    });

    setEditing(null);
  }

  function startEdit(feed) {
    setForm({
      name:
        feed.name ||
        feed.feed_name ||
        "",
      description:
        feed.description || "",
      unit:
        feed.unit || "Kg",
      minimum_stock:
        feed.minimum_stock ??
        feed.minimum_stock_level ??
        "",
      active:
        feed.active !== false,
    });

    setEditing(feed);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveFeed(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Feed name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim(),
        unit: form.unit || "Kg",
        minimum_stock:
          Number(
            form.minimum_stock || 0
          ),
        active: Boolean(
          form.active
        ),
      };

      if (editing) {
        await api.patch(
          `/feed/feeds/${editing.id}/`,
          payload
        );
      } else {
        await api.post(
          "/feed/feeds/",
          payload
        );
      }

      resetForm();

      await loadFeeds();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteFeed(feed) {
    const name =
      feed.name ||
      feed.feed_name ||
      "this feed";

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await api.delete(
        `/feed/feeds/${feed.id}/`
      );

      if (
        editing?.id === feed.id
      ) {
        resetForm();
      }

      await loadFeeds();
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(err)
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredFeeds =
    feeds.filter((feed) => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return true;
      }

      const text = [
        feed.name,
        feed.feed_name,
        feed.description,
        feed.unit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });

  return (
    <div>
      {/* ERROR */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setError("")
            }
          />
        </div>
      )}

      <div className="row g-4">

        {/* FORM */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    <i className="bi bi-tags me-2" />

                    {editing
                      ? "Edit Feed Type"
                      : "Add Feed Type"}
                  </h5>

                  <small className="text-muted">
                    Define the feed types used in your farm.
                  </small>
                </div>

                {editing && (
                  <span className="badge bg-warning text-dark">
                    Editing
                  </span>
                )}
              </div>
            </div>

            <div className="card-body">
              <form
                onSubmit={saveFeed}
              >

                {/* NAME */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Feed Name{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Broiler Starter"
                    required
                    disabled={saving}
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows="3"
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateForm(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Describe this feed type..."
                    disabled={saving}
                  />
                </div>

                <div className="row g-3">

                  {/* UNIT */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Unit
                    </label>

                    <select
                      className="form-select"
                      value={
                        form.unit
                      }
                      onChange={(e) =>
                        updateForm(
                          "unit",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    >
                      <option value="Kg">
                        Kilogram (Kg)
                      </option>

                      <option value="Bag">
                        Bag
                      </option>

                      <option value="Tonne">
                        Tonne
                      </option>
                    </select>
                  </div>

                  {/* MINIMUM STOCK */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Minimum Stock
                    </label>

                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={
                        form.minimum_stock
                      }
                      onChange={(e) =>
                        updateForm(
                          "minimum_stock",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* ACTIVE */}
                <div className="form-check form-switch mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="feedActive"
                    checked={
                      Boolean(
                        form.active
                      )
                    }
                    onChange={(e) =>
                      updateForm(
                        "active",
                        e.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <label
                    className="form-check-label"
                    htmlFor="feedActive"
                  >
                    Active Feed Type
                  </label>
                </div>

                {/* ACTIONS */}
                <div className="d-flex justify-content-end gap-2 mt-4">

                  {editing && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={
                        resetForm
                      }
                      disabled={saving}
                    >
                      <i className="bi bi-x-lg me-1" />
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
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
                          className={
                            editing
                              ? "bi bi-check-lg me-1"
                              : "bi bi-plus-circle me-1"
                          }
                        />

                        {editing
                          ? "Update Feed"
                          : "Add Feed Type"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FEED LIST */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex justify-content-between align-items-center gap-3">

                <div>
                  <h5 className="mb-1">
                    Feed Types
                  </h5>

                  <small className="text-muted">
                    {feeds.length} feed type
                    {feeds.length === 1
                      ? ""
                      : "s"} registered
                  </small>
                </div>

                <div
                  style={{
                    maxWidth: "260px",
                    width: "100%",
                  }}
                >
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search" />
                    </span>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search feed..."
                      value={
                        search
                      }
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="card-body p-0">

              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />

                  <div className="text-muted mt-2">
                    Loading feed types...
                  </div>
                </div>
              ) : filteredFeeds.length ===
                0 ? (
                <div className="text-center py-5 px-3">
                  <i className="bi bi-tags fs-1 text-muted" />

                  <h6 className="mt-3">
                    No feed types found
                  </h6>

                  <p className="text-muted mb-0">
                    Add your first feed type using the form.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">

                    <thead className="table-light">
                      <tr>
                        <th>
                          Feed Type
                        </th>

                        <th>
                          Unit
                        </th>

                        <th>
                          Minimum Stock
                        </th>

                        <th>
                          Status
                        </th>

                        <th className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFeeds.map(
                        (feed) => {
                          const name =
                            feed.name ||
                            feed.feed_name ||
                            `Feed #${feed.id}`;

                          const unit =
                            feed.unit ||
                            "Kg";

                          const minimum =
                            feed.minimum_stock ??
                            feed.minimum_stock_level ??
                            0;

                          const active =
                            feed.active !==
                            false;

                          return (
                            <tr
                              key={
                                feed.id
                              }
                            >
                              <td>
                                <div className="fw-semibold">
                                  {name}
                                </div>

                                {feed.description && (
                                  <small className="text-muted">
                                    {
                                      feed.description
                                    }
                                  </small>
                                )}
                              </td>

                              <td>
                                {unit}
                              </td>

                              <td>
                                {Number(
                                  minimum
                                ).toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td>
                                {active ? (
                                  <span className="badge bg-success-subtle text-success">
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary">
                                    Inactive
                                  </span>
                                )}
                              </td>

                              <td className="text-end">
                                <div className="btn-group btn-group-sm">

                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() =>
                                      startEdit(
                                        feed
                                      )
                                    }
                                    disabled={
                                      deleting
                                    }
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      deleteFeed(
                                        feed
                                      )
                                    }
                                    disabled={
                                      deleting
                                    }
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash" />
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>

                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}