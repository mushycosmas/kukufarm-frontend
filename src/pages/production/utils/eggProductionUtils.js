export const EGGS_PER_TRAY = 30;

export const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatNumber = (value) => {
  return toNumber(value).toLocaleString("en-TZ");
};

export const formatTrays = (value) => {
  const number = toNumber(value);

  return number.toLocaleString("en-TZ", {
    minimumFractionDigits: number % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  });
};

export const createEmptyForm = (flocks = []) => ({
  date: getToday(),
  flock: flocks.length > 0 ? flocks[0].id : "",

  full_trays: "",
  loose_eggs: "",

  broken_eggs: "",
  rejected_eggs: "",

  notes: "",
});

export const getEggsCollected = (record) => {
  return toNumber(record.eggs_collected);
};

export const getBrokenEggs = (record) => {
  return toNumber(record.broken_eggs);
};

export const getRejectedEggs = (record) => {
  return toNumber(record.rejected_eggs);
};

export const getTotalEggs = (record) => {
  return (
    getEggsCollected(record) +
    getBrokenEggs(record) +
    getRejectedEggs(record)
  );
};

export const getEquivalentTrays = (record) => {
  return getEggsCollected(record) / EGGS_PER_TRAY;
};

export const getFlockName = (record, flocks = []) => {
  if (record.flock_code) {
    return record.flock_code;
  }

  if (record.flock_name) {
    return record.flock_name;
  }

  const flock = flocks.find(
    (item) =>
      Number(item.id) === Number(record.flock)
  );

  return flock?.code || flock?.name || "-";
};

export const calculateForm = (form) => {
  const fullTrays = toNumber(form.full_trays);
  const looseEggs = toNumber(form.loose_eggs);
  const brokenEggs = toNumber(form.broken_eggs);
  const rejectedEggs = toNumber(form.rejected_eggs);

  const eggsCollected =
    fullTrays * EGGS_PER_TRAY +
    looseEggs;

  const equivalentTrays =
    eggsCollected / EGGS_PER_TRAY;

  const totalPhysicallyCollected =
    eggsCollected +
    brokenEggs +
    rejectedEggs;

  const productionRate =
    totalPhysicallyCollected > 0
      ? (
          (eggsCollected /
            totalPhysicallyCollected) *
          100
        ).toFixed(1)
      : "0.0";

  return {
    fullTrays,
    looseEggs,
    brokenEggs,
    rejectedEggs,
    eggsCollected,
    equivalentTrays,
    totalPhysicallyCollected,
    productionRate,
  };
};

export const validateProductionForm = (form) => {
  if (!form.date) {
    return "Please select the production date.";
  }

  if (!form.flock) {
    return "Please select a flock.";
  }

  const fullTrays = toNumber(form.full_trays);
  const looseEggs = toNumber(form.loose_eggs);
  const brokenEggs = toNumber(form.broken_eggs);
  const rejectedEggs = toNumber(form.rejected_eggs);

  if (
    fullTrays < 0 ||
    looseEggs < 0 ||
    brokenEggs < 0 ||
    rejectedEggs < 0
  ) {
    return "Egg quantities cannot be negative.";
  }

  if (
    !Number.isInteger(fullTrays) ||
    !Number.isInteger(looseEggs) ||
    !Number.isInteger(brokenEggs) ||
    !Number.isInteger(rejectedEggs)
  ) {
    return "Egg quantities must be whole numbers.";
  }

  if (looseEggs >= EGGS_PER_TRAY) {
    return `Loose eggs must be between 0 and ${
      EGGS_PER_TRAY - 1
    }. For ${EGGS_PER_TRAY} eggs, add another full tray.`;
  }

  const eggsCollected =
    fullTrays * EGGS_PER_TRAY +
    looseEggs;

  if (
    eggsCollected === 0 &&
    brokenEggs === 0 &&
    rejectedEggs === 0
  ) {
    return "Please enter at least one egg quantity.";
  }

  return null;
};

export const buildProductionPayload = (form) => {
  const fullTrays = toNumber(form.full_trays);
  const looseEggs = toNumber(form.loose_eggs);
  const brokenEggs = toNumber(form.broken_eggs);
  const rejectedEggs = toNumber(form.rejected_eggs);

  const eggsCollected =
    fullTrays * EGGS_PER_TRAY +
    looseEggs;

  const trays = Number(
    (
      eggsCollected /
      EGGS_PER_TRAY
    ).toFixed(2)
  );

  return {
    flock: Number(form.flock),
    date: form.date,

    eggs_collected: eggsCollected,

    broken_eggs: brokenEggs,

    rejected_eggs: rejectedEggs,

    trays,

    notes: form.notes?.trim() || "",
  };
};

export const recordToForm = (record) => {
  const eggsCollected = toNumber(
    record.eggs_collected
  );

  const fullTrays = Math.floor(
    eggsCollected / EGGS_PER_TRAY
  );

  const looseEggs =
    eggsCollected % EGGS_PER_TRAY;

  return {
    date: record.date || "",

    flock: record.flock || "",

    full_trays:
      fullTrays > 0
        ? String(fullTrays)
        : "",

    loose_eggs:
      looseEggs > 0
        ? String(looseEggs)
        : "",

    broken_eggs:
      record.broken_eggs ?? "",

    rejected_eggs:
      record.rejected_eggs ?? "",

    notes:
      record.notes || "",
  };
};

export const calculateStatistics = (data) => {
  const today = getToday();

  const todayRecords = data.filter(
    (record) =>
      record.date === today
  );

  const todayEggs =
    todayRecords.reduce(
      (sum, record) =>
        sum + getEggsCollected(record),
      0
    );

  const totalCollected =
    data.reduce(
      (sum, record) =>
        sum + getEggsCollected(record),
      0
    );

  const totalBroken =
    data.reduce(
      (sum, record) =>
        sum + getBrokenEggs(record),
      0
    );

  const totalRejected =
    data.reduce(
      (sum, record) =>
        sum + getRejectedEggs(record),
      0
    );

  const totalEggs =
    data.reduce(
      (sum, record) =>
        sum + getTotalEggs(record),
      0
    );

  const totalTrays =
    totalCollected / EGGS_PER_TRAY;

  const productionRate =
    totalEggs > 0
      ? (
          (totalCollected / totalEggs) *
          100
        ).toFixed(1)
      : "0.0";

  return {
    todayEggs,
    totalCollected,
    totalBroken,
    totalRejected,
    totalEggs,
    totalTrays,
    productionRate,
  };
};

export const getBackendError = (error) => {
  const backendError =
    error.response?.data;

  if (
    backendError &&
    typeof backendError === "object"
  ) {
    return Object.entries(
      backendError
    )
      .map(([field, value]) => {
        const message =
          Array.isArray(value)
            ? value.join(", ")
            : String(value);

        return `${field}: ${message}`;
      })
      .join(" ");
  }

  return (
    backendError?.detail ||
    "An unexpected error occurred."
  );
};