import React from "react";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  });
}

export default function SalesSummary({
  eggStock,
  loadingEggStock,
  eggStockError,
  totalEggsInForm,
  hasEnoughEggStock,
  remainingEggStock,
  totalSales,
  totalPaid,
  totalOutstanding,
  totalCredit,
}) {
  return (
    <>
      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="row g-3 mb-4">
        {/* Egg Stock */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">
                    Available Egg Stock
                  </div>

                  <h4 className="mb-0 fw-bold">
                    {loadingEggStock
                      ? "Loading..."
                      : `${formatMoney(eggStock)} eggs`}
                  </h4>
                </div>

                <div className="bg-warning-subtle rounded p-2">
                  <i className="bi bi-egg-fill text-warning fs-5" />
                </div>
              </div>

              {eggStockError && (
                <div className="small text-danger mt-2">
                  <i className="bi bi-exclamation-triangle me-1" />
                  Unable to verify stock
                </div>
              )}

              {!loadingEggStock &&
                !eggStockError && (
                  <div className="small text-muted mt-2">
                    Current available stock
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">
                    Total Sales
                  </div>

                  <h4 className="mb-0 fw-bold">
                    TZS {formatMoney(totalSales)}
                  </h4>
                </div>

                <div className="bg-primary-subtle rounded p-2">
                  <i className="bi bi-cart-check-fill text-primary fs-5" />
                </div>
              </div>

              <div className="small text-muted mt-2">
                All recorded sales
              </div>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">
                    Total Paid
                  </div>

                  <h4 className="mb-0 fw-bold text-success">
                    TZS {formatMoney(totalPaid)}
                  </h4>
                </div>

                <div className="bg-success-subtle rounded p-2">
                  <i className="bi bi-cash-stack text-success fs-5" />
                </div>
              </div>

              <div className="small text-muted mt-2">
                Payments received
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">
                    Outstanding
                  </div>

                  <h4 className="mb-0 fw-bold text-danger">
                    TZS {formatMoney(totalOutstanding)}
                  </h4>
                </div>

                <div className="bg-danger-subtle rounded p-2">
                  <i className="bi bi-credit-card-2-front-fill text-danger fs-5" />
                </div>
              </div>

              <div className="small text-muted mt-2">
                Unpaid customer balances
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CREDIT SUMMARY
      ===================================================== */}

      {Number(totalCredit || 0) > 0 && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-circle-fill fs-5" />

          <div>
            <strong>Credit Sales:</strong>{" "}
            TZS {formatMoney(totalCredit)}{" "}
            remains outstanding from credit sales.
          </div>
        </div>
      )}

      {/* =====================================================
          CURRENT SALE EGG STOCK CHECK
      ===================================================== */}

      {totalEggsInForm > 0 && (
        <div
          className={`alert ${
            hasEnoughEggStock
              ? "alert-success"
              : "alert-danger"
          } d-flex align-items-start gap-2 mb-4`}
        >
          <i
            className={`bi ${
              hasEnoughEggStock
                ? "bi-check-circle-fill"
                : "bi-exclamation-triangle-fill"
            } fs-5`}
          />

          <div>
            <div className="fw-semibold">
              Egg Stock Check
            </div>

            <div className="small">
              Requested:{" "}
              <strong>
                {formatMoney(totalEggsInForm)}
              </strong>{" "}
              eggs
            </div>

            <div className="small">
              Available:{" "}
              <strong>
                {formatMoney(eggStock)}
              </strong>{" "}
              eggs
            </div>

            {hasEnoughEggStock ? (
              <div className="small mt-1">
                Remaining after this sale:{" "}
                <strong>
                  {formatMoney(remainingEggStock)}
                </strong>{" "}
                eggs
              </div>
            ) : (
              <div className="small mt-1 fw-semibold">
                Insufficient egg stock. This sale
                cannot be saved.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}