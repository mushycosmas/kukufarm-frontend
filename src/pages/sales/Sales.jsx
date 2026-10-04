import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import api from "../../services/api";

import SaleForm from "./components/SaleForm";
import SalesRecords from "./components/SalesRecords";
import SalesSummary from "./components/SalesSummary";
import ReceivePaymentModal from "./components/ReceivePaymentModal";
import PaymentHistoryModal from "./components/PaymentHistoryModal";
import SalesReport from "./components/SalesReport";

import {
  createInitialForm,
  createInitialPaymentForm,
  extractError,
  getAvailableEggStock,
  getList,
  getPaymentStatus,
  getToday,
} from "./utils/salesHelpers";

export default function Sales() {
  // ============================================================
  // DATA
  // ============================================================

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);

  // ============================================================
  // EGG STOCK
  // ============================================================

  const [eggStock, setEggStock] = useState(0);
  const [loadingEggStock, setLoadingEggStock] = useState(true);
  const [eggStockError, setEggStockError] = useState("");

  // ============================================================
  // SALE FORM
  // ============================================================

  const [form, setForm] = useState(createInitialForm());

  const [editingId, setEditingId] = useState(null);

  // ============================================================
  // PAYMENT FORM / MODALS
  // ============================================================

  const [paymentForm, setPaymentForm] = useState(
    createInitialPaymentForm()
  );

  const [paymentSale, setPaymentSale] = useState(null);

  const [paymentHistorySale, setPaymentHistorySale] = useState(null);

  const [paymentHistory, setPaymentHistory] = useState([]);

  // ============================================================
  // LOADING STATES
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // ============================================================
  // MESSAGES
  // ============================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] = useState("");

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================

  useEffect(() => {
    loadSales();
    loadCustomers();
    loadEggStock();
  }, []);

  // ============================================================
  // LOAD SALES
  // ============================================================

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sales/");

      setData(getList(response));
    } catch (err) {
      console.error("Failed to load sales:", err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD CUSTOMERS
  // ============================================================

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await api.get("/customers/");

      setCustomers(getList(response));
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError(extractError(err));
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ============================================================
  // LOAD EGG STOCK
  // ============================================================

  const loadEggStock = async () => {
    try {
      setLoadingEggStock(true);
      setEggStockError("");

      const response = await api.get("/egg-inventory/");

      console.log("Egg inventory response:", response);

      const availableStock = getAvailableEggStock(response);

      setEggStock(availableStock);
    } catch (err) {
      console.error("Failed to load egg stock:", err);

      setEggStockError(extractError(err));
      setEggStock(0);
    } finally {
      setLoadingEggStock(false);
    }
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setForm(createInitialForm());
    setEditingId(null);
    setError("");
  };

  // ============================================================
  // SUCCESS MESSAGE
  // ============================================================

  const showSuccess = (message) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  // ============================================================
  // SALE FORM CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // PAYMENT METHOD CHANGE
  // ============================================================

  const handlePaymentMethodChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      payment_method: value,
      amount_paid:
        value === "credit" ? "" : previous.amount_paid,
    }));
  };

  // ============================================================
  // SALE ITEM CHANGE
  // ============================================================

  const handleItemChange = (index, field, value) => {
    setForm((previous) => {
      const items = [...previous.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...previous,
        items,
      };
    });
  };

  // ============================================================
  // ADD SALE ITEM
  // ============================================================

  const addItem = () => {
    setForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          product: "",
          is_egg: false,
          quantity: "",
          unit: "piece",
          unit_price: "",
        },
      ],
    }));
  };

  // ============================================================
  // REMOVE SALE ITEM
  // ============================================================

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return previous;
      }

      return {
        ...previous,
        items: previous.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      return sum + quantity * unitPrice;
    }, 0);
  }, [form.items]);

  const totalEggsInForm = useMemo(() => {
    return form.items.reduce((sum, item) => {
      if (!item.is_egg) {
        return sum;
      }

      const quantity = Number(item.quantity || 0);

      if (item.unit === "tray") {
        return sum + quantity * 30;
      }

      return sum + quantity;
    }, 0);
  }, [form.items]);

  const remainingEggStock = useMemo(() => {
    return Math.max(0, Number(eggStock || 0) - totalEggsInForm);
  }, [eggStock, totalEggsInForm]);

  const hasEnoughEggStock = useMemo(() => {
    if (totalEggsInForm <= 0) {
      return true;
    }

    return totalEggsInForm <= Number(eggStock || 0);
  }, [totalEggsInForm, eggStock]);

  const discount = useMemo(() => {
    return Math.max(0, Number(form.discount || 0));
  }, [form.discount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const amountPaid = useMemo(() => {
    return Math.max(0, Number(form.amount_paid || 0));
  }, [form.amount_paid]);

  const balance = useMemo(() => {
    return Math.max(0, total - amountPaid);
  }, [total, amountPaid]);

  const paymentStatus = useMemo(() => {
    return getPaymentStatus(total, amountPaid);
  }, [total, amountPaid]);

  // ============================================================
  // VALIDATE SALE FORM
  // ============================================================

  const validateForm = (stockOverride = null) => {
    if (!form.date) {
      return "Sale date is required.";
    }

    if (discount < 0) {
      return "Discount cannot be negative.";
    }

    if (discount > subtotal) {
      return "Discount cannot be greater than subtotal.";
    }

    if (!form.items.length) {
      return "At least one sale item is required.";
    }

    // ----------------------------------------------------------
    // EGG STOCK VALIDATION
    // ----------------------------------------------------------

    if (totalEggsInForm > 0) {
      if (loadingEggStock) {
        return "Please wait while egg stock is being checked.";
      }

      if (eggStockError && stockOverride === null) {
        return `Cannot verify egg stock. ${eggStockError}`;
      }

      const availableStock =
        stockOverride !== null
          ? Number(stockOverride)
          : Number(eggStock || 0);

      if (totalEggsInForm > availableStock) {
        return `Sale cancelled. Insufficient egg stock. Available: ${availableStock.toLocaleString()} eggs. Requested: ${totalEggsInForm.toLocaleString()} eggs.`;
      }
    }

    // ----------------------------------------------------------
    // PAYMENT VALIDATION
    // ----------------------------------------------------------

    if (!editingId) {
      if (amountPaid < 0) {
        return "Amount paid cannot be negative.";
      }

      if (amountPaid > total) {
        return "Amount paid cannot be greater than the sale total.";
      }
    }

    // ----------------------------------------------------------
    // ITEMS VALIDATION
    // ----------------------------------------------------------

    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];

      if (!item.product?.trim()) {
        return `Product is required for item ${i + 1}.`;
      }

      if (
        item.quantity === "" ||
        item.quantity === null ||
        Number(item.quantity) <= 0
      ) {
        return `Quantity must be greater than 0 for item ${i + 1}.`;
      }

      if (
        item.unit_price === "" ||
        item.unit_price === null ||
        Number(item.unit_price) < 0
      ) {
        return `Unit price is required for item ${i + 1}.`;
      }

      if (!["piece", "tray"].includes(item.unit)) {
        return `Invalid unit for item ${i + 1}.`;
      }

      if (
        item.unit === "tray" &&
        !Number.isInteger(Number(item.quantity))
      ) {
        return `Tray quantity must be a whole number for item ${i + 1}.`;
      }
    }

    return "";
  };

  // ============================================================
  // SAVE SALE REQUEST
  // ============================================================

  const saveSaleRequest = async (stockOverride = null) => {
    const validationError = validateForm(stockOverride);

    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        date: form.date,

        customer: form.customer
          ? Number(form.customer)
          : null,

        payment_method: form.payment_method,

        discount: Number(discount.toFixed(2)),

        notes: form.notes?.trim() || "",

        items: form.items.map((item) => ({
          id: item.id,

          product: item.product.trim(),

          is_egg: Boolean(item.is_egg),

          quantity: Number(item.quantity),

          unit: item.unit || "piece",

          unit_price: Number(item.unit_price),
        })),
      };

      // Initial payment is only submitted when creating
      // a new sale. Subsequent payments use SalePayment.
      if (!editingId) {
        payload.amount_paid = Number(amountPaid.toFixed(2));
      }

      let response;

      if (editingId) {
        response = await api.patch(
          `/sales/${editingId}/`,
          payload
        );
      } else {
        response = await api.post("/sales/", payload);
      }

      console.log("Sale saved:", response);

      showSuccess(
        editingId
          ? "Sale updated successfully."
          : "Sale created successfully."
      );

      await Promise.all([
        loadSales(),
        loadEggStock(),
      ]);

      resetForm();

      return true;
    } catch (err) {
      console.error("Failed to save sale:", err);

      setError(extractError(err));

      return false;
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SAVE SALE
  // ============================================================

  const save = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ----------------------------------------------------------
    // Refresh egg stock immediately before saving.
    // This prevents using an old stock value.
    // ----------------------------------------------------------

    if (totalEggsInForm > 0) {
      try {
        setSaving(true);
        setLoadingEggStock(true);
        setEggStockError("");

        const response = await api.get("/egg-inventory/");

        console.log(
          "Fresh egg inventory before sale:",
          response
        );

        const latestStock = getAvailableEggStock(response);

        setEggStock(latestStock);

        setLoadingEggStock(false);

        if (totalEggsInForm > latestStock) {
          setError(
            `Sale cancelled. Insufficient egg stock. Available: ${latestStock.toLocaleString()} eggs. Requested: ${totalEggsInForm.toLocaleString()} eggs.`
          );

          setSaving(false);

          return;
        }

        await saveSaleRequest(latestStock);

        return;
      } catch (err) {
        console.error(
          "Failed to refresh egg stock before sale:",
          err
        );

        setLoadingEggStock(false);
        setEggStockError(extractError(err));

        setError(
          `Cannot verify egg stock. ${extractError(err)}`
        );

        setSaving(false);

        return;
      }
    }

    await saveSaleRequest();
  };

  // ============================================================
  // EDIT SALE
  // ============================================================

  const editSale = (sale) => {
    setError("");
    setSuccess("");

    const saleItems = Array.isArray(sale.items)
      ? sale.items
      : [];

    setForm({
      date: sale.date || getToday(),

      customer:
        sale.customer !== null &&
        sale.customer !== undefined
          ? String(sale.customer)
          : "",

      invoice_no: sale.invoice_no || "",

      payment_method:
        sale.payment_method || "cash",

      amount_paid:
        sale.amount_paid !== undefined &&
        sale.amount_paid !== null
          ? String(sale.amount_paid)
          : "",

      discount:
        sale.discount !== undefined &&
        sale.discount !== null
          ? String(sale.discount)
          : "",

      notes: sale.notes || "",

      items:
        saleItems.length > 0
          ? saleItems.map((item) => ({
              id: item.id,

              product:
                item.product ||
                item.product_name ||
                "",

              is_egg:
                Boolean(
                  item.is_egg ??
                  item.isEgg ??
                  false
                ),

              quantity:
                item.quantity !== undefined &&
                item.quantity !== null
                  ? String(item.quantity)
                  : "",

              unit:
                item.unit || "piece",

              unit_price:
                item.unit_price !== undefined &&
                item.unit_price !== null
                  ? String(item.unit_price)
                  : "",
            }))
          : [
              {
                product: "",
                is_egg: false,
                quantity: "",
                unit: "piece",
                unit_price: "",
              },
            ],
    });

    setEditingId(sale.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // DELETE SALE
  // ============================================================

  const deleteSale = async (sale) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete sale ${sale.invoice_no || `#${sale.id}`}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(sale.id);
      setError("");
      setSuccess("");

      await api.delete(`/sales/${sale.id}/`);

      showSuccess("Sale deleted successfully.");

      await Promise.all([
        loadSales(),
        loadEggStock(),
      ]);

      if (editingId === sale.id) {
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete sale:", err);

      setError(extractError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  const getCustomerName = (customerId) => {
    if (!customerId) {
      return "Walk-in Customer";
    }

    const customer = customers.find(
      (item) =>
        String(item.id) === String(customerId)
    );

    return (
      customer?.name ||
      customer?.customer_name ||
      `Customer #${customerId}`
    );
  };

  // ============================================================
  // SALE PAID
  // ============================================================

  const getSalePaid = (sale) => {
    if (
      sale.amount_paid !== undefined &&
      sale.amount_paid !== null
    ) {
      return Math.max(
        0,
        Number(sale.amount_paid)
      );
    }

    if (sale.payment_method !== "credit") {
      return Number(sale.total || 0);
    }

    return 0;
  };

  // ============================================================
  // SALE BALANCE
  // ============================================================

  const getSaleBalance = (sale) => {
    if (
      sale.balance !== undefined &&
      sale.balance !== null
    ) {
      return Math.max(
        0,
        Number(sale.balance)
      );
    }

    return Math.max(
      0,
      Number(sale.total || 0) -
        getSalePaid(sale)
    );
  };

  // ============================================================
  // SALE STATUS
  // ============================================================

  const getSaleStatus = (sale) => {
    if (sale.payment_status) {
      return sale.payment_status;
    }

    return getPaymentStatus(
      sale.total,
      getSalePaid(sale)
    );
  };

  // ============================================================
  // RECEIVE PAYMENT MODAL
  // ============================================================

  const openPaymentModal = (sale) => {
    setPaymentSale(sale);

    setPaymentForm({
      date: getToday(),
      amount: "",
      payment_method: "cash",
      reference: "",
      notes: "",
    });

    setError("");
    setSuccess("");
  };

  const closePaymentModal = () => {
    if (savingPayment) {
      return;
    }

    setPaymentSale(null);
    setPaymentForm(createInitialPaymentForm());
  };

  // ============================================================
  // PAYMENT FORM CHANGE
  // ============================================================

  const handlePaymentFormChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // VALIDATE PAYMENT
  // ============================================================

  const validatePayment = () => {
    if (!paymentSale) {
      return "No sale selected.";
    }

    if (!paymentForm.date) {
      return "Payment date is required.";
    }

    const amount = Number(paymentForm.amount || 0);

    if (amount <= 0) {
      return "Payment amount must be greater than 0.";
    }

    const outstanding =
      getSaleBalance(paymentSale);

    if (amount > outstanding) {
      return `Payment cannot be greater than the outstanding balance of ${outstanding.toLocaleString()}.`;
    }

    if (
      !["cash", "mobile", "bank"].includes(
        paymentForm.payment_method
      )
    ) {
      return "Invalid payment method.";
    }

    return "";
  };

  // ============================================================
  // SAVE PAYMENT
  // ============================================================

  const savePayment = async (event) => {
    event.preventDefault();

    const validationError = validatePayment();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSavingPayment(true);
      setError("");
      setSuccess("");

      const payload = {
        sale: paymentSale.id,

        date: paymentForm.date,

        amount: Number(
          Number(paymentForm.amount).toFixed(2)
        ),

        payment_method:
          paymentForm.payment_method,

        reference:
          paymentForm.reference?.trim() || "",

        notes:
          paymentForm.notes?.trim() || "",
      };

      await api.post(
        "/sale-payments/",
        payload
      );

      showSuccess(
        "Payment received successfully."
      );

      await loadSales();

      closePaymentModal();
    } catch (err) {
      console.error(
        "Failed to save payment:",
        err
      );

      setError(extractError(err));
    } finally {
      setSavingPayment(false);
    }
  };

  // ============================================================
  // PAYMENT HISTORY
  // ============================================================

  const openPaymentHistory = async (sale) => {
    setPaymentHistorySale(sale);
    setPaymentHistory([]);
    setLoadingPaymentHistory(true);
    setError("");

    try {
      const response = await api.get(
        `/sale-payments/?sale=${sale.id}&ordering=-date,-id`
      );

      setPaymentHistory(
        getList(response)
      );
    } catch (err) {
      console.error(
        "Failed to load payment history:",
        err
      );

      setError(extractError(err));
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const closePaymentHistory = () => {
    if (loadingPaymentHistory) {
      return;
    }

    setPaymentHistorySale(null);
    setPaymentHistory([]);
  };

  // ============================================================
  // FILTER SALES
  // ============================================================

  const filteredSales = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((sale) => {
      const customerName =
        getCustomerName(sale.customer);

      const itemNames = (
        sale.items || []
      )
        .map(
          (item) =>
            item.product ||
            item.product_name ||
            ""
        )
        .join(" ");

      return (
        String(
          sale.invoice_no || ""
        )
          .toLowerCase()
          .includes(keyword) ||

        customerName
          .toLowerCase()
          .includes(keyword) ||

        itemNames
          .toLowerCase()
          .includes(keyword) ||

        String(
          sale.payment_method || ""
        )
          .toLowerCase()
          .includes(keyword) ||

        String(
          sale.payment_status || ""
        )
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search, customers]);

  // ============================================================
  // SUMMARY STATISTICS
  // ============================================================

  const totalSales = useMemo(() => {
    return data.reduce(
      (sum, sale) =>
        sum + Number(sale.total || 0),
      0
    );
  }, [data]);

  const totalPaid = useMemo(() => {
    return data.reduce(
      (sum, sale) =>
        sum + getSalePaid(sale),
      0
    );
  }, [data]);

  const totalOutstanding = useMemo(() => {
    return data.reduce(
      (sum, sale) =>
        sum + getSaleBalance(sale),
      0
    );
  }, [data]);

  const totalCredit = useMemo(() => {
    return data
      .filter(
        (sale) =>
          sale.payment_method === "credit"
      )
      .reduce(
        (sum, sale) =>
          sum + getSaleBalance(sale),
        0
      );
  }, [data]);

  // ============================================================
  // PAYMENT HISTORY SALE DATA
  // ============================================================

  const paymentHistoryData = useMemo(() => {
    if (!paymentHistorySale) {
      return {
        totalPaid: 0,
        recordedPaymentsTotal: 0,
        initialPayment: 0,
        payments: [],
      };
    }

    const totalPaid = getSalePaid(
      paymentHistorySale
    );

    const recordedPaymentsTotal =
      paymentHistory.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount || 0),
        0
      );

    const initialPayment = Math.max(
      totalPaid -
        recordedPaymentsTotal,
      0
    );

    const payments = [
      ...paymentHistory,
    ];

    if (initialPayment > 0) {
      payments.push({
        id: "initial-payment",
        date:
          paymentHistorySale.date ||
          getToday(),
        payment_method:
          paymentHistorySale.payment_method ||
          "cash",
        reference: "",
        amount: initialPayment,
        notes:
          "Initial payment recorded with sale.",
        is_initial: true,
      });
    }

    payments.sort((a, b) => {
      const dateA = String(
        a.date || ""
      );

      const dateB = String(
        b.date || ""
      );

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      return (
        Number(b.id || 0) -
        Number(a.id || 0)
      );
    });

    return {
      totalPaid,
      recordedPaymentsTotal,
      initialPayment,
      payments,
    };
  }, [
    paymentHistorySale,
    paymentHistory,
  ]);

  // ============================================================
  // REPORT
  // ============================================================

  const reportProps = {
    sales: data,
    customers,
    getCustomerName,
    getSalePaid,
    getSaleBalance,
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Manage egg, chicken and other farm sales."
      />

      <div className="container-fluid">
        {/* ======================================================
            ALERTS
        ====================================================== */}

        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <strong>Error:</strong>{" "}
            {error}

            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
              aria-label="Close"
            />
          </div>
        )}

        {success && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            <strong>Success:</strong>{" "}
            {success}

            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess("")}
              aria-label="Close"
            />
          </div>
        )}

        {/* ======================================================
            SALES SUMMARY
        ====================================================== */}

        <SalesSummary
          eggStock={eggStock}
          loadingEggStock={loadingEggStock}
          eggStockError={eggStockError}
          totalEggsInForm={totalEggsInForm}
          hasEnoughEggStock={hasEnoughEggStock}
          remainingEggStock={remainingEggStock}
          totalSales={totalSales}
          totalPaid={totalPaid}
          totalOutstanding={totalOutstanding}
          totalCredit={totalCredit}
        />

        {/* ======================================================
            REPORT
        ====================================================== */}

        <div className="d-flex justify-content-end mb-3">
          <SalesReport {...reportProps} />
        </div>

        {/* ======================================================
            SALE FORM
        ====================================================== */}

        <SaleForm
          form={form}
          editingId={editingId}
          customers={customers}
          loadingCustomers={loadingCustomers}
          saving={saving}
          subtotal={subtotal}
          discount={discount}
          total={total}
          amountPaid={amountPaid}
          balance={balance}
          paymentStatus={paymentStatus}
          totalEggsInForm={totalEggsInForm}
          eggStock={eggStock}
          eggStockError={eggStockError}
          hasEnoughEggStock={hasEnoughEggStock}
          remainingEggStock={remainingEggStock}
          onFormChange={handleFormChange}
          onPaymentMethodChange={
            handlePaymentMethodChange
          }
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSubmit={save}
          onReset={resetForm}
        />

        {/* ======================================================
            SALES RECORDS
        ====================================================== */}

        <SalesRecords
          loading={loading}
          sales={filteredSales}
          search={search}
          onSearchChange={setSearch}
          getCustomerName={getCustomerName}
          getSalePaid={getSalePaid}
          getSaleBalance={getSaleBalance}
          getSaleStatus={getSaleStatus}
          onReceivePayment={
            openPaymentModal
          }
          onPaymentHistory={
            openPaymentHistory
          }
          onEdit={editSale}
          onDelete={deleteSale}
          deletingId={deletingId}
          editingId={editingId}
        />
      </div>

      {/* ========================================================
          RECEIVE PAYMENT MODAL
      ======================================================== */}

      <ReceivePaymentModal
        paymentSale={paymentSale}
        paymentForm={paymentForm}
        savingPayment={savingPayment}
        onClose={closePaymentModal}
        onChange={handlePaymentFormChange}
        onSubmit={savePayment}
        getSalePaid={getSalePaid}
        getSaleBalance={getSaleBalance}
      />

      {/* ========================================================
          PAYMENT HISTORY MODAL
      ======================================================== */}

      <PaymentHistoryModal
        paymentHistorySale={
          paymentHistorySale
        }
        paymentHistory={
          paymentHistoryData.payments
        }
        loadingPaymentHistory={
          loadingPaymentHistory
        }
        totalPaid={
          paymentHistoryData.totalPaid
        }
        outstanding={
          paymentHistorySale
            ? getSaleBalance(
                paymentHistorySale
              )
            : 0
        }
        onClose={
          closePaymentHistory
        }
        onReceivePayment={() => {
          if (!paymentHistorySale) {
            return;
          }

          const sale =
            paymentHistorySale;

          closePaymentHistory();

          openPaymentModal(sale);
        }}
      />
    </>
  );
}