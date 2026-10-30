import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { QueueCard } from './QueueCard';
import { DoctorStatus, Patient } from '../../types';
import { generateDoctorSummary, getCurrentlyServingToken } from '../../utils/queueLogic';
import {
  UserPlus,
  Stethoscope,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Lock,
  LogOut,
  Flame,
  Printer,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';

export const StaffPortal: React.FC = () => {
  const {
    doctors,
    patients,
    staffDoctorId,
    staffLogin,
    staffLogout,
    updateDoctorStatus,
    addWalkInPatient,
  } = useClinic();

  // Login credentials state
  const [loginUsername, setLoginUsername] = useState('staff_rajesh');
  const [loginPassword, setLoginPassword] = useState('clinic123');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'COMPLETED' | 'ABSENT' | 'REPORTS'>('QUEUE');
  const [searchFilter, setSearchFilter] = useState('');

  // Add Free Walk-in patient modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    complaint: '',
    isEmergency: false,
  });

  // Report Period
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const currentDoctor = doctors.find((d) => d.id === staffDoctorId);

  // If not logged in, show staff login screen
  if (!currentDoctor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
              Doctor Clinic Staff Login
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter the Staff ID & Password provided by platform admin
            </p>
          </div>

          {loginError && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {loginError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = staffLogin(loginUsername, loginPassword);
              if (!res.success) {
                setLoginError(res.message);
              } else {
                setLoginError('');
              }
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Staff ID / Username
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. staff_rajesh"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer"
            >
              Sign In to Clinic Desk
            </button>
          </form>

          {/* Quick Demo Login Credentials Chips */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quick 1-Click Demo Login:
            </span>
            <div className="space-y-1.5">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setLoginUsername(doc.staffUsername);
                    setLoginPassword(doc.staffPassword);
                    staffLogin(doc.staffUsername, doc.staffPassword);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-800">{doc.name}</span>
                    <span className="text-slate-500 block text-[10px]">{doc.clinicName}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {doc.staffUsername}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Doctor Patients list
  const doctorPatients = patients.filter((p) => p.doctorId === currentDoctor.id);

  // Filtered by search
  const filteredPatients = doctorPatients.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.tokenNumber.toString().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.mobile.includes(term) ||
      p.complaint.toLowerCase().includes(term)
    );
  });

  const waitingPatients = filteredPatients.filter((p) => p.status === 'WAITING' || p.status === 'IN_CABIN');
  // Sort waiting patients: Emergency first, then IN_CABIN, then token number
  const sortedWaitingPatients = [...waitingPatients].sort((a, b) => {
    if (a.status === 'IN_CABIN') return -1;
    if (b.status === 'IN_CABIN') return 1;
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    return a.tokenNumber - b.tokenNumber;
  });

  const completedPatients = filteredPatients.filter((p) => p.status === 'COMPLETED');
  const absentPatients = filteredPatients.filter((p) => p.status === 'NOT_AVAILABLE');

  const currentlyServing = getCurrentlyServingToken(patients, currentDoctor.id);
  const summary = generateDoctorSummary(patients, currentDoctor.id, reportPeriod);

  const handleAddWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.name.trim() || !walkInForm.mobile.trim()) return;

    addWalkInPatient({
      doctorId: currentDoctor.id,
      name: walkInForm.name.trim(),
      mobile: walkInForm.mobile.trim(),
      age: parseInt(walkInForm.age, 10) || 30,
      gender: walkInForm.gender,
      address: walkInForm.address.trim() || 'Local Area',
      complaint: walkInForm.complaint.trim() || 'OPD Checkup',
      isEmergency: walkInForm.isEmergency,
    });
