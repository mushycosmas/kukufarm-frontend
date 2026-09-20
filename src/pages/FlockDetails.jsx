import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import { flocks } from '../data/mockData';

export default function FlockDetails() {
 const {id}=useParams(); const f=flocks.find(x=>x.id===Number(id))||flocks[0];
 return <><PageHeader title={`${f.code} Details`} subtitle={`${f.breed} flock performance and records.`} action={<Link to="/flocks" className="btn btn-light"><i className="bi bi-arrow-left me-2"/>Back to Flocks</Link>}/>
 <div className="detail-hero"><div className="flock-avatar"><i className="bi bi-egg-fried"/></div><div><h3>{f.code}</h3><p>{f.breed} · Started {f.date}</p></div><span className="status active ms-auto">Active</span></div>
 <div className="stats-grid"><StatCard title="Current Birds" value={f.birds.toLocaleString()} subtitle="Alive chickens" icon="bi-egg-fried"/><StatCard title="Age" value={`${f.age} weeks`} subtitle="Current flock age" icon="bi-calendar3" className="egg"/><StatCard title="Mortality" value={f.mortality} subtitle="Total recorded" icon="bi-heartbreak-fill" className="mortality"/><StatCard title="Production" value="83.6%" subtitle="Average rate" icon="bi-graph-up-arrow" className="profit"/></div>
 <div className="two-column"><div className="table-card p-4"><h5>Flock Information</h5><div className="detail-list"><span>Source <b>{f.source}</b></span><span>Start Date <b>{f.date}</b></span><span>Initial Birds <b>{(f.birds+f.mortality).toLocaleString()}</b></span><span>Status <b>{f.status}</b></span></div></div><div className="table-card p-4"><h5>Quick Actions</h5><div className="quick-actions"><Link to="/egg-production"><i className="bi bi-egg"/>Record Eggs</Link><Link to="/mortality"><i className="bi bi-heartbreak"/>Record Mortality</Link><Link to="/health"><i className="bi bi-heart-pulse"/>Health Record</Link><Link to="/feed"><i className="bi bi-basket"/>Feed Record</Link></div></div></div>
 </>;
}