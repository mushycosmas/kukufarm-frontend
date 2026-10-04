import React from "react";

import StatCard from "../../../components/dashboard/StatCard";

import {
  formatNumber,
  formatTrays,
} from "../utils/eggProductionUtils";

export default function EggProductionStats({
  statistics,
}) {
  return (
    <div className="stats-grid">

      <StatCard
        title="Today's Eggs"
        value={formatNumber(
          statistics.todayEggs
        )}
        subtitle="Good eggs collected"
        icon="bi-egg"
      />

      <StatCard
        title="Eggs Collected"
        value={formatNumber(
          statistics.totalCollected
        )}
        subtitle={`${formatTrays(
          statistics.totalTrays
        )} trays equivalent`}
        icon="bi-check-circle-fill"
        className="egg"
      />

      <StatCard
        title="Broken Eggs"
        value={formatNumber(
          statistics.totalBroken
        )}
        subtitle="Recorded period"
        icon="bi-x-circle-fill"
        className="mortality"
      />

      <StatCard
        title="Production Rate"
        value={`${statistics.productionRate}%`}
        subtitle="Good eggs vs total"
        icon="bi-graph-up-arrow"
        className="profit"
      />

    </div>
  );
}