import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-sidebar'}`}>
        <Header
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="p-6 max-w-container-max mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
