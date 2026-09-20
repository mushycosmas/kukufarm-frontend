import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { financialChart } from '../../data/mockData';

export default function SalesExpenseChart() {
  return <div className="chart-card">
    <div className="chart-head"><div><h5>Sales vs Expenses</h5><span>Monthly financial performance</span></div></div>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={financialChart} margin={{top:10,right:15,left:0,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
        <XAxis dataKey="month" axisLine={false} tickLine={false}/>
        <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v/1000000}M`}/>
        <Tooltip formatter={v => `TZS ${Number(v).toLocaleString()}`}/>
        <Legend/>
        <Bar dataKey="sales" name="Sales" fill="#198754" radius={[5,5,0,0]}/>
        <Bar dataKey="expenses" name="Expenses" fill="#dc3545" radius={[5,5,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}