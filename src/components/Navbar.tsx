import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Activity, Stethoscope, Lock, Key, User, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { doctors, staffLogin, staffDoctorId, staffLogout } = useClinic();
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loggedInDoctor = doctors.find((d) => d.id === staffDoctorId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStaffDropdown(false);
        setErrorMsg('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = staffLogin(username, password);
    if (res.success) {
      setShowStaffDropdown(false);
      setUsername('');
      setPassword('');
      setErrorMsg('');
      window.location.href = '/staff'; // Redirect to staff portal
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-hidden border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
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

        {/* Right side: Public View indicator with Hidden Secret Staff Login Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setShowStaffDropdown((prev) => !prev)}
            onDoubleClick={() => setShowStaffDropdown(true)}
            className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer select-none hover:bg-blue-100/60 transition shadow-2xs"
            title="Public OPD"
          >
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Public OPD (Patient / ₹20 Booking)</span>
            <span className="text-[10px] opacity-40 ml-0.5">▾</span>
          </div>

          {/* Secret Compact Staff Login Dropdown / Popover */}
          {showStaffDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Clinic Staff Portal</h4>
                    <p className="text-[10px] text-slate-500">Authorized Access Only</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStaffDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {staffDoctorId && loggedInDoctor ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-900">Logged in as {loggedInDoctor.name}</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Staff Desk Active</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffDropdown(false);
                        window.location.href = '/staff';
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Open Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        staffLogout();
                        setShowStaffDropdown(false);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Staff Username</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. staff_rajesh"
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Password</label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-slate-900/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Login to Staff Portal</span>
                  </button>
                </form>
              )}

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
