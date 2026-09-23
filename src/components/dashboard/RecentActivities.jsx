import React, { useMemo } from "react";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getDate = (item) => {
  return (
    item?.sale_date ||
    item?.expense_date ||
    item?.production_date ||
    item?.date ||
    item?.record_date ||
    item?.transaction_date ||
    item?.created_at ||
    item?.created ||
    null
  );
};

const getAmount = (item) => {
  return toNumber(
    item?.total_amount ??
      item?.amount ??
      item?.grand_total ??
      item?.net_amount ??
      item?.total ??
      0
  );
};

const getEggQuantity = (item) => {
  return toNumber(
    item?.total_eggs ??
      item?.eggs_collected ??
      item?.egg_count ??
      item?.quantity ??
      item?.total ??
      0
  );
};

const getFeedQuantity = (item) => {
  return toNumber(
    item?.quantity ??
      item?.bags ??
      item?.bags_consumed ??
      item?.quantity_bags ??
      item?.feed_quantity ??
      0
  );
};

const getInvoiceNumber = (item) => {
  return (
    item?.invoice_number ||
    item?.invoice_no ||
    item?.reference ||
    item?.sale_number ||
    item?.code ||
    `Sale #${item?.id || ""}`
  );
};

const getCustomerName = (item) => {
  if (typeof item?.customer === "string") {
    return item.customer;
  }

  if (item?.customer?.name) {
    return item.customer.name;
  }

  if (item?.customer_name) {
    return item.customer_name;
  }

  return "";
};

const getFeedName = (item) => {
  if (typeof item?.feed === "string") {
    return item.feed;
  }

  if (item?.feed?.name) {
    return item.feed.name;
  }

  if (item?.feed_name) {
    return item.feed_name;
  }

  return "Feed";
};

const getVaccineName = (item) => {
  return (
    item?.vaccine_name ||
    item?.vaccination_name ||
    item?.treatment ||
    item?.medicine ||
    item?.health_type ||
    "Health record"
  );
};

const getFlockName = (item) => {
  if (typeof item?.flock === "string") {
    return item.flock;
  }

  if (item?.flock?.name) {
    return item.flock.name;
  }

  if (item?.flock?.code) {
    return item.flock.code;
  }

  return item?.flock_name || item?.flock_code || "";
};

const formatCurrency = (value) => {
  return `TZS ${toNumber(value).toLocaleString()}`;
};

const formatTimeAgo = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = Math.max(
    0,
    now.getTime() - date.getTime()
  );

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getTimestamp = (item) => {
  const date = getDate(item);

  if (!date) {
    return 0;
  }

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export default function RecentActivities({
  sales = [],
  expenses = [],
  eggProduction = [],
  mortality = [],
}) {
  const activities = useMemo(() => {
    const result = [];

    /*
     * Egg production activities
     */
    eggProduction.forEach((item) => {
      const eggs = getEggQuantity(item);

      if (eggs <= 0) {
        return;
      }

      const date = getDate(item);

      result.push({
        id: `egg-${item?.id || date || Math.random()}`,
        icon: "bi-egg-fill",
        title: "Egg production recorded",
        description: `${eggs.toLocaleString()} eggs recorded`,
        date,
        timestamp: getTimestamp(item),
      });
    });

    /*
     * Sales activities
     */
    sales.forEach((item) => {
      const amount = getAmount(item);
      const invoice = getInvoiceNumber(item);
      const customer = getCustomerName(item);

      let description = `${invoice} · ${formatCurrency(amount)}`;

      if (customer) {
        description += ` · ${customer}`;
      }

      result.push({
        id: `sale-${item?.id || getDate(item) || Math.random()}`,
        icon: "bi-cart-check-fill",
        title: "New sale completed",
        description,
        date: getDate(item),
        timestamp: getTimestamp(item),
      });
    });

    /*
     * Expense activities
     */
    expenses.forEach((item) => {
      const amount = getAmount(item);
      const feedName = getFeedName(item);

      result.push({
        id: `expense-${item?.id || getDate(item) || Math.random()}`,
        icon: "bi-wallet2",
        title: "Expense recorded",
        description: `${feedName} · ${formatCurrency(amount)}`,
        date: getDate(item),
        timestamp: getTimestamp(item),
      });
    });

    /*
     * Mortality activities
     */
    mortality.forEach((item) => {
      const count = toNumber(
        item?.quantity ??
          item?.count ??
          item?.mortality_count ??
          item?.birds ??
          item?.number_of_birds ??
          0
      );

      const flock = getFlockName(item);

      if (count <= 0) {
        return;
      }

      result.push({
        id: `mortality-${item?.id || getDate(item) || Math.random()}`,
        icon: "bi-heartbreak-fill",
        title: "Mortality record added",
        description: `${count.toLocaleString()} bird${
          count === 1 ? "" : "s"
        } recorded${flock ? ` · ${flock}` : ""}`,
        date: getDate(item),
        timestamp: getTimestamp(item),
      });
    });

    /*
     * Sort newest activities first.
     */
    return result
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [
    sales,
    expenses,
    eggProduction,
    mortality,
  ]);

  return (
    <div className="activity-card">
      <div className="card-title-row">
        <h5>Recent Activities</h5>

        <button
          type="button"
          className="btn btn-link"
        >
          View all
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center text-muted py-4">
          <i className="bi bi-clock-history fs-3 d-block mb-2" />

          <span>
            No recent activities
          </span>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            className="activity"
            key={activity.id}
          >
            <div className="activity-icon">
              <i
                className={`bi ${activity.icon}`}
              />
            </div>

            <div className="flex-grow-1">
              <strong>
                {activity.title}
              </strong>

              <p>
                {activity.description}
              </p>
            </div>

            <small>
              {formatTimeAgo(activity.date)}
            </small>
          </div>
        ))
      )}
    </div>
  );
}