'use client';

import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children, user, activePath }) {
  const role = user?.role || 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#688997] via-[#8CA5AF] to-[#C7BEB2]">
      {/* Sidebar */}
      <Sidebar currentPath={activePath} role={role} user={user} />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-60 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <Navbar user={user} />

        {/* Page Content - with glass-like card container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
