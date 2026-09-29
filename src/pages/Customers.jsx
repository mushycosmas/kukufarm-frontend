import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  location: "",
  balance: "",
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
  return Number(value || 0).toLocaleString("en-TZ");
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
| Helpers for Sales / Payment data
|--------------------------------------------------------------------------
*/

function getCustomerId(item) {
  return (
    item?.customer_id ??
    item?.customer?.id ??
    item?.customer
  );
}

function getSaleDate(item) {
  return (
    item?.date ||
    item?.sale_date ||
    item?.transaction_date ||
    item?.created_at
  );
}

function getEggQuantity(item) {
  return Number(
    item?.eggs ??
      item?.egg_quantity ??
      item?.quantity ??
      item?.eggs_sold ??
      item?.quantity_eggs ??
      0
  );
}

function getTrays(item) {
  return Number(
    item?.trays ??
      item?.tray_quantity ??
      item?.egg_trays ??
      0
  );
}

function getSaleAmount(item) {
  return Number(
    item?.total_amount ??
      item?.total ??
      item?.amount ??
      item?.selling_price ??
      item?.grand_total ??
      0
  );
}

function getPaidAmount(item) {
  return Number(
    item?.amount_paid ??
      item?.paid_amount ??
      item?.payment ??
      item?.paid ??
      0
  );
}

function getPaymentDate(item) {
  return (
    item?.date ||
    item?.payment_date ||
    item?.transaction_date ||
    item?.created_at
  );
}

function getPaymentAmount(item) {
  return Number(
    item?.amount ??
      item?.payment_amount ??
      item?.paid_amount ??
      item?.amount_paid ??
      0
  );
}

function getPaymentMethod(item) {
  return (
    item?.payment_method ||
    item?.method ||
    item?.payment_type ||
    "-"
  );
}

/*
|--------------------------------------------------------------------------
| Main Component
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
      balance: Number(form.balance || 0),
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

  const editCustomer = (customer) => {
    setError("");
    setSuccess("");

    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      location: customer.location || "",
      balance: customer.balance ?? "",
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
  | Customer Details
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
       * Load sales belonging to this customer.
       *
       * Main endpoint:
       * /sales/?customer=<id>
       */
      const salesResponse = await api.get(
        `/sales/?customer=${customer.id}`
      );

      const sales = getList(salesResponse);

      /*
       * Some backends may return all sales instead of
       * filtering by customer. Filter again on frontend.
       */
      const filteredSales = sales.filter((sale) => {
        const saleCustomerId = getCustomerId(sale);

        if (
          saleCustomerId === undefined ||
          saleCustomerId === null ||
          saleCustomerId === ""
        ) {
          return true;
        }

        return String(saleCustomerId) === String(customer.id);
      });

      setCustomerSales(filteredSales);

      /*
       * Try to load payments.
       *
       * If your backend has:
       * /sales/payments/?customer=<id>
       *
       * it will be used.
       */
      try {
        const paymentsResponse = await api.get(
          `/sales/payments/?customer=${customer.id}`
        );

        const payments = getList(paymentsResponse);

        const filteredPayments = payments.filter((payment) => {
          const paymentCustomerId = getCustomerId(payment);

          if (
            paymentCustomerId === undefined ||
            paymentCustomerId === null ||
            paymentCustomerId === ""
          ) {
            return true;
          }

          return (
            String(paymentCustomerId) ===
            String(customer.id)
          );
        });

        setCustomerPayments(filteredPayments);
      } catch (paymentError) {
        /*
         * If a separate payments endpoint does not exist,
         * don't prevent the customer details from loading.
         */
        console.warn(
          "Payment endpoint unavailable:",
          paymentError
        );

        setCustomerPayments([]);
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
  | Summary
  |--------------------------------------------------------------------------
  */

  const totalOutstanding = useMemo(() => {
    return data.reduce(
      (sum, customer) =>
        sum + Number(customer.balance || 0),
      0
    );
  }, [data]);

  /*
  |--------------------------------------------------------------------------
  | Customer Details Calculations
  |--------------------------------------------------------------------------
  */

  const customerDetails = useMemo(() => {
    const totalEggs = customerSales.reduce(
      (sum, sale) => sum + getEggQuantity(sale),
      0
    );

    const totalTrays = customerSales.reduce(
      (sum, sale) => sum + getTrays(sale),
      0
    );

    const totalPurchases = customerSales.reduce(
      (sum, sale) => sum + getSaleAmount(sale),
      0
    );

    /*
     * Payments from separate payment records.
     */
    const separatePayments = customerPayments.reduce(
      (sum, payment) =>
        sum + getPaymentAmount(payment),
      0
    );

    /*
     * If sales themselves contain amount_paid,
     * calculate that too.
     */
    const salePayments = customerSales.reduce(
      (sum, sale) => sum + getPaidAmount(sale),
      0
    );

    /*
     * Prefer separate payment records when available.
     */
    const totalPayments =
      customerPayments.length > 0
        ? separatePayments
        : salePayments;

    /*
     * Customer.balance is currently maintained by
     * your customer API.
     */
    const remainingBalance = Number(
      selectedCustomer?.balance || 0
    );

    return {
      totalEggs,
      totalTrays,
      totalPurchases,
      totalPayments,
      remainingBalance,
    };
  }, [
    customerSales,
    customerPayments,
    selectedCustomer,
  ]);

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

            <div className="col-md-3 col-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Payments
                </small>

                <h5 className="mb-0 mt-1 text-success">
                  TZS{" "}
                  {formatMoney(
                    customerDetails.totalPayments
                  )}
                </h5>
              </div>
            </div>

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
                    Egg Purchase History
                  </h5>

                  <small className="text-muted">
                    All egg purchases made by this customer
                  </small>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Eggs</th>
                        <th>Trays</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {customerSales.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
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
                              getSaleAmount(sale);

                            const paid =
                              getPaidAmount(sale);

                            const balance =
                              Math.max(
                                amount - paid,
                                0
                              );

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
                                  {formatNumber(
                                    getEggQuantity(sale)
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    getTrays(sale)
                                  )}
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
                                      ? "text-danger"
                                      : "text-success"
                                  }
                                >
                                  TZS{" "}
                                  {formatMoney(
                                    balance
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
                    Payment History
                  </h5>

                  <small className="text-muted">
                    Payments received from this customer
                  </small>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>

                    <tbody>
                      {customerPayments.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-5 text-muted"
                          >
                            <i className="bi bi-wallet2 fs-2 d-block mb-2"></i>

                            No separate payment records
                            found.
                          </td>
                        </tr>
                      ) : (
                        customerPayments.map(
                          (payment, index) => (
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
                          )
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

                  {/* BALANCE */}

                  <div className="col-md-4">
                    <label className="form-label">
                      Opening Balance (TZS)
                    </label>

                    <input
                      type="number"
                      name="balance"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={form.balance}
                      onChange={handleChange}
                      placeholder="0"
                    />

                    <small className="text-muted">
                      Leave 0 if the customer has no
                      outstanding balance.
                    </small>
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
                  ) : filteredCustomers.length ===
                    0 ? (
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
                        const balance = Number(
                          customer.balance || 0
                        );

                        return (
                          <tr
                            key={customer.id}
                          >
                            {/* CUSTOMER NAME */}

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