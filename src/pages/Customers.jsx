
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  location: "",
};

function getList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  return [];
}

function extractError(error) {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || "Something went wrong.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : value;

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-TZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-TZ");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/*
|--------------------------------------------------------------------------
| Sale Helpers
|--------------------------------------------------------------------------
*/

function getCustomerId(item) {
  return (
    item?.customer_id ??
    item?.customer?.id ??
    item?.customer
  );
}

function getSaleDate(sale) {
  return (
    sale?.date ||
    sale?.sale_date ||
    sale?.transaction_date ||
    sale?.created_at
  );
}

function getSaleTotal(sale) {
  return Number(sale?.total || 0);
}

function getSalePaid(sale) {
  /*
   * IMPORTANT:
   *
   * Sale.amount_paid is the cumulative amount paid.
   *
   * Do NOT use SalePayment total here because
   * SalePayment contains only individual payment
   * transactions and may not include the initial payment.
   */
  return Number(sale?.amount_paid || 0);
}

function getSaleBalance(sale) {
  /*
   * Backend already defines:
   *
   * balance = total - amount_paid
   *
   * We calculate it again on frontend to make the
   * customer profile reliable even if balance is
   * not serialized by the API.
   */
  const total = getSaleTotal(sale);
  const paid = getSalePaid(sale);

  return Math.max(total - paid, 0);
}

/*
|--------------------------------------------------------------------------
| Sale Item Helpers
|--------------------------------------------------------------------------
*/

function getSaleItems(sale) {
  return Array.isArray(sale?.items) ? sale.items : [];
}

function getEggsFromItem(item) {
  if (!item?.is_egg) {
    return 0;
  }

  const quantity = Number(item?.quantity || 0);

  /*
   * Backend:
   *
   * tray = 30 eggs
   * piece = 1 egg
   */
  if (item?.unit === "tray") {
    return quantity * 30;
  }

  return quantity;
}

function getTraysFromItem(item) {
  if (!item?.is_egg) {
    return 0;
  }

  if (item?.unit !== "tray") {
    return 0;
  }

  return Number(item?.quantity || 0);
}

function getSaleEggs(sale) {
  return getSaleItems(sale).reduce(
    (sum, item) => sum + getEggsFromItem(item),
    0
  );
}

function getSaleTrays(sale) {
  return getSaleItems(sale).reduce(
    (sum, item) => sum + getTraysFromItem(item),
    0
  );
}

/*
|--------------------------------------------------------------------------
| Payment Helpers
|--------------------------------------------------------------------------
*/

function getPaymentDate(payment) {
  return (
    payment?.date ||
    payment?.payment_date ||
    payment?.transaction_date ||
    payment?.created_at
  );
}

function getPaymentAmount(payment) {
  return Number(
    payment?.amount ??
      payment?.payment_amount ??
      payment?.paid_amount ??
      payment?.amount_paid ??
      0
  );
}

function getPaymentMethod(payment) {
  return (
    payment?.payment_method ||
    payment?.method ||
    payment?.payment_type ||
    "-"
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Customers() {
  const [data, setData] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Customer Details
  |--------------------------------------------------------------------------
  */

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Customers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/customers/");
      setData(getList(response));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Save Customer
  |--------------------------------------------------------------------------
  */

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
    };

    try {
      if (editingId) {
        await api.patch(
          `/customers/${editingId}/`,
          payload
        );

        showSuccess("Customer updated successfully.");
      } else {
        await api.post("/customers/", payload);

        showSuccess("Customer added successfully.");
      }

      resetForm();

      await loadCustomers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Customer
  |--------------------------------------------------------------------------
  */

  const editCustomer = (customer) => {
    setError("");
    setSuccess("");

    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      location: customer.location || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Customer
  |--------------------------------------------------------------------------
  */

  const deleteCustomer = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/customers/${id}/`);

      showSuccess("Customer deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      if (selectedCustomer?.id === id) {
        closeCustomerDetails();
      }

      await loadCustomers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Customer Details
  |--------------------------------------------------------------------------
  */

  const openCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSales([]);
    setCustomerPayments([]);
    setDetailsError("");
    setDetailsLoading(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    try {
      /*
       * --------------------------------------------------------
       * SALES
       * --------------------------------------------------------
       *
       * Your backend supports:
       *
       * /sales/?customer=<id>
       *
       * SaleSerializer returns:
       *
       * {
       *   total,
       *   amount_paid,
       *   balance,
       *   items: [...]
       * }
       */
      const salesResponse = await api.get(
        `/sales/?customer=${customer.id}`
      );

      const sales = getList(salesResponse);

      /*
       * Extra frontend filtering in case the backend
       * does not apply the filter correctly.
       */
      const filteredSales = sales.filter((sale) => {
        const saleCustomerId = getCustomerId(sale);

        /*
         * If the API does not serialize customer ID,
         * keep the sale because it came from the
         * customer-filtered endpoint.
         */
        if (
          saleCustomerId === undefined ||
          saleCustomerId === null ||
          saleCustomerId === ""
        ) {
          return true;
        }

        return (
          String(saleCustomerId) ===
          String(customer.id)
        );
      });

      setCustomerSales(filteredSales);

      /*
       * --------------------------------------------------------
       * PAYMENTS
       * --------------------------------------------------------
       *
       * SalePaymentViewSet is normally registered as:
       *
       * /sales/payments/
       *
       * However, SalePaymentSerializer does NOT expose
       * customer_id directly.
       *
       * It exposes:
       *
       * sale
       * invoice_no
       * customer_name
       *
       * Therefore we don't depend on customer_id here.
       */
      try {
        const paymentsResponse = await api.get(
          `/sales/payments/?sale__customer=${customer.id}`
        );

        const payments = getList(paymentsResponse);

        setCustomerPayments(payments);
      } catch (paymentError) {
        /*
         * DjangoFilterBackend may not support the
         * nested sale__customer filter depending on
         * filterset configuration.
         *
         * In that case, load all payments and match
         * their sale IDs against this customer's sales.
         */
        try {
          const allPaymentsResponse = await api.get(
            "/sales/payments/"
          );

          const allPayments =
            getList(allPaymentsResponse);

          const customerSaleIds = new Set(
            filteredSales.map((sale) =>
              String(sale.id)
            )
          );

          const filteredPayments = allPayments.filter(
            (payment) =>
              payment?.sale &&
              customerSaleIds.has(
                String(
                  payment.sale?.id ??
                    payment.sale
                )
              )
          );

          setCustomerPayments(filteredPayments);
        } catch (fallbackError) {
          console.warn(
            "Payment endpoint unavailable:",
            fallbackError
          );

          setCustomerPayments([]);
        }
      }
    } catch (err) {
      setDetailsError(extractError(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerSales([]);
    setCustomerPayments([]);
    setDetailsError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((customer) => {
      return (
        String(customer.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer.phone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer.location || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search]);

  /*
  |--------------------------------------------------------------------------
  | Customer Balance
  |--------------------------------------------------------------------------
  */

  const getCustomerBalance = (customer) => {
    /*
     * If the customer API already provides balance,
     * use it for the customer list.
     *
     * Detailed customer profile uses the actual
     * Sale records as the source of truth.
     */
    return Number(customer?.balance || 0);
  };

  /*
  |--------------------------------------------------------------------------
  | Total Outstanding
  |--------------------------------------------------------------------------
  */

  const totalOutstanding = useMemo(() => {
    return data.reduce(
      (sum, customer) =>
        sum + getCustomerBalance(customer),
      0
    );
  }, [data]);

  /*
  |--------------------------------------------------------------------------
  | Customer Details Calculations
  |--------------------------------------------------------------------------
  */

  const customerDetails = useMemo(() => {
    /*
     * Total eggs purchased.
     *
     * IMPORTANT:
     * Eggs are stored inside SaleItem.
     */
    const totalEggs = customerSales.reduce(
      (sum, sale) =>
        sum + getSaleEggs(sale),
      0
    );

    /*
     * Total trays purchased.
     */
    const totalTrays = customerSales.reduce(
      (sum, sale) =>
        sum + getSaleTrays(sale),
      0
    );

    /*
     * Total value of all customer purchases.
     */
    const totalPurchases = customerSales.reduce(
      (sum, sale) =>
        sum + getSaleTotal(sale),
      0
    );

    /*
     * Total amount actually paid.
     *
     * IMPORTANT:
     *
     * Sale.amount_paid is cumulative.
     *
     * Therefore:
     *
     * totalPayments =
     *     SUM(Sale.amount_paid)
     *
     * NOT:
     *
     * SUM(SalePayment.amount)
     *
     * because SalePayment may only contain
     * additional payments.
     */
    const totalPayments = customerSales.reduce(
      (sum, sale) =>
        sum + getSalePaid(sale),
      0
    );

    /*
     * Outstanding customer balance.
     *
     * This is calculated from every sale:
     *
     * total - cumulative paid
     */
    const remainingBalance = customerSales.reduce(
      (sum, sale) =>
        sum + getSaleBalance(sale),
      0
    );

    return {
      totalEggs,
      totalTrays,
      totalPurchases,
      totalPayments,
      remainingBalance,
    };
  }, [customerSales]);

  /*
  |--------------------------------------------------------------------------
  | Render Customer Details
  |--------------------------------------------------------------------------
  */

  const renderCustomerDetails = () => {
    if (!selectedCustomer) {
      return null;
    }

    return (
      <div className="mb-4">
        <div className="form-card">

          {/* HEADER */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">
                <i className="bi bi-person-circle me-2 text-success"></i>
                Customer Details
              </h5>

              <small className="text-muted">
                Customer statement and transaction history
              </small>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={closeCustomerDetails}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to Customers
            </button>
          </div>

          {/* CUSTOMER PROFILE */}

          <div className="row g-3 mb-4">

            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <small className="text-muted d-block">
                  Customer
                </small>

                <h5 className="mb-1 mt-1">
                  {selectedCustomer.name}
                </h5>

                <div className="text-muted">
                  <i className="bi bi-telephone me-1"></i>
                  {selectedCustomer.phone || "-"}
                </div>

                <div className="text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  {selectedCustomer.location || "-"}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <small className="text-muted d-block">
                  Total Purchases
                </small>

                <h5 className="mb-0 mt-1">
                  TZS{" "}
                  {formatMoney(
                    customerDetails.totalPurchases
                  )}
                </h5>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <small className="text-muted d-block">
                  Remaining Balance
                </small>

                <h5
                  className={`mb-0 mt-1 ${
                    customerDetails.remainingBalance > 0
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  TZS{" "}
                  {formatMoney(
                    customerDetails.remainingBalance
                  )}
                </h5>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}

          <div className="row g-3 mb-4">

            {/* EGGS */}

            <div className="col-md-3 col-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Eggs Bought
                </small>

                <h5 className="mb-0 mt-1">
                  {formatNumber(
                    customerDetails.totalEggs
                  )}
                </h5>

                <small className="text-muted">
                  eggs
                </small>
              </div>
            </div>

            {/* TRAYS */}

            <div className="col-md-3 col-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Trays Bought
                </small>

                <h5 className="mb-0 mt-1">
                  {formatNumber(
                    customerDetails.totalTrays
                  )}
                </h5>

                <small className="text-muted">
                  trays
                </small>
              </div>
            </div>

            {/* PAYMENTS */}

            <div className="col-md-3 col-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Total Paid
                </small>

                <h5 className="mb-0 mt-1 text-success">
                  TZS{" "}
                  {formatMoney(
                    customerDetails.totalPayments
                  )}
                </h5>
              </div>
            </div>

            {/* OUTSTANDING */}

            <div className="col-md-3 col-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Outstanding
                </small>

                <h5
                  className={`mb-0 mt-1 ${
                    customerDetails.remainingBalance > 0
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  TZS{" "}
                  {formatMoney(
                    customerDetails.remainingBalance
                  )}
                </h5>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {detailsError && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {detailsError}
            </div>
          )}

          {/* LOADING */}

          {detailsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>

              <div className="mt-2 text-muted">
                Loading customer transactions...
              </div>
            </div>
          ) : (
            <>
              {/* PURCHASE HISTORY */}

              <div className="table-card mb-4">

                <div className="p-3 border-bottom">
                  <h5 className="mb-1">
                    <i className="bi bi-cart-check me-2 text-success"></i>
                    Purchase History
                  </h5>

                  <small className="text-muted">
                    All purchases made by this customer
                  </small>
                </div>

                <div className="table-responsive">

                  <table className="table align-middle mb-0">

                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice</th>
                        <th>Eggs</th>
                        <th>Trays</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>

                      {customerSales.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="text-center py-5 text-muted"
                          >
                            <i className="bi bi-cart-x fs-2 d-block mb-2"></i>

                            No purchase records found
                            for this customer.
                          </td>
                        </tr>
                      ) : (
                        customerSales.map(
                          (sale, index) => {

                            const amount =
                              getSaleTotal(sale);

                            const paid =
                              getSalePaid(sale);

                            const balance =
                              getSaleBalance(sale);

                            const eggs =
                              getSaleEggs(sale);

                            const trays =
                              getSaleTrays(sale);

                            return (
                              <tr
                                key={
                                  sale.id ||
                                  `sale-${index}`
                                }
                              >

                                <td>
                                  {formatDate(
                                    getSaleDate(sale)
                                  )}
                                </td>

                                <td>
                                  <strong>
                                    {sale.invoice_no ||
                                      "-"}
                                  </strong>
                                </td>

                                <td>
                                  {formatNumber(eggs)}
                                </td>

                                <td>
                                  {formatNumber(trays)}
                                </td>

                                <td>
                                  TZS{" "}
                                  {formatMoney(amount)}
                                </td>

                                <td className="text-success">
                                  TZS{" "}
                                  {formatMoney(paid)}
                                </td>

                                <td
                                  className={
                                    balance > 0
                                      ? "text-danger fw-semibold"
                                      : "text-success"
                                  }
                                >
                                  TZS{" "}
                                  {formatMoney(balance)}
                                </td>

                                <td>
                                  {sale.payment_status ===
                                  "paid" ? (
                                    <span className="badge bg-success">
                                      Paid
                                    </span>
                                  ) : sale.payment_status ===
                                    "partial" ? (
                                    <span className="badge bg-warning text-dark">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="badge bg-danger">
                                      Unpaid
                                    </span>
                                  )}
                                </td>

                              </tr>
                            );
                          }
                        )
                      )}

                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAYMENT HISTORY */}

              <div className="table-card">

                <div className="p-3 border-bottom">
                  <h5 className="mb-1">
                    <i className="bi bi-cash-stack me-2 text-success"></i>
                    Additional Payment History
                  </h5>

                  <small className="text-muted">
                    Individual additional payments received
                    from this customer
                  </small>
                </div>

                <div className="table-responsive">

                  <table className="table align-middle mb-0">

                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>

                    <tbody>

                      {customerPayments.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-5 text-muted"
                          >
                            <i className="bi bi-wallet2 fs-2 d-block mb-2"></i>

                            No additional payment
                            records found.
                          </td>
                        </tr>
                      ) : (
                        customerPayments.map(
                          (payment, index) => {

                            return (
                              <tr
                                key={
                                  payment.id ||
                                  `payment-${index}`
                                }
                              >

                                <td>
                                  {formatDate(
                                    getPaymentDate(
                                      payment
                                    )
                                  )}
                                </td>

                                <td>
                                  {payment.invoice_no ||
                                    payment.sale?.invoice_no ||
                                    "-"}
                                </td>

                                <td className="text-success fw-semibold">
                                  TZS{" "}
                                  {formatMoney(
                                    getPaymentAmount(
                                      payment
                                    )
                                  )}
                                </td>

                                <td>
                                  {getPaymentMethod(
                                    payment
                                  )}
                                </td>

                                <td>
                                  {payment.reference ||
                                    payment.transaction_reference ||
                                    payment.receipt_number ||
                                    "-"}
                                </td>

                              </tr>
                            );
                          }
                        )
                      )}

                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage your farm customers and outstanding balances."
        action={
          !showForm &&
          !selectedCustomer && (
            <button
              className="btn btn-success"
              onClick={openAddForm}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Customer
            </button>
          )
        }
      />

      {/* ALERTS */}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* CUSTOMER DETAILS */}

      {selectedCustomer ? (
        renderCustomerDetails()
      ) : (
        <>
          {/* SUMMARY */}

          <div className="row g-3 mb-4">

            <div className="col-md-6">
              <div className="form-card h-100">
                <small className="text-muted">
                  Total Customers
                </small>

                <h4 className="mb-0 mt-1">
                  {data.length.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-card h-100">
                <small className="text-muted">
                  Outstanding Balance
                </small>

                <h4 className="mb-0 mt-1 text-danger">
                  TZS{" "}
                  {formatMoney(totalOutstanding)}
                </h4>
              </div>
            </div>

          </div>

          {/* ADD / EDIT FORM */}

          {showForm && (
            <div className="form-card mb-4">

              <div className="d-flex justify-content-between align-items-center mb-3">

                <h5 className="mb-0">
                  {editingId
                    ? "Edit Customer"
                    : "Add Customer"}
                </h5>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetForm}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Cancel
                </button>

              </div>

              <form onSubmit={save}>

                <div className="row g-3">

                  {/* NAME */}

                  <div className="col-md-4">
                    <label className="form-label">
                      Customer Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  {/* PHONE */}

                  <div className="col-md-4">
                    <label className="form-label">
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 0712 345 678"
                    />
                  </div>

                  {/* LOCATION */}

                  <div className="col-md-4">
                    <label className="form-label">
                      Location
                    </label>

                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Dodoma"
                    />
                  </div>

                  {/* BUTTONS */}

                  <div className="col-12">

                    <button
                      type="submit"
                      className="btn btn-success me-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-1"></i>
                          {editingId
                            ? "Update Customer"
                            : "Save Customer"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                  </div>

                </div>
              </form>
            </div>
          )}

          {/* CUSTOMERS TABLE */}

          <div className="table-card">

            <div className="d-flex justify-content-between align-items-center p-3">

              <div>
                <h5 className="mb-1">
                  Customer Records
                </h5>

                <small className="text-muted">
                  {filteredCustomers.length} customer
                  {filteredCustomers.length !== 1
                    ? "s"
                    : ""}
                </small>
              </div>

              <div
                style={{
                  maxWidth: "320px",
                  width: "100%",
                }}
              >
                <div className="input-group">

                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />

                </div>
              </div>

            </div>

            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-5"
                      >
                        <div className="spinner-border text-success"></div>

                        <div className="mt-2 text-muted">
                          Loading customers...
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-5 text-muted"
                      >
                        <i className="bi bi-people fs-2 d-block mb-2"></i>

                        {search
                          ? "No customers match your search."
                          : "No customers found."}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(
                      (customer) => {

                        const balance =
                          getCustomerBalance(
                            customer
                          );

                        return (
                          <tr key={customer.id}>

                            {/* CUSTOMER */}

                            <td>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none fw-semibold"
                                onClick={() =>
                                  openCustomerDetails(
                                    customer
                                  )
                                }
                                title="View customer details"
                              >
                                <i className="bi bi-person-circle me-2"></i>
                                {customer.name}
                              </button>
                            </td>

                            {/* PHONE */}

                            <td>
                              {customer.phone || "-"}
                            </td>

                            {/* LOCATION */}

                            <td>
                              {customer.location || "-"}
                            </td>

                            {/* BALANCE */}

                            <td
                              className={
                                balance > 0
                                  ? "text-danger fw-semibold"
                                  : "text-success"
                              }
                            >
                              TZS{" "}
                              {formatMoney(balance)}
                            </td>

                            {/* ACTIONS */}

                            <td>
                              <div className="d-flex gap-1">

                                {/* VIEW */}

                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() =>
                                    openCustomerDetails(
                                      customer
                                    )
                                  }
                                  title="View customer details"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() =>
                                    editCustomer(
                                      customer
                                    )
                                  }
                                  title="Edit customer"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    deleteCustomer(
                                      customer.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    customer.id
                                  }
                                  title="Delete customer"
                                >
                                  {deletingId ===
                                  customer.id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <i className="bi bi-trash"></i>
                                  )}
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      }
                    )
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

