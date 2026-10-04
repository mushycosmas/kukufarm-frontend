// ============================================================
// FLOCK ERROR HANDLER
// ============================================================

export const extractFlockError = (err) => {
  const responseData = err?.response?.data;

  // No response from server
  if (!responseData) {
    return (
      err?.message ||
      "Unable to process flock. Please try again."
    );
  }

  // Server returned plain text
  if (typeof responseData === "string") {
    return responseData;
  }

  // DRF detail error
  if (responseData.detail) {
    return responseData.detail;
  }

  // Custom message
  if (responseData.message) {
    return responseData.message;
  }

  // Django REST Framework field validation errors
  if (typeof responseData === "object") {
    const messages = Object.entries(
      responseData
    ).flatMap(
      ([field, fieldMessages]) => {
        const list = Array.isArray(fieldMessages)
          ? fieldMessages
          : [fieldMessages];

        return list.map((message) => {
          // Handle nested error objects
          if (
            typeof message === "object" &&
            message !== null
          ) {
            return `${field}: ${JSON.stringify(
              message
            )}`;
          }

          return `${field}: ${message}`;
        });
      }
    );

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Unable to process flock. Please try again.";
};


// ============================================================
// FLOCK FORM VALIDATION
// ============================================================

export const validateFlockForm = (form) => {
  // ----------------------------------------------------------
  // Flock code
  // ----------------------------------------------------------
  if (!form.code?.trim()) {
    return "Flock code is required.";
  }

  // ----------------------------------------------------------
  // Flock name
  // ----------------------------------------------------------
  if (!form.name?.trim()) {
    return "Flock name is required.";
  }

  // ----------------------------------------------------------
  // Arrival date
  // ----------------------------------------------------------
  if (!form.arrival_date) {
    return "Arrival date is required.";
  }

  // ----------------------------------------------------------
  // Initial quantity
  // ----------------------------------------------------------
  if (
    form.initial_quantity === "" ||
    form.initial_quantity === null ||
    form.initial_quantity === undefined
  ) {
    return "Initial quantity is required.";
  }

  const initialQuantity = Number(
    form.initial_quantity
  );

  if (
    !Number.isFinite(initialQuantity) ||
    initialQuantity < 0
  ) {
    return "Initial quantity must be a valid number.";
  }

  // ----------------------------------------------------------
  // Current quantity
  // ----------------------------------------------------------
  if (
    form.current_quantity !== "" &&
    form.current_quantity !== null &&
    form.current_quantity !== undefined
  ) {
    const currentQuantity = Number(
      form.current_quantity
    );

    if (
      !Number.isFinite(currentQuantity) ||
      currentQuantity < 0
    ) {
      return "Current quantity must be a valid number.";
    }
  }

  // ----------------------------------------------------------
  // Age
  // ----------------------------------------------------------
  if (
    form.age_weeks !== "" &&
    form.age_weeks !== null &&
    form.age_weeks !== undefined
  ) {
    const ageWeeks = Number(
      form.age_weeks
    );

    if (
      !Number.isFinite(ageWeeks) ||
      ageWeeks < 0
    ) {
      return "Age must be a valid number.";
    }
  }

  // ----------------------------------------------------------
  // Current quantity cannot exceed initial quantity
  // ----------------------------------------------------------
  if (
    form.current_quantity !== "" &&
    form.current_quantity !== null &&
    form.current_quantity !== undefined
  ) {
    const currentQuantity = Number(
      form.current_quantity
    );

    if (
      Number.isFinite(currentQuantity) &&
      currentQuantity > initialQuantity
    ) {
      return "Current quantity cannot be greater than initial quantity.";
    }
  }

  return "";
};


// ============================================================
// BUILD API PAYLOAD
// ============================================================

export const buildFlockPayload = (form) => {
  const initialQuantity = Number(
    form.initial_quantity
  );

  const currentQuantity =
    form.current_quantity === "" ||
    form.current_quantity === null ||
    form.current_quantity === undefined
      ? initialQuantity
      : Number(form.current_quantity);

  const ageWeeks =
    form.age_weeks === "" ||
    form.age_weeks === null ||
    form.age_weeks === undefined
      ? 0
      : Number(form.age_weeks);

  return {
    code: form.code?.trim() || "",
    name: form.name?.trim() || "",
    breed: form.breed?.trim() || "",
    source: form.source?.trim() || "",
    arrival_date: form.arrival_date || null,

    initial_quantity: initialQuantity,

    current_quantity: currentQuantity,

    age_weeks: ageWeeks,

    status: form.status || "active",

    house: form.house?.trim() || "",

    notes: form.notes?.trim() || "",
  };
};


// ============================================================
// FORMAT NUMBER
// ============================================================

export const formatNumber = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString();
};


// ============================================================
// FORMAT STATUS
// ============================================================

export const formatStatus = (status) => {
  if (!status) {
    return "-";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
};


// ============================================================
// STATUS CSS CLASS
// ============================================================

export const getStatusClass = (status) => {
  switch (status) {
    case "active":
      return "status active";

    case "sold":
      return "status sold";

    case "closed":
      return "status closed";

    default:
      return "status";
  }
};