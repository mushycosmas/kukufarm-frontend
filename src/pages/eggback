import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import ConfirmModal from "../components/common/ConfirmModal";
import api from "../services/api";

const EGGS_PER_TRAY = 30;

/* =========================================================
   HELPERS
========================================================= */

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => {
  return toNumber(value).toLocaleString("en-TZ");
};

const formatTrays = (value) => {
  const number = toNumber(value);

  return number.toLocaleString("en-TZ", {
    minimumFractionDigits: number % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  });
};

/* =========================================================
   EMPTY FORM
========================================================= */

const createEmptyForm = (flocks = []) => ({
  date: getToday(),
  flock: flocks.length > 0 ? flocks[0].id : "",

  // Production
  full_trays: "",
  loose_eggs: "",

  // Damaged / rejected
  broken_eggs: "",
  rejected_eggs: "",

  notes: "",
});

/* =========================================================
   COMPONENT
========================================================= */

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

  const [form, setForm] = useState(createEmptyForm());

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productionResponse,
        flockResponse,
      ] = await Promise.all([
        api.get("/production/"),
        api.get("/flocks/"),
      ]);

      const productionData =
        productionResponse.data?.results ??
        (Array.isArray(productionResponse.data)
          ? productionResponse.data
          : []);

      const flockData =
        flockResponse.data?.results ??
        (Array.isArray(flockResponse.data)
          ? flockResponse.data
          : []);

      setData(productionData);
      setFlocks(flockData);

      if (flockData.length > 0) {
        setForm((current) => ({
          ...current,
          flock:
            current.flock ||
            flockData[0].id,
        }));
      }
    } catch (err) {
      console.error(
        "Failed to load egg production:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.detail ||
          "Failed to load egg production records."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  /* =======================================================
     FORM CALCULATIONS
  ======================================================= */

  const formCalculations = useMemo(() => {
    const fullTrays = toNumber(
      form.full_trays
    );

    const looseEggs = toNumber(
      form.loose_eggs
    );

    const brokenEggs = toNumber(
      form.broken_eggs
    );

    const rejectedEggs = toNumber(
      form.rejected_eggs
    );

    const eggsCollected =
      fullTrays * EGGS_PER_TRAY +
      looseEggs;

    const equivalentTrays =
      eggsCollected / EGGS_PER_TRAY;

    const totalPhysicallyCollected =
      eggsCollected +
      brokenEggs +
      rejectedEggs;

    const productionRate =
      totalPhysicallyCollected > 0
        ? (
            (eggsCollected /
              totalPhysicallyCollected) *
            100
          ).toFixed(1)
        : "0.0";

    return {
      fullTrays,
      looseEggs,
      brokenEggs,
      rejectedEggs,
      eggsCollected,
      equivalentTrays,
      totalPhysicallyCollected,
      productionRate,
    };
  }, [
    form.full_trays,
    form.loose_eggs,
    form.broken_eggs,
    form.rejected_eggs,
  ]);

  /* =======================================================
     CREATE
  ======================================================= */

  const openCreateModal = () => {
    setEditingId(null);
    setFormError("");

    setForm(
      createEmptyForm(flocks)
    );

    setShow(true);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const openEditModal = (record) => {
    setEditingId(record.id);
    setFormError("");

    const eggsCollected = toNumber(
      record.eggs_collected
    );

    const fullTrays = Math.floor(
      eggsCollected / EGGS_PER_TRAY
    );

    const looseEggs =
      eggsCollected % EGGS_PER_TRAY;

    setForm({
      date: record.date || "",

      flock:
        record.flock ||
        "",

      full_trays:
        fullTrays > 0
          ? String(fullTrays)
          : "",

      loose_eggs:
        looseEggs > 0
          ? String(looseEggs)
          : "",

      broken_eggs:
        record.broken_eggs ?? "",

      rejected_eggs:
        record.rejected_eggs ?? "",

      notes:
        record.notes || "",
    });

    setShow(true);
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    if (!form.date) {
      setFormError(
        "Please select the production date."
      );

      return false;
    }

    if (!form.flock) {
      setFormError(
        "Please select a flock."
      );

      return false;
    }

    const fullTrays = toNumber(
      form.full_trays
    );

    const looseEggs = toNumber(
      form.loose_eggs
    );

    const brokenEggs = toNumber(
      form.broken_eggs
    );

    const rejectedEggs = toNumber(
      form.rejected_eggs
    );

    if (
      fullTrays < 0 ||
      looseEggs < 0 ||
      brokenEggs < 0 ||
      rejectedEggs < 0
    ) {
      setFormError(
        "Egg quantities cannot be negative."
      );

      return false;
    }

    if (
      !Number.isInteger(fullTrays) ||
      !Number.isInteger(looseEggs) ||
      !Number.isInteger(brokenEggs) ||
      !Number.isInteger(rejectedEggs)
    ) {
      setFormError(
        "Egg quantities must be whole numbers."
      );

      return false;
    }

    if (
      looseEggs >= EGGS_PER_TRAY
    ) {
      setFormError(
        `Loose eggs must be between 0 and ${
          EGGS_PER_TRAY - 1
        }. For ${EGGS_PER_TRAY} eggs, add another full tray.`
      );

      return false;
    }

    const eggsCollected =
      fullTrays * EGGS_PER_TRAY +
      looseEggs;

    if (
      eggsCollected === 0 &&
      brokenEggs === 0 &&
      rejectedEggs === 0
    ) {
      setFormError(
        "Please enter at least one egg quantity."
      );

      return false;
    }

    return true;
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const save = async () => {
    setFormError("");
    setError("");

    if (!validateForm()) {
      return;
    }

    const fullTrays = toNumber(
      form.full_trays
    );

    const looseEggs = toNumber(
      form.loose_eggs
    );

    const brokenEggs = toNumber(
      form.broken_eggs
    );

    const rejectedEggs = toNumber(
      form.rejected_eggs
    );

    /*
     * Good eggs:
     *
     * full trays × 30 + loose eggs
     *
     * Example:
     *
     * 20 trays + 15 eggs
     * = 600 + 15
     * = 615 eggs
     */

    const eggsCollected =
      fullTrays * EGGS_PER_TRAY +
      looseEggs;

    /*
     * Equivalent tray value:
     *
     * 615 / 30 = 20.5
     */

    const trays = Number(
      (
        eggsCollected /
        EGGS_PER_TRAY
      ).toFixed(2)
    );

    /*
     * IMPORTANT:
     *
     * This is the exact payload sent to Django.
     */

    const payload = {
      flock: Number(form.flock),
      date: form.date,

      eggs_collected: Number(
        eggsCollected
      ),

      broken_eggs: Number(
        brokenEggs
      ),

      rejected_eggs: Number(
        rejectedEggs
      ),

      trays: trays,

      notes:
        form.notes?.trim() || "",
    };

    /*
     * DEBUG
     */

    console.log(
      "=========================================="
    );

    console.log(
      "EGG PRODUCTION PAYLOAD"
    );

    console.log(
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    console.log(
      "=========================================="
    );

    setSaving(true);

    try {
      let response;

      /* ===================================================
         UPDATE
      =================================================== */

      if (editingId) {
        response = await api.patch(
          `/production/${editingId}/`,
          payload
        );

        console.log(
          "Egg production update response:",
          response.data
        );

        setData((current) =>
          current.map((item) =>
            item.id === editingId
              ? response.data
              : item
          )
        );
      }

      /* ===================================================
         CREATE
      =================================================== */

      else {
        response = await api.post(
          "/production/",
          payload
        );

        console.log(
          "Egg production create response:",
          response.data
        );

        setData((current) => [
          response.data,
          ...current,
        ]);
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      setShow(false);
      setEditingId(null);

      setForm(
        createEmptyForm(flocks)
      );
    } catch (err) {
      console.error(
        "=========================================="
      );

      console.error(
        "EGG PRODUCTION SAVE ERROR"
      );

      console.error(
        "Status:",
        err.response?.status
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      console.error(
        "Payload sent:",
        payload
      );

      console.error(
        "=========================================="
      );

      const backendError =
        err.response?.data;

      if (
        backendError &&
        typeof backendError ===
          "object"
      ) {
        const messages =
          Object.entries(
            backendError
          )
            .map(
              ([
                field,
                value,
              ]) => {
                const message =
                  Array.isArray(
                    value
                  )
                    ? value.join(
                        ", "
                      )
                    : String(
                        value
                      );

                return `${field}: ${message}`;
              }
            )
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

  /* =======================================================
     DELETE
  ======================================================= */

  const confirmDelete = (
    id
  ) => {
    setDeleteId(id);
  };

  const remove = async () => {
    if (!deleteId) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api.delete(
        `/production/${deleteId}/`
      );

      setData((current) =>
        current.filter(
          (item) =>
            item.id !== deleteId
        )
      );

      setDeleteId(null);
    } catch (err) {
      console.error(
        "Failed to delete production:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.detail ||
          "Failed to delete production record."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     RECORD HELPERS
  ======================================================= */

  const getEggsCollected = (
    record
  ) => {
    return toNumber(
      record.eggs_collected
    );
  };

  const getBrokenEggs = (
    record
  ) => {
    return toNumber(
      record.broken_eggs
    );
  };

  const getRejectedEggs = (
    record
  ) => {
    return toNumber(
      record.rejected_eggs
    );
  };

  const getTotalEggs = (
    record
  ) => {
    return (
      getEggsCollected(record) +
      getBrokenEggs(record) +
      getRejectedEggs(record)
    );
  };

  const getEquivalentTrays = (
    record
  ) => {
    return (
      getEggsCollected(record) /
      EGGS_PER_TRAY
    );
  };

  const getFlockName = (
    record
  ) => {
    if (record.flock_code) {
      return record.flock_code;
    }

    if (record.flock_name) {
      return record.flock_name;
    }

    const flock =
      flocks.find(
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

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const today =
      getToday();

    const todayRecords =
      data.filter(
        (record) =>
          record.date === today
      );

    const todayEggs =
      todayRecords.reduce(
        (sum, record) =>
          sum +
          getEggsCollected(
            record
          ),
        0
      );

    const totalCollected =
      data.reduce(
        (sum, record) =>
          sum +
          getEggsCollected(
            record
          ),
        0
      );

    const totalBroken =
      data.reduce(
        (sum, record) =>
          sum +
          getBrokenEggs(
            record
          ),
        0
      );

    const totalRejected =
      data.reduce(
        (sum, record) =>
          sum +
          getRejectedEggs(
            record
          ),
        0
      );

    const totalEggs =
      data.reduce(
        (sum, record) =>
          sum +
          getTotalEggs(
            record
          ),
        0
      );

    const totalTrays =
      totalCollected /
      EGGS_PER_TRAY;

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
      totalEggs,
      totalTrays,
      productionRate,
    };
  }, [data]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <PageHeader
        title="Egg Production"
        subtitle="Record and monitor daily egg production."
        action={
          <button
            className="btn btn-success"
            onClick={
              openCreateModal
            }
            disabled={
              flocks.length === 0
            }
          >
            <i className="bi bi-plus-lg me-2" />

            Record Production
          </button>
        }
      />

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>
            {error}
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={
              loadData
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="stats-grid">

        <StatCard
          title="Today's Eggs"
          value={formatNumber(
            statistics.todayEggs
          )}
          subtitle="Good eggs collected"
          icon="bi-egg"
        />

        <StatCard
          title="Eggs Collected"
          value={formatNumber(
            statistics.totalCollected
          )}
          subtitle={`${formatTrays(
            statistics.totalTrays
          )} trays equivalent`}
          icon="bi-check-circle-fill"
          className="egg"
        />

        <StatCard
          title="Broken Eggs"
          value={formatNumber(
            statistics.totalBroken
          )}
          subtitle="Recorded period"
          icon="bi-x-circle-fill"
          className="mortality"
        />

        <StatCard
          title="Production Rate"
          value={`${statistics.productionRate}%`}
          subtitle="Good eggs vs total"
          icon="bi-graph-up-arrow"
          className="profit"
        />

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="table-card">

        <div className="table-responsive">

          <table className="table align-middle">

            <thead>
              <tr>
                <th>Date</th>
                <th>Flock</th>
                <th>Good Eggs</th>
                <th>Equivalent Trays</th>
                <th>Broken</th>
                <th>Rejected</th>
                <th>Total Collected</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {/* LOADING */}

              {loading && (
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
              )}

              {/* EMPTY */}

              {!loading &&
                data.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-5"
                    >
                      <i className="bi bi-egg fs-1 d-block mb-2" />

                      No egg production records found.
                    </td>
                  </tr>
                )}

              {/* DATA */}

              {!loading &&
                data.length > 0 &&
                data.map(
                  (record) => (
                    <tr
                      key={
                        record.id
                      }
                    >

                      {/* DATE */}

                      <td>
                        {record.date}
                      </td>

                      {/* FLOCK */}

                      <td>
                        <span className="record-link">
                          {getFlockName(
                            record
                          )}
                        </span>
                      </td>

                      {/* GOOD EGGS */}

                      <td>
                        <strong>
                          {formatNumber(
                            getEggsCollected(
                              record
                            )
                          )}
                        </strong>

                        <div className="small text-muted">
                          Good eggs
                        </div>
                      </td>

                      {/* TRAYS */}

                      <td>
                        <strong>
                          {formatTrays(
                            getEquivalentTrays(
                              record
                            )
                          )}
                        </strong>

                        <div className="small text-muted">
                          trays
                        </div>
                      </td>

                      {/* BROKEN */}

                      <td>
                        {formatNumber(
                          getBrokenEggs(
                            record
                          )
                        )}
                      </td>

                      {/* REJECTED */}

                      <td>
                        {formatNumber(
                          getRejectedEggs(
                            record
                          )
                        )}
                      </td>

                      {/* TOTAL */}

                      <td>
                        <strong>
                          {formatNumber(
                            getTotalEggs(
                              record
                            )
                          )}
                        </strong>

                        <div className="small text-muted">
                          Good + broken + rejected
                        </div>
                      </td>

                      {/* ACTION */}

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
                            disabled={
                              saving ||
                              deleting
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
                            disabled={
                              saving ||
                              deleting
                            }
                          >
                            <i className="bi bi-trash text-danger" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <Modal
        show={show}
        onHide={() =>
          !saving &&
          setShow(false)
        }
        centered
      >

        <Modal.Header
          closeButton={!saving}
        >
          <Modal.Title>
            {editingId
              ? "Edit Egg Production"
              : "Record Egg Production"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {/* FORM ERROR */}

          {formError && (
            <div className="alert alert-danger">
              {formError}
            </div>
          )}

          <div className="row g-3">

            {/* =================================================
                DATE
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Production Date
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={
                  form.date
                }
                onChange={
                  handleChange
                }
                disabled={
                  saving
                }
              />

            </div>

            {/* =================================================
                FLOCK
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Flock
              </label>

              <select
                name="flock"
                className="form-select"
                value={
                  form.flock
                }
                onChange={
                  handleChange
                }
                disabled={
                  saving
                }
              >

                <option value="">
                  Select Flock
                </option>

                {flocks.map(
                  (flock) => (
                    <option
                      key={
                        flock.id
                      }
                      value={
                        flock.id
                      }
                    >
                      {flock.code}

                      {flock.name
                        ? ` - ${flock.name}`
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* =================================================
                FULL TRAYS
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Full Trays
              </label>

              <div className="input-group">

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="full_trays"
                  className="form-control"
                  value={
                    form.full_trays
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  placeholder="e.g. 20"
                />

                <span className="input-group-text">
                  trays
                </span>

              </div>

              <div className="form-text">
                1 tray ={" "}
                {EGGS_PER_TRAY} eggs
              </div>

            </div>

            {/* =================================================
                LOOSE EGGS
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Loose Eggs
              </label>

              <div className="input-group">

                <input
                  type="number"
                  min="0"
                  max={
                    EGGS_PER_TRAY -
                    1
                  }
                  step="1"
                  name="loose_eggs"
                  className="form-control"
                  value={
                    form.loose_eggs
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  placeholder="e.g. 15"
                />

                <span className="input-group-text">
                  eggs
                </span>

              </div>

              <div className="form-text">
                0–
                {EGGS_PER_TRAY -
                  1}{" "}
                eggs
              </div>

            </div>

            {/* =================================================
                CALCULATION
            ================================================== */}

            <div className="col-12">

              <div className="border rounded p-3 bg-light">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span className="text-muted">
                    Full trays
                  </span>

                  <strong>
                    {
                      formCalculations.fullTrays
                    }
                  </strong>

                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span className="text-muted">
                    Loose eggs
                  </span>

                  <strong>
                    {
                      formCalculations.looseEggs
                    }
                  </strong>

                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span>
                    <strong>
                      Good Eggs Collected
                    </strong>
                  </span>

                  <strong className="text-success fs-5">
                    {formatNumber(
                      formCalculations.eggsCollected
                    )}{" "}
                    eggs
                  </strong>

                </div>

                <div className="d-flex justify-content-between align-items-center">

                  <span className="text-muted">
                    Equivalent
                  </span>

                  <strong>
                    {formatTrays(
                      formCalculations.equivalentTrays
                    )}{" "}
                    trays
                  </strong>

                </div>

              </div>

            </div>

            {/* =================================================
                BROKEN
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Broken Eggs
              </label>

              <div className="input-group">

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="broken_eggs"
                  className="form-control"
                  value={
                    form.broken_eggs
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  placeholder="0"
                />

                <span className="input-group-text">
                  eggs
                </span>

              </div>

              <div className="form-text">
                Not added to sellable inventory.
              </div>

            </div>

            {/* =================================================
                REJECTED
            ================================================== */}

            <div className="col-md-6">

              <label className="form-label">
                Rejected Eggs
              </label>

              <div className="input-group">

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="rejected_eggs"
                  className="form-control"
                  value={
                    form.rejected_eggs
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  placeholder="0"
                />

                <span className="input-group-text">
                  eggs
                </span>

              </div>

              <div className="form-text">
                Not added to sellable inventory.
              </div>

            </div>

            {/* =================================================
                SUMMARY
            ================================================== */}

            <div className="col-12">

              <div className="alert alert-success mb-0">

                <div className="d-flex justify-content-between">

                  <span>
                    Good eggs:
                  </span>

                  <strong>
                    {formatNumber(
                      formCalculations.eggsCollected
                    )}
                  </strong>

                </div>

                <div className="d-flex justify-content-between">

                  <span>
                    Broken:
                  </span>

                  <strong>
                    {formatNumber(
                      formCalculations.brokenEggs
                    )}
                  </strong>

                </div>

                <div className="d-flex justify-content-between">

                  <span>
                    Rejected:
                  </span>

                  <strong>
                    {formatNumber(
                      formCalculations.rejectedEggs
                    )}
                  </strong>

                </div>

                <hr />

                <div className="d-flex justify-content-between">

                  <strong>
                    Total Eggs Collected
                  </strong>

                  <strong>
                    {formatNumber(
                      formCalculations.totalPhysicallyCollected
                    )}
                  </strong>

                </div>

              </div>

            </div>

            {/* =================================================
                NOTES
            ================================================== */}

            <div className="col-12">

              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                rows="3"
                className="form-control"
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                placeholder="Optional notes..."
                disabled={
                  saving
                }
              />

            </div>

          </div>

        </Modal.Body>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <Modal.Footer>

          <Button
            variant="light"
            onClick={() =>
              setShow(false)
            }
            disabled={
              saving
            }
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
      ===================================================== */}

      <ConfirmModal
        show={
          !!deleteId
        }
        onHide={() =>
          !deleting &&
          setDeleteId(null)
        }
        onConfirm={
          remove
        }
      />
    </>
  );
}