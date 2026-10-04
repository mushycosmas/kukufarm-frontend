// ============================================================
// SALES CONSTANTS
// ============================================================

export const EGGS_PER_TRAY = 30;

export const paymentMethods = [
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "mobile",
    label: "Mobile Money",
  },
  {
    value: "bank",
    label: "Bank",
  },
  {
    value: "credit",
    label: "Credit",
  },
];

export const paymentTransactionMethods = [
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "mobile",
    label: "Mobile Money",
  },
  {
    value: "bank",
    label: "Bank",
  },
];

export const units = [
  {
    value: "piece",
    label: "Piece",
  },
  {
    value: "tray",
    label: "Tray",
  },
];

export const emptyItem = {
  product: "",
  is_egg: false,
  quantity: "",
  unit: "piece",
  unit_price: "",
};

// ============================================================
// DATE
// ============================================================

export const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// INITIAL SALE FORM
// ============================================================

export const createInitialForm = () => ({
  date: getToday(),

  customer: "",

  invoice_no: "",

  payment_method: "cash",

  amount_paid: "",

  discount: "",

  notes: "",

  items: [
    {
      ...emptyItem,
    },
  ],
});

// ============================================================
// INITIAL PAYMENT FORM
// ============================================================

export const createInitialPaymentForm = () => ({
  date: getToday(),

  amount: "",

  payment_method: "cash",

  reference: "",

  notes: "",
});

// ============================================================
// GET API LIST
// ============================================================

export function getList(response) {
  // Axios response:
  // response.data = [...]
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Axios response:
  // response.data.results = [...]
  if (
    Array.isArray(
      response?.data?.results
    )
  ) {
    return response.data.results;
  }

  // Direct array
  if (Array.isArray(response)) {
    return response;
  }

  // Direct results object
  if (
    Array.isArray(
      response?.results
    )
  ) {
    return response.results;
  }

  return [];
}

// ============================================================
// ERROR EXTRACTION
// ============================================================

export function extractError(error) {
  const data = error?.response?.data;

  if (!data) {
    return (
      error?.message ||
      "Something went wrong."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.message) {
    return data.message;
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
          message =
            JSON.stringify(value);
        }

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

// ============================================================
// FORMAT MONEY
// ============================================================

export function formatMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  });
}

// ============================================================
// ITEM TOTAL
// ============================================================

export function calculateItemTotal(item) {
  if (!item) {
    return 0;
  }

  return (
    Number(item.quantity || 0) *
    Number(item.unit_price || 0)
  );
}

// ============================================================
// EGG QUANTITY
// ============================================================

export function calculateEggQuantity(item) {
  if (!item || !item.is_egg) {
    return 0;
  }

  const quantity = Number(
    item.quantity || 0
  );

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  if (item.unit === "tray") {
    return (
      quantity *
      EGGS_PER_TRAY
    );
  }

  return quantity;
}

// ============================================================
// PAYMENT STATUS
// ============================================================

export function getPaymentStatus(
  total,
  amountPaid
) {
  const saleTotal = Number(
    total || 0
  );

  const paid = Number(
    amountPaid || 0
  );

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

// ============================================================
// PAYMENT STATUS LABEL
// ============================================================

export function getPaymentStatusLabel(
  status
) {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "paid":
      return "Paid";

    case "partial":
      return "Partial";

    case "unpaid":
      return "Unpaid";

    case "credit":
      return "Credit";

    default:
      return "Unpaid";
  }
}

// ============================================================
// PAYMENT STATUS CLASS
// ============================================================

export function getPaymentStatusClass(
  status
) {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "paid":
      return "active";

    case "partial":
      return "warning";

    case "unpaid":
      return "inactive";

    case "credit":
      return "inactive";

    default:
      return "inactive";
  }
}

// ============================================================
// PAYMENT METHOD LABEL
// ============================================================

export function getPaymentMethodLabel(
  value
) {
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
}

// ============================================================
// TRANSACTION PAYMENT METHOD LABEL
// ============================================================

export function getTransactionPaymentMethodLabel(
  value
) {
  const method =
    paymentTransactionMethods.find(
      (item) =>
        item.value === value
    );

  return (
    method?.label ||
    value ||
    "-"
  );
}

// ============================================================
// NUMERIC FIELD HELPER
// ============================================================

export function getNumericField(
  object,
  fields
) {
  for (const field of fields) {
    if (
      object?.[field] !== undefined &&
      object?.[field] !== null &&
      object?.[field] !== ""
    ) {
      const value = Number(
        object[field]
      );

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

// ============================================================
// GET AVAILABLE EGG STOCK
// ============================================================

export function getAvailableEggStock(
  response
) {
  const data = response?.data ?? response;

  // ----------------------------------------------------------
  // DIRECT OBJECT
  // ----------------------------------------------------------

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const directStock =
      getNumericField(data, [
        "available_eggs",
        "egg_stock",
        "current_stock",
        "current_egg_stock",
        "eggs_available",
        "available_stock",
        "closing_stock",
        "balance",
        "stock",
      ]);

    if (directStock !== null) {
      return Math.max(
        0,
        directStock
      );
    }

    // --------------------------------------------------------
    // NESTED DATA
    // --------------------------------------------------------

    if (
      data.data &&
      typeof data.data ===
        "object" &&
      !Array.isArray(data.data)
    ) {
      const nestedStock =
        getNumericField(
          data.data,
          [
            "available_eggs",
            "egg_stock",
            "current_stock",
            "current_egg_stock",
            "eggs_available",
            "available_stock",
            "closing_stock",
            "balance",
            "stock",
          ]
        );

      if (nestedStock !== null) {
        return Math.max(
          0,
          nestedStock
        );
      }
    }
  }

  // ----------------------------------------------------------
  // ARRAY RECORDS
  // ----------------------------------------------------------

  const records =
    getList(response);

  if (!records.length) {
    return 0;
  }

  const sortedRecords = [
    ...records,
  ].sort((a, b) => {
    const dateA = String(
      a?.date || ""
    );

    const dateB = String(
      b?.date || ""
    );

    if (dateA !== dateB) {
      return dateB.localeCompare(
        dateA
      );
    }

    return (
      Number(b?.id || 0) -
      Number(a?.id || 0)
    );
  });

  // ----------------------------------------------------------
  // FIND DIRECT STOCK VALUE
  // ----------------------------------------------------------

  for (const record of sortedRecords) {
    const stock =
      getNumericField(
        record,
        [
          "available_eggs",
          "egg_stock",
          "current_stock",
          "current_egg_stock",
          "eggs_available",
          "available_stock",
          "closing_stock",
          "balance",
          "stock",
        ]
      );

    if (stock !== null) {
      return Math.max(
        0,
        stock
      );
    }
  }

  // ----------------------------------------------------------
  // CALCULATE FROM LATEST RECORD
  // ----------------------------------------------------------

  const latest =
    sortedRecords[0];

  const openingStock =
    getNumericField(
      latest,
      [
        "opening_stock",
        "opening_eggs",
      ]
    );

  const produced =
    getNumericField(
      latest,
      [
        "eggs_collected",
        "eggs_produced",
        "produced_eggs",
        "production",
      ]
    );

  const sold =
    getNumericField(
      latest,
      [
        "eggs_sold",
        "sold_eggs",
        "sales",
      ]
    );

  if (
    openingStock !== null ||
    produced !== null ||
    sold !== null
  ) {
    return Math.max(
      0,
      (openingStock || 0) +
        (produced || 0) -
        (sold || 0)
    );
  }

  return 0;
}