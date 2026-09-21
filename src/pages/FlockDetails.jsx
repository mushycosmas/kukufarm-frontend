import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import api from "../services/api";


export default function FlockDetails() {
  const { id } = useParams();

  const [flock, setFlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /*
   * Load flock from Django API
   */
  const loadFlock = useCallback(async () => {
    if (!id) {
      setError("Flock ID was not provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/flocks/${id}/`);

      setFlock(response.data);
    } catch (err) {
      console.error("Failed to load flock:", err);

      if (err?.response?.status === 404) {
        setError("The requested flock was not found.");
      } else {
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load flock details."
        );
      }

      setFlock(null);
    } finally {
      setLoading(false);
    }
  }, [id]);


  useEffect(() => {
    loadFlock();
  }, [loadFlock]);


  /*
   * Format numbers
   */
  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };


  /*
   * Format status
   */
  const formatStatus = (status) => {
    if (!status) return "-";

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };


  /*
   * Status class
   */
  const getStatusClass = (status) => {
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


  /*
   * Loading
   */
  if (loading) {
    return (
      <>
        <PageHeader
          title="Flock Details"
          subtitle="Loading flock information..."
        />

        <div className="table-card">
          <div className="text-center py-5">
            <Spinner
              animation="border"
              variant="success"
            />

            <div className="mt-3 text-muted">
              Loading flock details...
            </div>
          </div>
        </div>
      </>
    );
  }


  /*
   * Error
   */
  if (error || !flock) {
    return (
      <>
        <PageHeader
          title="Flock Details"
          subtitle="Unable to load the requested flock."
          action={
            <Link
              to="/flocks"
              className="btn btn-light"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Flocks
            </Link>
          }
        />

        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>

          {error || "Flock not found."}
        </div>
      </>
    );
  }


  return (
    <>
      {/* PAGE HEADER */}
      <PageHeader
        title={`${flock.code} Details`}
        subtitle={
          `${flock.breed || "Poultry"} flock performance and records.`
        }
        action={
          <Link
            to="/flocks"
            className="btn btn-light"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Flocks
          </Link>
        }
      />


      {/* FLOCK HERO */}
      <div className="detail-hero">

        <div className="flock-avatar">
          <i className="bi bi-egg-fried"></i>
        </div>

        <div>
          <h3>{flock.code}</h3>

          <p>
            {flock.name}

            {flock.breed && (
              <>
                {" "}
                · {flock.breed}
              </>
            )}

            {" "}
            · Started {flock.arrival_date}
          </p>
        </div>

        <span
          className={`${getStatusClass(
            flock.status
          )} ms-auto`}
        >
          {formatStatus(flock.status)}
        </span>

      </div>


      {/* STATISTICS */}
      <div className="stats-grid">

        <StatCard
          title="Current Birds"
          value={formatNumber(
            flock.current_quantity
          )}
          subtitle="Current flock quantity"
          icon="bi-egg-fried"
        />

        <StatCard
          title="Age"
          value={`${formatNumber(
            flock.age_weeks
          )} weeks`}
          subtitle="Current flock age"
          icon="bi-calendar3"
          className="egg"
        />

        <StatCard
          title="Initial Birds"
          value={formatNumber(
            flock.initial_quantity
          )}
          subtitle="Quantity received"
          icon="bi-box-seam"
          className="mortality"
        />

        <StatCard
          title="Status"
          value={formatStatus(
            flock.status
          )}
          subtitle="Current flock status"
          icon="bi-activity"
          className="profit"
        />

      </div>


      {/* INFORMATION + ACTIONS */}
      <div className="two-column">

        {/* FLOCK INFORMATION */}
        <div className="table-card p-4">

          <h5 className="mb-4">
            Flock Information
          </h5>

          <div className="detail-list">

            <span>
              Flock Code
              <b>{flock.code || "-"}</b>
            </span>

            <span>
              Flock Name
              <b>{flock.name || "-"}</b>
            </span>

            <span>
              Breed
              <b>{flock.breed || "-"}</b>
            </span>

            <span>
              Source
              <b>{flock.source || "-"}</b>
            </span>

            <span>
              Arrival Date
              <b>{flock.arrival_date || "-"}</b>
            </span>

            <span>
              Initial Birds
              <b>
                {formatNumber(
                  flock.initial_quantity
                )}
              </b>
            </span>

            <span>
              Current Birds
              <b>
                {formatNumber(
                  flock.current_quantity
                )}
              </b>
            </span>

            <span>
              Age
              <b>
                {formatNumber(
                  flock.age_weeks
                )}{" "}
                weeks
              </b>
            </span>

            <span>
              House
              <b>{flock.house || "-"}</b>
            </span>

            <span>
              Status
              <b>
                {formatStatus(
                  flock.status
                )}
              </b>
            </span>

          </div>

          {flock.notes && (
            <div className="mt-4">

              <h6 className="text-muted">
                Notes
              </h6>

              <p className="mb-0">
                {flock.notes}
              </p>

            </div>
          )}

        </div>


        {/* QUICK ACTIONS */}
        <div className="table-card p-4">

          <h5 className="mb-4">
            Quick Actions
          </h5>

          <div className="quick-actions">

            <Link to="/egg-production">
              <i className="bi bi-egg"></i>
              Record Eggs
            </Link>

            <Link to="/mortality">
              <i className="bi bi-heartbreak"></i>
              Record Mortality
            </Link>

            <Link to="/health">
              <i className="bi bi-heart-pulse"></i>
              Health Record
            </Link>

            <Link to="/feed">
              <i className="bi bi-basket"></i>
              Feed Record
            </Link>

          </div>

        </div>

      </div>


      {/* DATA NOTE */}
      <div className="alert alert-light mt-4 border">

        <i className="bi bi-info-circle me-2"></i>

        Mortality, egg production, health and feed
        records are managed through their respective
        modules. This flock page displays the core
        flock information stored in the Flock record.

      </div>

    </>
  );
}

