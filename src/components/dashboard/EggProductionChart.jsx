import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { eggChart } from '../../data/mockData';

export default function EggProductionChart() {
  return <div className="chart-card">
    <div className="chart-head"><div><h5>Egg Production</h5><span>Daily production for the last 7 days</span></div>
      <select className="form-select form-select-sm"><option>Last 7 Days</option><option>Last 30 Days</option></select>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={eggChart} margin={{top:10,right:15,left:0,bottom:0}}>
        <defs><linearGradient id="eggFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#198754" stopOpacity={0.25}/><stop offset="95%" stopColor="#198754" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
        <XAxis dataKey="day" axisLine={false} tickLine={false}/>
        <YAxis axisLine={false} tickLine={false}/>
        <Tooltip/>
        <Area type="monotone" dataKey="eggs" stroke="#198754" fill="url(#eggFill)" strokeWidth={3}/>
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}