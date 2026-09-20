import React from 'react';
const items = [
  ['bi-egg-fill','Egg production recorded','4,380 eggs recorded today','5 min ago'],
  ['bi-cart-check-fill','New sale completed','INV-001 · TZS 450,000','35 min ago'],
  ['bi-basket-fill','Feed consumption recorded','22 bags consumed','1 hour ago'],
  ['bi-heart-pulse-fill','Health record added','Newcastle vaccination · FL-001','2 hours ago'],
  ['bi-wallet2','Expense recorded','Feed · TZS 720,000','3 hours ago']
];
export default function RecentActivities() {
 return <div className="activity-card"><div className="card-title-row"><h5>Recent Activities</h5><button className="btn btn-link">View all</button></div>
 {items.map((x,i)=><div className="activity" key={i}><div className="activity-icon"><i className={`bi ${x[0]}`}/></div><div><strong>{x[1]}</strong><p>{x[2]}</p></div><small>{x[3]}</small></div>)}</div>;
}