import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const EGGS_PER_TRAY = 30;

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit" },
];

const paymentTransactionMethods = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank" },
];

const units = [
  { value: "piece", label: "Piece" },
  { value: "tray", label: "Tray" },
];

const emptyItem = {
  product: "",
  is_egg: false,
  quantity: "",
  unit: "piece",
  unit_price: "",
};

const createInitialForm = () => ({
  date: getToday(),
  customer: "",
  invoice_no: "",
  payment_method: "cash",
  amount_paid: "",
  discount: "",
  notes: "",
  items: [{ ...emptyItem }],
});

const createInitialPaymentForm = () => ({
  date: getToday(),
  amount: "",
  payment_method: "cash",
  reference: "",
  notes: "",
});

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
        let message = value;

        if (Array.isArray(value)) {
          message = value.join(", ");
        } else if (
          typeof value === "object" &&
          value !== null
        ) {
          message = JSON.stringify(value);
        }

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  });
}

function calculateItemTotal(item) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unit_price || 0);

  return quantity * unitPrice;
}

function calculateEggQuantity(item) {
  if (!item.is_egg) {
    return 0;
  }

  const quantity = Number(item.quantity || 0);

  if (item.unit === "tray") {
    return quantity * EGGS_PER_TRAY;
  }

  return quantity;
}

function getPaymentStatus(total, amountPaid) {
  const saleTotal = Number(total || 0);
  const paid = Number(amountPaid || 0);

  if (saleTotal <= 0) {
    return "paid";
  }

  if (paid <= 0) {
    return "unpaid";
  }

  if (paid >= saleTotal) {
    return "paid";
  }

  return "partial";
}

function getPaymentStatusLabel(status) {
  switch (status) {
    case "paid":
      return "Paid";

    case "partial":
      return "Partial";

    case "unpaid":
      return "Unpaid";

    default:
      return "Unpaid";
  }
}

function getPaymentStatusClass(status) {
  switch (status) {
    case "paid":
      return "active";

    case "partial":
      return "warning";

    case "unpaid":
      return "inactive";

    default:
      return "inactive";
  }
}

function getPaymentMethodLabel(value) {
  const method = paymentMethods.find(
    (item) => item.value === value
  );

  return method?.label || value || "-";
}

function getTransactionPaymentMethodLabel(value) {
  const method =
    paymentTransactionMethods.find(
      (item) => item.value === value
    );

  return method?.label || value || "-";
}

