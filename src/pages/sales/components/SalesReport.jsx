import React, {
  useMemo,
  useState,
} from "react";

import api from "../../../services/api";

import {
  formatMoney,
  getPaymentStatus,
  getPaymentStatusLabel,
} from "../utils/salesHelpers";

// ==========================================================
// DJANGO BACKEND PDF ENDPOINT
// ==========================================================

const SALES_REPORT_PDF_URL =
  "/reports/sales/pdf/";

export default function SalesReport({
  sales = [],
  customers = [],
  getCustomerName,
  getSalePaid,
  getSaleBalance,
}) {
  const [showReport, setShowReport] =
    useState(false);

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [generatingPdf, setGeneratingPdf] =
    useState(false);

  const [reportError, setReportError] =
    useState("");

  // ==========================================================
  // FILTER REPORT DATA
  // ==========================================================

  const reportSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = String(
        sale.date || ""
      );

      if (
        dateFrom &&
        saleDate < dateFrom
      ) {
        return false;
      }

      if (
        dateTo &&
        saleDate > dateTo
      ) {
        return false;
      }

      return true;
    });
  }, [
    sales,
    dateFrom,
    dateTo,
  ]);

  // ==========================================================
  // REPORT TOTALS
  // ==========================================================

  const reportTotals = useMemo(() => {
    const totals = {
      sales: 0,
      paid: 0,
      outstanding: 0,
    };

    reportSales.forEach((sale) => {
      totals.sales += Number(
        sale.total || 0
      );

      totals.paid += Number(
        getSalePaid(sale) || 0
      );

      totals.outstanding += Number(
        getSaleBalance(sale) || 0
      );
    });

    return totals;
  }, [
    reportSales,
    getSalePaid,
    getSaleBalance,
  ]);

  // ==========================================================
  // OPEN REPORT
  // ==========================================================

  const openReport = () => {
    setReportError("");
    setShowReport(true);
  };

  // ==========================================================
  // CLOSE REPORT
  // ==========================================================

  const closeReport = () => {
    if (generatingPdf) {
      return;
    }

    setShowReport(false);
    setReportError("");
  };

  // ==========================================================
  // RESET DATES
  // ==========================================================

  const resetDates = () => {
    if (generatingPdf) {
      return;
    }

    setDateFrom("");
    setDateTo("");
    setReportError("");
  };

  // ==========================================================
  // GENERATE BACKEND PDF
  // ==========================================================

  const generatePdfReport = async () => {
    if (generatingPdf) {
      return;
    }

    setReportError("");

    // ========================================================
    // VALIDATE FROM DATE
    // ========================================================

    if (!dateFrom) {
      setReportError(
        "Please select the From Date before generating the report."
      );

      return;
    }

    // ========================================================
    // VALIDATE TO DATE
    // ========================================================

    if (!dateTo) {
      setReportError(
        "Please select the To Date before generating the report."
      );

      return;
    }

    // ========================================================
    // VALIDATE DATE RANGE
    // ========================================================

    if (dateFrom > dateTo) {
      setReportError(
        "From Date cannot be later than To Date."
      );

      return;
    }

    try {
      setGeneratingPdf(true);

      // ======================================================
      // PARAMETERS EXPECTED BY DJANGO
      // ======================================================

      const params = {
        from_date: dateFrom,
        to_date: dateTo,
      };

      console.log(
        "Generating Sales PDF with:",
        params
      );

      // ======================================================
      // CALL DJANGO REPORT ENDPOINT
      // ======================================================

      const response = await api.get(
        SALES_REPORT_PDF_URL,
        {
          params,
          responseType: "blob",
        }
      );

      // ======================================================
      // VERIFY RESPONSE
      // ======================================================

      if (!response?.data) {
        throw new Error(
          "The server returned an empty PDF response."
        );
      }

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
      // CREATE TEMPORARY URL
      // ======================================================

      const pdfUrl =
        window.URL.createObjectURL(
          blob
        );

      // ======================================================
      // OPEN PDF IN NEW TAB
      // ======================================================

      const newWindow =
        window.open(
          pdfUrl,
          "_blank"
        );

      // ======================================================
      // POPUP BLOCKED
      // ======================================================

      if (!newWindow) {
        const link =
          document.createElement("a");

        link.href = pdfUrl;

        link.download =
          `kukufarm-sales-report-${dateFrom}-to-${dateTo}.pdf`;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();
      }

      // ======================================================
      // CLEAN OBJECT URL LATER
      // ======================================================

      setTimeout(() => {
        window.URL.revokeObjectURL(
          pdfUrl
        );
      }, 60000);

    } catch (error) {
      console.error(
        "Sales PDF generation failed:",
        error
      );

      // ======================================================
      // DEFAULT ERROR
      // ======================================================

      let message =
        "Failed to generate sales report.";

      // ======================================================
      // HANDLE DJANGO / AXIOS ERROR
      // ======================================================

      try {
        const errorData =
          error?.response?.data;

        if (
          errorData instanceof Blob
        ) {
          const text =
            await errorData.text();

          if (text) {
            try {
              const json =
                JSON.parse(text);

              message =
                json.detail ||
                json.error ||
                json.message ||
                message;
            } catch {
              message = text;
            }
          }
        } else if (
          errorData &&
          typeof errorData ===
            "object"
        ) {
          message =
            errorData.detail ||
            errorData.error ||
            errorData.message ||
            message;
        } else if (
          error?.message
        ) {
          message =
            error.message;
        }
      } catch (parseError) {
        console.error(
          "Could not parse PDF error:",
          parseError
        );
      }

      setReportError(message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* ======================================================
          SALES REPORT BUTTON
      ====================================================== */}

      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={openReport}
      >
        <i className="bi bi-file-earmark-bar-graph me-2" />

        Sales Report
      </button>

      {/* ======================================================
          REPORT MODAL
      ====================================================== */}

      {showReport && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">

              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="modal-header">

                <div>
                  <h5 className="modal-title mb-1">
                    Sales Report
                  </h5>

                  <small className="text-muted">
                    Generate sales report from
                    the Django backend
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReport}
                  disabled={
                    generatingPdf
                  }
                />

              </div>

              {/* ==================================================
                  BODY
              ================================================== */}

              <div className="modal-body">

                {/* ================================================
                    ERROR
                ================================================= */}

                {reportError && (
                  <div
                    className="alert alert-danger d-flex align-items-start"
                    role="alert"
                  >

                    <i className="bi bi-exclamation-triangle-fill me-2 mt-1" />

                    <div>
                      <strong>
                        Report generation failed
                      </strong>

                      <div className="small mt-1">
                        {reportError}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-close ms-auto"
                      onClick={() =>
                        setReportError("")
                      }
                    />

                  </div>
                )}

                {/* ================================================
                    DATE FILTERS
                ================================================= */}

                <div className="row g-3 mb-4">

                  {/* FROM DATE */}

                  <div className="col-md-4">

                    <label className="form-label">
                      From Date
                      <span className="text-danger">
                        {" "}*
                      </span>
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={dateFrom}
                      onChange={(event) => {
                        setDateFrom(
                          event.target.value
                        );

                        setReportError("");
                      }}
                      disabled={
                        generatingPdf
                      }
                    />

                  </div>

                  {/* TO DATE */}

                  <div className="col-md-4">

                    <label className="form-label">
                      To Date
                      <span className="text-danger">
                        {" "}*
                      </span>
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={dateTo}
                      onChange={(event) => {
                        setDateTo(
                          event.target.value
                        );

                        setReportError("");
                      }}
                      disabled={
                        generatingPdf
                      }
                    />

                  </div>

                  {/* RESET */}

                  <div className="col-md-4 d-flex align-items-end">

                    <button
                      type="button"
                      className="btn btn-light w-100"
                      onClick={resetDates}
                      disabled={
                        generatingPdf
                      }
                    >
                      <i className="bi bi-arrow-counterclockwise me-2" />

                      Reset Dates
                    </button>

                  </div>

                </div>

                {/* ================================================
                    SUMMARY
                ================================================= */}

                <div className="row g-3 mb-4">

                  {/* TOTAL SALES */}

                  <div className="col-md-4">

                    <div className="border rounded p-3 h-100">

                      <div className="small text-muted">
                        Total Sales
                      </div>

                      <div className="fs-5 fw-bold">
                        TZS{" "}
                        {formatMoney(
                          reportTotals.sales
                        )}
                      </div>

                    </div>

                  </div>

                  {/* TOTAL PAID */}

                  <div className="col-md-4">

                    <div className="border rounded p-3 h-100">

                      <div className="small text-muted">
                        Total Paid
                      </div>

                      <div className="fs-5 fw-bold text-success">
                        TZS{" "}
                        {formatMoney(
                          reportTotals.paid
                        )}
                      </div>

                    </div>

                  </div>

                  {/* OUTSTANDING */}

                  <div className="col-md-4">

                    <div className="border rounded p-3 h-100">

                      <div className="small text-muted">
                        Outstanding
                      </div>

                      <div className="fs-5 fw-bold text-danger">
                        TZS{" "}
                        {formatMoney(
                          reportTotals.outstanding
                        )}
                      </div>

                    </div>

                  </div>

                </div>

                {/* ================================================
                    REPORT INFORMATION
                ================================================= */}

                <div className="alert alert-info">

                  <div className="d-flex">

                    <i className="bi bi-info-circle me-2 mt-1" />

                    <div>

                      <strong>
                        Django Backend PDF
                      </strong>

                      <div className="small mt-1">
                        The final PDF is generated
                        by the KukuFarm Django
                        backend using ReportLab.
                      </div>

                      {dateFrom &&
                        dateTo && (
                          <div className="small mt-1">

                            Reporting Period:{" "}

                            <strong>
                              {dateFrom}
                              {" "}
                              to
                              {" "}
                              {dateTo}
                            </strong>

                          </div>
                        )}

                    </div>

                  </div>

                </div>

                {/* ================================================
                    PREVIEW TABLE
                ================================================= */}

                <div className="table-responsive">

                  <table className="table table-bordered table-hover align-middle">

                    <thead className="table-light">

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          Invoice
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Products
                        </th>

                        <th className="text-end">
                          Amount
                        </th>

                        <th className="text-end">
                          Paid
                        </th>

                        <th className="text-end">
                          Balance
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {reportSales.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="9"
                            className="text-center py-4 text-muted"
                          >
                            No sales found for
                            the selected period.
                          </td>

                        </tr>

                      ) : (

                        reportSales.map(
                          (
                            sale,
                            index
                          ) => {

                            const paid =
                              getSalePaid(
                                sale
                              );

                            const balance =
                              getSaleBalance(
                                sale
                              );

                            const status =
                              sale.payment_status ||
                              getPaymentStatus(
                                sale.total,
                                paid
                              );

                            const products =
                              (
                                sale.items ||
                                []
                              )
                                .map(
                                  (
                                    item
                                  ) =>
                                    item.product ||
                                    item.product_name ||
                                    "-"
                                )
                                .join(
                                  ", "
                                );

                            return (
                              <tr
                                key={
                                  sale.id ||
                                  index
                                }
                              >

                                <td>
                                  {index +
                                    1}
                                </td>

                                <td>
                                  {sale.invoice_no ||
                                    "-"}
                                </td>

                                <td>
                                  {sale.date ||
                                    "-"}
                                </td>

                                <td>
                                  {getCustomerName(
                                    sale.customer
                                  )}
                                </td>

                                <td>
                                  {products ||
                                    "-"}
                                </td>

                                <td className="text-end">

                                  {formatMoney(
                                    sale.total
                                  )}

                                </td>

                                <td className="text-end text-success">

                                  {formatMoney(
                                    paid
                                  )}

                                </td>

                                <td className="text-end text-danger">

                                  {formatMoney(
                                    balance
                                  )}

                                </td>

                                <td>

                                  <span
                                    className={`badge ${
                                      status ===
                                      "paid"
                                        ? "bg-success"
                                        : status ===
                                          "partial"
                                        ? "bg-warning text-dark"
                                        : "bg-danger"
                                    }`}
                                  >

                                    {getPaymentStatusLabel(
                                      status
                                    )}

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )

                      )}

                    </tbody>

                    {/* ============================================
                        TOTALS
                    ============================================= */}

                    {reportSales.length >
                      0 && (
                      <tfoot className="table-light">

                        <tr>

                          <th
                            colSpan="5"
                            className="text-end"
                          >
                            TOTAL
                          </th>

                          <th className="text-end">

                            {formatMoney(
                              reportTotals.sales
                            )}

                          </th>

                          <th className="text-end text-success">

                            {formatMoney(
                              reportTotals.paid
                            )}

                          </th>

                          <th className="text-end text-danger">

                            {formatMoney(
                              reportTotals.outstanding
                            )}

                          </th>

                          <th />

                        </tr>

                      </tfoot>
                    )}

                  </table>

                </div>

              </div>

              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReport}
                  disabled={
                    generatingPdf
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    generatePdfReport
                  }
                  disabled={
                    generatingPdf ||
                    reportSales.length ===
                      0 ||
                    !dateFrom ||
                    !dateTo
                  }
                >

                  {generatingPdf ? (
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
      )}
    </>
  );
}