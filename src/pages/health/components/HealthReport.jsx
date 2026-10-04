import React, { useState } from "react";
import api from "../../../services/api";

const today = new Date()
  .toISOString()
  .split("T")[0];

export default function HealthReport({
  onError,
  onSuccess,
}) {
  const [showOptions, setShowOptions] =
    useState(false);

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState(today);

  const [generating, setGenerating] =
    useState(false);

  const generateReport = async () => {
    onError("");
    onSuccess("");

    if (!fromDate) {
      onError(
        "Please select the report start date."
      );
      return;
    }

    if (!toDate) {
      onError(
        "Please select the report end date."
      );
      return;
    }

    if (fromDate > toDate) {
      onError(
        "Report start date cannot be after the end date."
      );
      return;
    }

    try {
      setGenerating(true);

      const response = await api.get(
        "/reports/health/pdf/",
        {
          params: {
            from_date: fromDate,
            to_date: toDate,
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

      const newWindow =
        window.open(
          pdfUrl,
          "_blank"
        );

      if (!newWindow) {
        onError(
          "The PDF could not be opened because your browser blocked the new tab. Please allow pop-ups for this site."
        );

        window.URL.revokeObjectURL(
          pdfUrl
        );

        return;
      }

      onSuccess(
        "Health report generated successfully."
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(
          pdfUrl
        );
      }, 30000);
    } catch (err) {
      const data = err?.response?.data;

      if (
        data instanceof Blob
      ) {
        try {
          const text =
            await data.text();

          try {
            const json =
              JSON.parse(text);

            onError(
              json.detail ||
                json.message ||
                "Failed to generate health report."
            );
          } catch {
            onError(text);
          }
        } catch {
          onError(
            "Failed to generate health report."
          );
        }
      } else {
        onError(
          err?.message ||
            "Failed to generate health report."
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              Health Reports
            </h5>

            <small className="text-muted">
              Generate a professional PDF report for health,
              vaccinations and mortality.
            </small>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setShowOptions(
                !showOptions
              )
            }
          >
            <i className="bi bi-file-earmark-pdf me-2" />
            Generate Report
          </button>
        </div>

        {showOptions && (
          <div className="border rounded p-3 mt-3 bg-light">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">
                  From Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
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
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="col-md-4">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                      generateReport
                    }
                    disabled={generating}
                  >
                    <i className="bi bi-file-earmark-pdf me-2" />

                    {generating
                      ? "Generating..."
                      : "Generate PDF"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowOptions(
                        false
                      );
                      setFromDate("");
                      setToDate(today);
                    }}
                    disabled={generating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div className="small text-muted mt-3">
              The report will include health records,
              vaccinations and mortality records within
              the selected date range.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}