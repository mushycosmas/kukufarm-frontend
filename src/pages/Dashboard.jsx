import React, { useEffect, useMemo, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import EggProductionChart from "../components/dashboard/EggProductionChart";
import SalesExpenseChart from "../components/dashboard/SalesExpenseChart";
import RecentActivities from "../components/dashboard/RecentActivities";

import api from "../services/api";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toArray = (data) => {
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


const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const formatNumber = (value) => {
  return new Intl.NumberFormat("en-TZ").format(
    Math.round(toNumber(value))
  );
};


const formatCurrency = (value) => {
  const number = toNumber(value);

  if (number >= 1000000) {
    return `TZS ${(number / 1000000).toFixed(2)}M`;
  }

  if (number >= 1000) {
    return `TZS ${(number / 1000).toFixed(1)}K`;
  }

  return `TZS ${formatNumber(number)}`;
};


const getDateString = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const isSameDate = (value, dateString) => {
  if (!value) {
    return false;
  }

  const date = String(value).substring(
    0,
    10
  );

  return date === dateString;
};


const isSameMonth = (value, date) => {
  if (!value) {
    return false;
  }

  const itemDate = new Date(value);

  if (Number.isNaN(itemDate.getTime())) {
    return false;
  }

  return (
    itemDate.getFullYear() ===
      date.getFullYear() &&
    itemDate.getMonth() ===
      date.getMonth()
  );
};


const getItemDate = (item) => {
  return (
    item.date ||
    item.production_date ||
    item.sale_date ||
    item.expense_date ||
    item.created_at ||
    item.created ||
    item.record_date ||
    null
  );
};


/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [flocks, setFlocks] = useState([]);

  const [eggProduction, setEggProduction] = useState([]);

  const [feedStock, setFeedStock] = useState([]);

  const [mortality, setMortality] = useState([]);

  const [sales, setSales] = useState([]);

  const [expenses, setExpenses] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Current date
  |--------------------------------------------------------------------------
  */

  const today = useMemo(
    () => new Date(),
    []
  );

  const todayString = useMemo(
    () => getDateString(today),
    [today]
  );


  /*
  |--------------------------------------------------------------------------
  | Load dashboard data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Load current authenticated user.
         */
        let currentUser = null;

        try {
          const userResponse = await api.get(
            "/auth/me/"
          );

          currentUser =
            userResponse.data;
        } catch (userError) {
          /*
           * Try accounts/me if auth/me is not available.
           */
          try {
            const userResponse = await api.get(
              "/accounts/me/"
            );

            currentUser =
              userResponse.data;
          } catch {
            currentUser = null;
          }
        }


        /*
         * Load all dashboard sources.
         *
         * Promise.allSettled is intentional.
         *
         * If one module is temporarily unavailable,
         * the dashboard can still display data from
         * the other modules.
         */
        const responses =
          await Promise.allSettled([
            api.get("/flocks/"),
            api.get("/production/"),
            api.get("/feed/"),
            api.get("/health/mortality/"),
            api.get("/sales/"),
            api.get("/expenses/"),
          ]);


        if (!mounted) {
          return;
        }


        const [
          flocksResponse,
          productionResponse,
          feedResponse,
          mortalityResponse,
          salesResponse,
          expensesResponse,
        ] = responses;


        /*
         * Flocks
         */
        if (
          flocksResponse.status ===
          "fulfilled"
        ) {
          setFlocks(
            toArray(
              flocksResponse.value.data
            )
          );
        }


        /*
         * Egg production
         */
        if (
          productionResponse.status ===
          "fulfilled"
        ) {
          setEggProduction(
            toArray(
              productionResponse.value.data
            )
          );
        }


        /*
         * Feed
         */
        if (
          feedResponse.status ===
          "fulfilled"
        ) {
          setFeedStock(
            toArray(
              feedResponse.value.data
            )
          );
        }


        /*
         * Mortality
         */
        if (
          mortalityResponse.status ===
          "fulfilled"
        ) {
          setMortality(
            toArray(
              mortalityResponse.value.data
            )
          );
        }


        /*
         * Sales
         */
        if (
          salesResponse.status ===
          "fulfilled"
        ) {
          setSales(
            toArray(
              salesResponse.value.data
            )
          );
        }


        /*
         * Expenses
         */
        if (
          expensesResponse.status ===
          "fulfilled"
        ) {
          setExpenses(
            toArray(
              expensesResponse.value.data
            )
          );
        }


        setUser(currentUser);


        /*
         * Check if every request failed.
         */
        const failedRequests =
          responses.filter(
            (response) =>
              response.status ===
              "rejected"
          );


        if (
          failedRequests.length ===
          responses.length
        ) {
          setError(
            "Unable to load dashboard data."
          );
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load dashboard data."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };


    loadDashboard();


    return () => {
      mounted = false;
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Total chickens
  |--------------------------------------------------------------------------
  */

  const totalChickens = useMemo(() => {
    return flocks
      .filter((flock) => {
        const status =
          String(
            flock.status || ""
          ).toLowerCase();

        return (
          !status ||
          status === "active"
        );
      })
      .reduce(
        (total, flock) => {
          return (
            total +
            toNumber(
              flock.current_birds ??
                flock.current_chickens ??
                flock.chickens ??
                flock.bird_count ??
                flock.quantity ??
                flock.initial_birds ??
                0
            )
          );
        },
        0
      );
  }, [flocks]);


  /*
  |--------------------------------------------------------------------------
  | Active flocks
  |--------------------------------------------------------------------------
  */

  const activeFlocks = useMemo(() => {
    return flocks.filter((flock) => {
      const status =
        String(
          flock.status || ""
        ).toLowerCase();

      return (
        status === "active" ||
        !flock.status
      );
    }).length;
  }, [flocks]);


  /*
  |--------------------------------------------------------------------------
  | Today's eggs
  |--------------------------------------------------------------------------
  */

  const todaysEggs = useMemo(() => {
    return eggProduction
      .filter((item) => {
        return isSameDate(
          getItemDate(item),
          todayString
        );
      })
      .reduce(
        (total, item) => {
          return (
            total +
            toNumber(
              item.total_eggs ??
                item.eggs_collected ??
                item.quantity ??
                item.egg_count ??
                item.total ??
                0
            )
          );
        },
        0
      );
  }, [
    eggProduction,
    todayString,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Egg production rate
  |--------------------------------------------------------------------------
  */

  const eggProductionRate = useMemo(() => {
    if (totalChickens <= 0) {
      return 0;
    }

    return (
      (todaysEggs /
        totalChickens) *
      100
    );
  }, [
    todaysEggs,
    totalChickens,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Feed stock
  |--------------------------------------------------------------------------
  */

  const totalFeedStock = useMemo(() => {
    return feedStock.reduce(
      (total, item) => {
        return (
          total +
          toNumber(
            item.current_stock ??
              item.stock_quantity ??
              item.quantity ??
              item.remaining_quantity ??
              item.balance ??
              0
          )
        );
      },
      0
    );
  }, [feedStock]);


  /*
  |--------------------------------------------------------------------------
  | Today's mortality
  |--------------------------------------------------------------------------
  */

  const todaysMortality = useMemo(() => {
    return mortality
      .filter((item) => {
        return isSameDate(
          getItemDate(item),
          todayString
        );
      })
      .reduce(
        (total, item) => {
          return (
            total +
            toNumber(
              item.quantity ??
                item.deaths ??
                item.mortality ??
                item.number_of_deaths ??
                item.count ??
                0
            )
          );
        },
        0
      );
  }, [
    mortality,
    todayString,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Mortality rate
  |--------------------------------------------------------------------------
  */

  const mortalityRate = useMemo(() => {
    if (totalChickens <= 0) {
      return 0;
    }

    return (
      (todaysMortality /
        totalChickens) *
      100
    );
  }, [
    todaysMortality,
    totalChickens,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Today's sales
  |--------------------------------------------------------------------------
  */

  const todaysSales = useMemo(() => {
    return sales
      .filter((sale) => {
        return isSameDate(
          getItemDate(sale),
          todayString
        );
      })
      .reduce(
        (total, sale) => {
          return (
            total +
            toNumber(
              sale.total_amount ??
                sale.total ??
                sale.grand_total ??
                sale.amount ??
                sale.net_amount ??
                0
            )
          );
        },
        0
      );
  }, [
    sales,
    todayString,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Today's sales transactions
  |--------------------------------------------------------------------------
  */

  const todaysSalesCount = useMemo(() => {
    return sales.filter(
      (sale) =>
        isSameDate(
          getItemDate(sale),
          todayString
        )
    ).length;
  }, [
    sales,
    todayString,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Monthly expenses
  |--------------------------------------------------------------------------
  */

  const monthlyExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        return isSameMonth(
          getItemDate(expense),
          today
        );
      })
      .reduce(
        (total, expense) => {
          return (
            total +
            toNumber(
              expense.total_amount ??
                expense.total ??
                expense.amount ??
                expense.cost ??
                0
            )
          );
        },
        0
      );
  }, [
    expenses,
    today,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Monthly expense transactions
  |--------------------------------------------------------------------------
  */

  const monthlyExpenseCount =
    useMemo(() => {
      return expenses.filter(
        (expense) =>
          isSameMonth(
            getItemDate(expense),
            today
          )
      ).length;
    }, [
      expenses,
      today,
    ]);


  /*
  |--------------------------------------------------------------------------
  | Monthly sales
  |--------------------------------------------------------------------------
  */

  const monthlySales = useMemo(() => {
    return sales
      .filter((sale) => {
        return isSameMonth(
          getItemDate(sale),
          today
        );
      })
      .reduce(
        (total, sale) => {
          return (
            total +
            toNumber(
              sale.total_amount ??
                sale.total ??
                sale.grand_total ??
                sale.amount ??
                sale.net_amount ??
                0
            )
          );
        },
        0
      );
  }, [
    sales,
    today,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Monthly profit
  |--------------------------------------------------------------------------
  */

  const monthlyProfit =
    monthlySales -
    monthlyExpenses;


  /*
  |--------------------------------------------------------------------------
  | Profit margin
  |--------------------------------------------------------------------------
  */

  const profitMargin = useMemo(() => {
    if (monthlySales <= 0) {
      return 0;
    }

    return (
      (monthlyProfit /
        monthlySales) *
      100
    );
  }, [
    monthlySales,
    monthlyProfit,
  ]);


  /*
  |--------------------------------------------------------------------------
  | User name
  |--------------------------------------------------------------------------
  */

  const userName = useMemo(() => {
    if (!user) {
      return "Kelvin";
    }

    return (
      user.first_name ||
      user.username ||
      "Kelvin"
    );
  }, [user]);


  /*
  |--------------------------------------------------------------------------
  | Farm name
  |--------------------------------------------------------------------------
  */

  const farmName =
    user?.farm?.name ||
    user?.farm_name ||
    "Kelvin Poultry Farm";


  /*
  |--------------------------------------------------------------------------
  | Date display
  |--------------------------------------------------------------------------
  */

  const formattedDate =
    today.toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Loading your farm overview..."
        />

        <div className="d-flex justify-content-center align-items-center py-5">
          <div
            className="spinner-border text-success"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <span className="ms-3 text-muted">
            Loading dashboard data...
          </span>
        </div>
      </>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Here's your farm overview for today."
        action={
          <button
            type="button"
            className="btn btn-success"
          >
            <i className="bi bi-plus-lg me-2" />
            Quick Record
          </button>
        }
      />


      {/* Error */}
      {error && (
        <div
          className="alert alert-warning d-flex align-items-center"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />

          <div>
            {error}
          </div>
        </div>
      )}


      {/* Welcome */}
      <div className="welcome-strip">
        <div>
          <strong>
            Good morning, {userName}! 👋
          </strong>

          <span>
            {formattedDate} · {farmName}
          </span>
        </div>

        <div className="weather">
          <i className="bi bi-brightness-high-fill" />

          <span>
            --°C
            <br />
            <small>
              Weather unavailable
            </small>
          </span>
        </div>
      </div>


      {/* Farm statistics */}
      <div className="stats-grid">

        <StatCard
          title="Total Chickens"
          value={formatNumber(totalChickens)}
          subtitle={`${activeFlocks} active ${
            activeFlocks === 1
              ? "flock"
              : "flocks"
          }`}
          icon="bi-egg-fried"
          trend=""
        />


        <StatCard
          title="Today's Eggs"
          value={formatNumber(todaysEggs)}
          subtitle={`${eggProductionRate.toFixed(
            1
          )}% production rate`}
          icon="bi-egg"
          trend=""
          className="egg"
        />


        <StatCard
          title="Feed Stock"
          value={`${formatNumber(
            totalFeedStock
          )} Bags`}
          subtitle="Current available stock"
          icon="bi-basket2-fill"
          trend=""
          className="feed"
        />


        <StatCard
          title="Today's Mortality"
          value={formatNumber(
            todaysMortality
          )}
          subtitle={`${mortalityRate.toFixed(
            2
          )}% mortality rate`}
          icon="bi-heartbreak-fill"
          trend=""
          className="mortality"
        />

      </div>


      {/* Financial statistics */}
      <div className="stats-grid financial-stats">

        <StatCard
          title="Today's Sales"
          value={formatCurrency(
            todaysSales
          )}
          subtitle={`${todaysSalesCount} ${
            todaysSalesCount === 1
              ? "transaction"
              : "transactions"
          }`}
          icon="bi-cash-stack"
          trend=""
          className="sales"
        />


        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(
            monthlyExpenses
          )}
          subtitle={`${monthlyExpenseCount} ${
            monthlyExpenseCount === 1
              ? "transaction"
              : "transactions"
          }`}
          icon="bi-wallet2"
          trend=""
          className="expense"
        />


        <StatCard
          title="Monthly Profit"
          value={formatCurrency(
            monthlyProfit
          )}
          subtitle={`${profitMargin.toFixed(
            1
          )}% profit margin`}
          icon="bi-graph-up-arrow"
          trend=""
          className="profit"
        />

      </div>


      {/* Charts */}
      <div className="charts-grid">
        <EggProductionChart
          data={eggProduction}
        />

        <SalesExpenseChart
          sales={sales}
          expenses={expenses}
        />
      </div>


      {/* Recent activities */}
      <RecentActivities
        sales={sales}
        expenses={expenses}
        eggProduction={eggProduction}
        mortality={mortality}
      />
    </>
  );
}

