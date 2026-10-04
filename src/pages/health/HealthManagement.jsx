import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import api from "../../services/api";
import HealthForm from "./components/HealthForm";
import HealthTable from "./components/HealthTable";
import VaccinationForm from "./components/VaccinationForm";
import VaccinationTable from "./components/VaccinationTable";
import MortalityForm from "./components/MortalityForm";
import MortalityTable from "./components/MortalityTable";
import HealthReport from "./components/HealthReport";

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

function getResults(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getErrorMessage(
  error,
  fallback = "Something went wrong."
) {
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
      messages.push(
        `${field}: ${value.join(", ")}`
      );
    } else if (typeof value === "string") {
      messages.push(
        `${field}: ${value}`
      );
    } else {
      messages.push(
        `${field}: ${JSON.stringify(value)}`
      );
    }
  });

  return messages.length
    ? messages.join(" | ")
    : fallback;
}

export default function HealthManagement() {
  const [activeTab, setActiveTab] =
    useState("health");

  const [flocks, setFlocks] = useState([]);
  const [healthRecords, setHealthRecords] =
    useState([]);
  const [vaccinations, setVaccinations] =
    useState([]);
  const [mortalities, setMortalities] =
    useState([]);

  const [healthForm, setHealthForm] =
    useState(emptyHealthForm);

  const [vaccinationForm, setVaccinationForm] =
    useState(emptyVaccinationForm);

  const [mortalityForm, setMortalityForm] =
    useState(emptyMortalityForm);

  const [editingHealthId, setEditingHealthId] =
    useState(null);

  const [
    editingVaccinationId,
    setEditingVaccinationId,
  ] = useState(null);

  const [
    editingMortalityId,
    setEditingMortalityId,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

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

      setFlocks(
        getResults(flocksResponse.data)
      );

      setHealthRecords(
        getResults(healthResponse.data)
      );

      setVaccinations(
        getResults(vaccinationResponse.data)
      );

      setMortalities(
        getResults(mortalityResponse.data)
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load health data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeFlocks = useMemo(() => {
    return flocks.filter(
      (flock) =>
        !flock.status ||
        String(flock.status).toLowerCase() ===
          "active"
    );
  }, [flocks]);

  const getFlockById = (id) => {
    return flocks.find(
      (flock) =>
        Number(flock.id) === Number(id)
    );
  };

  const totalMortality = useMemo(() => {
    return mortalities.reduce(
      (total, record) =>
        total + Number(record.quantity || 0),
      0
    );
  }, [mortalities]);

  // ---------------------------------------------------------
  // HEALTH
  // ---------------------------------------------------------

  const saveHealth = async (form) => {
    clearMessages();

    if (!form.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!form.condition.trim()) {
      setError(
        "Please enter the health condition."
      );
      return;
    }

    const payload = {
      flock: Number(form.flock),
      date: form.date,
      condition: form.condition,
      symptoms: form.symptoms,
      treatment: form.treatment,
      medicine: form.medicine,
      dosage: form.dosage,
      veterinarian: form.veterinarian,
      notes: form.notes,
    };

    setSaving(true);

    try {
      if (editingHealthId) {
        await api.patch(
          `/health/records/${editingHealthId}/`,
          payload
        );

        setSuccess(
          "Health record updated successfully."
        );
      } else {
        await api.post(
          "/health/records/",
          payload
        );

        setSuccess(
          "Health record added successfully."
        );
      }

      resetHealthForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to save health record."
        )
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
      flock: record.flock
        ? String(record.flock)
        : "",
      condition: record.condition || "",
      symptoms: record.symptoms || "",
      treatment: record.treatment || "",
      medicine: record.medicine || "",
      dosage: record.dosage || "",
      veterinarian:
        record.veterinarian || "",
      notes: record.notes || "",
    });

    setEditingHealthId(record.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteHealth = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this health record?"
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await api.delete(
        `/health/records/${id}/`
      );

      setSuccess(
        "Health record deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete health record."
        )
      );
    }
  };

  const resetHealthForm = () => {
    setHealthForm({
      ...emptyHealthForm,
      date: today,
    });

    setEditingHealthId(null);
  };

  // ---------------------------------------------------------
  // VACCINATION
  // ---------------------------------------------------------

  const saveVaccination = async (form) => {
    clearMessages();

    if (!form.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!form.vaccine.trim()) {
      setError(
        "Please enter the vaccine name."
      );
      return;
    }

    const payload = {
      flock: Number(form.flock),
      vaccine: form.vaccine,
      date: form.date,
      next_due_date:
        form.next_due_date || null,
      dosage: form.dosage,
      administered_by:
        form.administered_by,
      notes: form.notes,
    };

    setSaving(true);

    try {
      if (editingVaccinationId) {
        await api.patch(
          `/health/vaccinations/${editingVaccinationId}/`,
          payload
        );

        setSuccess(
          "Vaccination record updated successfully."
        );
      } else {
        await api.post(
          "/health/vaccinations/",
          payload
        );

        setSuccess(
          "Vaccination record added successfully."
        );
      }

      resetVaccinationForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to save vaccination record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const editVaccination = (record) => {
    clearMessages();

    setActiveTab("vaccination");

    setVaccinationForm({
      flock: record.flock
        ? String(record.flock)
        : "",
      vaccine: record.vaccine || "",
      date: record.date || today,
      next_due_date:
        record.next_due_date || "",
      dosage: record.dosage || "",
      administered_by:
        record.administered_by || "",
      notes: record.notes || "",
    });

    setEditingVaccinationId(record.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteVaccination = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vaccination record?"
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await api.delete(
        `/health/vaccinations/${id}/`
      );

      setSuccess(
        "Vaccination record deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete vaccination record."
        )
      );
    }
  };

  const resetVaccinationForm = () => {
    setVaccinationForm({
      ...emptyVaccinationForm,
      date: today,
    });

    setEditingVaccinationId(null);
  };

  // ---------------------------------------------------------
  // MORTALITY
  // ---------------------------------------------------------

  const saveMortality = async (form) => {
    clearMessages();

    if (!form.flock) {
      setError("Please select a flock.");
      return;
    }

    if (!form.date) {
      setError(
        "Please select the mortality date."
      );
      return;
    }

    if (
      form.quantity === "" ||
      Number(form.quantity) <= 0
    ) {
      setError(
        "Mortality quantity must be greater than zero."
      );
      return;
    }

    if (!form.cause) {
      setError(
        "Please select the mortality cause."
      );
      return;
    }

    const payload = {
      flock: Number(form.flock),
      date: form.date,
      quantity: Number(form.quantity),
      cause: form.cause,
      notes: form.notes,
    };

    setSaving(true);

    try {
      if (editingMortalityId) {
        await api.patch(
          `/health/mortality/${editingMortalityId}/`,
          payload
        );

        setSuccess(
          "Mortality record updated successfully."
        );
      } else {
        await api.post(
          "/health/mortality/",
          payload
        );

        setSuccess(
          "Mortality record added successfully."
        );
      }

      resetMortalityForm();
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to save mortality record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const editMortality = (record) => {
    clearMessages();

    setActiveTab("mortality");

    setMortalityForm({
      flock: record.flock
        ? String(record.flock)
        : "",
      date: record.date || today,
      quantity:
        record.quantity !== undefined &&
        record.quantity !== null
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

  const deleteMortality = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this mortality record?"
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await api.delete(
        `/health/mortality/${id}/`
      );

      setSuccess(
        "Mortality record deleted successfully and flock quantity refreshed."
      );

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete mortality record."
        )
      );
    }
  };

  const resetMortalityForm = () => {
    setMortalityForm({
      ...emptyMortalityForm,
      date: today,
    });

    setEditingMortalityId(null);
  };

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  const filteredHealthRecords = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return healthRecords;
    }

    return healthRecords.filter((record) => {
      const flock = getFlockById(
        record.flock
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
  }, [
    healthRecords,
    flocks,
    search,
  ]);

  const filteredVaccinations = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return vaccinations;
    }

    return vaccinations.filter((record) => {
      const flock = getFlockById(
        record.flock
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
  }, [
    vaccinations,
    flocks,
    search,
  ]);

  const filteredMortalities = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return mortalities;
    }

    return mortalities.filter((record) => {
      const flock = getFlockById(
        record.flock
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
  }, [
    mortalities,
    flocks,
    search,
  ]);

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

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
                {healthRecords.length}
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
                {vaccinations.length}
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

      {/* REPORT */}
      <HealthReport
        onError={setError}
        onSuccess={setSuccess}
      />

      {/* TABS */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "health"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("health");
                  setSearch("");
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
                  activeTab === "vaccination"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("vaccination");
                  setSearch("");
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
                  activeTab === "mortality"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("mortality");
                  setSearch("");
                  clearMessages();
                }}
              >
                Mortality
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* HEALTH */}
      {activeTab === "health" && (
        <>
          <HealthForm
            form={healthForm}
            setForm={setHealthForm}
            flocks={activeFlocks}
            saving={saving}
            editingId={editingHealthId}
            onSubmit={saveHealth}
            onCancel={resetHealthForm}
          />

          <HealthTable
            records={filteredHealthRecords}
            flocks={flocks}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={editHealth}
            onDelete={deleteHealth}
          />
        </>
      )}

      {/* VACCINATION */}
      {activeTab === "vaccination" && (
        <>
          <VaccinationForm
            form={vaccinationForm}
            setForm={setVaccinationForm}
            flocks={activeFlocks}
            saving={saving}
            editingId={editingVaccinationId}
            onSubmit={saveVaccination}
            onCancel={resetVaccinationForm}
          />

          <VaccinationTable
            records={filteredVaccinations}
            flocks={flocks}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={editVaccination}
            onDelete={deleteVaccination}
          />
        </>
      )}

      {/* MORTALITY */}
      {activeTab === "mortality" && (
        <>
          <MortalityForm
            form={mortalityForm}
            setForm={setMortalityForm}
            flocks={activeFlocks}
            saving={saving}
            editingId={editingMortalityId}
            onSubmit={saveMortality}
            onCancel={resetMortalityForm}
          />

          <MortalityTable
            records={filteredMortalities}
            flocks={flocks}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={editMortality}
            onDelete={deleteMortality}
          />
        </>
      )}
    </>
  );
}