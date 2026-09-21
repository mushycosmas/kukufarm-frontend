import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import ConfirmModal from "../components/common/ConfirmModal";
import api from "../services/api";

export default function EggProduction() {
  const [data, setData] = useState([]);
  const [flocks, setFlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    flock: "",
    eggs_collected: "",
    broken_eggs: "",
    rejected_eggs: "",
    trays: "",
    notes: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [productionResponse, flockResponse] =
        await Promise.all([
          api.get("/production/"),
          api.get("/flocks/"),
        ]);

      const productionData =
        productionResponse.data?.results
          ? productionResponse.data.results
          : Array.isArray(productionResponse.data)
            ? productionResponse.data
            : [];

      const flockData =
        flockResponse.data?.results
          ? flockResponse.data.results
          : Array.isArray(flockResponse.data)
            ? flockResponse.data
            : [];

      setData(productionData);
      setFlocks(flockData);

      if (flockData.length > 0) {
        setForm((current) => ({
          ...current,
          flock: current.flock || flockData[0].id,
        }));
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load egg production records."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  // =========================================================
  // CREATE
  // =========================================================

  const openCreateModal = () => {
    setEditingId(null);
    setFormError("");

    setForm({
      date: new Date().toISOString().split("T")[0],
      flock: flocks.length > 0 ? flocks[0].id : "",
      eggs_collected: "",
      broken_eggs: "",
      rejected_eggs: "",
      trays: "",
      notes: "",
    });

    setShow(true);
  };

  // =========================================================
  // EDIT
  // =========================================================

  const openEditModal = (record) => {
    setEditingId(record.id);
    setFormError("");

    setForm({
      date: record.date || "",
      flock: record.flock || "",
      eggs_collected: record.eggs_collected ?? "",
      broken_eggs: record.broken_eggs ?? "",
      rejected_eggs: record.rejected_eggs ?? "",
      trays: record.trays ?? "",
      notes: record.notes || "",
    });

    setShow(true);
  };

  // =========================================================
  // SAVE / UPDATE
  // =========================================================

  const save = async () => {
    setFormError("");

    if (!form.date) {
      setFormError("Please select the date.");
      return;
    }

    if (!form.flock) {
      setFormError("Please select a flock.");
      return;
    }

    const eggsCollected =
      Number(form.eggs_collected) || 0;

    const brokenEggs =
      Number(form.broken_eggs) || 0;

    const rejectedEggs =
      Number(form.rejected_eggs) || 0;

    const trays =
      Number(form.trays) || 0;

    if (
      eggsCollected < 0 ||
      brokenEggs < 0 ||
      rejectedEggs < 0 ||
      trays < 0
    ) {
      setFormError("Values cannot be negative.");
      return;
    }

    if (
      eggsCollected === 0 &&
      brokenEggs === 0 &&
      rejectedEggs === 0
    ) {
      setFormError(
        "Please enter at least one egg quantity."
      );
      return;
    }

    const payload = {
      flock: Number(form.flock),
      date: form.date,
      eggs_collected: eggsCollected,
      broken_eggs: brokenEggs,
      rejected_eggs: rejectedEggs,
      trays: trays,
      notes: form.notes || "",
    };

    setSaving(true);

    try {
      let response;

      if (editingId) {
        // UPDATE
        response = await api.patch(
          `/production/${editingId}/`,
          payload
        );

        setData((current) =>
          current.map((item) =>
            item.id === editingId
              ? response.data
              : item
          )
        );
      } else {
        // CREATE
        response = await api.post(
          "/production/",
          payload
        );

        setData((current) => [
          response.data,
          ...current,
        ]);
      }

      setShow(false);
      setEditingId(null);

      setForm({
        date: new Date().toISOString().split("T")[0],
        flock:
          flocks.length > 0
            ? flocks[0].id
            : "",
        eggs_collected: "",
        broken_eggs: "",
        rejected_eggs: "",
        trays: "",
        notes: "",
      });
    } catch (err) {
      console.error(
        "Production save error:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      const backendError =
        err.response?.data;

      if (
        backendError &&
        typeof backendError === "object"
      ) {
        const messages =
          Object.entries(backendError)
            .map(([field, value]) => {
              const message =
                Array.isArray(value)
                  ? value.join(", ")
                  : String(value);

              return `${field}: ${message}`;
            })
            .join(" ");

        setFormError(
          messages ||
            "Failed to save production record."
        );
      } else {
        setFormError(
          "Failed to save production record."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const remove = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      await api.delete(
        `/production/${deleteId}/`
      );

      setData((current) =>
        current.filter(
          (item) => item.id !== deleteId
        )
      );

      setDeleteId(null);
    } catch (err) {
      console.error(
        "Failed to delete production:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to delete production record."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getEggsCollected = (record) =>
    Number(record.eggs_collected || 0);

  const getBrokenEggs = (record) =>
    Number(record.broken_eggs || 0);

  const getRejectedEggs = (record) =>
    Number(record.rejected_eggs || 0);

  const getTotalEggs = (record) =>
    getEggsCollected(record) +
    getBrokenEggs(record) +
    getRejectedEggs(record);

  const getFlockName = (record) => {
    if (record.flock_code) {
      return record.flock_code;
    }

    if (record.flock_name) {
      return record.flock_name;
    }

    const flock = flocks.find(
      (item) =>
        Number(item.id) ===
        Number(record.flock)
    );

    return (
      flock?.code ||
      flock?.name ||
      "-"
    );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const today =
      new Date().toISOString().split("T")[0];

    const todayRecords = data.filter(
      (record) =>
        record.date === today
    );

    const todayEggs =
      todayRecords.reduce(
        (sum, record) =>
          sum + getEggsCollected(record),
        0
      );

    const totalCollected =
      data.reduce(
        (sum, record) =>
          sum + getEggsCollected(record),
        0
      );

    const totalBroken =
      data.reduce(
        (sum, record) =>
          sum + getBrokenEggs(record),
        0
      );

    const totalRejected =
      data.reduce(
        (sum, record) =>
          sum + getRejectedEggs(record),
        0
      );

    const totalEggs =
      data.reduce(
        (sum, record) =>
          sum + getTotalEggs(record),
        0
      );

    const productionRate =
      totalEggs > 0
        ? (
            (totalCollected /
              totalEggs) *
            100
          ).toFixed(1)
        : "0.0";

    return {
      todayEggs,
      totalCollected,
      totalBroken,
      totalRejected,
      productionRate,
    };
  }, [data]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <PageHeader
        title="Egg Production"
        subtitle="Record and monitor daily egg production."
        action={
          <button
            className="btn btn-success"
            onClick={openCreateModal}
            disabled={
              flocks.length === 0
            }
          >
            <i className="bi bi-plus-lg me-2" />
            Record Production
          </button>
        }
      />

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadData}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="stats-grid">
        <StatCard
          title="Today's Eggs"
          value={statistics.todayEggs.toLocaleString()}
          subtitle="Eggs collected"
          icon="bi-egg"
        />

        <StatCard
          title="Eggs Collected"
          value={statistics.totalCollected.toLocaleString()}
          subtitle="Recorded period"
          icon="bi-check-circle-fill"
          className="egg"
        />

        <StatCard
          title="Broken Eggs"
          value={statistics.totalBroken.toLocaleString()}
          subtitle="Recorded period"
          icon="bi-x-circle-fill"
          className="mortality"
        />

        <StatCard
          title="Production Rate"
          value={`${statistics.productionRate}%`}
          subtitle="Collected vs total"
          icon="bi-graph-up-arrow"
          className="profit"
        />
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Flock</th>
                <th>Eggs Collected</th>
                <th>Broken</th>
                <th>Rejected</th>
                <th>Trays</th>
                <th>Total Eggs</th>
                <th>Action</th>
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
                      Loading production records...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-5"
                  >
                    <i className="bi bi-egg fs-1 d-block mb-2" />

                    No egg production records found.
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.date}
                    </td>

                    <td>
                      <span className="record-link">
                        {getFlockName(record)}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {getEggsCollected(
                          record
                        ).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      {getBrokenEggs(
                        record
                      ).toLocaleString()}
                    </td>

                    <td>
                      {getRejectedEggs(
                        record
                      ).toLocaleString()}
                    </td>

                    <td>
                      {Number(
                        record.trays || 0
                      ).toLocaleString()}
                    </td>

                    <td>
                      <strong>
                        {getTotalEggs(
                          record
                        ).toLocaleString()}
                      </strong>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          title="Edit"
                          onClick={() =>
                            openEditModal(
                              record
                            )
                          }
                        >
                          <i className="bi bi-pencil text-primary" />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          title="Delete"
                          onClick={() =>
                            confirmDelete(
                              record.id
                            )
                          }
                          disabled={deleting}
                        >
                          <i className="bi bi-trash text-danger" />
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

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      <Modal
        show={show}
        onHide={() =>
          !saving && setShow(false)
        }
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            {editingId
              ? "Edit Egg Production"
              : "Record Egg Production"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {formError && (
            <div className="alert alert-danger">
              {formError}
            </div>
          )}

          <div className="row g-3">

            {/* DATE */}
            <div className="col-md-6">
              <label className="form-label">
                Date
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={form.date}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* FLOCK */}
            <div className="col-md-6">
              <label className="form-label">
                Flock
              </label>

              <select
                name="flock"
                className="form-select"
                value={form.flock}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Select Flock
                </option>

                {flocks.map((flock) => (
                  <option
                    key={flock.id}
                    value={flock.id}
                  >
                    {flock.code}
                    {flock.name
                      ? ` - ${flock.name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* EGGS */}
            <div className="col-md-4">
              <label className="form-label">
                Eggs Collected
              </label>

              <input
                type="number"
                min="0"
                name="eggs_collected"
                className="form-control"
                value={
                  form.eggs_collected
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* BROKEN */}
            <div className="col-md-4">
              <label className="form-label">
                Broken Eggs
              </label>

              <input
                type="number"
                min="0"
                name="broken_eggs"
                className="form-control"
                value={
                  form.broken_eggs
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* REJECTED */}
            <div className="col-md-4">
              <label className="form-label">
                Rejected Eggs
              </label>

              <input
                type="number"
                min="0"
                name="rejected_eggs"
                className="form-control"
                value={
                  form.rejected_eggs
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* TRAYS */}
            <div className="col-md-6">
              <label className="form-label">
                Trays
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="trays"
                className="form-control"
                value={form.trays}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* NOTES */}
            <div className="col-12">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                rows="3"
                className="form-control"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
                disabled={saving}
              />
            </div>

          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            onClick={() =>
              setShow(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="success"
            onClick={save}
            disabled={
              saving ||
              flocks.length === 0
            }
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2" />

                {editingId
                  ? "Update Record"
                  : "Save Record"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <ConfirmModal
        show={!!deleteId}
        onHide={() =>
          !deleting &&
          setDeleteId(null)
        }
        onConfirm={remove}
      />
    </>
  );
}