// === Yeh WhatsApp notification wala code yahan jodein ===
    try {
      await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '91' + walkInForm.mobile.trim(),
          patientName: walkInForm.name.trim(),
          doctorName: currentDoctor.name, // Agar doctor ka naam available hai
        }),
      });
    } catch (err) {
      console.error('WhatsApp trigger error:', err);
    }
    // ========================================================
    setWalkInForm({
      name: '',
      mobile: '',
      age: '',
      gender: 'Male',
      address: '',
      complaint: '',
      isEmergency: false,
    });
    setShowAddModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 pb-20">
      {/* Clinic Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={currentDoctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
              alt={currentDoctor.name}
              className="h-12 w-12 rounded-2xl object-cover border-2 border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{currentDoctor.name}</h1>
                <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                  {currentDoctor.cabinNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentDoctor.clinicName} • Operator Staff Desk ({currentDoctor.staffUsername})
              </p>
            </div>
          </div>

          {/* Quick Doctor Status Controller for Staff */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 mr-1">Doctor Status:</span>
            {(['AVAILABLE', 'LUNCH', 'SURGERY', 'LEAVE'] as DoctorStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  updateDoctorStatus(currentDoctor.id, st);
                  }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentDoctor.status === st
                    ? st === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : st === 'LUNCH'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : st === 'SURGERY'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'AVAILABLE' && <span>🟢 Available</span>}
                {st === 'LUNCH' && <span>🟡 Lunch Break</span>}
                {st === 'SURGERY' && <span>🔴 In Surgery</span>}
                {st === 'LEAVE' && <span>⚪ Leave</span>}
              </button>
            ))}

            <button
              type="button"
              onClick={staffLogout}
              className="ml-2 rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              title="Staff Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Staff Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Summary & Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Currently In Cabin */}
          <div className="rounded-2xl bg-blue-600 text-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">
                Current In Cabin (Andar)
              </span>
              <div className="text-3xl font-black mt-1">
                {currentlyServing > 0 ? `#${currentlyServing}` : 'None'}
              </div>
              <span className="text-[11px] text-blue-200">Blue status active</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/40 flex items-center justify-center">
              <Stethoscope className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Waiting Queue */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Waiting Patients
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {doctorPatients.filter((p) => p.status === 'WAITING').length}
              </div>
              <span className="text-[11px] text-slate-500">In waiting room</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Completed Today */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Completed (Dekhe Gaye)
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                {completedPatients.length}
              </div>
              <span className="text-[11px] text-emerald-700">Green status marked</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Add Free Walk-in Patient Action Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer flex items-center justify-between text-left group"
          >
            <div>
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">
                + Staff Walk-in Entry
              </span>
              <div className="text-lg font-black mt-1 leading-tight">
                Add Patient (FREE)
              </div>
              <span className="text-[11px] text-emerald-200">
                Next Token #{doctorPatients.length + 1}
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </button>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'QUEUE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Queue ({waitingPatients.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedPatients.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ABSENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'ABSENT'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Available / Absent ({absentPatients.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REPORTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'REPORTS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reports & Summary (Reports)
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search token #, name, phone..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* TAB CONTENT */}

        {/* Doctor Status Pause Alert Banner when not available */}
        {currentDoctor.status !== 'AVAILABLE' && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Doctor Status: {currentDoctor.status === 'LUNCH' ? 'Lunch Break (लंच)' : currentDoctor.status === 'SURGERY' ? 'In Surgery (सर्जरी)' : 'On Leave (छुट्टी)'} — Patient Calling Blocked
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Doctor abhi mareez nahi dekh rahe hain. Cabin me bulane ke sabhi buttons band hain. Doctor ke aane par upar <strong>🟢 Available</strong> par click karein.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateDoctorStatus(currentDoctor.id, 'AVAILABLE')}
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>🟢 Mark Doctor Available Now</span>
            </button>
          </div>
        )}

        {/* TAB 1: ACTIVE QUEUE */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-3">
            {sortedWaitingPatients.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Queue is Clear!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Abhi koi mareez pratiksha me nahi hai. Add new walk-in patient anytime.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition cursor-pointer"
                >
                  + Add Free Walk-in Patient
                </button>
              </div>
            ) : (
              sortedWaitingPatients.map((patient, index) => (
                <QueueCard
                  key={patient.id}
                  patient={patient}
                  isFirstWaiting={index === 0 && patient.status === 'WAITING'}
                  isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                  doctorStatus={currentDoctor.status}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED TODAY */}
        {activeTab === 'COMPLETED' && (
          <div className="space-y-3">
            {completedPatients.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs text-slate-500">
                No completed patients yet today.
              </div>
            ) : (
              completedPatients.map((patient) => (
                <QueueCard
                  key={patient.id}
                  patient={patient}
                  isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                  doctorStatus={currentDoctor.status}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 3: NOT AVAILABLE / ABSENT */}
        {activeTab === 'ABSENT' && (
          <div className="space-y-3">
            {absentPatients.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs text-slate-500">
                Koi bhi mareez absent/skipped nahi hai.
              </div>
            ) : (
              absentPatients.map((patient) => (
                <QueueCard
                  key={patient.id}
                  patient={patient}
                  isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                  doctorStatus={currentDoctor.status}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 4: SUMMARY & REPORTS (DIN, WEEK, MONTH, YEAR) */}
        {activeTab === 'REPORTS' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>OPD Visit Summary & Analytics ({currentDoctor.name})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daily, Weekly, Monthly, and Annual visit report generation
                </p>
              </div>

              {/* Period Switcher (Day, Week, Month, Year as requested) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['day', 'week', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setReportPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                      reportPeriod === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'day' ? 'Din (Day)' : p === 'week' ? 'Week (Weekly)' : p === 'month' ? 'Month (Monthly)' : 'Year (Yearly)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500">Kul Registered</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{summary.totalRegistered}</div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Completed (Seen)</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">{summary.totalCompleted}</div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200 text-center">
                <span className="text-[10px] font-bold uppercase text-blue-700">Staff Walk-In (Free)</span>
                <div className="text-2xl font-black text-blue-800 mt-1">{summary.totalWalkIn}</div>
              </div>

              <div className="rounded-2xl bg-purple-50 p-4 border border-purple-200 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-700">Online Bookings</span>
                <div className="text-2xl font-black text-purple-800 mt-1">{summary.totalOnline}</div>
              </div>

              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-center">
                <span className="text-[10px] font-bold uppercase text-rose-700">Emergencies</span>
                <div className="text-2xl font-black text-rose-800 mt-1">{summary.totalEmergency}</div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-700">Not Available</span>
                <div className="text-2xl font-black text-amber-800 mt-1">{summary.totalNotAvailable}</div>
              </div>
            </div>

            {/* Print / Export Report action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official OPD Report</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD WALK-IN PATIENT MODAL (100% FREE AS SPECIFIED) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Staff Registration Desk
                </span>
                <h3 className="text-base font-bold mt-1">Add Walk-In Patient (FREE)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white hover:opacity-75 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkInSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={walkInForm.name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                  placeholder="e.g. Ram Kumar"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={walkInForm.mobile}
                    onChange={(e) => setWalkInForm({ ...walkInForm, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit phone"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age & Gender *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={walkInForm.age}
                      onChange={(e) => setWalkInForm({ ...walkInForm, age: e.target.value })}
                      placeholder="Age"
                      className="w-16 rounded-xl border border-slate-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <select
                      value={walkInForm.gender}
                      onChange={(e) => setWalkInForm({ ...walkInForm, gender: e.target.value as any })}
                      className="flex-1 rounded-xl border border-slate-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Male">M</option>
                      <option value="Female">F</option>
                      <option value="Other">O</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address / Locality
                </label>
                <input
                  type="text"
                  value={walkInForm.address}
                  onChange={(e) => setWalkInForm({ ...walkInForm, address: e.target.value })}
                  placeholder="e.g. Civil Lines"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complaint / Reason
                </label>
                <input
                  type="text"
                  value={walkInForm.complaint}
                  onChange={(e) => setWalkInForm({ ...walkInForm, complaint: e.target.value })}
                  placeholder="e.g. Chest pain, Fever, Regular checkup"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Emergency toggle */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800">
                    Emergency Case? (आपातकालीन प्राथमिकता)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={walkInForm.isEmergency}
                  onChange={(e) => setWalkInForm({ ...walkInForm, isEmergency: e.target.checked })}
                  className="h-4 w-4 text-rose-600 rounded"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                >
                  Confirm (Free Token)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
