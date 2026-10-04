import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/common/PageHeader";
import api from "../../services/api";

import FeedSummary from "./components/FeedSummary";
import FeedTabs from "./components/FeedTabs";
import FeedInventory from "./components/FeedInventory";
import FeedMovementForm from "./components/FeedMovementForm";
import FeedHistory from "./components/FeedHistory";
import FeedTypes from "./components/FeedTypes";
import ConfirmModal from "./components/ConfirmModal";

const getToday = () => {
  return new Date()
    .toISOString()
    .slice(0, 10);
};

const emptyForm = {
  date: getToday(),
  feed: "",
  movement_type: "Stock In",
  flock: "",
  quantity: "",
  reference: "",
  notes: "",
};


// ============================================================
// HELPERS
// ============================================================

function normalizeList(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


function getErrorMessage(err) {
  const data = err?.response?.data;

  if (!data) {
    return (
      err?.message ||
      "Operation failed."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey =
    Object.keys(data)[0];

  if (firstKey) {
    const value = data[firstKey];

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (
      typeof value === "object"
    ) {
      return JSON.stringify(value);
    }

    return String(value);
  }

  return "Operation failed.";
}


// ============================================================
// COMPONENT
// ============================================================

export default function FeedManagement() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [feeds, setFeeds] =
    useState([]);

  const [stock, setStock] =
    useState([]);

  const [consumptions, setConsumptions] =
    useState([]);

  const [flocks, setFlocks] =
    useState([]);


  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] =
    useState({
      ...emptyForm,
    });

  const [editing, setEditing] =
    useState(null);


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("inventory");


  // ==========================================================
  // CONFIRMATION
  // ==========================================================

  const [confirm, setConfirm] =
    useState({
      show: false,
      item: null,
      type: null,
    });


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  async function loadData() {

    try {

      setLoading(true);
      setError("");

      const [
        feedsResponse,
        stockResponse,
        consumptionResponse,
        flocksResponse,
      ] = await Promise.all([
        api.get("/feed/feeds/"),
        api.get("/feed/stock/"),
        api.get("/feed/consumption/"),
        api.get("/flocks/"),
      ]);

      setFeeds(
        normalizeList(
          feedsResponse
        )
      );

      setStock(
        normalizeList(
          stockResponse
        )
      );

      setConsumptions(
        normalizeList(
          consumptionResponse
        )
      );

      setFlocks(
        normalizeList(
          flocksResponse
        )
      );

    } catch (err) {

      console.error(
        "Failed to load feed data:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // RELOAD FEEDS ONLY
  // ==========================================================
  //
  // Used after FeedTypes creates/updates/deletes a feed.
  //
  // This is the important part that makes the new Feed Type
  // immediately appear in FeedMovementForm without refreshing
  // the browser.
  //
  // ==========================================================

  async function reloadFeeds() {

    try {

      const response =
        await api.get(
          "/feed/feeds/"
        );

      const data =
        normalizeList(response);

      setFeeds(data);

      return data;

    } catch (err) {

      console.error(
        "Failed to reload feed types:",
        err
      );

      setError(
        getErrorMessage(err)
      );

      return [];

    }
  }


  // ==========================================================
  // RESET FORM
  // ==========================================================

  function resetForm() {

    setForm({
      ...emptyForm,
      date: getToday(),
    });

    setEditing(null);
  }


  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  function updateForm(
    field,
    value
  ) {

    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }


  // ==========================================================
  // ADD STOCK
  // ==========================================================

  function openAddStock(
    feedId = ""
  ) {

    setForm({
      ...emptyForm,

      date: getToday(),

      feed: feedId,

      movement_type:
        "Stock In",
    });

    setEditing(null);

    setActiveTab(
      "stock"
    );

    setError("");
  }


  // ==========================================================
  // CONSUMPTION
  // ==========================================================

  function openConsumption(
    feedId = ""
  ) {

    setForm({
      ...emptyForm,

      date: getToday(),

      feed: feedId,

      movement_type:
        "Consumption",
    });

    setEditing(null);

    setActiveTab(
      "stock"
    );

    setError("");
  }


  // ==========================================================
  // SAVE MOVEMENT
  // ==========================================================

  async function saveMovement(e) {

    e.preventDefault();

    setSaving(true);
    setError("");

    try {

      // ------------------------------------------------------
      // FEED VALIDATION
      // ------------------------------------------------------

      if (!form.feed) {

        throw new Error(
          "Please select a feed item."
        );
      }


      // ------------------------------------------------------
      // QUANTITY VALIDATION
      // ------------------------------------------------------

      if (
        !form.quantity ||
        Number(form.quantity) <= 0
      ) {

        throw new Error(
          "Quantity must be greater than zero."
        );
      }


      const quantity =
        Number(form.quantity);


      // ======================================================
      // CONSUMPTION
      // ======================================================

      if (
        form.movement_type ===
        "Consumption"
      ) {

        if (!form.flock) {

          throw new Error(
            "Please select the flock receiving the feed."
          );
        }

        const payload = {

          feed:
            Number(form.feed),

          flock:
            Number(form.flock),

          date:
            form.date,

          quantity:
            quantity,

          notes:
            form.notes || "",
        };


        // ----------------------------------------------------
        // EDIT CONSUMPTION
        // ----------------------------------------------------

        if (
          editing &&
          editing.type ===
            "Consumption"
        ) {

          await api.patch(
            `/feed/consumption/${editing.id}/`,
            payload
          );

        }

        // ----------------------------------------------------
        // CREATE CONSUMPTION
        // ----------------------------------------------------

        else {

          await api.post(
            "/feed/consumption/",
            payload
          );
        }

      }


      // ======================================================
      // STOCK IN / OTHER STOCK MOVEMENT
      // ======================================================

      else {

        const payload = {

          feed:
            Number(form.feed),

          date:
            form.date,

          quantity:
            quantity,

          reference:
            form.reference || "",

          notes:
            form.notes || "",
        };


        // ----------------------------------------------------
        // EDIT STOCK
        // ----------------------------------------------------

        if (
          editing &&
          editing.type !==
            "Consumption"
        ) {

          await api.patch(
            `/feed/stock/${editing.id}/`,
            payload
          );

        }

        // ----------------------------------------------------
        // ADD STOCK
        // ----------------------------------------------------

        else {

          await api.post(
            "/feed/stock/",
            payload
          );
        }
      }


      // ======================================================
      // SUCCESS
      // ======================================================

      resetForm();

      await loadData();

      setActiveTab(
        "inventory"
      );

    } catch (err) {

      console.error(
        "Failed to save feed movement:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {

      setSaving(false);

    }
  }


  // ==========================================================
  // EDIT MOVEMENT
  // ==========================================================

  function startEdit(
    item,
    movementType
  ) {

    const isConsumption =
      movementType ===
      "Consumption";


    setForm({

      date:
        item.date ||
        getToday(),

      feed:
        item.feed ??
        item.feed_id ??
        "",

      movement_type:
        isConsumption
          ? "Consumption"
          : "Stock In",

      flock:
        item.flock ??
        item.flock_id ??
        "",

      quantity:
        item.quantity ??
        "",

      reference:
        item.reference ||
        "",

      notes:
        item.notes ||
        "",
    });


    setEditing({

      id:
        item.id,

      type:
        isConsumption
          ? "Consumption"
          : "Stock In",
    });


    setActiveTab(
      "stock"
    );

    setError("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // ==========================================================
  // ASK DELETE
  // ==========================================================

  function askDelete(
    item,
    type
  ) {

    setConfirm({

      show: true,

      item: item,

      type: type,
    });
  }


  // ==========================================================
  // CONFIRM DELETE
  // ==========================================================

  async function confirmDelete() {

    if (!confirm.item) {
      return;
    }

    try {

      setDeleting(true);
      setError("");


      const endpoint =
        confirm.type ===
        "Consumption"

          ? `/feed/consumption/${confirm.item.id}/`

          : `/feed/stock/${confirm.item.id}/`;


      await api.delete(
        endpoint
      );


      setConfirm({

        show: false,

        item: null,

        type: null,
      });


      await loadData();

    } catch (err) {

      console.error(
        "Failed to delete feed movement:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {

      setDeleting(false);

    }
  }


  // ==========================================================
  // STOCK MOVEMENTS
  // ==========================================================

  const stockMovements =
    useMemo(() => {

      return stock.map(
        (item) => ({

          ...item,

          movement_type:
            item.movement_type ||
            "Stock In",

          direction:
            "IN",
        })
      );

    }, [stock]);


  // ==========================================================
  // COMPLETE HISTORY
  // ==========================================================

  const movements =
    useMemo(() => {

      const rows = [

        ...stockMovements,

        ...consumptions.map(
          (item) => ({

            ...item,

            movement_type:
              "Consumption",

            direction:
              "OUT",
          })
        ),
      ];


      rows.sort(
        (a, b) => {

          const dateA =
            new Date(
              a.date || 0
            ).getTime();

          const dateB =
            new Date(
              b.date || 0
            ).getTime();

          return (
            dateB -
            dateA
          );
        }
      );


      return rows;

    }, [
      stockMovements,
      consumptions,
    ]);


  // ==========================================================
  // FILTER HISTORY
  // ==========================================================

  const filteredMovements =
    useMemo(() => {

      if (
        !search.trim()
      ) {

        return movements;
      }


      const term =
        search
          .toLowerCase()
          .trim();


      return movements.filter(
        (item) => {

          const text = [

            item.feed_name,

            item.flock_name,

            item.flock_code,

            item.reference,

            item.created_by_name,

            item.movement_type,

            item.notes,

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return text.includes(
            term
          );
        }
      );

    }, [
      movements,
      search,
    ]);


  // ==========================================================
  // TOTAL STOCK
  // ==========================================================

  const totalStock =
    useMemo(() => {

      return stock.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );

    }, [stock]);


  // ==========================================================
  // LOW STOCK
  // ==========================================================

  const lowStockCount =
    useMemo(() => {

      return stock.filter(
        (item) => {

          return (
            item.stock_status ===
              "low_stock" ||

            item.stock_status ===
              "out_of_stock"
          );
        }
      ).length;

    }, [stock]);


  // ==========================================================
  // TOTAL STOCK IN
  // ==========================================================

  const totalStockIn =
    useMemo(() => {

      return stockMovements.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );

    }, [stockMovements]);


  // ==========================================================
  // TOTAL CONSUMED
  // ==========================================================

  const totalConsumed =
    useMemo(() => {

      return consumptions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );

    }, [consumptions]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="Feed Management"
        subtitle="Manage feed types, inventory, stock movements and feed consumption."
      />


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="alert alert-danger d-flex justify-content-between align-items-center">

          <span>
            {error}
          </span>

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setError("")
            }
          />

        </div>
      )}


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <FeedSummary
        feeds={feeds}
        totalStock={
          totalStock
        }
        totalStockIn={
          totalStockIn
        }
        lowStockCount={
          lowStockCount
        }
      />


      {/* ======================================================
          TABS
      ====================================================== */}

      <FeedTabs
        activeTab={
          activeTab
        }
        setActiveTab={
          setActiveTab
        }
        onAddStock={() =>
          openAddStock()
        }
      />


      {/* ======================================================
          INVENTORY
      ====================================================== */}

      {activeTab ===
        "inventory" && (

        <FeedInventory
          stock={stock}
          loading={loading}
          onAddStock={
            openAddStock
          }
          onConsumption={
            openConsumption
          }
        />
      )}


      {/* ======================================================
          STOCK / CONSUMPTION
      ====================================================== */}

      {activeTab ===
        "stock" && (

        <FeedMovementForm
          feeds={feeds}
          flocks={flocks}
          form={form}
          editing={editing}
          loading={loading}
          saving={saving}
          updateForm={
            updateForm
          }
          onSubmit={
            saveMovement
          }
          onCancel={
            resetForm
          }
        />
      )}


      {/* ======================================================
          HISTORY
      ====================================================== */}

      {activeTab ===
        "history" && (

        <FeedHistory
          movements={
            filteredMovements
          }
          loading={loading}
          search={search}
          setSearch={
            setSearch
          }
          onEdit={
            startEdit
          }
          onDelete={
            askDelete
          }
        />
      )}


      {/* ======================================================
          FEED TYPES
      ====================================================== */}

      {activeTab ===
        "feed-types" && (

        <FeedTypes
          onFeedsChanged={
            reloadFeeds
          }
        />
      )}


      {/* ======================================================
          TOTAL CONSUMED
      ====================================================== */}

      {activeTab !==
        "feed-types" && (

        <div className="mt-3 text-muted small">

          Total feed consumed:{" "}

          <strong>

            {Number(
              totalConsumed || 0
            ).toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}

          </strong>

        </div>
      )}


      {/* ======================================================
          CONFIRM DELETE
      ====================================================== */}

      <ConfirmModal

        show={
          confirm.show
        }

        title="Delete Feed Movement"

        message={
          confirm.type ===
          "Consumption"

            ? "Are you sure you want to delete this consumption record? The inventory balance will be restored."

            : "Are you sure you want to delete this stock movement? The inventory balance will be recalculated."
        }

        onConfirm={
          confirmDelete
        }

        onCancel={() =>
          setConfirm({

            show: false,

            item: null,

            type: null,
          })
        }

        loading={
          deleting
        }
      />

    </>
  );
}