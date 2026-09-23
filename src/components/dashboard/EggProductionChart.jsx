import React, { useMemo, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const getProductionDate = (item) => {
  return (
    item?.production_date ||
    item?.date ||
    item?.record_date ||
    item?.created_at ||
    item?.created ||
    null
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


const formatDateKey = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const formatDay = (date) => {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
    }
  );
};


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function EggProductionChart({
  data = [],
}) {
  const [period, setPeriod] =
    useState("7");


  /*
  |--------------------------------------------------------------------------
  | Prepare chart data
  |--------------------------------------------------------------------------
  */

  const chartData = useMemo(() => {
    const days = Number(period);

    const today = new Date();

    const result = [];


    /*
     * Create every day in the selected period.
     *
     * This is important because days with no production
     * should still appear on the chart as 0.
     */
    for (
      let index = days - 1;
      index >= 0;
      index--
    ) {
      const date = new Date(today);

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        today.getDate() - index
      );

      result.push({
        date: formatDateKey(date),
        day: formatDay(date),
        eggs: 0,
      });
    }


    /*
     * Convert API response into daily totals.
     */
    data.forEach((item) => {
      const productionDate =
        getProductionDate(item);

      if (!productionDate) {
        return;
      }

      const date = new Date(
        productionDate
      );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }

      const dateKey =
        formatDateKey(date);

      const target =
        result.find(
          (entry) =>
            entry.date === dateKey
        );

      if (!target) {
        return;
      }

      target.eggs += getEggQuantity(
        item
      );
    });


    return result;
  }, [
    data,
    period,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Total eggs
  |--------------------------------------------------------------------------
  */

  const totalEggs = useMemo(() => {
    return chartData.reduce(
      (total, item) =>
        total + item.eggs,
      0
    );
  }, [chartData]);


  /*
  |--------------------------------------------------------------------------
  | Average
  |--------------------------------------------------------------------------
  */

  const averageEggs = useMemo(() => {
    if (!chartData.length) {
      return 0;
    }

    return (
      totalEggs /
      chartData.length
    );
  }, [
    totalEggs,
    chartData.length,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Custom tooltip
  |--------------------------------------------------------------------------
  */

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    const eggs = payload[0]?.value || 0;

    return (
      <div
        className="bg-white border rounded shadow-sm px-3 py-2"
        style={{
          minWidth: "150px",
        }}
      >
        <div className="fw-semibold">
          {label}
        </div>

        <div className="text-success mt-1">
          <i className="bi bi-egg me-1" />

          {Number(eggs).toLocaleString()} eggs
        </div>
      </div>
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="chart-card">

      <div className="chart-head">

        <div>
          <h5>
            Egg Production
          </h5>

          <span>
            Daily production for the last{" "}
            {period} days
          </span>
        </div>


        <select
          className="form-select form-select-sm"
          value={period}
          onChange={(event) =>
            setPeriod(
              event.target.value
            )
          }
          style={{
            width: "150px",
          }}
        >
          <option value="7">
            Last 7 Days
          </option>

          <option value="30">
            Last 30 Days
          </option>
        </select>

      </div>


      {/* Summary */}
      <div className="d-flex gap-4 mb-3">

        <div>
          <small className="text-muted d-block">
            Total Eggs
          </small>

          <strong>
            {totalEggs.toLocaleString()}
          </strong>
        </div>


        <div>
          <small className="text-muted d-block">
            Daily Average
          </small>

          <strong>
            {Math.round(
              averageEggs
            ).toLocaleString()}
          </strong>
        </div>

      </div>


      {/* Chart */}
      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 15,
            left: 0,
            bottom: 0,
          }}
        >

          <defs>
            <linearGradient
              id="eggFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#198754"
                stopOpacity={0.25}
              />

              <stop
                offset="95%"
                stopColor="#198754"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>


          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />


          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
          />


          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              Number(value).toLocaleString()
            }
          />


          <Tooltip
            content={
              <CustomTooltip />
            }
          />


          <Area
            type="monotone"
            dataKey="eggs"
            stroke="#198754"
            fill="url(#eggFill)"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
            }}
          />

        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}
