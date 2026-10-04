import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60000
  )
    .toISOString()
    .split("T")[0];
};

const today = getToday();

const mortalityCauses = [
  "Natural",
  "Disease",
  "Accident",
  "Predation",
  "Heat Stress",
  "Cold Stress",
  "Injury",
  "Cannibalism",
  "Unknown",
  "Other",
];

const initialForm = {
  date: today,
  flock: "",
  quantity: "",
  cause: "Natural",
  notes: "",
};

export default function Mortality() {
  const [data, setData] = useState([]);
  const [flocks, setFlocks] = useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [reportFromDate, setReportFromDate] =
    useState("");

  const [reportToDate, setReportToDate] =
    useState("");

  // ============================================================
  // HELPERS
  // ============================================================

  const getList = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  const extractError = (err) => {
    const responseData =
      err?.response?.data;

    if (!responseData) {
      return (
        err?.message ||
        "Something went wrong."
      );
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    const messages = [];

    Object.entries(responseData).forEach(
      ([field, value]) => {
        if (Array.isArray(value)) {
          messages.push(
            `${field}: ${value.join(", ")}`
          );
        } else if (
          typeof value === "string"
        ) {
          messages.push(
            `${field}: ${value}`
          );
        } else {
          messages.push(
            `${field}: ${JSON.stringify(
              value
            )}`
          );
        }
      }
    );

    return (
      messages.join(" | ") ||
      "Unable to process request."
    );
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const getFlock = (flockId) => {
    if (
      flockId &&
      typeof flockId === "object"
    ) {
      flockId = flockId.id;
    }

    return flocks.find(
      (flock) =>
        String(flock.id) ===
        String(flockId)
    );
  };

  const getFlockLabel = (item) => {
    if (item.flock_code) {
      return item.flock_name
        ? `${item.flock_code} - ${item.flock_name}`
        : item.flock_code;
    }

    const flock = getFlock(
      item.flock
    );

    if (flock) {
      return `${flock.code} - ${flock.name}`;
    }

    return "-";
  };

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        mortalityResponse,
        flocksResponse,
      ] = await Promise.all([
        api.get("/health/mortality/"),
        api.get("/flocks/"),
      ]);

      setData(
        getList(mortalityResponse)
      );

      setFlocks(
        getList(flocksResponse)
      );
    } catch (err) {
      console.error(
        "Mortality loading error:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // FORM
  // ============================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      date: getToday(),
    });

    setEditingId(null);
  };

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const save = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.date) {
      setError(
        "Please select the date."
      );

      return;
    }

    if (!form.flock) {
      setError(
        "Please select a flock."
      );

      return;
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setError(
        "Please enter a valid mortality quantity."
      );

      return;
    }

    if (!form.cause) {
      setError(
        "Please select the mortality cause."
      );

      return;
    }

    const selectedFlock =
      getFlock(form.flock);

    /*
     * For a new mortality record,
     * validate against the current flock quantity.
     */
    if (
      !editingId &&
      selectedFlock &&
      selectedFlock.current_quantity !==
        undefined &&
      Number(form.quantity) >
        Number(
          selectedFlock.current_quantity
        )
    ) {
      setError(
        `Mortality cannot exceed the current flock quantity of ${selectedFlock.current_quantity} birds.`
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        date: form.date,
        flock: Number(form.flock),
        quantity: Number(form.quantity),
        cause: form.cause,
        notes: form.notes,
      };

      if (editingId) {
        const response =
          await api.patch(
            `/health/mortality/${editingId}/`,
            payload
          );

        setData((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? response.data
              : item
          )
        );

        showSuccess(
          "Mortality record updated successfully."
        );
      } else {
        const response =
          await api.post(
            "/health/mortality/",
            payload
          );

        setData((prev) => [
          response.data,
          ...prev,
        ]);

        showSuccess(
          "Mortality recorded successfully."
        );
      }

      /*
       * Refresh flocks because mortality
       * changes current flock quantity.
       */
      const flocksResponse =
        await api.get("/flocks/");

      setFlocks(
        getList(flocksResponse)
      );

      resetForm();
    } catch (err) {
      console.error(
        "Mortality save error:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // EDIT
  // ============================================================

  const editRecord = (item) => {
    setEditingId(item.id);

    let flockId = item.flock;

    if (
      flockId &&
      typeof flockId === "object"
    ) {
      flockId = flockId.id;
    }

    setForm({
      date:
        item.date ||
        getToday(),

      flock:
        flockId
          ? String(flockId)
          : "",

      quantity:
        item.quantity !==
          undefined &&
        item.quantity !== null
          ? String(item.quantity)
          : "",

      cause:
        item.cause ||
        "Natural",

      notes:
        item.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // DELETE
  // ============================================================

  const deleteRecord = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this mortality record?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/health/mortality/${id}/`
      );

      setData((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );

      /*
       * Refresh flocks because deleting
       * mortality should restore flock quantity.
       */
      const flocksResponse =
        await api.get("/flocks/");

      setFlocks(
        getList(flocksResponse)
      );

      if (editingId === id) {
        resetForm();
      }

      showSuccess(
        "Mortality record deleted successfully."
      );
    } catch (err) {
      console.error(
        "Mortality delete error:",
        err
      );

      setError(
        extractError(err)
      );
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredData = useMemo(() => {
    const term =
      search.toLowerCase().trim();

    if (!term) {
      return data;
    }

    return data.filter((item) => {
      const values = [
        item.date,
        item.flock_code,
        item.flock_name,
        item.cause,
        item.notes,
        item.quantity,
      ];

      return values
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term)
        );
    });
  }, [data, search]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalMortality =
    data.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  const todayMortality =
    data
      .filter(
        (item) =>
          item.date === today
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );

  // ============================================================
  // EXPORT PDF REPORT
  // ============================================================

  const generateReport = async () => {
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

    if (
      reportFromDate >
      reportToDate
    ) {
      setError(
        "Start date cannot be after end date."
      );

      return;
    }

    try {
      setExporting(true);

      const response =
        await api.get(
          "/reports/health/pdf/",
          {
            params: {
              from_date:
                reportFromDate,

              to_date:
                reportToDate,
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
        window.URL.createObjectURL(
          blob
        );

      const newWindow =
        window.open(
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

      showSuccess(
        "Mortality PDF report opened successfully."
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(
          pdfUrl
        );
      }, 30000);
    } catch (err) {
      console.error(
        "Mortality PDF export error:",
        err
      );

      /*
       * Blob responses sometimes contain
       * JSON error messages. Try to read
       * the blob before displaying the error.
       */
      if (
        err?.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          const parsed =
            JSON.parse(text);

          if (parsed?.detail) {
            setError(
              parsed.detail
            );

            return;
          }
        } catch {
          // Ignore blob parsing errors.
        }
      }

      setError(
        extractError(err)
      );
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <PageHeader
        title="Mortality"
        subtitle="Record and monitor chicken mortality."
      />

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {success && (
        <div className="alert alert-success alert-dismissible">
          <strong>
            Success:
          </strong>{" "}
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setSuccess("")
            }
          />
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <strong>
            Error:
          </strong>{" "}
          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setError("")
            }
          />
        </div>
      )}

      {/* ======================================================
          REPORT
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                Mortality Report
              </h5>

              <p className="text-muted mb-0 small">
                Generate a professional PDF report
                for mortality records within the
                selected date range.
              </p>
            </div>

            <i className="bi bi-file-earmark-pdf fs-2 text-danger" />
          </div>

          <div className="row g-3 align-items-end">
            {/* FROM DATE */}

            <div className="col-md-4">
              <label className="form-label">
                From Date
              </label>

              <input
                type="date"
                className="form-control"
                value={
                  reportFromDate
                }
                onChange={(e) =>
                  setReportFromDate(
                    e.target.value
                  )
                }
              />
            </div>

            {/* TO DATE */}

            <div className="col-md-4">
              <label className="form-label">
                To Date
              </label>

              <input
                type="date"
                className="form-control"
                value={
                  reportToDate
                }
                onChange={(e) =>
                  setReportToDate(
                    e.target.value
                  )
                }
              />
            </div>

            {/* GENERATE */}

            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={
                  generateReport
                }
                disabled={
                  exporting
                }
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

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Mortality Records
              </div>

              <h3 className="mb-0">
                {data.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Total Birds Lost
              </div>

              <h3 className="mb-0 text-danger">
                {totalMortality}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Today's Mortality
              </div>

              <h3 className="mb-0">
                {todayMortality}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <div className="form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingId
              ? "Edit Mortality"
              : "Record Mortality"}
          </h5>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={
                resetForm
              }
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={save}>
          <div className="row g-3">
            {/* DATE */}

            <div className="col-md-3">
              <label className="form-label">
                Date{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={form.date}
                onChange={
                  handleChange
                }
                required
              />
            </div>

            {/* FLOCK */}

            <div className="col-md-3">
              <label className="form-label">
                Flock{" "}
                <span className="text-danger">
                  *
                </span>
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
                required
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
                      {flock.code} -{" "}
                      {flock.name}{" "}
                      {flock.current_quantity !==
                      undefined
                        ? `(${flock.current_quantity} birds)`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* QUANTITY */}

            <div className="col-md-2">
              <label className="form-label">
                Quantity{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <input
                type="number"
                name="quantity"
                className="form-control"
                min="1"
                step="1"
                value={
                  form.quantity
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            {/* CAUSE */}

            <div className="col-md-4">
              <label className="form-label">
                Cause{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <select
                name="cause"
                className="form-select"
                value={
                  form.cause
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="">
                  Select Cause
                </option>

                {mortalityCauses.map(
                  (cause) => (
                    <option
                      key={cause}
                      value={cause}
                    >
                      {cause}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* NOTES */}

            <div className="col-12">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="2"
                placeholder="Additional notes..."
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
              />
            </div>

            {/* WARNING */}

            <div className="col-12">
              <div className="alert alert-warning mb-0">
                <strong>
                  Important:
                </strong>{" "}
                Recording mortality automatically
                reduces the selected flock's current
                quantity.
              </div>
            </div>

            {/* BUTTONS */}

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Mortality"
                  : "Save Mortality"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="table-card">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0">
            Mortality Records
          </h5>

          <input
            type="text"
            className="form-control"
            style={{
              maxWidth: "300px",
            }}
            placeholder="Search mortality..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Flock
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Cause
                </th>

                <th>
                  Notes
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-4"
                  >
                    Loading mortality
                    records...
                  </td>
                </tr>
              ) : filteredData.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-muted py-4"
                  >
                    No mortality
                    records found.
                  </td>
                </tr>
              ) : (
                filteredData.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                    >
                      {/* DATE */}

                      <td>
                        {
                          item.date
                        }
                      </td>

                      {/* FLOCK */}

                      <td>
                        <strong>
                          {getFlockLabel(
                            item
                          )}
                        </strong>

                        {item.flock_name && (
                          <div className="small text-muted">
                            {
                              item.flock_name
                            }
                          </div>
                        )}
                      </td>

                      {/* QUANTITY */}

                      <td>
                        <strong className="text-danger">
                          {
                            item.quantity
                          }
                        </strong>
                      </td>

                      {/* CAUSE */}

                      <td>
                        {
                          item.cause ||
                          "-"
                        }
                      </td>

                      {/* NOTES */}

                      <td>
                        {
                          item.notes ||
                          "-"
                        }
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() =>
                              editRecord(
                                item
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() =>
                              deleteRecord(
                                item.id
                              )
                            }
                          >
                            Delete
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
    </>
  );
}
