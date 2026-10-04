export const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `TZS ${amount.toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  })}`;
};

export const extractError = (error) => {
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

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(", ")
        : String(messages);

      return `${field}: ${message}`;
    })
    .join(" | ");
};

export const getPaymentLabel = (value, paymentMethods) => {
  const method = paymentMethods.find(
    (item) => item.value === value
  );

  return method ? method.label : value || "-";
};