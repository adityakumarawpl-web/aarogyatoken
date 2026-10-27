import React from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/Navbar';
import { PublicOPDView } from './components/public/PublicOPDView';
import { StaffPortal } from './components/staff/StaffPortal';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { BotCallModal } from './components/common/BotCallModal';

const AppContent: React.FC = () => {
  const { currentView } = useClinic();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {currentView === 'PUBLIC' && <PublicOPDView />}
        {currentView === 'STAFF' && <StaffPortal />}
        {currentView === 'ADMIN' && <SuperAdminDashboard />}
      </main>

      {/* Simulated Automated Voice Bot Incoming Call Screen */}
      <BotCallModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <span>AarogyaToken OPD Platform</span>
            <span>•</span>
            <span className="text-emerald-600">Live Queue & Smart Voice Bot Alert</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Designed for Multi-Clinic Doctors & Walk-in / Online Patients
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}
