'use client';

import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children, user, activePath }) {
  const role = user?.role || 'student';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentPath={activePath} role={role} />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <Navbar user={user} />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
