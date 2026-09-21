import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const today = new Date().toISOString().split("T")[0];

const emptyHealthForm = {
  date: today,
  flock: "",
  condition: "",
  symptoms: "",
  treatment: "",
  medicine: "",
  dosage: "",
  veterinarian: "",
  notes: "",
};

const emptyVaccinationForm = {
  flock: "",
  vaccine: "",
  date: today,
  next_due_date: "",
  dosage: "",
  administered_by: "",
  notes: "",
};

const emptyMortalityForm = {
  flock: "",
  date: today,
  quantity: "",
  cause: "",
  notes: "",
};

const mortalityCauses = [
  "Natural",
  "Disease",
  "Accident",
  "Predation",
  "Heat Stress",
  "Cold Stress",
  "Injury",
  "Cannibalism",
  "Unknown",
  "Other",
];

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getFlockDisplay(flock) {
  if (!flock) return "-";

  return flock.code
    ? `${flock.code}${flock.name ? ` - ${flock.name}` : ""}`
    : flock.name || `Flock #${flock.id}`;
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
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

  const messages = [];

  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      messages.push(`${field}: ${value.join(", ")}`);
    } else if (typeof value === "string") {
      messages.push(`${field}: ${value}`);
    } else {
      messages.push(`${field}: ${JSON.stringify(value)}`);
    }
  });

  return messages.length ? messages.join(" | ") : fallback;
}

