import React from 'react';
import { useClinic } from '../context/ClinicContext';
import {
  Activity,
  Users,
  Shield,
  Stethoscope,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentView, setCurrentView, staffDoctorId, doctors, resetToDemoData } = useClinic();

  const loggedInDoctor = doctors.find((d) => d.id === staffDoctorId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Brand & Top Status Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-white">Live OPD Token Network</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-400">
            Real-time Doctor Status & Queue Management SaaS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all clinics, queue numbers, and test data back to default?')) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800"
            title="Reset to fresh demo data"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Aarogya<span className="text-blue-600">Token</span>
              </span>
              <span className="rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 border border-blue-200 uppercase">
                OPD SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Live OPD Queue & Doctor Status Platform
            </p>
          </div>
        </div>

        {/* Primary Role Navigation Tabs */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setCurrentView('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentView === 'PUBLIC'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Public OPD</span>
            <span className="hidden md:inline text-[10px] opacity-75 font-normal">(Patient / ₹20 Booking)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('STAFF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
              currentView === 'STAFF'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Clinic Staff</span>
            <span className="hidden md:inline text-[10px] opacity-75 font-normal">
              {loggedInDoctor ? `(${loggedInDoctor.name.split(' ')[1] || 'Desk'})` : '(Staff Login)'}
            </span>
            {loggedInDoctor && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute -top-0.5 right-1"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentView === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>Super Admin</span>
            <span className="hidden md:inline text-[10px] text-amber-300 font-normal">(Owner ₹20 Earnings)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
