import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const today = new Date().toISOString().slice(0, 10);

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit" },
];

const emptyItem = {
  product: "",
  quantity: "",
  unit_price: "",
};

const getNextInvoiceNumber = (sales) => {
  let highest = 0;

  sales.forEach((sale) => {
    const invoice = String(sale.invoice_no || "");

    const match = invoice.match(/^INV-(\d+)$/);

    if (match) {
      const number = parseInt(match[1], 10);

      if (number > highest) {
        highest = number;
      }
    }
  });

  return `INV-${String(highest + 1).padStart(6, "0")}`;
};

const createInitialForm = (sales = []) => ({
  date: today,
  customer: "",
  invoice_no: getNextInvoiceNumber(sales),
  payment_method: "cash",
  discount: "",
  notes: "",
  items: [{ ...emptyItem }],
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

function calculateItemTotal(item) {
  return (
    Number(item.quantity || 0) *
    Number(item.unit_price || 0)
  );
}

export default function Sales() {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState(
    createInitialForm()
  );

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSales();
    loadCustomers();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sales/");
      const sales = getList(response);

      setData(sales);

      /*
       * Generate the first invoice number
       * after loading existing sales.
       */
      setForm((current) => {
        if (editingId) {
          return current;
        }

        return {
          ...current,
          invoice_no: getNextInvoiceNumber(sales),
        };
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const response = await api.get("/customers/");
      setCustomers(getList(response));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoadingCustomers(false);
    }
  };

  const resetForm = (sales = data) => {
    setEditingId(null);

    setForm(
      createInitialForm(sales)
    );
  };

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setForm((current) => {
      const items = [...current.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...current,
        items,
      };
    });
  };

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

  const removeItem = (index) => {
    setForm((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
      };
    });
  };

  const subtotal = useMemo(() => {
    return form.items.reduce(
      (sum, item) =>
        sum + calculateItemTotal(item),
      0
    );
  }, [form.items]);

  const discount = Number(
    form.discount || 0
  );

  const total = Math.max(
    0,
    subtotal - discount
  );

  const validateForm = () => {
    if (!form.date) {
      return "Sale date is required.";
    }

    if (!form.invoice_no) {
      return "Invoice number could not be generated.";
    }

    if (discount < 0) {
      return "Discount cannot be negative.";
    }

    if (!form.items.length) {
      return "At least one sale item is required.";
    }

    for (
      let i = 0;
      i < form.items.length;
      i++
    ) {
      const item = form.items[i];

      if (!item.product.trim()) {
        return `Product is required for item ${
          i + 1
        }.`;
      }

      if (
        !item.quantity ||
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
    }

    return "";
  };

  const save = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      date: form.date,

      customer: form.customer
        ? Number(form.customer)
        : null,

      /*
       * Invoice is generated automatically
       * by Sales.jsx.
       */
      invoice_no: form.invoice_no,

      payment_method:
        form.payment_method,

      discount: discount,

      notes: form.notes.trim(),

      items: form.items.map((item) => ({
        product: item.product.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(
          item.unit_price
        ),
      })),
    };

    try {
      if (editingId) {
        await api.patch(
          `/sales/${editingId}/`,
          payload
        );

        showSuccess(
          "Sale updated successfully."
        );
      } else {
        await api.post(
          "/sales/",
          payload
        );

        showSuccess(
          `Sale ${form.invoice_no} recorded successfully.`
        );
      }

      setEditingId(null);

      await loadSales();

      /*
       * Generate the next invoice number
       * after saving.
       */
      setForm(
        createInitialForm([
          ...data,
          {
            invoice_no: form.invoice_no,
          },
        ])
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const editSale = (sale) => {
    setError("");
    setSuccess("");

    setEditingId(sale.id);

    setForm({
      date: sale.date || today,

      customer: sale.customer
        ? String(sale.customer)
        : "",

      /*
       * Keep the existing invoice number
       * when editing.
       */
      invoice_no:
        sale.invoice_no || "",

      payment_method:
        sale.payment_method || "cash",

      discount:
        sale.discount || "",

      notes:
        sale.notes || "",

      items:
        sale.items?.length > 0
          ? sale.items.map((item) => ({
              product:
                item.product || "",
              quantity:
                item.quantity ?? "",
              unit_price:
                item.unit_price ?? "",
            }))
          : [{ ...emptyItem }],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteSale = async (id) => {
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

      showSuccess(
        "Sale deleted successfully."
      );

      if (editingId === id) {
        resetForm(
          data.filter(
            (sale) => sale.id !== id
          )
        );
      }

      await loadSales();
    } catch (err) {
      setError(
        extractError(err)
      );
    } finally {
      setDeletingId(null);
    }
  };

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

  const filteredSales = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((sale) => {
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
          .includes(keyword)
      );
    });
  }, [
    data,
    search,
    customers,
  ]);

  const totalSales = useMemo(() => {
    return data.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.total || 0
        ),
      0
    );
  }, [data]);

  const totalPaid = useMemo(() => {
    return data
      .filter(
        (sale) =>
          sale.payment_method !==
          "credit"
      )
      .reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.total || 0
          ),
        0
      );
  }, [data]);

  const totalCredit = useMemo(() => {
    return data
      .filter(
        (sale) =>
          sale.payment_method ===
          "credit"
      )
      .reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.total || 0
          ),
        0
      );
  }, [data]);

  const getPaymentLabel = (
    value
  ) => {
    const method =
      paymentMethods.find(
        (item) =>
          item.value === value
      );

    return (
      method?.label ||
      value ||
      "-"
    );
  };

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Manage egg, chicken and other farm sales."
      />

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
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
        <div className="alert alert-success alert-dismissible fade show">
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

      {/* SUMMARY */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
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

        <div className="col-md-4">
          <div className="form-card h-100">
            <small className="text-muted">
              Paid Sales
            </small>

            <h4 className="mb-0 mt-1">
              TZS{" "}
              {formatMoney(
                totalPaid
              )}
            </h4>
          </div>
        </div>

        <div className="col-md-4">
          <div className="form-card h-100">
            <small className="text-muted">
              Credit Sales
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

      {/* FORM */}
      <div className="form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingId
              ? "Edit Sale"
              : "Record Sale"}
          </h5>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() =>
                resetForm()
              }
            >
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
                value={form.date}
                onChange={
                  handleFormChange
                }
                required
              />
            </div>

            {/* AUTO INVOICE */}
            <div className="col-md-3">
              <label className="form-label">
                Invoice No.
              </label>

              <input
                type="text"
                className="form-control"
                value={
                  form.invoice_no
                }
                readOnly
              />

              <small className="text-muted">
                Automatically generated
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
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            {/* PAYMENT */}
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
                  handleFormChange
                }
              >
                {paymentMethods.map(
                  (method) => (
                    <option
                      key={
                        method.value
                      }
                      value={
                        method.value
                      }
                    >
                      {method.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ITEMS */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  Sale Items
                </h6>

                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={
                    addItem
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
                      <th>
                        Quantity
                      </th>
                      <th>
                        Unit Price
                      </th>
                      <th>
                        Total
                      </th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.items.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Eggs - Tray"
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
                              required
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
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
                              required
                            />
                          </td>

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
                              required
                            />
                          </td>

                          <td>
                            <strong>
                              TZS{" "}
                              {formatMoney(
                                calculateItemTotal(
                                  item
                                )
                              )}
                            </strong>
                          </td>

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
                                form.items
                                  .length ===
                                1
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
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
              />
            </div>

            {/* NOTES */}
            <div className="col-md-8">
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
              />
            </div>

            {/* TOTAL */}
            <div className="col-12">
              <div className="border rounded p-3 bg-light">
                <div className="row justify-content-end">
                  <div className="col-md-4">
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

                      <strong>
                        TZS{" "}
                        {formatMoney(
                          discount
                        )}
                      </strong>
                    </div>

                    <hr />

                    <div className="d-flex justify-content-between">
                      <strong>
                        Total
                      </strong>

                      <strong className="fs-5">
                        TZS{" "}
                        {formatMoney(
                          total
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
                      ? "Update Sale"
                      : "Save Sale"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SALES TABLE */}
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
                  Payment
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
                    colSpan="7"
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
                    colSpan="7"
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
                  (sale) => (
                    <tr
                      key={
                        sale.id
                      }
                    >
                      <td>
                        <span className="record-link">
                          {
                            sale.invoice_no
                          }
                        </span>
                      </td>

                      <td>
                        {
                          sale.date
                        }
                      </td>

                      <td>
                        {getCustomerName(
                          sale.customer
                        )}
                      </td>

                      <td>
                        {sale.items
                          ?.length ? (
                          sale.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  item.id ||
                                  index
                                }
                              >
                                {
                                  item.product
                                }

                                <small className="text-muted ms-1">
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </small>
                              </div>
                            )
                          )
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <strong>
                          TZS{" "}
                          {formatMoney(
                            sale.total
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            sale.payment_method ===
                            "credit"
                              ? "inactive"
                              : "active"
                          }`}
                        >
                          {getPaymentLabel(
                            sale.payment_method
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() =>
                              editSale(
                                sale
                              )
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              deleteSale(
                                sale.id
                              )
                            }
                            disabled={
                              deletingId ===
                              sale.id
                            }
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
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

