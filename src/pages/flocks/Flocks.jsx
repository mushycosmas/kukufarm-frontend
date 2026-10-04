import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/common/ConfirmModal";

import FlockFilters from "./components/FlockFilters";
import FlockTable from "./components/FlockTable";
import FlockFormModal from "./components/FlockFormModal";

import {
  buildFlockPayload,
  extractFlockError,
  validateFlockForm,
} from "./utils/flockUtils";

import api from "../../services/api";

// ============================================================
// INITIAL FLOCK FORM
// ============================================================

const EMPTY_FLOCK_FORM = {
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

// ============================================================
// CREATE NEW FORM OBJECT
// ============================================================

const getInitialFlockForm = () => ({
  ...EMPTY_FLOCK_FORM,
});

// ============================================================
// FLOCKS PAGE
// ============================================================

export default function Flocks() {
  // ==========================================================
  // DATA
  // ==========================================================

  const [flocks, setFlocks] = useState([]);

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState(
    getInitialFlockForm
  );

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ==========================================================
  // DELETE
  // ==========================================================

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // PDF REPORT STATE
  // ==========================================================

  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  // ==========================================================
  // LOAD FLOCKS
  // ==========================================================

  const loadFlocks = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const params = {};

        const trimmedSearch = search.trim();

        if (trimmedSearch) {
          params.search = trimmedSearch;
        }

        if (statusFilter) {
          params.status = statusFilter;
        }

        const response = await api.get(
          "/flocks/",
          {
            params,
          }
        );

        const responseData = response?.data;

        // ====================================================
        // DRF ARRAY RESPONSE
        // ====================================================

        if (Array.isArray(responseData)) {
          setFlocks(responseData);
          return;
        }

        // ====================================================
        // DRF PAGINATED RESPONSE
        // ====================================================

        if (
          Array.isArray(
            responseData?.results
          )
        ) {
          setFlocks(responseData.results);
          return;
        }

        setFlocks([]);
      } catch (err) {
        console.error(
          "Failed to load flocks:",
          err
        );

        setFlocks([]);

        setError(
          extractFlockError(err) ||
            "Failed to load flocks."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [search, statusFilter]
  );

  // ==========================================================
  // LOAD ON PAGE OPEN / FILTER CHANGE
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFlocks();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [loadFlocks]);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = useCallback(() => {
    setForm(getInitialFlockForm());
    setFormError("");
  }, []);

  // ==========================================================
  // OPEN CREATE MODAL
  // ==========================================================

  const openCreateModal = () => {
    resetForm();

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // ==========================================================
  // CLOSE CREATE MODAL
  // ==========================================================

  const closeCreateModal = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  // ==========================================================
  // HANDLE FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // ==========================================================
  // SAVE FLOCK
  // ==========================================================

  const saveFlock = async () => {
    setFormError("");
    setError("");
    setSuccess("");

    const validationError =
      validateFlockForm(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload =
        buildFlockPayload(form);

      await api.post(
        "/flocks/",
        payload
      );

      setShowForm(false);

      resetForm();

      setSuccess(
        "Flock added successfully."
      );

      await loadFlocks(false);
    } catch (err) {
      console.error(
        "Failed to save flock:",
        err
      );

      setFormError(
        extractFlockError(err) ||
          "Failed to save flock."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // OPEN DELETE MODAL
  // ==========================================================

  const openDeleteModal = (flock) => {
    if (!flock?.id) {
      return;
    }

    setDeleteId(flock.id);

    setError("");
    setSuccess("");
  };

  // ==========================================================
  // CLOSE DELETE MODAL
  // ==========================================================

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteId(null);
  };

  // ==========================================================
  // DELETE FLOCK
  // ==========================================================

  const deleteFlock = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      setError("");
      setSuccess("");

      await api.delete(
        `/flocks/${deleteId}/`
      );

      setDeleteId(null);

      setSuccess(
        "Flock deleted successfully."
      );

      await loadFlocks(false);
    } catch (err) {
      console.error(
        "Failed to delete flock:",
        err
      );

      setError(
        extractFlockError(err) ||
          "Failed to delete flock."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // CLIENT-SIDE FILTER
  // ==========================================================

  const filteredFlocks = useMemo(() => {
    let result = Array.isArray(flocks)
      ? flocks
      : [];

    const normalizedSearch =
      search.trim().toLowerCase();

    if (normalizedSearch) {
      result = result.filter(
        (flock) => {
          const values = [
            flock?.code,
            flock?.name,
            flock?.breed,
            flock?.source,
            flock?.house,
            flock?.status,
          ];

          return values.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
          );
        }
      );
    }

    if (statusFilter) {
      result = result.filter(
        (flock) =>
          String(
            flock?.status ?? ""
          ).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    return result;
  }, [
    flocks,
    search,
    statusFilter,
  ]);

  // ==========================================================
  // DELETE TARGET
  // ==========================================================

  const deleteTarget = useMemo(() => {
    if (!deleteId) {
      return null;
    }

    return flocks.find(
      (flock) =>
        String(flock?.id) ===
        String(deleteId)
    );
  }, [
    flocks,
    deleteId,
  ]);

  // ==========================================================
  // EXPORT FLOCK PDF
  // ==========================================================

  const exportPDF = async () => {
    setError("");
    setSuccess("");

    // ========================================================
    // VALIDATE FROM DATE
    // ========================================================

    if (!reportFromDate) {
      setError(
        "Please select the report start date."
      );
      return;
    }

    // ========================================================
    // VALIDATE TO DATE
    // ========================================================

    if (!reportToDate) {
      setError(
        "Please select the report end date."
      );
      return;
    }

    // ========================================================
    // VALIDATE DATE RANGE
    // ========================================================

    if (reportFromDate > reportToDate) {
      setError(
        "Start date cannot be after the end date."
      );
      return;
    }

    try {
      setExporting(true);

      // ======================================================
      // REQUEST PDF FROM DJANGO
      // ======================================================

      const response = await api.get(
        "/reports/flocks/pdf/",
        {
          params: {
            from_date: reportFromDate,
            to_date: reportToDate,
          },

          responseType: "blob",
        }
      );

      // ======================================================
      // CREATE PDF BLOB
      // ======================================================

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      // ======================================================
      // CREATE TEMPORARY PDF URL
      // ======================================================

      const pdfUrl =
        window.URL.createObjectURL(blob);

      // ======================================================
      // OPEN PDF IN NEW TAB
      // ======================================================

      const newWindow = window.open(
        pdfUrl,
        "_blank"
      );

      // ======================================================
      // CHECK POPUP BLOCKER
      // ======================================================

      if (!newWindow) {
        setError(
          "The PDF could not be opened because your browser blocked the new tab. Please allow pop-ups for this site."
        );

        window.URL.revokeObjectURL(pdfUrl);

        return;
      }

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      setSuccess(
        "Flock PDF report opened successfully."
      );

      // ======================================================
      // CLEANUP
      // ======================================================

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 30000);
    } catch (err) {
      console.error(
        "Failed to generate flock PDF:",
        err
      );

      setError(
        extractFlockError(err) ||
          "Failed to generate flock PDF report."
      );
    } finally {
      setExporting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div className="d-flex justify-content-between align-items-start mb-4">
        <PageHeader
          title="Flocks"
          subtitle="Manage poultry flocks, quantities, breeds and status."
        />

        <button
          type="button"
          className="btn btn-primary mt-1"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Flock
        </button>
      </div>

      {/* ====================================================
          SUCCESS MESSAGE
      ==================================================== */}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>

          {success}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {/* ====================================================
          ERROR MESSAGE
      ==================================================== */}

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>

          {error}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <FlockFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ====================================================
          FLOCK PDF REPORT
      ==================================================== */}

      <div className="card shadow-sm border-0 mb-4">
        {/* --------------------------------------------------
            REPORT HEADER
        -------------------------------------------------- */}

        <div className="card-header bg-white">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-1">
                <i className="bi bi-file-earmark-pdf me-2 text-danger"></i>

                Flock Report
              </h5>

              <small className="text-muted">
                Generate a professional PDF report
                for a selected date range.
              </small>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            REPORT BODY
        -------------------------------------------------- */}

        <div className="card-body">
          <div className="row g-3 align-items-end">

            {/* =================================================
                FROM DATE
            ================================================= */}

            <div className="col-md-4">
              <label
                htmlFor="flockReportFromDate"
                className="form-label fw-semibold"
              >
                From Date
              </label>

              <input
                id="flockReportFromDate"
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

            {/* =================================================
                TO DATE
            ================================================= */}

            <div className="col-md-4">
              <label
                htmlFor="flockReportToDate"
                className="form-label fw-semibold"
              >
                To Date
              </label>

              <input
                id="flockReportToDate"
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

            {/* =================================================
                OPEN PDF BUTTON
            ================================================= */}

            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={exportPDF}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>

                    Generating PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2"></i>

                    Open Flock PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              REPORT INFORMATION
          ================================================= */}

          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>

              The report is generated by the Django
              backend and opens in a new browser tab.
              It includes flocks recorded between
              the selected dates.
            </small>
          </div>
        </div>
      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <FlockTable
        flocks={filteredFlocks}
        loading={loading}
        search={search}
        statusFilter={statusFilter}
        deleting={deleting}
        onAdd={openCreateModal}
        onDelete={openDeleteModal}
      />

      {/* ====================================================
          ADD FLOCK FORM
      ==================================================== */}

      <FlockFormModal
        show={showForm}
        form={form}
        formError={formError}
        saving={saving}
        onHide={closeCreateModal}
        onChange={handleChange}
        onSave={saveFlock}
      />

      {/* ====================================================
          DELETE CONFIRMATION
      ==================================================== */}

      <ConfirmModal
        show={Boolean(deleteId)}
        title="Delete Flock"
        message={
          deleteTarget
            ? `Are you sure you want to delete flock "${deleteTarget.name || deleteTarget.code}"? This action cannot be undone.`
            : "Are you sure you want to delete this flock? This action cannot be undone."
        }
        confirmText={
          deleting
            ? "Deleting..."
            : "Delete Flock"
        }
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={deleteFlock}
        onCancel={closeDeleteModal}
      />
    </>
  );
}