export default function Sales() {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState(
    createInitialForm()
  );

  const [
    paymentForm,
    setPaymentForm,
  ] = useState(createInitialPaymentForm());

  const [editingId, setEditingId] =
    useState(null);

  const [
    paymentSale,
    setPaymentSale,
  ] = useState(null);

  const [
    paymentHistorySale,
    setPaymentHistorySale,
  ] = useState(null);

  const [
    paymentHistory,
    setPaymentHistory,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(true);

  const [
    loadingPaymentHistory,
    setLoadingPaymentHistory,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    savingPayment,
    setSavingPayment,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    loadSales();
    loadCustomers();
  }, []);

  /*
   * ============================================================
   * LOAD SALES
   * ============================================================
   */

  const loadSales = async () => {
    setLoading(true);

    try {
      const response =
        await api.get("/sales/");

      const sales =
        getList(response);

      setData(sales);

      return sales;
    } catch (err) {
      setError(
        extractError(err)
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * LOAD CUSTOMERS
   * ============================================================
   */

  const loadCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const response =
        await api.get("/customers/");

      setCustomers(
        getList(response)
      );
    } catch (err) {
      setError(
        extractError(err)
      );
    } finally {
      setLoadingCustomers(false);
    }
  };

  /*
   * ============================================================
   * RESET SALE FORM
   * ============================================================
   */

  const resetForm = () => {
    setEditingId(null);
    setError("");

    setForm(
      createInitialForm()
    );
  };

  /*
   * ============================================================
   * SUCCESS MESSAGE
   * ============================================================
   */

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  /*
   * ============================================================
   * MAIN FORM CHANGE
   * ============================================================
   */

  const handleFormChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  /*
   * ============================================================
   * PAYMENT METHOD CHANGE
   * ============================================================
   */

  const handlePaymentMethodChange = (
    e
  ) => {
    const value =
      e.target.value;

    setForm((current) => {
      let amountPaid =
        current.amount_paid;

      if (value === "credit") {
        amountPaid = "0";
      }

      if (
        value !== "credit" &&
        current.amount_paid === "0"
      ) {
        amountPaid = "";
      }

      return {
        ...current,
        payment_method: value,
        amount_paid: amountPaid,
      };
    });

    setError("");
  };

  /*
   * ============================================================
   * ITEM CHANGE
   * ============================================================
   */

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setForm((current) => {
      const items = [
        ...current.items,
      ];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...current,
        items,
      };
    });

    setError("");
  };

  /*
   * ============================================================
   * ADD ITEM
   * ============================================================
   */

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...emptyItem,
        },
      ],
    }));
  };

  /*
   * ============================================================
   * REMOVE ITEM
   * ============================================================
   */

  const removeItem = (
    index
  ) => {
    setForm((current) => {
      if (
        current.items.length ===
        1
      ) {
        return current;
      }

      return {
        ...current,
        items:
          current.items.filter(
            (_, itemIndex) =>
              itemIndex !== index
          ),
      };
    });
  };

  /*
   * ============================================================
   * SUBTOTAL
   * ============================================================
   */

  const subtotal = useMemo(() => {
    return form.items.reduce(
      (sum, item) =>
        sum +
        calculateItemTotal(item),
      0
    );
  }, [form.items]);

  /*
   * ============================================================
   * TOTAL EGGS
   * ============================================================
   */

  const totalEggsInForm =
    useMemo(() => {
      return form.items.reduce(
        (sum, item) =>
          sum +
          calculateEggQuantity(
            item
          ),
        0
      );
    }, [form.items]);

  /*
   * ============================================================
   * DISCOUNT
   * ============================================================
   */

  const discount = Number(
    form.discount || 0
  );

  /*
   * ============================================================
   * TOTAL
   * ============================================================
   */

  const total = Math.max(
    0,
    subtotal - discount
  );

  /*
   * ============================================================
   * INITIAL AMOUNT PAID
   *
   * This is only used when creating
   * a new sale.
   * ============================================================
   */

  const amountPaid = Math.max(
    0,
    Number(form.amount_paid || 0)
  );

  /*
   * ============================================================
   * FORM BALANCE
   * ============================================================
   */

  const balance = Math.max(
    0,
    total - amountPaid
  );

  /*
   * ============================================================
   * FORM PAYMENT STATUS
   * ============================================================
   */

  const paymentStatus =
    getPaymentStatus(
      total,
      amountPaid
    );

  /*
   * ============================================================
   * VALIDATE SALE FORM
   * ============================================================
   */

  const validateForm = () => {
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

    /*
     * Amount paid is only relevant when
     * creating a new sale.
     */

    if (!editingId) {
      if (amountPaid < 0) {
        return "Amount paid cannot be negative.";
      }

      if (amountPaid > total) {
        return "Amount paid cannot be greater than the sale total.";
      }
    }

    for (
      let i = 0;
      i < form.items.length;
      i++
    ) {
      const item =
        form.items[i];

      if (
        !item.product?.trim()
      ) {
        return `Product is required for item ${
          i + 1
        }.`;
      }

      if (
        item.quantity === "" ||
        item.quantity === null ||
        Number(item.quantity) <= 0
      ) {
        return `Quantity must be greater than 0 for item ${
          i + 1
        }.`;
      }

      if (
        item.unit_price === "" ||
        item.unit_price === null ||
        Number(item.unit_price) < 0
      ) {
        return `Unit price is required for item ${
          i + 1
        }.`;
      }

      if (
        ![
          "piece",
          "tray",
        ].includes(item.unit)
      ) {
        return `Invalid unit for item ${
          i + 1
        }.`;
      }

      if (
        item.unit === "tray" &&
        !Number.isInteger(
          Number(item.quantity)
        )
      ) {
        return `Tray quantity must be a whole number for item ${
          i + 1
        }.`;
      }
    }

    return "";
  };

  /*
   * ============================================================
   * SAVE / UPDATE SALE
   * ============================================================
   */

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setSaving(true);

    /*
     * IMPORTANT:
     *
     * amount_paid is intentionally NOT
     * included when editing.
     *
     * Existing payments must be managed
     * through SalePayment.
     */

    const payload = {
      date: form.date,

      customer: form.customer
        ? Number(form.customer)
        : null,

      payment_method:
        form.payment_method,

      discount: Number(
        discount.toFixed(2)
      ),

      notes:
        form.notes?.trim() ||
        "",

      items:
        form.items.map(
          (item) => ({
            product:
              item.product.trim(),

            is_egg:
              Boolean(
                item.is_egg
              ),

            quantity:
              Number(
                item.quantity
              ),

            unit:
              item.unit ||
              "piece",

            unit_price:
              Number(
                item.unit_price
              ),
          })
        ),
    };

    /*
     * Initial payment is only sent
     * when creating a new sale.
     */

    if (!editingId) {
      payload.amount_paid =
        Number(
          amountPaid.toFixed(2)
        );
    }

    console.log(
      "SALE PAYLOAD:",
      payload
    );

    try {
      if (editingId) {
        const response =
          await api.patch(
            `/sales/${editingId}/`,
            payload
          );

        const savedSale =
          response.data;

        showSuccess(
          `Sale ${
            savedSale?.invoice_no ||
            form.invoice_no
          } updated successfully.`
        );
      } else {
        const response =
          await api.post(
            "/sales/",
            payload
          );

        const savedSale =
          response.data;

        const invoiceNumber =
          savedSale?.invoice_no ||
          "Sale";

        showSuccess(
          `Sale ${invoiceNumber} recorded successfully.`
        );
      }

      await loadSales();

      setEditingId(null);

      setForm(
        createInitialForm()
      );
    } catch (err) {
      console.error(
        "SALE SAVE ERROR:",
        err.response?.data
      );

      setError(
        extractError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * EDIT SALE
   * ============================================================
   */

  const editSale = (sale) => {
    setError("");
    setSuccess("");

    setEditingId(
      sale.id
    );

    const existingAmountPaid =
      Number(
        sale.amount_paid || 0
      );

    setForm({
      date:
        sale.date ||
        getToday(),

      customer:
        sale.customer
          ? String(
              sale.customer
            )
          : "",

      invoice_no:
        sale.invoice_no ||
        "",

      payment_method:
        sale.payment_method ||
        "cash",

      /*
       * Display existing paid amount
       * but do not submit it during edit.
       */

      amount_paid:
        String(
          existingAmountPaid
        ),

      discount:
        sale.discount ??
        "",

      notes:
        sale.notes || "",

      items:
        sale.items?.length >
        0
          ? sale.items.map(
              (item) => ({
                id: item.id,

                product:
                  item.product ||
                  "",

                is_egg:
                  Boolean(
                    item.is_egg
                  ),

                quantity:
                  item.quantity ??
                  "",

                unit:
                  item.unit ||
                  "piece",

                unit_price:
                  item.unit_price ??
                  "",
              })
            )
          : [
              {
                ...emptyItem,
              },
            ],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ============================================================
   * DELETE SALE
   * ============================================================
   */

  const deleteSale = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this sale?"
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/sales/${id}/`
      );

      await loadSales();

      showSuccess(
        "Sale deleted successfully."
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(
        extractError(err)
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * ============================================================
   * CUSTOMER NAME
   * ============================================================
   */

  const getCustomerName = (
    customerId
  ) => {
    if (!customerId) {
      return "Walk-in Customer";
    }

    const customer =
      customers.find(
        (item) =>
          String(item.id) ===
          String(customerId)
      );

    return (
      customer?.name ||
      `Customer #${customerId}`
    );
  };

  /*
   * ============================================================
   * SALE PAID
   * ============================================================
   */

  const getSalePaid = (
    sale
  ) => {
    if (
      sale.amount_paid !==
        undefined &&
      sale.amount_paid !==
        null
    ) {
      return Math.max(
        0,
        Number(
          sale.amount_paid
        )
      );
    }

    if (
      sale.payment_method !==
      "credit"
    ) {
      return Number(
        sale.total || 0
      );
    }

    return 0;
  };

  /*
   * ============================================================
   * SALE BALANCE
   * ============================================================
   */

  const getSaleBalance = (
    sale
  ) => {
    /*
     * Prefer backend balance.
     */

    if (
      sale.balance !==
        undefined &&
      sale.balance !==
        null
    ) {
      return Math.max(
        0,
        Number(
          sale.balance
        )
      );
    }

    const saleTotal =
      Number(
        sale.total || 0
      );

    const paid =
      getSalePaid(sale);

    return Math.max(
      0,
      saleTotal - paid
    );
  };

  /*
   * ============================================================
   * SALE STATUS
   * ============================================================
   */

  const getSaleStatus = (
    sale
  ) => {
    if (
      sale.payment_status
    ) {
      return sale.payment_status;
    }

    return getPaymentStatus(
      sale.total,
      getSalePaid(sale)
    );
  };

  /*
   * ============================================================
   * OPEN RECEIVE PAYMENT
   * ============================================================
   */

  const openPaymentModal = (
    sale
  ) => {
    setError("");

    setSuccess("");

    setPaymentSale(
      sale
    );

    setPaymentForm(
      createInitialPaymentForm()
    );
  };

  /*
   * ============================================================
   * CLOSE RECEIVE PAYMENT
   * ============================================================
   */

  const closePaymentModal =
    () => {
      if (savingPayment) {
        return;
      }

      setPaymentSale(null);

      setPaymentForm(
        createInitialPaymentForm()
      );
    };

  /*
   * ============================================================
   * PAYMENT FORM CHANGE
   * ============================================================
   */

  const handlePaymentFormChange =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setPaymentForm(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      setError("");
    };

  /*
   * ============================================================
   * VALIDATE PAYMENT
   * ============================================================
   */

  const validatePayment = () => {
    if (!paymentSale) {
      return "No sale selected.";
    }

    if (!paymentForm.date) {
      return "Payment date is required.";
    }

    const amount =
      Number(
        paymentForm.amount || 0
      );

    if (amount <= 0) {
      return "Payment amount must be greater than zero.";
    }

    const outstanding =
      getSaleBalance(
        paymentSale
      );

    if (amount > outstanding) {
      return `Payment cannot be greater than the outstanding balance of TZS ${formatMoney(
        outstanding
      )}.`;
    }

    if (
      ![
        "cash",
        "mobile",
        "bank",
      ].includes(
        paymentForm.payment_method
      )
    ) {
      return "Invalid payment method.";
    }

    return "";
  };

  /*
   * ============================================================
   * SAVE PAYMENT
   * ============================================================
   */

  const savePayment = async (
    e
  ) => {
    e.preventDefault();

    setError("");

    const validationError =
      validatePayment();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setSavingPayment(true);

    try {
      const payload = {
        sale: paymentSale.id,

        date:
          paymentForm.date,

        amount: Number(
          Number(
            paymentForm.amount
          ).toFixed(2)
        ),

        payment_method:
          paymentForm.payment_method,

        reference:
          paymentForm.reference?.trim() ||
          "",

        notes:
          paymentForm.notes?.trim() ||
          "",
      };

      console.log(
        "PAYMENT PAYLOAD:",
        payload
      );

      await api.post(
        "/sale-payments/",
        payload
      );

      showSuccess(
        `Payment of TZS ${formatMoney(
          payload.amount
        )} received successfully.`
      );

      setPaymentSale(null);

      setPaymentForm(
        createInitialPaymentForm()
      );

      await loadSales();
    } catch (err) {
      console.error(
        "PAYMENT ERROR:",
        err.response?.data
      );

      setError(
        extractError(err)
      );
    } finally {
      setSavingPayment(false);
    }
  };

  /*
   * ============================================================
   * LOAD PAYMENT HISTORY
   * ============================================================
   */

  const openPaymentHistory =
    async (sale) => {
      setError("");

      setPaymentHistorySale(
        sale
      );

      setPaymentHistory([]);

      setLoadingPaymentHistory(
        true
      );

      try {
        const response =
          await api.get(
            `/sale-payments/?sale=${sale.id}&ordering=-date,-id`
          );

        setPaymentHistory(
          getList(response)
        );
      } catch (err) {
        setError(
          extractError(err)
        );
      } finally {
        setLoadingPaymentHistory(
          false
        );
      }
    };

  /*
   * ============================================================
   * CLOSE PAYMENT HISTORY
   * ============================================================
   */

  const closePaymentHistory =
    () => {
      if (
        loadingPaymentHistory
      ) {
        return;
      }

      setPaymentHistorySale(
        null
      );

      setPaymentHistory([]);
    };

  /*
   * ============================================================
   * FILTER SALES
   * ============================================================
   */

  const filteredSales =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return data;
      }

      return data.filter(
        (sale) => {
          const customerName =
            getCustomerName(
              sale.customer
            );

          const itemNames =
            (sale.items || [])
              .map(
                (item) =>
                  item.product
              )
              .join(" ");

          return (
            String(
              sale.invoice_no ||
                ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            customerName
              .toLowerCase()
              .includes(
                keyword
              ) ||
            itemNames
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              sale.payment_method ||
                ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              sale.payment_status ||
                ""
            )
              .toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [
      data,
      search,
      customers,
    ]);

  /*
   * ============================================================
   * TOTAL SALES
   * ============================================================
   */

  const totalSales =
    useMemo(() => {
      return data.reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.total || 0
          ),
        0
      );
    }, [data]);

  /*
   * ============================================================
   * TOTAL PAID
   * ============================================================
   */

  const totalPaid =
    useMemo(() => {
      return data.reduce(
        (sum, sale) =>
          sum +
          getSalePaid(sale),
        0
      );
    }, [data]);

  /*
   * ============================================================
   * TOTAL OUTSTANDING
   * ============================================================
   */

  const totalOutstanding =
    useMemo(() => {
      return data.reduce(
        (sum, sale) =>
          sum +
          getSaleBalance(
            sale
          ),
        0
      );
    }, [data]);

  /*
   * ============================================================
   * CREDIT OUTSTANDING
   * ============================================================
   */

  const totalCredit =
    useMemo(() => {
      return data
        .filter(
          (sale) =>
            sale.payment_method ===
            "credit"
        )
        .reduce(
          (sum, sale) =>
            sum +
            getSaleBalance(
              sale
            ),
          0
        );
    }, [data]);

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Manage egg, chicken and other farm sales."
      />

      {/* =========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="bi bi-exclamation-triangle me-2"></i>

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

      {/* =========================================================
          SUCCESS
      ========================================================== */}

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle me-2"></i>

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

      {/* =========================================================
          SUMMARY
      ========================================================== */}

      <div className="row g-3 mb-4">

        <div className="col-md-3">
          <div className="form-card h-100">
            <small className="text-muted">
              Total Sales
            </small>

            <h4 className="mb-0 mt-1">
              TZS{" "}
              {formatMoney(
                totalSales
              )}
            </h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="form-card h-100">
            <small className="text-muted">
              Total Paid
            </small>

            <h4 className="mb-0 mt-1 text-success">
              TZS{" "}
              {formatMoney(
                totalPaid
              )}
            </h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="form-card h-100">
            <small className="text-muted">
              Outstanding
            </small>

            <h4 className="mb-0 mt-1 text-danger">
              TZS{" "}
              {formatMoney(
                totalOutstanding
              )}
            </h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="form-card h-100">
            <small className="text-muted">
              Credit Outstanding
            </small>

            <h4 className="mb-0 mt-1">
              TZS{" "}
              {formatMoney(
                totalCredit
              )}
            </h4>
          </div>
        </div>

      </div>

      {/* =========================================================
          SALE FORM
      ========================================================== */}

      <div className="form-card mb-4">

        <div className="d-flex justify-content-between align-items-center mb-3">

          <div>
            <h5 className="mb-1">
              {editingId
                ? "Edit Sale"
                : "Record Sale"}
            </h5>

            {editingId && (
              <small className="text-muted">
                Editing invoice{" "}
                <strong>
                  {form.invoice_no}
                </strong>
              </small>
            )}

            {!editingId && (
              <small className="text-muted">
                New invoice number will be generated automatically after saving.
              </small>
            )}
          </div>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={
                resetForm
              }
              disabled={saving}
            >
              <i className="bi bi-x-lg me-1"></i>
              Cancel Edit
            </button>
          )}

        </div>

        <form onSubmit={save}>

          <div className="row g-3">

            {/* DATE */}

            <div className="col-md-3">

              <label className="form-label">
                Date
              </label>

              <input
                type="date"
                name="date"
                className="form-control"
                value={
                  form.date
                }
                onChange={
                  handleFormChange
                }
                required
                disabled={saving}
              />

            </div>

            {/* INVOICE */}

            <div className="col-md-3">

              <label className="form-label">
                Invoice No.
              </label>

              <input
                type="text"
                className="form-control"
                value={
                  editingId
                    ? form.invoice_no
                    : "Generated after saving"
                }
                readOnly
              />

              <small className="text-muted">
                {editingId
                  ? "Existing invoice number"
                  : "Automatically generated by the server"}
              </small>

            </div>

            {/* CUSTOMER */}

            <div className="col-md-3">

              <label className="form-label">
                Customer
              </label>

              <select
                name="customer"
                className="form-select"
                value={
                  form.customer
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  saving
                }
              >

                <option value="">
                  Walk-in Customer
                </option>

                {loadingCustomers ? (
                  <option disabled>
                    Loading customers...
                  </option>
                ) : (
                  customers.map(
                    (
                      customer
                    ) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {
                          customer.name
                        }
                      </option>
                    )
                  )
                )}

              </select>

            </div>

            {/* PAYMENT METHOD */}

            <div className="col-md-3">

              <label className="form-label">
                Payment Method
              </label>

              <select
                name="payment_method"
                className="form-select"
                value={
                  form.payment_method
                }
                onChange={
                  handlePaymentMethodChange
                }
                disabled={
                  saving
                }
              >

                {paymentMethods.map(
                  (
                    method
                  ) => (
                    <option
                      key={
                        method.value
                      }
                      value={
                        method.value
                      }
                    >
                      {
                        method.label
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SALE ITEMS */}

            <div className="col-12">

              <div className="d-flex justify-content-between align-items-center mb-2">

                <div>

                  <h6 className="mb-0">
                    Sale Items
                  </h6>

                  <small className="text-muted">
                    Mark egg items as "Yes" so their quantity is included in egg inventory sales.
                  </small>

                </div>

                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={
                    addItem
                  }
                  disabled={
                    saving
                  }
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Add Item
                </button>

              </div>

              <div className="table-responsive">

                <table className="table table-bordered align-middle mb-0">

                  <thead>

                    <tr>

                      <th>
                        Product
                      </th>

                      <th
                        style={{
                          width: "120px",
                        }}
                      >
                        Egg Item
                      </th>

                      <th
                        style={{
                          width: "130px",
                        }}
                      >
                        Unit
                      </th>

                      <th
                        style={{
                          width: "130px",
                        }}
                      >
                        Quantity
                      </th>

                      <th
                        style={{
                          width: "160px",
                        }}
                      >
                        Unit Price
                      </th>

                      <th
                        style={{
                          width: "170px",
                        }}
                      >
                        Total
                      </th>

                      <th
                        style={{
                          width: "60px",
                        }}
                      />

                    </tr>

                  </thead>

                  <tbody>

                    {form.items.map(
                      (
                        item,
                        index
                      ) => {

                        const itemTotal =
                          calculateItemTotal(
                            item
                          );

                        const eggQuantity =
                          calculateEggQuantity(
                            item
                          );

                        return (
                          <tr
                            key={
                              item.id ||
                              `new-${index}`
                            }
                          >

                            {/* PRODUCT */}

                            <td>

                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Large Eggs"
                                value={
                                  item.product
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    index,
                                    "product",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving
                                }
                                required
                              />

                            </td>

                            {/* EGG ITEM */}

                            <td>

                              <select
                                className={`form-select ${
                                  item.is_egg
                                    ? "border-success"
                                    : ""
                                }`}
                                value={
                                  item.is_egg
                                    ? "yes"
                                    : "no"
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    index,
                                    "is_egg",
                                    e
                                      .target
                                      .value ===
                                      "yes"
                                  )
                                }
                                disabled={
                                  saving
                                }
                              >

                                <option value="no">
                                  No
                                </option>

                                <option value="yes">
                                  Yes
                                </option>

                              </select>

                            </td>

                            {/* UNIT */}

                            <td>

                              <select
                                className="form-select"
                                value={
                                  item.unit ||
                                  "piece"
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    index,
                                    "unit",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving
                                }
                              >

                                {units.map(
                                  (
                                    unit
                                  ) => (
                                    <option
                                      key={
                                        unit.value
                                      }
                                      value={
                                        unit.value
                                      }
                                    >
                                      {
                                        unit.label
                                      }
                                    </option>
                                  )
                                )}

                              </select>

                            </td>

                            {/* QUANTITY */}

                            <td>

                              <input
                                type="number"
                                min="0"
                                step={
                                  item.unit ===
                                  "tray"
                                    ? "1"
                                    : "0.01"
                                }
                                className="form-control"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving
                                }
                                required
                              />

                              {item.is_egg &&
                                eggQuantity >
                                  0 && (
                                  <small className="text-success d-block mt-1">

                                    <i className="bi bi-egg-fill me-1"></i>

                                    {formatMoney(
                                      eggQuantity
                                    )}{" "}
                                    eggs

                                  </small>
                                )}

                            </td>

                            {/* UNIT PRICE */}

                            <td>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                value={
                                  item.unit_price
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleItemChange(
                                    index,
                                    "unit_price",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving
                                }
                                required
                              />

                            </td>

                            {/* TOTAL */}

                            <td>

                              <strong>
                                TZS{" "}
                                {formatMoney(
                                  itemTotal
                                )}
                              </strong>

                            </td>

                            {/* REMOVE */}

                            <td>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                disabled={
                                  saving ||
                                  form.items
                                    .length ===
                                    1
                                }
                                title="Remove item"
                              >
                                <i className="bi bi-trash"></i>
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* EGG SUMMARY */}

              {totalEggsInForm >
                0 && (
                <div className="alert alert-success mt-3 mb-0">

                  <div className="d-flex align-items-start">

                    <i className="bi bi-egg-fill fs-5 me-2"></i>

                    <div>

                      <strong>
                        Egg Stock Deduction:
                      </strong>{" "}

                      {formatMoney(
                        totalEggsInForm
                      )}{" "}
                      eggs

                      <div className="small text-muted mt-1">

                        {form.items
                          .filter(
                            (
                              item
                            ) =>
                              item.is_egg
                          )
                          .map(
                            (
                              item,
                              index
                            ) => {

                              const quantity =
                                Number(
                                  item.quantity ||
                                    0
                                );

                              const eggs =
                                calculateEggQuantity(
                                  item
                                );

                              return (
                                <span
                                  key={
                                    index
                                  }
                                  className="d-block"
                                >
                                  {item.product ||
                                    "Egg item"}{" "}
                                  —{" "}
                                  {
                                    quantity
                                  }{" "}
                                  {
                                    item.unit
                                  }{" "}
                                  ={" "}
                                  {formatMoney(
                                    eggs
                                  )}{" "}
                                  eggs
                                </span>
                              );
                            }
                          )}

                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* DISCOUNT */}

            <div className="col-md-4">

              <label className="form-label">
                Discount (TZS)
              </label>

              <input
                type="number"
                name="discount"
                min="0"
                step="0.01"
                className="form-control"
                value={
                  form.discount
                }
                onChange={
                  handleFormChange
                }
                placeholder="0"
                disabled={
                  saving
                }
              />

            </div>

            {/* AMOUNT PAID */}

            <div className="col-md-4">

              <label className="form-label">
                {editingId
                  ? "Amount Paid"
                  : "Initial Amount Paid"}{" "}
                (TZS)
              </label>

              <input
                type="number"
                name="amount_paid"
                min="0"
                max={total}
                step="0.01"
                className="form-control"
                value={
                  form.amount_paid
                }
                onChange={
                  handleFormChange
                }
                placeholder="0"
                readOnly={
                  Boolean(
                    editingId
                  )
                }
                disabled={
                  saving ||
                  (!editingId &&
                    form.payment_method ===
                      "credit")
                }
              />

              {editingId ? (
                <small className="text-muted">
                  Existing payments cannot be changed here. Use Receive Payment below.
                </small>
              ) : (
                form.payment_method ===
                  "credit" && (
                  <small className="text-muted">
                    Credit sale defaults to unpaid. You can record a payment later.
                  </small>
                )
              )}

            </div>

            {/* PAYMENT STATUS */}

            <div className="col-md-4">

              <label className="form-label">
                Payment Status
              </label>

              <div className="form-control bg-light">

                <span
                  className={`status ${getPaymentStatusClass(
                    paymentStatus
                  )}`}
                >
                  {getPaymentStatusLabel(
                    paymentStatus
                  )}
                </span>

              </div>

            </div>

            {/* NOTES */}

            <div className="col-12">

              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="2"
                value={
                  form.notes
                }
                onChange={
                  handleFormChange
                }
                placeholder="Optional notes..."
                disabled={
                  saving
                }
              />

            </div>

            {/* TOTALS */}

            <div className="col-12">

              <div className="border rounded p-3 bg-light">

                <div className="row justify-content-end">

                  <div className="col-md-5">

                    <div className="d-flex justify-content-between mb-2">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        TZS{" "}
                        {formatMoney(
                          subtotal
                        )}
                      </strong>

                    </div>

                    <div className="d-flex justify-content-between mb-2">

                      <span>
                        Discount
                      </span>

                      <strong className="text-danger">
                        - TZS{" "}
                        {formatMoney(
                          discount
                        )}
                      </strong>

                    </div>

                    <hr />

                    <div className="d-flex justify-content-between mb-2">

                      <strong>
                        Total
                      </strong>

                      <strong className="fs-5 text-success">
                        TZS{" "}
                        {formatMoney(
                          total
                        )}
                      </strong>

                    </div>

                    <div className="d-flex justify-content-between mb-2">

                      <span>
                        Amount Paid
                      </span>

                      <strong className="text-success">
                        TZS{" "}
                        {formatMoney(
                          amountPaid
                        )}
                      </strong>

                    </div>

                    <div className="d-flex justify-content-between">

                      <strong>
                        Balance
                      </strong>

                      <strong
                        className={
                          balance >
                          0
                            ? "text-danger"
                            : "text-success"
                        }
                      >
                        TZS{" "}
                        {formatMoney(
                          balance
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* SAVE */}

            <div className="col-12">

              <button
                type="submit"
                className="btn btn-success"
                disabled={
                  saving
                }
              >

                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>

                    {editingId
                      ? "Updating..."
                      : "Saving..."}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>

                    {editingId
                      ? "Update Sale"
                      : "Save Sale"}
                  </>
                )}

              </button>

              {!editingId && (
                <button
                  type="button"
                  className="btn btn-light ms-2"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Clear
                </button>
              )}

            </div>

          </div>

        </form>

      </div>

      {/* =========================================================
          SALES RECORDS
      ========================================================== */}

      <div className="table-card">

        <div className="d-flex justify-content-between align-items-center p-3">

          <div>

            <h5 className="mb-1">
              Sales Records
            </h5>

            <small className="text-muted">
              {filteredSales.length}{" "}
              record
              {filteredSales.length !==
              1
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
                placeholder="Search sales..."
                value={
                  search
                }
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

        </div>

        <div className="table-responsive">

          <table className="table align-middle mb-0">

            <thead>

              <tr>

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

                <th>
                  Amount
                </th>

                <th>
                  Paid
                </th>

                <th>
                  Balance
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>

                  <td
                    colSpan="10"
                    className="text-center py-5"
                  >

                    <div className="spinner-border text-success"></div>

                    <div className="mt-2 text-muted">
                      Loading sales...
                    </div>

                  </td>

                </tr>
              ) : filteredSales.length ===
                0 ? (
                <tr>

                  <td
                    colSpan="10"
                    className="text-center py-5 text-muted"
                  >

                    <i className="bi bi-receipt fs-2 d-block mb-2"></i>

                    {search
                      ? "No sales match your search."
                      : "No sales recorded yet."}

                  </td>

                </tr>
              ) : (
                filteredSales.map(
                  (sale) => {
                    const salePaid =
                      getSalePaid(
                        sale
                      );

                    const saleBalance =
                      getSaleBalance(
                        sale
                      );

                    const saleStatus =
                      getSaleStatus(
                        sale
                      );

                    return (
                      <tr
                        key={
                          sale.id
                        }
                      >

                        {/* INVOICE */}

                        <td>

                          <span className="record-link">
                            {
                              sale.invoice_no
                            }
                          </span>

                        </td>

                        {/* DATE */}

                        <td>
                          {
                            sale.date
                          }
                        </td>

                        {/* CUSTOMER */}

                        <td>
                          {getCustomerName(
                            sale.customer
                          )}
                        </td>

                        {/* PRODUCTS */}

                        <td>

                          {sale.items
                            ?.length ? (
                            sale.items.map(
                              (
                                item,
                                index
                              ) => {
                                const eggQuantity =
                                  calculateEggQuantity(
                                    item
                                  );

                                return (
                                  <div
                                    key={
                                      item.id ||
                                      index
                                    }
                                    className="mb-1"
                                  >

                                    <span>
                                      {
                                        item.product
                                      }
                                    </span>

                                    <small className="text-muted ms-1">
                                      ×{" "}
                                      {
                                        item.quantity
                                      }{" "}
                                      {
                                        item.unit ===
                                        "tray"
                                          ? "tray"
                                          : "piece"
                                      }
                                    </small>

                                    {item.is_egg && (
                                      <>
                                        <span className="badge bg-success ms-2">
                                          Egg
                                        </span>

                                        <small className="text-success ms-1">
                                          (
                                          {formatMoney(
                                            eggQuantity
                                          )}{" "}
                                          eggs)
                                        </small>
                                      </>
                                    )}

                                  </div>
                                );
                              }
                            )
                          ) : (
                            "-"
                          )}

                        </td>

                        {/* AMOUNT */}

                        <td>

                          <strong>
                            TZS{" "}
                            {formatMoney(
                              sale.total
                            )}
                          </strong>

                        </td>

                        {/* PAID */}

                        <td>

                          <strong className="text-success">
                            TZS{" "}
                            {formatMoney(
                              salePaid
                            )}
                          </strong>

                        </td>

                        {/* BALANCE */}

                        <td>

                          <strong
                            className={
                              saleBalance >
                              0
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            TZS{" "}
                            {formatMoney(
                              saleBalance
                            )}
                          </strong>

                        </td>

                        {/* PAYMENT METHOD */}

                        <td>

                          <span
                            className={`status ${
                              sale.payment_method ===
                              "credit"
                                ? "inactive"
                                : "active"
                            }`}
                          >
                            {getPaymentMethodLabel(
                              sale.payment_method
                            )}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status ${getPaymentStatusClass(
                              saleStatus
                            )}`}
                          >
                            {getPaymentStatusLabel(
                              saleStatus
                            )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="d-flex gap-1">

                            {/* RECEIVE PAYMENT */}

                            {saleBalance >
                              0 && (
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={() =>
                                  openPaymentModal(
                                    sale
                                  )
                                }
                                disabled={
                                  saving ||
                                  deletingId !==
                                    null
                                }
                                title="Receive payment"
                              >
                                <i className="bi bi-cash-coin"></i>
                              </button>
                            )}

                            {/* PAYMENT HISTORY */}

                            <button
                              type="button"
                              className="btn btn-outline-info btn-sm"
                              onClick={() =>
                                openPaymentHistory(
                                  sale
                                )
                              }
                              disabled={
                                saving ||
                                deletingId !==
                                  null
                              }
                              title="Payment history"
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                editSale(
                                  sale
                                )
                              }
                              disabled={
                                saving ||
                                deletingId !==
                                  null
                              }
                              title="Edit sale"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() =>
                                deleteSale(
                                  sale.id
                                )
                              }
                              disabled={
                                saving ||
                                deletingId ===
                                  sale.id
                              }
                              title="Delete sale"
                            >

                              {deletingId ===
                              sale.id ? (
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

      {/* =========================================================
          RECEIVE PAYMENT MODAL
      ========================================================== */}

      {paymentSale && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <div>

                  <h5 className="modal-title">
                    Receive Payment
                  </h5>

                  <small className="text-muted">
                    Invoice{" "}
                    <strong>
                      {
                        paymentSale.invoice_no
                      }
                    </strong>
                  </small>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={
                    closePaymentModal
                  }
                  disabled={
                    savingPayment
                  }
                />

              </div>

              <form
                onSubmit={
                  savePayment
                }
              >

                <div className="modal-body">

                  {/* SALE SUMMARY */}

                  <div className="row g-3 mb-3">

                    <div className="col-4">

                      <small className="text-muted d-block">
                        Sale Total
                      </small>

                      <strong>
                        TZS{" "}
                        {formatMoney(
                          paymentSale.total
                        )}
                      </strong>

                    </div>

                    <div className="col-4">

                      <small className="text-muted d-block">
                        Paid
                      </small>

                      <strong className="text-success">
                        TZS{" "}
                        {formatMoney(
                          getSalePaid(
                            paymentSale
                          )
                        )}
                      </strong>

                    </div>

                    <div className="col-4">

                      <small className="text-muted d-block">
                        Balance
                      </small>

                      <strong className="text-danger">
                        TZS{" "}
                        {formatMoney(
                          getSaleBalance(
                            paymentSale
                          )
                        )}
                      </strong>

                    </div>

                  </div>

                  <hr />

                  {/* DATE */}

                  <div className="mb-3">

                    <label className="form-label">
                      Payment Date
                    </label>

                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={
                        paymentForm.date
                      }
                      onChange={
                        handlePaymentFormChange
                      }
                      disabled={
                        savingPayment
                      }
                      required
                    />

                  </div>

                  {/* AMOUNT */}

                  <div className="mb-3">

                    <label className="form-label">
                      Amount (TZS)
                    </label>

                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      min="0.01"
                      max={getSaleBalance(
                        paymentSale
                      )}
                      step="0.01"
                      value={
                        paymentForm.amount
                      }
                      onChange={
                        handlePaymentFormChange
                      }
                      placeholder="Enter payment amount"
                      disabled={
                        savingPayment
                      }
                      required
                    />

                    <small className="text-muted">
                      Maximum payment: TZS{" "}
                      {formatMoney(
                        getSaleBalance(
                          paymentSale
                        )
                      )}
                    </small>

                  </div>

                  {/* METHOD */}

                  <div className="mb-3">

                    <label className="form-label">
                      Payment Method
                    </label>

                    <select
                      name="payment_method"
                      className="form-select"
                      value={
                        paymentForm.payment_method
                      }
                      onChange={
                        handlePaymentFormChange
                      }
                      disabled={
                        savingPayment
                      }
                    >

                      {paymentTransactionMethods.map(
                        (
                          method
                        ) => (
                          <option
                            key={
                              method.value
                            }
                            value={
                              method.value
                            }
                          >
                            {
                              method.label
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* REFERENCE */}

                  <div className="mb-3">

                    <label className="form-label">
                      Reference
                    </label>

                    <input
                      type="text"
                      name="reference"
                      className="form-control"
                      value={
                        paymentForm.reference
                      }
                      onChange={
                        handlePaymentFormChange
                      }
                      placeholder="e.g. M-Pesa transaction number"
                      disabled={
                        savingPayment
                      }
                    />

                  </div>

                  {/* NOTES */}

                  <div className="mb-0">

                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      value={
                        paymentForm.notes
                      }
                      onChange={
                        handlePaymentFormChange
                      }
                      placeholder="Optional payment notes..."
                      disabled={
                        savingPayment
                      }
                    />

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={
                      closePaymentModal
                    }
                    disabled={
                      savingPayment
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={
                      savingPayment
                    }
                  >

                    {savingPayment ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving Payment...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cash-coin me-1"></i>
                        Receive Payment
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================
          PAYMENT HISTORY MODAL
      ========================================================== */}

      {paymentHistorySale && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >

          <div className="modal-dialog modal-lg modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <div>

                  <h5 className="modal-title">
                    Payment History
                  </h5>

                  <small className="text-muted">
                    Invoice{" "}
                    <strong>
                      {
                        paymentHistorySale.invoice_no
                      }
                    </strong>
                  </small>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={
                    closePaymentHistory
                  }
                  disabled={
                    loadingPaymentHistory
                  }
                />

              </div>

              <div className="modal-body">

                {/* SUMMARY */}

                <div className="row g-3 mb-4">

                  <div className="col-md-4">

                    <div className="border rounded p-3">

                      <small className="text-muted d-block">
                        Sale Total
                      </small>

                      <strong>
                        TZS{" "}
                        {formatMoney(
                          paymentHistorySale.total
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="col-md-4">

                    <div className="border rounded p-3">

                      <small className="text-muted d-block">
                        Total Paid
                      </small>

                      <strong className="text-success">
                        TZS{" "}
                        {formatMoney(
                          getSalePaid(
                            paymentHistorySale
                          )
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="col-md-4">

                    <div className="border rounded p-3">

                      <small className="text-muted d-block">
                        Outstanding
                      </small>

                      <strong className="text-danger">
                        TZS{" "}
                        {formatMoney(
                          getSaleBalance(
                            paymentHistorySale
                          )
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                {loadingPaymentHistory ? (
                  <div className="text-center py-5">

                    <div className="spinner-border text-success"></div>

                    <div className="mt-2 text-muted">
                      Loading payment history...
                    </div>

                  </div>
                ) : paymentHistory.length ===
                  0 ? (
                  <div className="text-center py-5 text-muted">

                    <i className="bi bi-cash-stack fs-1 d-block mb-2"></i>

                    No payment transactions found.

                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table table-bordered align-middle">

                      <thead>

                        <tr>

                          <th>
                            #
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Method
                          </th>

                          <th>
                            Reference
                          </th>

                          <th className="text-end">
                            Amount
                          </th>

                          <th>
                            Notes
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {paymentHistory.map(
                          (
                            payment,
                            index
                          ) => (
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
                                {
                                  payment.date
                                }
                              </td>

                              <td>

                                <span className="status active">
                                  {getTransactionPaymentMethodLabel(
                                    payment.payment_method
                                  )}
                                </span>

                              </td>

                              <td>
                                {
                                  payment.reference ||
                                  "-"
                                }
                              </td>

                              <td className="text-end">

                                <strong className="text-success">
                                  TZS{" "}
                                  {formatMoney(
                                    payment.amount
                                  )}
                                </strong>

                              </td>

                              <td>
                                {
                                  payment.notes ||
                                  "-"
                                }
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                      <tfoot>

                        <tr>

                          <th
                            colSpan="4"
                            className="text-end"
                          >
                            Total Paid
                          </th>

                          <th className="text-end">

                            <strong className="text-success">
                              TZS{" "}
                              {formatMoney(
                                paymentHistory.reduce(
                                  (
                                    sum,
                                    payment
                                  ) =>
                                    sum +
                                    Number(
                                      payment.amount ||
                                        0
                                    ),
                                  0
                                )
                              )}
                            </strong>

                          </th>

                          <th />

                        </tr>

                      </tfoot>

                    </table>

                  </div>
                )}

              </div>

              <div className="modal-footer">

                {getSaleBalance(
                  paymentHistorySale
                ) > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      const sale =
                        paymentHistorySale;

                      closePaymentHistory();

                      openPaymentModal(
                        sale
                      );
                    }}
                  >
                    <i className="bi bi-cash-coin me-1"></i>
                    Receive Payment
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    closePaymentHistory
                  }
                  disabled={
                    loadingPaymentHistory
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}