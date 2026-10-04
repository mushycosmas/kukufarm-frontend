import React, { useState } from "react";
import api from "../../../services/api";

export default function EggProductionReportButton({
  flock = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/production/reports/pdf/",
        {
          params: {
            flock: flock || undefined,
          },
          responseType: "blob",
        }
      );

      // Create PDF blob
      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      // Create temporary download URL
      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download = `egg-production-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      document.body.appendChild(link);

      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Failed to download egg production PDF:",
        err
      );

      // Handle blob error responses
      if (
        err.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          const data = JSON.parse(text);

          setError(
            data.detail ||
              data.message ||
              "Failed to generate PDF report."
          );
        } catch {
          setError(
            "Failed to generate PDF report."
          );
        }
      } else {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to generate PDF report."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-danger"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />

            Generating...
          </>
        ) : (
          <>
            <i className="bi bi-file-earmark-pdf me-2" />
            Export PDF
          </>
        )}
      </button>

      {error && (
        <div className="small text-danger mt-1">
          {error}
        </div>
      )}
    </div>
  );
}