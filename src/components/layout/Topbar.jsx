import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <button className="mobile-menu btn btn-light" onClick={onMenu}><i className="bi bi-list" /></button>
      <div className="topbar-search">
        <i className="bi bi-search" />
        <input placeholder="Search anything..." />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn"><i className="bi bi-bell" /><span /></button>
        <div className="user-menu">
          <div className="avatar">K</div>
          <div className="user-info"><strong>{user?.name || 'Kelvin'}</strong><small>{user?.role}</small></div>
          <button className="dropdown-btn" onClick={logout} title="Logout"><i className="bi bi-box-arrow-right" /></button>
        </div>
      </div>
    </header>
  );
}