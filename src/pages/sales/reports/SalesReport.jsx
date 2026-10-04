import React from "react";

const SalesReport = ({
  reportFromDate,
  reportToDate,

  setReportFromDate,
  setReportToDate,

  exporting,
  exportPDF,
}) => {
  return (
    <div className="form-card mb-4">

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>

          <h5 className="mb-1">
            Sales Report
          </h5>

          <small className="text-muted">
            Generate a professional sales report
            for a selected date range.
          </small>

        </div>

        <i className="bi bi-file-earmark-pdf fs-3 text-danger"></i>

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
            value={reportFromDate}
            onChange={(e) =>
              setReportFromDate(
                e.target.value
              )
            }
            disabled={exporting}
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
            value={reportToDate}
            onChange={(e) =>
              setReportToDate(
                e.target.value
              )
            }
            disabled={exporting}
          />

        </div>

        {/* EXPORT */}

        <div className="col-md-4">

          <button
            type="button"
            className="btn btn-danger w-100"
            onClick={exportPDF}
            disabled={exporting}
          >

            {exporting ? (

              <>
                <span className="spinner-border spinner-border-sm me-2"></span>

                Generating PDF...
              </>

            ) : (

              <>
                <i className="bi bi-file-earmark-pdf me-2"></i>

                Export Sales PDF
              </>

            )}

          </button>

        </div>

      </div>

    </div>
  );
};

export default SalesReport;