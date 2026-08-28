import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const DashboardLayout = ({ title, subtitle, children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main, #060a14)', color: '#fff' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Topbar title={title} subtitle={subtitle} />
        <main style={{ flex: 1, padding: '28px', boxSizing: 'border-box', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
