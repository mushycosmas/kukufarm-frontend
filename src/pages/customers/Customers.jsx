import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/common/PageHeader";
import api from "../../services/api";

import CustomerSummary from "./components/CustomerSummary";
import CustomerForm from "./components/CustomerForm";
import CustomerReport from "./components/CustomerReport";
import CustomerTable from "./components/CustomerTable";
import CustomerDetails from "./components/CustomerDetails";

import {
  getList,
  extractError,
  getCustomerId,
  getSaleDate,
  getSaleTotal,
  getSalePaid,
  getSaleBalance,
  getSaleEggs,
  getSaleTrays,
  getPaymentDate,
  getPaymentAmount,
  getPaymentMethod,
} from "./utils/customerUtils";

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  active: true,
};

export default function Customers() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [exporting, setExporting] = useState(false);
  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");

  // Display a success message and clear it after five seconds.
  const showSuccess = useCallback((message) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 5000);
  }, []);

  // Load customers from the Django API.
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers/");

      setCustomers(getList(response.data));
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Handle form input changes.
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Close and reset the customer form.
  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  // Open the form for a new customer.
  const startCreate = () => {
    setError("");
    setSuccess("");
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Open the form with the selected customer's information.
  const startEdit = (customer) => {
    setError("");
    setSuccess("");

    setForm({
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || customer?.location || "",
      active: customer?.active !== false,
    });

    setEditingId(customer?.id ?? null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Create or update a customer.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      active: form.active,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await api.patch(`/customers/${editingId}/`, payload);
        showSuccess("Customer updated successfully.");
      } else {
        await api.post("/customers/", payload);
        showSuccess("Customer added successfully.");
      }

      resetForm();
      await loadCustomers();
    } catch (err) {
      console.error("Failed to save customer:", err);
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  // Close customer details and clear transaction data.
  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerSales([]);
    setCustomerPayments([]);
    setDetailsError("");
    setDetailsLoading(false);
  };

  // Delete a customer.
  const handleDelete = async (customer) => {
    if (!customer?.id) {
      setError("Unable to delete this customer: customer ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(customer.id);
      setError("");
      setSuccess("");

      await api.delete(`/customers/${customer.id}/`);

      if (
        String(selectedCustomer?.id) === String(customer.id)
      ) {
        closeCustomerDetails();
      }

      showSuccess("Customer deleted successfully.");

      await loadCustomers();
    } catch (err) {
      console.error("Failed to delete customer:", err);
      setError(extractError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Load sales and payments for a selected customer.
  const openCustomerDetails = async (customer) => {
    if (!customer?.id) {
      setError("Unable to open customer details: customer ID is missing.");
      return;
    }

    setSelectedCustomer(customer);
    setCustomerSales([]);
    setCustomerPayments([]);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const salesResponse = await api.get("/sales/", {
        params: {
          customer: customer.id,
        },
      });

      const sales = getList(salesResponse.data).filter(
        (sale) =>
          String(getCustomerId(sale)) === String(customer.id)
      );

      setCustomerSales(sales);

      const saleIds = sales.map((sale) => sale.id);

      let payments = [];

      try {
        const paymentResponse = await api.get("/sale-payments/", {
          params: {
            "sale__customer": customer.id,
          },
        });

        payments = getList(paymentResponse.data);
      } catch (paymentError) {
        console.warn(
          "Filtered payment query failed; trying fallback:",
          paymentError
        );

        try {
          const fallbackResponse = await api.get("/sale-payments/");
          payments = getList(fallbackResponse.data);
        } catch (fallbackError) {
          console.error(
            "Failed to load payment history:",
            fallbackError
          );

          throw new Error(
            "Could not load customer payment history. Please try again."
          );
        }
      }

      // Keep payments belonging to this customer's sales only.
      payments = payments.filter((payment) => {
        const saleId =
          typeof payment?.sale === "object"
            ? payment.sale?.id
            : payment?.sale_id ?? payment?.sale;

        return saleIds.some(
          (id) => String(id) === String(saleId)
        );
      });

      setCustomerPayments(payments);
    } catch (err) {
      console.error("Failed to load customer details:", err);
      setDetailsError(extractError(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filter customers by name, phone, email, or address.
  const filteredCustomers = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer?.name,
        customer?.phone,
        customer?.email,
        customer?.address,
        customer?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  // Calculate total outstanding balances.
  const totalOutstanding = useMemo(
    () =>
      customers.reduce(
        (sum, customer) =>
          sum +
          Number(
            customer?.balance ?? customer?.outstanding ?? 0
          ),
        0
      ),
    [customers]
  );

  // Calculate the selected customer's purchase and payment totals.
  const customerDetailsSummary = useMemo(() => {
    const totalEggs = customerSales.reduce(
      (sum, sale) => sum + getSaleEggs(sale),
      0
    );

    const totalTrays = customerSales.reduce(
      (sum, sale) => sum + getSaleTrays(sale),
      0
    );

    const totalPurchases = customerSales.reduce(
      (sum, sale) => sum + getSaleTotal(sale),
      0
    );

    const totalPayments = customerSales.reduce(
      (sum, sale) => sum + getSalePaid(sale),
      0
    );

    const paymentTransactions = customerPayments.reduce(
      (sum, payment) => sum + getPaymentAmount(payment),
      0
    );

    return {
      totalEggs,
      totalTrays,
      totalPurchases,
      totalPayments,
      paymentTransactions,
      remainingBalance: Math.max(
        totalPurchases - totalPayments,
        0
      ),
    };
  }, [customerSales, customerPayments]);

  // Generate and download the customer PDF report.
  const generateCustomerReport = async () => {
    setError("");
    setSuccess("");

    if (!reportFromDate || !reportToDate) {
      setError("Please select both report dates.");
      return;
    }

    if (reportFromDate > reportToDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    let downloadUrl;

    try {
      setExporting(true);

      const response = await api.get("/reports/customers/pdf/", {
        params: {
          from_date: reportFromDate,
          to_date: reportToDate,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `customers-report-${reportFromDate}-to-${reportToDate}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess("Customer PDF report downloaded.");
    } catch (err) {
      console.error("Failed to generate customer report:", err);
      setError(extractError(err));
    } finally {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }

      setExporting(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <PageHeader
        title="Customers"
        subtitle="Manage customers, purchases, payments and outstanding balances"
        icon="bi-people"
        action={
          !selectedCustomer && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startCreate}
            >
              <i className="bi bi-person-plus me-2" />
              Add Customer
            </button>
          )
        }
      />

      {/* Error message */}
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
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* Success message */}
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
            onClick={() => setSuccess("")}
            aria-label="Close"
          />
        </div>
      )}

      {selectedCustomer ? (
        <CustomerDetails
          selectedCustomer={selectedCustomer}
          customerSales={customerSales}
          customerPayments={customerPayments}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          customerDetailsSummary={customerDetailsSummary}
          closeCustomerDetails={closeCustomerDetails}
          getSaleDate={getSaleDate}
          getSaleEggs={getSaleEggs}
          getSaleTrays={getSaleTrays}
          getSaleTotal={getSaleTotal}
          getSalePaid={getSalePaid}
          getSaleBalance={getSaleBalance}
          getPaymentDate={getPaymentDate}
          getPaymentAmount={getPaymentAmount}
          getPaymentMethod={getPaymentMethod}
        />
      ) : (
        <>
          <CustomerSummary
            customers={customers}
            totalOutstanding={totalOutstanding}
          />

          <CustomerReport
            fromDate={reportFromDate}
            toDate={reportToDate}
            setFromDate={setReportFromDate}
            setToDate={setReportToDate}
            exporting={exporting}
            onExport={generateCustomerReport}
          />

          {showForm && (
            <CustomerForm
              form={form}
              editingId={editingId}
              saving={saving}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={resetForm}
            />
          )}

          <CustomerTable
            customers={filteredCustomers}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onCreate={startCreate}
            onView={openCustomerDetails}
            onEdit={startEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </>
      )}
    </div>
  );
}
