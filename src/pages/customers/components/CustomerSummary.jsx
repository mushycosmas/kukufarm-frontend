import React from "react";
import { formatMoney, formatNumber } from "../utils/customerUtils";

export default function CustomerSummary({ customers = [], totalOutstanding }) {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => customer?.active !== false).length;
  const outstanding = totalOutstanding ?? customers.reduce(
    (sum, customer) => sum + Number(customer?.balance ?? customer?.outstanding ?? 0), 0
  );
  const cards = [
    { title: "Total Customers", value: formatNumber(totalCustomers), icon: "bi-people", color: "primary" },
    { title: "Active Customers", value: formatNumber(activeCustomers), icon: "bi-person-check", color: "success" },
    { title: "Outstanding Balance", value: `TZS ${formatMoney(outstanding)}`, icon: "bi-wallet2", color: "danger" },
  ];
  return <div className="row g-3 mb-4">
    {cards.map((card) => <div className="col-md-4" key={card.title}>
      <div className="card border-0 shadow-sm h-100"><div className="card-body">
        <div className="d-flex justify-content-between align-items-center"><div>
          <div className="text-muted small">{card.title}</div>
          <h3 className={`mb-0 ${card.color === "primary" ? "" : `text-${card.color}`}`}>{card.value}</h3>
        </div><i className={`bi ${card.icon} fs-2 text-${card.color}`} /></div>
      </div></div>
    </div>)}
  </div>;
}
