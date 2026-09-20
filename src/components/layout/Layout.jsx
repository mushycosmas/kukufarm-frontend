import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-area">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="content"><Outlet /></main>
        <footer className="footer">© 2026 KukuFarm Management System. All rights reserved.</footer>
      </div>
    </div>
  );
}