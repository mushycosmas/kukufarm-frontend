import React from 'react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import EggProductionChart from '../components/dashboard/EggProductionChart';
import SalesExpenseChart from '../components/dashboard/SalesExpenseChart';
import RecentActivities from '../components/dashboard/RecentActivities';

export default function Dashboard() {
 return <><PageHeader title="Dashboard" subtitle="Here's your farm overview for today." action={<button className="btn btn-success"><i className="bi bi-plus-lg me-2"/>Quick Record</button>}/>
 <div className="welcome-strip"><div><strong>Good morning, Kelvin! 👋</strong><span>Tuesday, 15 September 2026 · Kelvin Poultry Farm</span></div><div className="weather"><i className="bi bi-brightness-high-fill"/><span>26°C<br/><small>Dodoma</small></span></div></div>
 <div className="stats-grid">
  <StatCard title="Total Chickens" value="5,240" subtitle="3 active flocks" icon="bi-egg-fried" trend="+2.4%"/>
  <StatCard title="Today's Eggs" value="4,380" subtitle="83.6% production rate" icon="bi-egg" trend="+1.8%" className="egg"/>
  <StatCard title="Feed Stock" value="32 Bags" subtitle="Estimated 12 days" icon="bi-basket2-fill" trend="-4.2%" className="feed"/>
  <StatCard title="Today's Mortality" value="5" subtitle="0.10% mortality rate" icon="bi-heartbreak-fill" trend="-12.5%" className="mortality"/>
 </div>
 <div className="stats-grid financial-stats">
  <StatCard title="Today's Sales" value="TZS 1.31M" subtitle="3 transactions" icon="bi-cash-stack" trend="+8.2%" className="sales"/>
  <StatCard title="Monthly Expenses" value="TZS 1.18M" subtitle="12 transactions" icon="bi-wallet2" trend="+3.1%" className="expense"/>
  <StatCard title="Monthly Profit" value="TZS 1.27M" subtitle="51.7% profit margin" icon="bi-graph-up-arrow" trend="+10.4%" className="profit"/>
 </div>
 <div className="charts-grid"><EggProductionChart/><SalesExpenseChart/></div>
 <RecentActivities/>
 </>;
}