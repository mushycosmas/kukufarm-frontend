/* Customer page formatting, API response and sales/payment helpers. */

export const getList = (data) => {
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

export const extractError = (err) => {
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

export const formatMoney = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat(
      "en-TZ",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };

export const formatNumber = (value) => {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(Number(value || 0));
  };

export const formatDate = (value) => {
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

export const getToday = () => {
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

export const getCustomerId = (sale) => {
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

export const getSaleDate = (sale) => {
    return (
      sale?.date ||
      sale?.sale_date ||
      sale?.created_at ||
      null
    );
  };

export const getSaleTotal = (sale) => {
    return Number(
      sale?.total ??
      sale?.grand_total ??
      sale?.amount ??
      0
    );
  };

export const getSalePaid = (sale) => {
    return Number(
      sale?.amount_paid ??
      sale?.paid_amount ??
      0
    );
  };

export const getSaleBalance = (sale) => {
    const total = getSaleTotal(sale);
    const paid = getSalePaid(sale);

    return Math.max(
      total - paid,
      0
    );
  };

export const getSaleItems = (sale) => {
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

export const getItemQuantity = (item) => {
    return Number(
      item?.quantity ??
      item?.qty ??
      0
    );
  };

export const getItemUnit = (item) => {
    return String(
      item?.unit || ""
    ).toLowerCase();
  };

export const isEggItem = (item) => {
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

export const getSaleEggs = (sale) => {
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

export const getSaleTrays = (sale) => {
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

export const getPaymentDate = (payment) => {
    return (
      payment?.date ||
      payment?.payment_date ||
      payment?.created_at ||
      null
    );
  };

export const getPaymentAmount = (payment) => {
    return Number(
      payment?.amount ??
      payment?.paid_amount ??
      0
    );
  };

export const getPaymentMethod = (payment) => {
    return (
      payment?.payment_method ||
      payment?.method ||
      "-"
    );
  };
