import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/common/ConfirmModal";

import EggProductionStats from "./components/EggProductionStats";
import EggProductionTable from "./components/EggProductionTable";
import EggProductionModal from "./components/EggProductionModal";

import {
  createEmptyForm,
  calculateForm,
  calculateStatistics,
  recordToForm,
  validateProductionForm,
  buildProductionPayload,
  getBackendError,
} from "./utils/eggProductionUtils";

import api from "../../services/api";

export default function EggProduction() {
  // =========================================================
  // DATA
  // =========================================================

  const [data, setData] = useState([]);
  const [flocks, setFlocks] = useState([]);

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // =========================================================
  // MODAL STATE
  // =========================================================

  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState(
    createEmptyForm()
  );

  // =========================================================
  // PDF REPORT STATE
  // =========================================================

  const [reportFromDate, setReportFromDate] =
    useState("");

  const [reportToDate, setReportToDate] =
    useState("");

  const [exporting, setExporting] =
    useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

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

      // =====================================================
      // PRODUCTION DATA
      // =====================================================

      const productionData =
        productionResponse.data?.results ??
        (Array.isArray(
          productionResponse.data
        )
          ? productionResponse.data
          : []);

      // =====================================================
      // FLOCK DATA
      // =====================================================

      const flockData =
        flockResponse.data?.results ??
        (Array.isArray(
          flockResponse.data
        )
          ? flockResponse.data
          : []);

      setData(productionData);
      setFlocks(flockData);

      // =====================================================
      // SELECT FIRST FLOCK AUTOMATICALLY
      // =====================================================

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

  // =========================================================
  // LOAD DATA ON PAGE OPEN
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FORM CALCULATIONS
  // =========================================================

  const calculations = useMemo(
    () => calculateForm(form),
    [form]
  );

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(
    () => calculateStatistics(data),
    [data]
  );

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setError("");
  };

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingId(null);
    setFormError("");
    setError("");
    setSuccess("");

    setForm(
      createEmptyForm(flocks)
    );

    setShow(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (record) => {
    setEditingId(record.id);
    setFormError("");
    setError("");
    setSuccess("");

    setForm(
      recordToForm(record)
    );

    setShow(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShow(false);
    setEditingId(null);
    setFormError("");
  };

  // =========================================================
  // SAVE PRODUCTION
  // =========================================================

  const save = async () => {
    setFormError("");
    setError("");
    setSuccess("");

    // =======================================================
    // VALIDATE FORM
    // =======================================================

    const validationError =
      validateProductionForm(form);

    if (validationError) {
      setFormError(
        validationError
      );

      return;
    }

    // =======================================================
    // BUILD DJANGO PAYLOAD
    // =======================================================

    const payload =
      buildProductionPayload(form);

    console.log(
      "======================================"
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
      "======================================"
    );

    setSaving(true);

    try {
      let response;

      // =====================================================
      // UPDATE
      // =====================================================

      if (editingId) {
        response =
          await api.patch(
            `/production/${editingId}/`,
            payload
          );

        console.log(
          "Egg production update:",
          response.data
        );

        setData((current) =>
          current.map((item) =>
            item.id === editingId
              ? response.data
              : item
          )
        );

        setSuccess(
          "Egg production record updated successfully."
        );
      }

      // =====================================================
      // CREATE
      // =====================================================

      else {
        response =
          await api.post(
            "/production/",
            payload
          );

        console.log(
          "Egg production create:",
          response.data
        );

        setData((current) => [
          response.data,
          ...current,
        ]);

        setSuccess(
          "Egg production record added successfully."
        );
      }

      // =====================================================
      // RESET
      // =====================================================

      setShow(false);
      setEditingId(null);
      setFormError("");

      setForm(
        createEmptyForm(flocks)
      );
    } catch (err) {
      console.error(
        "======================================"
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
        "Payload:",
        payload
      );

      console.error(
        "======================================"
      );

      setFormError(
        getBackendError(err) ||
          "Failed to save production record."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CONFIRM DELETE
  // =========================================================

  const confirmDelete = (id) => {
    setDeleteId(id);
    setError("");
    setSuccess("");
  };

  // =========================================================
  // DELETE PRODUCTION
  // =========================================================

  const remove = async () => {
    if (!deleteId) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

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

      setSuccess(
        "Egg production record deleted successfully."
      );
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

  // =========================================================
  // EXPORT PDF
  // =========================================================

  const exportPDF = async () => {
    setError("");
    setSuccess("");

    // =======================================================
    // VALIDATE FROM DATE
    // =======================================================

    if (!reportFromDate) {
      setError(
        "Please select the report start date."
      );

      return;
    }

    // =======================================================
    // VALIDATE TO DATE
    // =======================================================

    if (!reportToDate) {
      setError(
        "Please select the report end date."
      );

      return;
    }

    // =======================================================
    // VALIDATE DATE RANGE
    // =======================================================

    if (reportFromDate > reportToDate) {
      setError(
        "Start date cannot be after the end date."
      );

      return;
    }

    try {
      setExporting(true);

      // =====================================================
      // REQUEST PDF FROM DJANGO
      // =====================================================

      const response = await api.get(
        "/production/reports/pdf/",
        {
          params: {
            from_date: reportFromDate,
            to_date: reportToDate,
          },

          responseType: "blob",
        }
      );

      // =====================================================
      // CREATE PDF BLOB
      // =====================================================

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      // =====================================================
      // CREATE TEMPORARY URL
      // =====================================================

      const pdfUrl =
        window.URL.createObjectURL(blob);

      // =====================================================
      // OPEN PDF IN NEW TAB
      // =====================================================

      const newWindow = window.open(
        pdfUrl,
        "_blank"
      );

      // =====================================================
      // POPUP BLOCKED
      // =====================================================

      if (!newWindow) {
        setError(
          "The PDF could not be opened because your browser blocked the new tab. Please allow pop-ups for this site."
        );

        window.URL.revokeObjectURL(
          pdfUrl
        );

        return;
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(
        "Egg production PDF report opened successfully."
      );

      // =====================================================
      // CLEANUP
      // =====================================================

      setTimeout(() => {
        window.URL.revokeObjectURL(
          pdfUrl
        );
      }, 30000);
    } catch (err) {
      console.error(
        "Failed to generate egg production PDF:",
        err
      );

      // =====================================================
      // HANDLE DJANGO BLOB ERROR
      // =====================================================

      if (
        err.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          const data =
            JSON.parse(text);

          setError(
            data.detail ||
              data.message ||
              "Failed to generate egg production PDF report."
          );
        } catch {
          setError(
            "Failed to generate egg production PDF report."
          );
        }
      } else {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to generate egg production PDF report."
        );
      }
    } finally {
      setExporting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

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
            type="button"
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

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2" />

          {success}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() =>
              setSuccess("")
            }
          />
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && (
        <div
          className="alert alert-danger d-flex justify-content-between align-items-center"
          role="alert"
        >
          <span>
            <i className="bi bi-exclamation-triangle me-2" />

            {error}
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={loadData}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Retry"}
            </button>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setError("")
              }
            />
          </div>
        </div>
      )}

      {/* =====================================================
          PDF REPORT
      ===================================================== */}

      <div className="card shadow-sm border-0 mb-4">
        {/* ---------------------------------------------------
            REPORT HEADER
        --------------------------------------------------- */}

        <div className="card-header bg-white">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-1">
                <i className="bi bi-file-earmark-pdf me-2 text-danger" />

                Egg Production Report
              </h5>

              <small className="text-muted">
                Generate a professional PDF
                report for a selected date range.
              </small>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------
            REPORT BODY
        --------------------------------------------------- */}

        <div className="card-body">
          <div className="row g-3 align-items-end">

            {/* =================================================
                FROM DATE
            ================================================= */}

            <div className="col-md-4">
              <label
                htmlFor="productionReportFromDate"
                className="form-label fw-semibold"
              >
                From Date
              </label>

              <input
                id="productionReportFromDate"
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
                htmlFor="productionReportToDate"
                className="form-label fw-semibold"
              >
                To Date
              </label>

              <input
                id="productionReportToDate"
                type="date"
                className="form-control"
                value={reportToDate}
                min={
                  reportFromDate ||
                  undefined
                }
                onChange={(e) =>
                  setReportToDate(
                    e.target.value
                  )
                }
              />
            </div>

            {/* =================================================
                OPEN PDF
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
                    />

                    Generating PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2" />

                    Open Production PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------
              REPORT INFORMATION
          --------------------------------------------------- */}

          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1" />

              The report is generated by the
              Django backend and opens in a new
              browser tab. It includes egg
              production records between the
              selected dates.
            </small>
          </div>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <EggProductionStats
        statistics={statistics}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <EggProductionTable
        data={data}
        flocks={flocks}
        loading={loading}
        saving={saving}
        deleting={deleting}
        onEdit={openEditModal}
        onDelete={confirmDelete}
      />

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <EggProductionModal
        show={show}
        saving={saving}
        editingId={editingId}
        form={form}
        flocks={flocks}
        calculations={calculations}
        formError={formError}
        onClose={closeModal}
        onChange={handleChange}
        onSave={save}
      />

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <ConfirmModal
        show={!!deleteId}
        onHide={() =>
          !deleting &&
          setDeleteId(null)
        }
        onConfirm={remove}
        loading={deleting}
      />
    </>
  );
}