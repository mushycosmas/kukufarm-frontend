import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";

import PageHeader from "../components/common/PageHeader";
import ConfirmModal from "../components/common/ConfirmModal";
import api from "../services/api";


const EMPTY_FORM = {
  code: "",
  name: "",
  breed: "Layers",
  source: "",
  arrival_date: "",
  initial_quantity: "",
  current_quantity: "",
  age_weeks: "",
  status: "active",
  house: "",
  notes: "",
};


const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "closed", label: "Closed" },
];


export default function Flocks() {
  const [data, setData] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [show, setShow] = useState(false);
  const [del, setDel] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");


  /*
   * Load flocks
   */
  const loadFlocks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get("/flocks/", {
        params,
      });

      /*
       * DRF pagination support.
       *
       * If pagination is enabled:
       * {
       *   count: 10,
       *   next: "...",
       *   previous: null,
       *   results: [...]
       * }
       *
       * If pagination is disabled:
       * [...]
       */
      const result = response.data;

      if (Array.isArray(result)) {
        setData(result);
      } else if (Array.isArray(result?.results)) {
        setData(result.results);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to load flocks:", err);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load flocks. Please try again.";

      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);


  /*
   * Load when page opens and when filters change.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFlocks();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadFlocks]);


  /*
   * Reset form
   */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
  };


  /*
   * Open Add Flock modal
   */
  const openCreateModal = () => {
    resetForm();
    setShow(true);
  };


  /*
   * Close Add Flock modal
   */
  const closeCreateModal = () => {
    if (saving) return;

    setShow(false);
    resetForm();
  };


  /*
   * Handle form changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };


  /*
   * Validate form
   */
  const validateForm = () => {
    if (!form.code.trim()) {
      return "Flock code is required.";
    }

    if (!form.name.trim()) {
      return "Flock name is required.";
    }

    if (!form.arrival_date) {
      return "Arrival date is required.";
    }

    if (
      form.initial_quantity === "" ||
      Number(form.initial_quantity) < 0
    ) {
      return "Initial quantity must be a valid number.";
    }

    if (
      form.current_quantity !== "" &&
      Number(form.current_quantity) < 0
    ) {
      return "Current quantity must be a valid number.";
    }

    if (
      form.age_weeks !== "" &&
      Number(form.age_weeks) < 0
    ) {
      return "Age must be a valid number.";
    }

    return "";
  };


  /*
   * Create flock
   */
  const save = async () => {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const initialQuantity = Number(form.initial_quantity);

      /*
       * If current quantity is not entered,
       * start it equal to initial quantity.
       */
      const currentQuantity =
        form.current_quantity === ""
          ? initialQuantity
          : Number(form.current_quantity);

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        breed: form.breed.trim(),
        source: form.source.trim(),
        arrival_date: form.arrival_date,
        initial_quantity: initialQuantity,
        current_quantity: currentQuantity,
        age_weeks:
          form.age_weeks === ""
            ? 0
            : Number(form.age_weeks),
        status: form.status,
        house: form.house.trim(),
        notes: form.notes.trim(),
      };

      await api.post("/flocks/", payload);

      setShow(false);
      resetForm();

      /*
       * Reload from Django so the UI always reflects
       * the database.
       */
      await loadFlocks();
    } catch (err) {
      console.error("Failed to create flock:", err);

      const responseData = err?.response?.data;

      let message = "Unable to save flock. Please try again.";

      if (responseData) {
        if (typeof responseData === "string") {
          message = responseData;
        } else if (responseData.detail) {
          message = responseData.detail;
        } else {
          /*
           * Django REST Framework validation errors:
           *
           * {
           *   "code": ["This field must be unique."]
           * }
           */
          const messages = Object.entries(responseData)
            .flatMap(([field, messages]) => {
              const list = Array.isArray(messages)
                ? messages
                : [messages];

              return list.map(
                (item) => `${field}: ${item}`
              );
            });

          if (messages.length > 0) {
            message = messages.join(" ");
          }
        }
      }

      setFormError(message);
    } finally {
      setSaving(false);
    }
  };


  /*
   * Delete flock
   */
  const remove = async () => {
    if (!del) return;

    setDeleting(true);

    try {
      await api.delete(`/flocks/${del.id}/`);

      setDel(null);

      await loadFlocks();
    } catch (err) {
      console.error("Failed to delete flock:", err);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to delete flock. Please try again.";

      setError(message);
      setDel(null);
    } finally {
      setDeleting(false);
    }
  };


  /*
   * Client-side filtering fallback.
   *
   * This is useful even if Django filtering/search is not
   * configured globally.
   */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((flock) => {
      const matchesSearch =
        !query ||
        [
          flock.code,
          flock.name,
          flock.breed,
          flock.source,
          flock.house,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        flock.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);


  /*
   * Status badge
   */
  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "status active";

      case "sold":
        return "status sold";

      case "closed":
        return "status closed";

      default:
        return "status";
    }
  };


  /*
   * Format status
   */
  const formatStatus = (status) => {
    if (!status) return "-";

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };


  /*
   * Format number
   */
  const formatNumber = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString();
  };


  return (
    <>
      <PageHeader
        title="Flock Management"
        subtitle="Manage your chicken flocks and monitor their performance."
        action={
          <button
            className="btn btn-success"
            onClick={openCreateModal}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add New Flock
          </button>
        }
      />


      {/* FILTERS */}
      <div className="filter-card">
        <div className="search-box">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search flocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>

          {STATUS_OPTIONS.map((status) => (
            <option
              key={status.value}
              value={status.value}
            >
              {status.label}
            </option>
          ))}
        </select>
      </div>


      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>

          <div className="flex-grow-1">
            {error}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadFlocks}
          >
            Retry
          </button>
        </div>
      )}


      {/* TABLE */}
      <div className="table-card">
        <div className="table-responsive">

          {loading ? (
            <div className="text-center py-5">
              <Spinner
                animation="border"
                variant="success"
              />

              <div className="mt-3 text-muted">
                Loading flocks...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">

              <i
                className="bi bi-egg"
                style={{ fontSize: "2.5rem" }}
              ></i>

              <h5 className="mt-3">
                No flocks found
              </h5>

              <p className="text-muted mb-3">
                {search || statusFilter
                  ? "Try changing your search or filter."
                  : "You have not added any flocks yet."}
              </p>

              {!search && !statusFilter && (
                <button
                  className="btn btn-success"
                  onClick={openCreateModal}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add New Flock
                </button>
              )}
            </div>
          ) : (
            <table className="table align-middle">

              <thead>
                <tr>
                  <th>Flock</th>
                  <th>Breed</th>
                  <th>Start Date</th>
                  <th>Chickens</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((flock) => (
                  <tr key={flock.id}>

                    <td>
                      <Link
                        className="record-link"
                        to={`/flocks/${flock.id}`}
                      >
                        {flock.code}
                      </Link>

                      {flock.name && (
                        <div className="small text-muted">
                          {flock.name}
                        </div>
                      )}
                    </td>


                    <td>
                      {flock.breed || "-"}
                    </td>


                    <td>
                      {flock.arrival_date || "-"}
                    </td>


                    <td>
                      <strong>
                        {formatNumber(
                          flock.current_quantity
                        )}
                      </strong>

                      <div className="small text-muted">
                        Initial:{" "}
                        {formatNumber(
                          flock.initial_quantity
                        )}
                      </div>
                    </td>


                    <td>
                      {formatNumber(flock.age_weeks)} weeks
                    </td>


                    <td>
                      <span
                        className={getStatusClass(
                          flock.status
                        )}
                      >
                        {formatStatus(flock.status)}
                      </span>
                    </td>


                    <td>
                      <div className="action-buttons">

                        <Link
                          to={`/flocks/${flock.id}`}
                          className="btn btn-sm btn-light"
                          title="View flock"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>

                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => setDel(flock)}
                          disabled={deleting}
                          title="Delete flock"
                        >
                          <i className="bi bi-trash text-danger"></i>
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>
      </div>


      {/* ADD FLOCK MODAL */}
      <Modal
        show={show}
        onHide={closeCreateModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-egg-fried me-2 text-success"></i>
            Add New Flock
          </Modal.Title>
        </Modal.Header>


        <Modal.Body>

          {formError && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {formError}
            </div>
          )}


          <div className="row g-3">

            {/* FLOCK CODE */}
            <div className="col-md-6">
              <label
                htmlFor="code"
                className="form-label"
              >
                Flock Code <span className="text-danger">*</span>
              </label>

              <input
                id="code"
                name="code"
                type="text"
                className="form-control"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. FLK-001"
                disabled={saving}
              />
            </div>


            {/* FLOCK NAME */}
            <div className="col-md-6">
              <label
                htmlFor="name"
                className="form-label"
              >
                Flock Name <span className="text-danger">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Layer House A"
                disabled={saving}
              />
            </div>


            {/* BREED */}
            <div className="col-md-6">
              <label
                htmlFor="breed"
                className="form-label"
              >
                Breed
              </label>

              <select
                id="breed"
                name="breed"
                className="form-select"
                value={form.breed}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Layers">
                  Layers
                </option>

                <option value="Broilers">
                  Broilers
                </option>

                <option value="Local">
                  Local
                </option>
              </select>
            </div>


            {/* SOURCE */}
            <div className="col-md-6">
              <label
                htmlFor="source"
                className="form-label"
              >
                Source
              </label>

              <input
                id="source"
                name="source"
                type="text"
                className="form-control"
                value={form.source}
                onChange={handleChange}
                placeholder="e.g. Farm supplier"
                disabled={saving}
              />
            </div>


            {/* ARRIVAL DATE */}
            <div className="col-md-6">
              <label
                htmlFor="arrival_date"
                className="form-label"
              >
                Arrival Date{" "}
                <span className="text-danger">*</span>
              </label>

              <input
                id="arrival_date"
                name="arrival_date"
                type="date"
                className="form-control"
                value={form.arrival_date}
                onChange={handleChange}
                disabled={saving}
              />
            </div>


            {/* INITIAL QUANTITY */}
            <div className="col-md-6">
              <label
                htmlFor="initial_quantity"
                className="form-label"
              >
                Initial Chickens{" "}
                <span className="text-danger">*</span>
              </label>

              <input
                id="initial_quantity"
                name="initial_quantity"
                type="number"
                min="0"
                className="form-control"
                value={form.initial_quantity}
                onChange={handleChange}
                placeholder="e.g. 1000"
                disabled={saving}
              />
            </div>


            {/* CURRENT QUANTITY */}
            <div className="col-md-6">
              <label
                htmlFor="current_quantity"
                className="form-label"
              >
                Current Chickens
              </label>

              <input
                id="current_quantity"
                name="current_quantity"
                type="number"
                min="0"
                className="form-control"
                value={form.current_quantity}
                onChange={handleChange}
                placeholder="Defaults to initial quantity"
                disabled={saving}
              />

              <div className="form-text">
                Leave empty to use the initial quantity.
              </div>
            </div>


            {/* AGE */}
            <div className="col-md-6">
              <label
                htmlFor="age_weeks"
                className="form-label"
              >
                Age (weeks)
              </label>

              <input
                id="age_weeks"
                name="age_weeks"
                type="number"
                min="0"
                className="form-control"
                value={form.age_weeks}
                onChange={handleChange}
                placeholder="e.g. 24"
                disabled={saving}
              />
            </div>


            {/* HOUSE */}
            <div className="col-md-6">
              <label
                htmlFor="house"
                className="form-label"
              >
                House
              </label>

              <input
                id="house"
                name="house"
                type="text"
                className="form-control"
                value={form.house}
                onChange={handleChange}
                placeholder="e.g. House A"
                disabled={saving}
              />
            </div>


            {/* STATUS */}
            <div className="col-md-6">
              <label
                htmlFor="status"
                className="form-label"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                className="form-select"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>


            {/* NOTES */}
            <div className="col-12">
              <label
                htmlFor="notes"
                className="form-label"
              >
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows="3"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes about this flock..."
                disabled={saving}
              ></textarea>
            </div>

          </div>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="light"
            onClick={closeCreateModal}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="success"
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Save Flock
              </>
            )}
          </Button>

        </Modal.Footer>

      </Modal>


      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        show={!!del}
        onHide={() => {
          if (!deleting) {
            setDel(null);
          }
        }}
        onConfirm={remove}
      />

    </>
  );
}

