import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const Customers = () => {
  /* =========================================================
     FORM
  ========================================================= */

  const initialForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    active: true,
  };

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  /* =========================================================
     CUSTOMERS
  ========================================================= */

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* =========================================================
     SEARCH / ALERTS
  ========================================================= */

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     CUSTOMER DETAILS
  ========================================================= */

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [customerSales, setCustomerSales] = useState([]);
  const [customerPayments, setCustomerPayments] =
    useState([]);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState("");

  /* =========================================================
     PDF REPORT
  ========================================================= */

  const [exporting, setExporting] = useState(false);
  const [reportFromDate, setReportFromDate] =
    useState("");
  const [reportToDate, setReportToDate] =
    useState("");

  /* =========================================================
     HELPERS
  ========================================================= */

  const getList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  const extractError = (err) => {
    const responseData = err?.response?.data;

    if (!responseData) {
      return (
        err?.message ||
        "An unexpected error occurred."
      );
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    if (responseData.message) {
      return responseData.message;
    }

    if (typeof responseData === "object") {
      const messages = [];

      Object.entries(responseData).forEach(
        ([field, value]) => {
          if (Array.isArray(value)) {
            messages.push(
              `${field}: ${value.join(", ")}`
            );
          } else if (typeof value === "string") {
            messages.push(
              `${field}: ${value}`
            );
          }
        }
      );

      if (messages.length > 0) {
        return messages.join(" | ");
      }
    }

    return "An unexpected error occurred.";
  };

  const showSuccess = (message) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  const formatMoney = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat(
      "en-TZ",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    try {
      return new Date(value).toLocaleDateString(
        "en-GB"
      );
    } catch {
      return value;
    }
  };

  const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================================================
     SALE HELPERS
  ========================================================= */

  const getCustomerId = (sale) => {
    if (sale?.customer_id) {
      return sale.customer_id;
    }

    if (
      sale?.customer &&
      typeof sale.customer === "object"
    ) {
      return sale.customer.id;
    }

    if (
      sale?.customer &&
      typeof sale.customer !== "object"
    ) {
      return sale.customer;
    }

    return null;
  };

  const getSaleDate = (sale) => {
    return (
      sale?.date ||
      sale?.sale_date ||
      sale?.created_at ||
      null
    );
  };

  const getSaleTotal = (sale) => {
    return Number(
      sale?.total ??
      sale?.grand_total ??
      sale?.amount ??
      0
    );
  };

  const getSalePaid = (sale) => {
    return Number(
      sale?.amount_paid ??
      sale?.paid_amount ??
      0
    );
  };

  const getSaleBalance = (sale) => {
    const total = getSaleTotal(sale);
    const paid = getSalePaid(sale);

    return Math.max(
      total - paid,
      0
    );
  };

  const getSaleItems = (sale) => {
    if (Array.isArray(sale?.items)) {
      return sale.items;
    }

    if (Array.isArray(sale?.sale_items)) {
      return sale.sale_items;
    }

    if (Array.isArray(sale?.details)) {
      return sale.details;
    }

    return [];
  };

  const getItemQuantity = (item) => {
    return Number(
      item?.quantity ??
      item?.qty ??
      0
    );
  };

  const getItemUnit = (item) => {
    return String(
      item?.unit || ""
    ).toLowerCase();
  };

  const isEggItem = (item) => {
    if (item?.is_egg === true) {
      return true;
    }

    const product = String(
      item?.product ||
      item?.product_name ||
      ""
    ).toLowerCase();

    return (
      product.includes("egg") ||
      product.includes("mayai")
    );
  };

  const getSaleEggs = (sale) => {
    let eggs = 0;

    getSaleItems(sale).forEach(
      (item) => {
        if (!isEggItem(item)) {
          return;
        }

        const quantity =
          getItemQuantity(item);

        const unit =
          getItemUnit(item);

        if (unit === "tray") {
          eggs += quantity * 30;
        } else {
          eggs += quantity;
        }
      }
    );

    return eggs;
  };

  const getSaleTrays = (sale) => {
    let trays = 0;

    getSaleItems(sale).forEach(
      (item) => {
        if (!isEggItem(item)) {
          return;
        }

        const quantity =
          getItemQuantity(item);

        const unit =
          getItemUnit(item);

        if (unit === "tray") {
          trays += quantity;
        }
      }
    );

    return trays;
  };

  /* =========================================================
     PAYMENT HELPERS
  ========================================================= */

  const getPaymentDate = (payment) => {
    return (
      payment?.date ||
      payment?.payment_date ||
      payment?.created_at ||
      null
    );
  };

  const getPaymentAmount = (payment) => {
    return Number(
      payment?.amount ??
      payment?.paid_amount ??
      0
    );
  };

  const getPaymentMethod = (payment) => {
    return (
      payment?.payment_method ||
      payment?.method ||
      "-"
    );
  };

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  const loadCustomers = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/customers/"
          );

        setCustomers(
          getList(response.data)
        );
      } catch (err) {
        console.error(
          "Failed to load customers:",
          err
        );

        setError(
          extractError(err)
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /* =========================================================
     FORM HANDLING
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setError("");
    setSuccess("");

    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (customer) => {
    setError("");
    setSuccess("");

    setForm({
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address:
        customer?.address ||
        customer?.location ||
        "",
      active:
        customer?.active !== false,
    });

    setEditingId(
      customer?.id
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     SAVE CUSTOMER
  ========================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError(
        "Customer name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address:
          form.address.trim(),
        active: form.active,
      };

      if (editingId) {
        await api.patch(
          `/customers/${editingId}/`,
          payload
        );

        showSuccess(
          "Customer updated successfully."
        );
      } else {
        await api.post(
          "/customers/",
          payload
        );

        showSuccess(
          "Customer added successfully."
        );
      }

      resetForm();

      await loadCustomers();
    } catch (err) {
      console.error(
        "Failed to save customer:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE CUSTOMER
  ========================================================= */

  const handleDelete = async (
    customer
  ) => {
    if (!customer?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${customer.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        customer.id
      );

      setError("");
      setSuccess("");

      await api.delete(
        `/customers/${customer.id}/`
      );

      if (
        selectedCustomer?.id ===
        customer.id
      ) {
        setSelectedCustomer(null);
        setCustomerSales([]);
        setCustomerPayments([]);
      }

      showSuccess(
        "Customer deleted successfully."
      );

      await loadCustomers();
    } catch (err) {
      console.error(
        "Failed to delete customer:",
        err
      );

      setError(
        extractError(err)
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     CUSTOMER DETAILS
  ========================================================= */

  const openCustomerDetails =
    async (customer) => {
      if (!customer?.id) {
        return;
      }

      setSelectedCustomer(
        customer
      );

      setCustomerSales([]);
      setCustomerPayments([]);
      setDetailsError("");
      setDetailsLoading(true);

      try {
        const salesResponse =
          await api.get(
            "/sales/",
            {
              params: {
                customer:
                  customer.id,
              },
            }
          );

        let sales =
          getList(
            salesResponse.data
          );

        sales =
          sales.filter(
            (sale) =>
              Number(
                getCustomerId(
                  sale
                )
              ) ===
              Number(
                customer.id
              )
          );

        setCustomerSales(
          sales
        );

        try {
          const paymentResponse =
            await api.get(
              "/sale-payments/",
              {
                params: {
                  "sale__customer":
                    customer.id,
                },
              }
            );

          let payments =
            getList(
              paymentResponse.data
            );

          const saleIds =
            sales.map(
              (sale) =>
                sale.id
            );

          payments =
            payments.filter(
              (payment) => {
                const saleId =
                  typeof payment?.sale ===
                  "object"
                    ? payment?.sale?.id
                    : payment?.sale_id ||
                      payment?.sale;

                return saleIds.includes(
                  saleId
                );
              }
            );

          setCustomerPayments(
            payments
          );
        } catch (
          paymentError
        ) {
          console.warn(
            "Primary payment query failed:",
            paymentError
          );

          try {
            const fallbackResponse =
              await api.get(
                "/sale-payments/"
              );

            let payments =
              getList(
                fallbackResponse.data
              );

            const saleIds =
              sales.map(
                (sale) =>
                  sale.id
              );

            payments =
              payments.filter(
                (payment) => {
                  const saleId =
                    typeof payment?.sale ===
                    "object"
                      ? payment?.sale?.id
                      : payment?.sale_id ||
                        payment?.sale;

                  return saleIds.includes(
                    saleId
                  );
                }
              );

            setCustomerPayments(
              payments
            );
          } catch (
            fallbackError
          ) {
            console.warn(
              "Fallback payment query failed:",
              fallbackError
            );

            setCustomerPayments(
              []
            );
          }
        }
      } catch (err) {
        console.error(
          "Failed to load customer details:",
          err
        );

        setDetailsError(
          extractError(err)
        );
      } finally {
        setDetailsLoading(
          false
        );
      }
    };

  const closeCustomerDetails =
    () => {
      setSelectedCustomer(
        null
      );

      setCustomerSales([]);
      setCustomerPayments([]);
      setDetailsError("");
    };

  /* =========================================================
     FILTER CUSTOMERS
  ========================================================= */

  const filteredCustomers =
    useMemo(() => {
      const query =
        String(search || "")
          .trim()
          .toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) => {
          const searchableText = [
            customer?.name,
            customer?.phone,
            customer?.email,
            customer?.address,
            customer?.location,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    },
    [
      customers,
      search,
    ]);

  /* =========================================================
     CUSTOMER SUMMARY
  ========================================================= */

  const totalCustomers =
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer?.active !== false
    ).length;

  const totalOutstanding =
    customers.reduce(
      (
        total,
        customer
      ) =>
        total +
        Number(
          customer?.balance ||
          customer?.outstanding ||
          0
        ),
      0
    );

  const totalCustomerSales =
    customers.reduce(
      (
        total,
        customer
      ) =>
        total +
        Number(
          customer?.total_purchases ||
          customer?.total_sales ||
          0
        ),
      0
    );

  /* =========================================================
     SELECTED CUSTOMER SUMMARY
  ========================================================= */

  const customerDetailsSummary =
    useMemo(() => {
      const totalEggs =
        customerSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            getSaleEggs(
              sale
            ),
          0
        );

      const totalTrays =
        customerSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            getSaleTrays(
              sale
            ),
          0
        );

      const totalPurchases =
        customerSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            getSaleTotal(
              sale
            ),
          0
        );

      const totalPayments =
        customerSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            getSalePaid(
              sale
            ),
          0
        );

      const paymentTransactions =
        customerPayments.reduce(
          (
            total,
            payment
          ) =>
            total +
            getPaymentAmount(
              payment
            ),
          0
        );

      const remainingBalance =
        Math.max(
          totalPurchases -
            totalPayments,
          0
        );

      return {
        totalEggs,
        totalTrays,
        totalPurchases,
        totalPayments,
        paymentTransactions,
        remainingBalance,
      };
    },
    [
      customerSales,
      customerPayments,
    ]);

  /* =========================================================
     CUSTOMER PDF REPORT
  ========================================================= */

  const generateCustomerReport =
    async () => {
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
            "/reports/customers/pdf/",
            {
              params: {
                from_date:
                  reportFromDate,
                to_date:
                  reportToDate,
              },
              responseType:
                "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type:
                "application/pdf",
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
          "Customer PDF report opened successfully."
        );

        window.setTimeout(
          () => {
            window.URL.revokeObjectURL(
              pdfUrl
            );
          },
          30000
        );
      } catch (err) {
        console.error(
          "Customer PDF export error:",
          err
        );

        if (
          err?.response?.data instanceof
          Blob
        ) {
          try {
            const text =
              await err.response.data.text();

            const parsed =
              JSON.parse(text);

            if (
              parsed?.detail
            ) {
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

  /* =========================================================
     RENDER CUSTOMER DETAILS
  ========================================================= */

  const renderCustomerDetails =
    () => {
      if (!selectedCustomer) {
        return null;
      }

      return (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-1">
                Customer Details
              </h4>

              <p className="text-muted mb-0">
                Customer statement and
                transaction history
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={
                closeCustomerDetails
              }
            >
              <i className="bi bi-arrow-left me-2" />
              Back to Customers
            </button>
          </div>

          {detailsError && (
            <div className="alert alert-danger">
              {detailsError}
            </div>
          )}

          {/* Customer Profile */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: 55,
                        height: 55,
                      }}
                    >
                      <i className="bi bi-person fs-4" />
                    </div>

                    <div>
                      <h5 className="mb-1">
                        {
                          selectedCustomer.name
                        }
                      </h5>

                      <small className="text-muted">
                        Customer
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="mb-2">
                    <small className="text-muted d-block">
                      Phone
                    </small>

                    <span>
                      {selectedCustomer.phone ||
                        "-"}
                    </span>
                  </div>

                  <div>
                    <small className="text-muted d-block">
                      Email
                    </small>

                    <span>
                      {selectedCustomer.email ||
                        "-"}
                    </span>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="mb-2">
                    <small className="text-muted d-block">
                      Address
                    </small>

                    <span>
                      {selectedCustomer.address ||
                        selectedCustomer.location ||
                        "-"}
                    </span>
                  </div>

                  <div>
                    <small className="text-muted d-block">
                      Status
                    </small>

                    {selectedCustomer.active !==
                    false ? (
                      <span className="badge bg-success">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">
                    Total Purchases
                  </div>

                  <h4 className="mb-0">
                    TZS{" "}
                    {formatMoney(
                      customerDetailsSummary.totalPurchases
                    )}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">
                    Payments
                  </div>

                  <h4 className="mb-0 text-success">
                    TZS{" "}
                    {formatMoney(
                      customerDetailsSummary.totalPayments
                    )}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">
                    Outstanding
                  </div>

                  <h4 className="mb-0 text-danger">
                    TZS{" "}
                    {formatMoney(
                      customerDetailsSummary.remainingBalance
                    )}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">
                    Eggs Purchased
                  </div>

                  <h4 className="mb-0">
                    {formatNumber(
                      customerDetailsSummary.totalEggs
                    )}
                  </h4>

                  <small className="text-muted">
                    {formatNumber(
                      customerDetailsSummary.totalTrays
                    )}{" "}
                    trays
                  </small>
                </div>
              </div>
            </div>
          </div>

          {detailsLoading ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                />

                <p className="text-muted mt-3 mb-0">
                  Loading customer
                  transactions...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Purchase History */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">
                        Egg Purchase History
                      </h5>

                      <small className="text-muted">
                        All egg purchases made by this customer
                      </small>
                    </div>

                    <span className="badge bg-primary">
                      {
                        customerSales.length
                      }{" "}
                      transaction
                      {customerSales.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <div className="card-body p-0">
                  {customerSales.length ===
                  0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-receipt fs-1 text-muted" />

                      <h6 className="mt-3">
                        No purchases found
                      </h6>

                      <p className="text-muted mb-0">
                        This customer has no
                        sales transactions.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Invoice</th>
                            <th>Eggs</th>
                            <th>Trays</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Method</th>
                          </tr>
                        </thead>

                        <tbody>
                          {customerSales.map(
                            (
                              sale,
                              index
                            ) => (
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
                                  {formatDate(
                                    getSaleDate(
                                      sale
                                    )
                                  )}
                                </td>

                                <td>
                                  <span className="fw-semibold">
                                    {sale.invoice_no ||
                                      sale.invoice ||
                                      "-"}
                                  </span>
                                </td>

                                <td>
                                  {formatNumber(
                                    getSaleEggs(
                                      sale
                                    )
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    getSaleTrays(
                                      sale
                                    )
                                  )}
                                </td>

                                <td>
                                  TZS{" "}
                                  {formatMoney(
                                    getSaleTotal(
                                      sale
                                    )
                                  )}
                                </td>

                                <td className="text-success">
                                  TZS{" "}
                                  {formatMoney(
                                    getSalePaid(
                                      sale
                                    )
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={
                                      getSaleBalance(
                                        sale
                                      ) >
                                      0
                                        ? "text-danger fw-semibold"
                                        : "text-success fw-semibold"
                                    }
                                  >
                                    TZS{" "}
                                    {formatMoney(
                                      getSaleBalance(
                                        sale
                                      )
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {sale.payment_method ||
                                    "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>

                        <tfoot className="table-light">
                          <tr>
                            <th
                              colSpan="3"
                              className="text-end"
                            >
                              Totals:
                            </th>

                            <th>
                              {formatNumber(
                                customerDetailsSummary.totalEggs
                              )}
                            </th>

                            <th>
                              {formatNumber(
                                customerDetailsSummary.totalTrays
                              )}
                            </th>

                            <th>
                              TZS{" "}
                              {formatMoney(
                                customerDetailsSummary.totalPurchases
                              )}
                            </th>

                            <th className="text-success">
                              TZS{" "}
                              {formatMoney(
                                customerDetailsSummary.totalPayments
                              )}
                            </th>

                            <th className="text-danger">
                              TZS{" "}
                              {formatMoney(
                                customerDetailsSummary.remainingBalance
                              )}
                            </th>

                            <th />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-1">
                    Payments
                  </h5>

                  <small className="text-muted">
                    Payment transactions recorded
                    for this customer
                  </small>
                </div>

                <div className="card-body p-0">
                  {customerPayments.length ===
                  0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-cash-stack fs-1 text-muted" />

                      <h6 className="mt-3">
                        No payment transactions
                      </h6>

                      <p className="text-muted mb-0">
                        No individual payment
                        transactions were found.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Invoice</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Reference</th>
                            <th>Notes</th>
                          </tr>
                        </thead>

                        <tbody>
                          {customerPayments.map(
                            (
                              payment,
                              index
                            ) => {
                              const sale =
                                customerSales.find(
                                  (
                                    item
                                  ) => {
                                    const saleId =
                                      typeof payment?.sale ===
                                      "object"
                                        ? payment?.sale?.id
                                        : payment?.sale_id ||
                                          payment?.sale;

                                    return (
                                      Number(
                                        item.id
                                      ) ===
                                      Number(
                                        saleId
                                      )
                                    );
                                  }
                                );

                              return (
                                <tr
                                  key={
                                    payment.id ||
                                    index
                                  }
                                >
                                  <td>
                                    {index +
                                      1}
                                  </td>

                                  <td>
                                    {formatDate(
                                      getPaymentDate(
                                        payment
                                      )
                                    )}
                                  </td>

                                  <td>
                                    {sale?.invoice_no ||
                                      payment?.invoice_no ||
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
                                    {payment?.reference ||
                                      "-"}
                                  </td>

                                  <td>
                                    {payment?.notes ||
                                      "-"}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>

                        <tfoot className="table-light">
                          <tr>
                            <th
                              colSpan="3"
                              className="text-end"
                            >
                              Total Payments:
                            </th>

                            <th className="text-success">
                              TZS{" "}
                              {formatMoney(
                                customerDetailsSummary.paymentTransactions
                              )}
                            </th>

                            <th
                              colSpan="3"
                            />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div className="container-fluid py-3">
      <PageHeader
        title="Customers"
        subtitle="Manage customers, purchases, payments and outstanding balances"
        actions={
          !selectedCustomer ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                startCreate
              }
            >
              <i className="bi bi-person-plus me-2" />
              Add Customer
            </button>
          ) : null
        }
      />

      {/* Alerts */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
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
            onClick={() =>
              setSuccess("")
            }
          />
        </div>
      )}

      {/* Customer Details */}
      {selectedCustomer ? (
        renderCustomerDetails()
      ) : (
        <>
          {/* Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="text-muted small">
                        Total Customers
                      </div>

                      <h3 className="mb-0">
                        {formatNumber(
                          totalCustomers
                        )}
                      </h3>
                    </div>

                    <i className="bi bi-people fs-2 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="text-muted small">
                        Active Customers
                      </div>

                      <h3 className="mb-0 text-success">
                        {formatNumber(
                          activeCustomers
                        )}
                      </h3>
                    </div>

                    <i className="bi bi-person-check fs-2 text-success" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="text-muted small">
                        Outstanding Balance
                      </div>

                      <h3 className="mb-0 text-danger">
                        TZS{" "}
                        {formatMoney(
                          totalOutstanding
                        )}
                      </h3>
                    </div>

                    <i className="bi bi-wallet2 fs-2 text-danger" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">
                    Customer Report
                  </h5>

                  <p className="text-muted mb-0 small">
                    Generate a professional PDF
                    report containing customer
                    purchases, payments and
                    outstanding balances.
                  </p>
                </div>

                <i className="bi bi-file-earmark-pdf fs-2 text-danger" />
              </div>

              <div className="row g-3 align-items-end">
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
                    onChange={(event) =>
                      setReportFromDate(
                        event.target.value
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
                    value={
                      reportToDate
                    }
                    onChange={(event) =>
                      setReportToDate(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-4">
                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={
                      generateCustomerReport
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

          {/* Add / Edit Form */}
          {showForm && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      {editingId
                        ? "Edit Customer"
                        : "Add Customer"}
                    </h5>

                    <small className="text-muted">
                      Enter customer information
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={
                      resetForm
                    }
                  />
                </div>
              </div>

              <div className="card-body">
                <form
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Customer Name{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={
                          form.name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        className="form-control"
                        value={
                          form.phone
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={
                          form.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter email address"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Address
                      </label>

                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        value={
                          form.address
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter customer address"
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          name="active"
                          id="customer-active"
                          className="form-check-input"
                          checked={
                            form.active
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <label
                          htmlFor="customer-active"
                          className="form-check-label"
                        >
                          Active Customer
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={
                            resetForm
                          }
                          disabled={
                            saving
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={
                            saving
                          }
                        >
                          {saving ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              />

                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-2" />

                              {editingId
                                ? "Update Customer"
                                : "Save Customer"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Customer List */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <h5 className="mb-1">
                    Customers
                  </h5>

                  <small className="text-muted">
                    {formatNumber(
                      filteredCustomers.length
                    )}{" "}
                    customer
                    {filteredCustomers.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    found
                  </small>
                </div>

                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search" />
                    </span>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search customers..."
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                    />

                    {search && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                          setSearch("")
                        }
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />

                  <p className="text-muted mt-3 mb-0">
                    Loading customers...
                  </p>
                </div>
              ) : filteredCustomers.length ===
                0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people fs-1 text-muted" />

                  <h6 className="mt-3 mb-1">
                    No customers found
                  </h6>

                  <p className="text-muted mb-3">
                    {search
                      ? "No customers match your search."
                      : "Start by adding your first customer."}
                  </p>

                  {!search && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={
                        startCreate
                      }
                    >
                      <i className="bi bi-person-plus me-2" />
                      Add Customer
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Balance</th>
                        <th className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCustomers.map(
                        (
                          customer,
                          index
                        ) => {
                          const balance =
                            Number(
                              customer?.balance ??
                              customer?.outstanding ??
                              0
                            );

                          return (
                            <tr
                              key={
                                customer.id ||
                                index
                              }
                            >
                              <td>
                                {index +
                                  1}
                              </td>

                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                    style={{
                                      width: 38,
                                      height: 38,
                                    }}
                                  >
                                    <i className="bi bi-person" />
                                  </div>

                                  <div>
                                    <div className="fw-semibold">
                                      {
                                        customer.name
                                      }
                                    </div>

                                    {customer.id && (
                                      <small className="text-muted">
                                        ID:{" "}
                                        {
                                          customer.id
                                        }
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td>
                                {customer.phone ||
                                  "-"}
                              </td>

                              <td>
                                {customer.email ||
                                  "-"}
                              </td>

                              <td>
                                {customer.address ||
                                  customer.location ||
                                  "-"}
                              </td>

                              <td>
                                {customer.active !==
                                false ? (
                                  <span className="badge bg-success">
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Inactive
                                  </span>
                                )}
                              </td>

                              <td>
                                <span
                                  className={
                                    balance >
                                    0
                                      ? "text-danger fw-semibold"
                                      : "text-success fw-semibold"
                                  }
                                >
                                  TZS{" "}
                                  {formatMoney(
                                    balance
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-info"
                                    title="View customer"
                                    onClick={() =>
                                      openCustomerDetails(
                                        customer
                                      )
                                    }
                                  >
                                    <i className="bi bi-eye" />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    title="Edit customer"
                                    onClick={() =>
                                      startEdit(
                                        customer
                                      )
                                    }
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    title="Delete customer"
                                    disabled={
                                      deletingId ===
                                      customer.id
                                    }
                                    onClick={() =>
                                      handleDelete(
                                        customer
                                      )
                                    }
                                  >
                                    {deletingId ===
                                    customer.id ? (
                                      <span
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                      />
                                    ) : (
                                      <i className="bi bi-trash" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Customers;