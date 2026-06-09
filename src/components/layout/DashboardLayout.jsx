"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileDock from "@/components/layout/MobileDock";

export default function DashboardLayout({ children, user, activePath }) {
  const role = user?.role || "student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#688997] via-[#8CA5AF] to-[#C7BEB2] ">
      {/* Desktop Sidebar */}
      <Sidebar currentPath={activePath} role={role} user={user} />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-60 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <Navbar user={user} activePath={activePath} />

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 safe-bottom">
          <div className="max-w-[1440px] mx-auto space-y-4 sm:space-y-6 page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Dock Navigation */}
      <MobileDock role={role} />
    </div>
  );
}