export default function HealthManagement() {
  const [activeTab, setActiveTab] = useState("health");

  const [flocks, setFlocks] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [mortalities, setMortalities] = useState([]);

  const [healthForm, setHealthForm] = useState(emptyHealthForm);
  const [vaccinationForm, setVaccinationForm] =
    useState(emptyVaccinationForm);
  const [mortalityForm, setMortalityForm] =
    useState(emptyMortalityForm);

  const [editingHealthId, setEditingHealthId] = useState(null);
  const [editingVaccinationId, setEditingVaccinationId] = useState(null);
  const [editingMortalityId, setEditingMortalityId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        flocksResponse,
        healthResponse,
        vaccinationResponse,
        mortalityResponse,
      ] = await Promise.all([
        api.get("/flocks/"),
        api.get("/health/records/"),
        api.get("/health/vaccinations/"),
        api.get("/health/mortality/"),
      ]);

      setFlocks(getResults(flocksResponse.data));
      setHealthRecords(getResults(healthResponse.data));
      setVaccinations(getResults(vaccinationResponse.data));
      setMortalities(getResults(mortalityResponse.data));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load health data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHealthChange = (e) => {
    const { name, value } = e.target;

    setHealthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVaccinationChange = (e) => {
    const { name, value } = e.target;

    setVaccinationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMortalityChange = (e) => {
    const { name, value } = e.target;

    setMortalityForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetHealthForm = () => {
    setHealthForm({
      ...emptyHealthForm,
      date: today,
    });
    setEditingHealthId(null);
  };

  const resetVaccinationForm = () => {
    setVaccinationForm({
      ...emptyVaccinationForm,
      date: today,
    });
    setEditingVaccinationId(null);
  };

  const resetMortalityForm = () => {
    setMortalityForm({
      ...emptyMortalityForm,
      date: today,
    });
    setEditingMortalityId(null);
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!healthForm.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!healthForm.condition.trim()) {
      setError("Please enter the health condition.");
      return;
    }

    const payload = {
      flock: Number(healthForm.flock),
      date: healthForm.date,
      condition: healthForm.condition,
      symptoms: healthForm.symptoms,
      treatment: healthForm.treatment,
      medicine: healthForm.medicine,
      dosage: healthForm.dosage,
      veterinarian: healthForm.veterinarian,
      notes: healthForm.notes,
    };

    setSaving(true);

    try {
      if (editingHealthId) {
        await api.patch(
          `/health/records/${editingHealthId}/`,
          payload
        );

        setSuccess("Health record updated successfully.");
      } else {
        await api.post("/health/records/", payload);

        setSuccess("Health record added successfully.");
      }

      resetHealthForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save health record.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVaccinationSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!vaccinationForm.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!vaccinationForm.vaccine.trim()) {
      setError("Please enter the vaccine name.");
      return;
    }

    const payload = {
      flock: Number(vaccinationForm.flock),
      vaccine: vaccinationForm.vaccine,
      date: vaccinationForm.date,
      next_due_date: vaccinationForm.next_due_date || null,
      dosage: vaccinationForm.dosage,
      administered_by: vaccinationForm.administered_by,
      notes: vaccinationForm.notes,
    };

    setSaving(true);

    try {
      if (editingVaccinationId) {
        await api.patch(
          `/health/vaccinations/${editingVaccinationId}/`,
          payload
        );

        setSuccess("Vaccination record updated successfully.");
      } else {
        await api.post("/health/vaccinations/", payload);

        setSuccess("Vaccination record added successfully.");
      }

      resetVaccinationForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save vaccination record.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMortalitySubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!mortalityForm.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!mortalityForm.date) {
      setError("Please select the mortality date.");
      return;
    }

    if (
      mortalityForm.quantity === "" ||
      Number(mortalityForm.quantity) <= 0
    ) {
      setError("Mortality quantity must be greater than zero.");
      return;
    }

    if (!mortalityForm.cause) {
      setError("Please select the mortality cause.");
      return;
    }

    const payload = {
      flock: Number(mortalityForm.flock),
      date: mortalityForm.date,
      quantity: Number(mortalityForm.quantity),
      cause: mortalityForm.cause,
      notes: mortalityForm.notes,
    };

    setSaving(true);

    try {
      if (editingMortalityId) {
        await api.patch(
          `/health/mortality/${editingMortalityId}/`,
          payload
        );

        setSuccess("Mortality record updated successfully.");
      } else {
        await api.post("/health/mortality/", payload);

        setSuccess("Mortality record added successfully.");
      }

      resetMortalityForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save mortality record.")
      );
    } finally {
      setSaving(false);
    }
  };

  const editHealth = (record) => {
    clearMessages();

    setActiveTab("health");

    setHealthForm({
      date: record.date || today,
      flock: record.flock ? String(record.flock) : "",
      condition: record.condition || "",
      symptoms: record.symptoms || "",
      treatment: record.treatment || "",
      medicine: record.medicine || "",
      dosage: record.dosage || "",
      veterinarian: record.veterinarian || "",
      notes: record.notes || "",
    });

    setEditingHealthId(record.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const editVaccination = (record) => {
    clearMessages();

    setActiveTab("vaccination");

    setVaccinationForm({
      flock: record.flock ? String(record.flock) : "",
      vaccine: record.vaccine || "",
      date: record.date || today,
      next_due_date: record.next_due_date || "",
      dosage: record.dosage || "",
      administered_by: record.administered_by || "",
      notes: record.notes || "",
    });

    setEditingVaccinationId(record.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const editMortality = (record) => {
    clearMessages();

    setActiveTab("mortality");

    setMortalityForm({
      flock: record.flock ? String(record.flock) : "",
      date: record.date || today,
      quantity:
        record.quantity !== undefined && record.quantity !== null
          ? String(record.quantity)
          : "",
      cause: record.cause || "",
      notes: record.notes || "",
    });

    setEditingMortalityId(record.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteHealth = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this health record?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.delete(`/health/records/${id}/`);

      setSuccess("Health record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to delete health record.")
      );
    }
  };

  const deleteVaccination = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vaccination record?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.delete(`/health/vaccinations/${id}/`);

      setSuccess("Vaccination record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to delete vaccination record.")
      );
    }
  };

  const deleteMortality = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this mortality record?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.delete(`/health/mortality/${id}/`);

      setSuccess(
        "Mortality record deleted successfully and flock quantity refreshed."
      );

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to delete mortality record.")
      );
    }
  };

  const filteredHealthRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return healthRecords;

    return healthRecords.filter((record) => {
      const flock = flocks.find(
        (item) => Number(item.id) === Number(record.flock)
      );

      const text = [
        record.condition,
        record.symptoms,
        record.treatment,
        record.medicine,
        record.dosage,
        record.veterinarian,
        record.notes,
        flock?.code,
        flock?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [healthRecords, flocks, search]);

  const filteredVaccinations = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return vaccinations;

    return vaccinations.filter((record) => {
      const flock = flocks.find(
        (item) => Number(item.id) === Number(record.flock)
      );

      const text = [
        record.vaccine,
        record.dosage,
        record.administered_by,
        record.notes,
        flock?.code,
        flock?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [vaccinations, flocks, search]);

  const filteredMortalities = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return mortalities;

    return mortalities.filter((record) => {
      const flock = flocks.find(
        (item) => Number(item.id) === Number(record.flock)
      );

      const text = [
        record.cause,
        record.notes,
        record.quantity,
        flock?.code,
        flock?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [mortalities, flocks, search]);

  const activeFlocks = useMemo(() => {
    return flocks.filter(
      (flock) =>
        !flock.status ||
        String(flock.status).toLowerCase() === "active"
    );
  }, [flocks]);

  const totalMortality = useMemo(() => {
    return mortalities.reduce(
      (total, record) => total + Number(record.quantity || 0),
      0
    );
  }, [mortalities]);

  const totalHealthRecords = healthRecords.length;
  const totalVaccinations = vaccinations.length;

  const getFlockById = (id) => {
    return flocks.find(
      (flock) => Number(flock.id) === Number(id)
    );
  };

  return (
    <>
      <PageHeader
        title="Health & Vaccination"
        subtitle="Manage flock health records, vaccinations, treatments and mortality."
      />

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <strong>Error:</strong> {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {/* SUMMARY */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Health Records
              </div>

              <div className="fs-3 fw-bold">
                {totalHealthRecords}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Vaccinations
              </div>

              <div className="fs-3 fw-bold">
                {totalVaccinations}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                Total Mortality
              </div>

              <div className="fs-3 fw-bold">
                {totalMortality}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "health" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("health");
                  clearMessages();
                }}
              >
                Health Records
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "vaccination" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("vaccination");
                  clearMessages();
                }}
              >
                Vaccinations
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "mortality" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("mortality");
                  clearMessages();
                }}
              >
                Mortality
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* HEALTH RECORD */}
      {activeTab === "health" && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">
                    {editingHealthId
                      ? "Edit Health Record"
                      : "Add Health Record"}
                  </h5>

                  <small className="text-muted">
                    Record illness, symptoms, treatment and medication.
                  </small>
                </div>

                {editingHealthId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetHealthForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleHealthSubmit}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>

                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={healthForm.date}
                      onChange={handleHealthChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Flock <span className="text-danger">*</span>
                    </label>

                    <select
                      name="flock"
                      className="form-select"
                      value={healthForm.flock}
                      onChange={handleHealthChange}
                      required
                    >
                      <option value="">
                        Select flock
                      </option>

                      {activeFlocks.map((flock) => (
                        <option
                          key={flock.id}
                          value={flock.id}
                        >
                          {getFlockDisplay(flock)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Condition <span className="text-danger">*</span>
                    </label>

                    <input
                      type="text"
                      name="condition"
                      className="form-control"
                      placeholder="e.g. Respiratory infection"
                      value={healthForm.condition}
                      onChange={handleHealthChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Symptoms
                    </label>

                    <textarea
                      name="symptoms"
                      className="form-control"
                      rows="3"
                      placeholder="Describe symptoms..."
                      value={healthForm.symptoms}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Treatment
                    </label>

                    <textarea
                      name="treatment"
                      className="form-control"
                      rows="3"
                      placeholder="Treatment given..."
                      value={healthForm.treatment}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Medicine
                    </label>

                    <input
                      type="text"
                      name="medicine"
                      className="form-control"
                      placeholder="Medicine name"
                      value={healthForm.medicine}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Dosage
                    </label>

                    <input
                      type="text"
                      name="dosage"
                      className="form-control"
                      placeholder="e.g. 5ml / bird"
                      value={healthForm.dosage}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Veterinarian
                    </label>

                    <input
                      type="text"
                      name="veterinarian"
                      className="form-control"
                      placeholder="Veterinarian name"
                      value={healthForm.veterinarian}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      placeholder="Additional notes..."
                      value={healthForm.notes}
                      onChange={handleHealthChange}
                    />
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingHealthId
                        ? "Update Health Record"
                        : "Save Health Record"}
                    </button>

                    {editingHealthId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary ms-2"
                        onClick={resetHealthForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Health Records
                </h5>

                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-5">
                  Loading...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Flock</th>
                        <th>Condition</th>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Veterinarian</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredHealthRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-muted py-4"
                          >
                            No health records found.
                          </td>
                        </tr>
                      ) : (
                        filteredHealthRecords.map((record) => {
                          const flock = getFlockById(record.flock);

                          return (
                            <tr key={record.id}>
                              <td>
                                {formatDate(record.date)}
                              </td>

                              <td>
                                {getFlockDisplay(flock)}
                              </td>

                              <td>
                                <strong>
                                  {record.condition || "-"}
                                </strong>

                                {record.symptoms && (
                                  <div className="small text-muted">
                                    {record.symptoms}
                                  </div>
                                )}
                              </td>

                              <td>
                                {record.medicine || "-"}
                              </td>

                              <td>
                                {record.dosage || "-"}
                              </td>

                              <td>
                                {record.veterinarian || "-"}
                              </td>

                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() =>
                                      editHealth(record)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      deleteHealth(record.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VACCINATION */}
      {activeTab === "vaccination" && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">
                    {editingVaccinationId
                      ? "Edit Vaccination"
                      : "Add Vaccination"}
                  </h5>

                  <small className="text-muted">
                    Record vaccines administered to each flock.
                  </small>
                </div>

                {editingVaccinationId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetVaccinationForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleVaccinationSubmit}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Flock <span className="text-danger">*</span>
                    </label>

                    <select
                      name="flock"
                      className="form-select"
                      value={vaccinationForm.flock}
                      onChange={handleVaccinationChange}
                      required
                    >
                      <option value="">
                        Select flock
                      </option>

                      {activeFlocks.map((flock) => (
                        <option
                          key={flock.id}
                          value={flock.id}
                        >
                          {getFlockDisplay(flock)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Vaccine <span className="text-danger">*</span>
                    </label>

                    <input
                      type="text"
                      name="vaccine"
                      className="form-control"
                      placeholder="e.g. Newcastle"
                      value={vaccinationForm.vaccine}
                      onChange={handleVaccinationChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>

                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={vaccinationForm.date}
                      onChange={handleVaccinationChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Next Due Date
                    </label>

                    <input
                      type="date"
                      name="next_due_date"
                      className="form-control"
                      value={vaccinationForm.next_due_date}
                      onChange={handleVaccinationChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Dosage
                    </label>

                    <input
                      type="text"
                      name="dosage"
                      className="form-control"
                      placeholder="e.g. 1 dose / bird"
                      value={vaccinationForm.dosage}
                      onChange={handleVaccinationChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Administered By
                    </label>

                    <input
                      type="text"
                      name="administered_by"
                      className="form-control"
                      placeholder="Name"
                      value={vaccinationForm.administered_by}
                      onChange={handleVaccinationChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      placeholder="Additional notes..."
                      value={vaccinationForm.notes}
                      onChange={handleVaccinationChange}
                    />
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingVaccinationId
                        ? "Update Vaccination"
                        : "Save Vaccination"}
                    </button>

                    {editingVaccinationId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary ms-2"
                        onClick={resetVaccinationForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Vaccination History
                </h5>

                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search vaccinations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-5">
                  Loading...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Flock</th>
                        <th>Vaccine</th>
                        <th>Next Due</th>
                        <th>Dosage</th>
                        <th>Administered By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredVaccinations.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-muted py-4"
                          >
                            No vaccination records found.
                          </td>
                        </tr>
                      ) : (
                        filteredVaccinations.map((record) => {
                          const flock = getFlockById(record.flock);

                          return (
                            <tr key={record.id}>
                              <td>
                                {formatDate(record.date)}
                              </td>

                              <td>
                                {getFlockDisplay(flock)}
                              </td>

                              <td>
                                <strong>
                                  {record.vaccine || "-"}
                                </strong>
                              </td>

                              <td>
                                {formatDate(
                                  record.next_due_date
                                )}
                              </td>

                              <td>
                                {record.dosage || "-"}
                              </td>

                              <td>
                                {record.administered_by || "-"}
                              </td>

                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() =>
                                      editVaccination(record)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      deleteVaccination(
                                        record.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MORTALITY */}
      {activeTab === "mortality" && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">
                    {editingMortalityId
                      ? "Edit Mortality Record"
                      : "Add Mortality Record"}
                  </h5>

                  <small className="text-muted">
                    Record bird deaths and automatically update flock quantity.
                  </small>
                </div>

                {editingMortalityId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetMortalityForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleMortalitySubmit}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Flock <span className="text-danger">*</span>
                    </label>

                    <select
                      name="flock"
                      className="form-select"
                      value={mortalityForm.flock}
                      onChange={handleMortalityChange}
                      required
                    >
                      <option value="">
                        Select flock
                      </option>

                      {activeFlocks.map((flock) => (
                        <option
                          key={flock.id}
                          value={flock.id}
                        >
                          {getFlockDisplay(flock)}
                          {flock.current_quantity !== undefined &&
                            ` — ${flock.current_quantity} birds`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>

                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={mortalityForm.date}
                      onChange={handleMortalityChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Quantity <span className="text-danger">*</span>
                    </label>

                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      min="1"
                      step="1"
                      placeholder="Number of birds"
                      value={mortalityForm.quantity}
                      onChange={handleMortalityChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Cause <span className="text-danger">*</span>
                    </label>

                    <select
                      name="cause"
                      className="form-select"
                      value={mortalityForm.cause}
                      onChange={handleMortalityChange}
                      required
                    >
                      <option value="">
                        Select mortality cause
                      </option>

                      {mortalityCauses.map((cause) => (
                        <option key={cause} value={cause}>
                          {cause}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      placeholder="Additional information..."
                      value={mortalityForm.notes}
                      onChange={handleMortalityChange}
                    />
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingMortalityId
                        ? "Update Mortality"
                        : "Save Mortality"}
                    </button>

                    {editingMortalityId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary ms-2"
                        onClick={resetMortalityForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Mortality Records
                </h5>

                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: "300px" }}
                  placeholder="Search mortality..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-5">
                  Loading...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Flock</th>
                        <th>Quantity</th>
                        <th>Cause</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredMortalities.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center text-muted py-4"
                          >
                            No mortality records found.
                          </td>
                        </tr>
                      ) : (
                        filteredMortalities.map((record) => {
                          const flock = getFlockById(record.flock);

                          return (
                            <tr key={record.id}>
                              <td>
                                {formatDate(record.date)}
                              </td>

                              <td>
                                {getFlockDisplay(flock)}
                              </td>

                              <td>
                                <span className="badge bg-danger">
                                  {record.quantity} birds
                                </span>
                              </td>

                              <td>
                                <span className="badge bg-secondary">
                                  {record.cause || "Unknown"}
                                </span>
                              </td>

                              <td>
                                {record.notes || "-"}
                              </td>

                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() =>
                                      editMortality(record)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      deleteMortality(record.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
