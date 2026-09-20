import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/sidebar.css';

const groups = [
  { title: 'MAIN', items: [{to:'/', icon:'bi-grid-1x2-fill', label:'Dashboard'}] },
  { title: 'FARM MANAGEMENT', items: [
    {to:'/flocks', icon:'bi-egg-fried', label:'Flocks'},
    {to:'/egg-production', icon:'bi-egg', label:'Egg Production'},
    {to:'/feed', icon:'bi-basket2-fill', label:'Feed Management'},
    {to:'/health', icon:'bi-heart-pulse-fill', label:'Health & Vaccination'},
    {to:'/mortality', icon:'bi-clipboard2-x-fill', label:'Mortality'}
  ]},
  { title: 'BUSINESS', items: [
    {to:'/sales', icon:'bi-cash-stack', label:'Sales'},
    {to:'/customers', icon:'bi-people-fill', label:'Customers'},
    {to:'/expenses', icon:'bi-wallet2', label:'Expenses'},
    {to:'/suppliers', icon:'bi-truck', label:'Suppliers'}
  ]},
  { title: 'REPORTING', items: [{to:'/reports', icon:'bi-bar-chart-fill', label:'Reports'}] },
  { title: 'ADMINISTRATION', items: [
    {to:'/users', icon:'bi-person-gear', label:'Users & Roles'},
    {to:'/settings', icon:'bi-gear-fill', label:'Settings'}
  ]}
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><i className="bi bi-egg-fried" /></div>
          <div><strong>KukuFarm</strong><small>Farm Management</small></div>
        </div>
        <div className="farm-badge">
          <i className="bi bi-house-heart-fill" />
          <div><span>Current Farm</span><strong>Kelvin Poultry Farm</strong></div>
          <i className="bi bi-chevron-down ms-auto" />
        </div>
        <nav>
          {groups.map(group => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>
              {group.items.map(item => (
                <NavLink key={item.to} end={item.to === '/'} to={item.to} onClick={onClose}
                  className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                  <i className={`bi ${item.icon}`} /><span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}