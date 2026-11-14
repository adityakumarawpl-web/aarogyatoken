import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
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

        {/* Right side: Public View indicator (Staff navigation removed, accessible via /staff URL) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Public OPD (Patient / ₹20 Booking)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
