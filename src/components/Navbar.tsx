import React from 'react';
import { useClinic } from '../context/ClinicContext';
import {
  Activity,
  Users,
  Stethoscope,
  RotateCcw,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentView, staffDoctorId, doctors, resetToDemoData } = useClinic();

  const loggedInDoctor = doctors.find((d) => d.id === staffDoctorId);

  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Brand & Top Status Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-3 sm:px-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="font-medium text-white truncate text-[11px]">Live OPD Token Network</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400 truncate text-[11px]">
            Real-time Doctor Status & Queue Management SaaS
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all clinics, queue numbers, and test data back to default?')) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            title="Reset to fresh demo data"
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Bar: Mobile Friendly Full Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 w-full">
        {/* Logo & Platform Name */}
        <div 
          onClick={() => {
            window.location.href = '/';
          }}
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer"
          title="Go to Public OPD Home"
        >
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                Aarogya<span className="text-blue-600">Token</span>
              </span>
              <span className="rounded bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] font-bold px-1 py-0.2 border border-blue-200 uppercase">
                OPD
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden md:block">
              Live OPD Queue & Doctor Status Platform
            </p>
          </div>
        </div>

        {/* Primary Role Navigation Tabs (Public OPD aur Clinic Staff sirf yahan rahenge) */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[62%] sm:max-w-none shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              currentView === 'PUBLIC'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>Public OPD</span>
            <span className="hidden lg:inline text-[10px] opacity-75 font-normal">(Patient / ₹20 Booking)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/staff';
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer relative whitespace-nowrap ${
              currentView === 'STAFF'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>Clinic Staff</span>
            <span className="hidden lg:inline text-[10px] opacity-75 font-normal">
              {loggedInDoctor ? `(${loggedInDoctor.name.split(' ')[1] || 'Desk'})` : '(Login)'}
            </span>
            {loggedInDoctor && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute -top-0.5 right-1"></span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
