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
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');

  // Time string (e.g. "01:00 PM" ya "13:00") ko minutes mein convert karna
  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 13 * 60; // Default 1:00 PM (780 mins)
    const cleanStr = timeStr.trim().toUpperCase();
    const isPM = cleanStr.includes('PM');
    const isAM = cleanStr.includes('AM');
    const rawTime = cleanStr.replace(/[APM\s]/g, '');
    const [hoursStr, minutesStr] = rawTime.split(':');
    let hours = parseInt(hoursStr, 10) || 0;
    const minutes = parseInt(minutesStr, 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  // Doctor ki profile timing ke hisaab se check karna ki Morning Shift active hai ya nahi
  const isMorningShiftActiveForDoctor = (targetDate: string, doctor: any) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Future date par Morning hamesha allow rahegi
    if (targetDate > todayStr) return true;

    // Aaj ki date ke liye doctor ki timing check karein
    if (targetDate === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let morningEndTimeStr = doctor?.morningShiftEnd || doctor?.morningEnd;
      if (!morningEndTimeStr && doctor?.opdTimings && doctor.opdTimings.includes('-')) {
        morningEndTimeStr = doctor.opdTimings.split('-')[1]?.trim();
      }
      if (!morningEndTimeStr) morningEndTimeStr = '01:00 PM';

      const morningEndMinutes = parseTimeToMinutes(morningEndTimeStr);
      return currentMinutes <= morningEndMinutes;
    }

    return false;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    complaint: '',
    isEmergency: false,
    appointmentDate: new Date().toISOString().split('T')[0],
    selectedShift: 'Morning',
  });

  // Report Period
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const currentDoctor = doctors.find((d) => d.id === staffDoctorId);

  // Date change hone par auto-adjust karna
  const handleDateChange = (newDate: string) => {
    const morningAllowed = isMorningShiftActiveForDoctor(newDate, currentDoctor);
    setWalkInForm((prev) => ({
      ...prev,
      appointmentDate: newDate,
      selectedShift: (!morningAllowed && prev.selectedShift === 'Morning') ? 'Evening' : prev.selectedShift,
    }));
  };

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

  // 1. Doctor Patients list with Date, Shift & Search filters
  const doctorPatients = patients.filter((p) => {
    if (p.doctorId !== currentDoctor?.id) return false;

    const patientDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
    if (selectedDateFilter && patientDate && patientDate !== selectedDateFilter) return false;

    if (selectedShiftFilter && selectedShiftFilter !== 'ALL') {
      const patientShift = (p.selectedShift || p.shift || '').trim();
      if (patientShift && patientShift !== selectedShiftFilter) return false;
    }

    if (!searchFilter.trim()) return true;

    const term = searchFilter.toLowerCase();
    const tokenStr = p.tokenNumber ? p.tokenNumber.toString() : '';
    const nameStr = p.name ? p.name.toLowerCase() : '';
    const phoneStr = (p.mobile || p.phone || '');
    const complaintStr = p.complaint ? p.complaint.toLowerCase() : '';

    return (
      tokenStr.includes(term) ||
      nameStr.includes(term) ||
      phoneStr.includes(term) ||
      complaintStr.includes(term)
    );
  });

  const waitingPatients = doctorPatients.filter((p) => p.status === 'WAITING' || p.status === 'IN_CABIN');

  const sortedWaitingPatients = [...waitingPatients].sort((a, b) => {
    if (a.status === 'IN_CABIN') return -1;
    if (b.status === 'IN_CABIN') return 1;
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    return (a.tokenNumber || 0) - (b.tokenNumber || 0);
  });

  const completedPatients = doctorPatients.filter((p) => p.status === 'COMPLETED');
  const absentPatients = doctorPatients.filter((p) => p.status === 'NOT_AVAILABLE');

  const currentlyServing = getCurrentlyServingToken(patients, currentDoctor?.id);
  const summary = generateDoctorSummary(patients, currentDoctor?.id, reportPeriod);

  const currentActiveDate = selectedDateFilter || new Date().toISOString().split('T')[0];
  const currentActiveShift = (selectedShiftFilter && selectedShiftFilter !== 'ALL') ? selectedShiftFilter : 'Morning';

  const matchingShiftPatients = patients.filter((p) => {
    const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
    const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim();
    return (
      p.doctorId === currentDoctor?.id &&
      pDate === currentActiveDate &&
      pShift.toLowerCase() === currentActiveShift.toLowerCase()
    );
  });

  const nextDisplayToken = matchingShiftPatients.reduce((max, p) => {
    const num = typeof p.tokenNumber === 'number' ? p.tokenNumber : parseInt(String(p.tokenNumber), 10) || 0;
    return num > max ? num : max;
  }, 0) + 1;

  const handleAddWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.name.trim() || !walkInForm.mobile.trim() || !currentDoctor?.id) return;

    addWalkInPatient({
      doctorId: currentDoctor.id,
      name: walkInForm.name.trim(),
      mobile: walkInForm.mobile.trim(),
      age: parseInt(walkInForm.age, 10) || 30,
      gender: walkInForm.gender,
      address: walkInForm.address.trim() || 'Local Area',
      complaint: walkInForm.complaint.trim() || 'OPD Checkup',
      isEmergency: walkInForm.isEmergency,
      selectedShift: walkInForm.selectedShift,
      appointmentDate: walkInForm.appointmentDate,
    } as any);

    fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '91' + walkInForm.mobile.trim(),
        patientName: walkInForm.name.trim(),
        doctorName: currentDoctor.name,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.error('WhatsApp trigger error:', err));

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultShift = isMorningShiftActiveForDoctor(todayStr, currentDoctor) ? 'Morning' : 'Evening';

    setWalkInForm({
      name: '',
      mobile: '',
      age: '',
      gender: 'Male',
      address: '',
      complaint: '',
      isEmergency: false,
      appointmentDate: todayStr,
      selectedShift: defaultShift,
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

          {/* Doctor Status Dropdown & Logout */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Doctor Status:</span>
            <select
              value={currentDoctor.status || 'AVAILABLE'}
              onChange={(e) => updateDoctorStatus(currentDoctor.id, e.target.value as any)}
              className={`text-xs font-bold rounded-xl px-3 py-2 border shadow-xs outline-none cursor-pointer transition ${
                currentDoctor.status === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : currentDoctor.status === 'LUNCH'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : currentDoctor.status === 'SURGERY'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <option value="AVAILABLE">🟢 Available (OPD Open)</option>
              <option value="LUNCH">🟡 Lunch Break</option>
              <option value="SURGERY">🔴 In Surgery</option>
              <option value="LEAVE">⚪ Leave</option>
            </select>

            <button
              type="button"
              onClick={staffLogout}
              className="ml-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
              title="Staff Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Staff Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 3 Main Action Buttons Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Button 1: Add Patient (FREE) */}
          <button
            type="button"
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const defaultShift = isMorningShiftActiveForDoctor(todayStr, currentDoctor) ? 'Morning' : 'Evening';
              setWalkInForm({
                name: '',
                mobile: '',
                age: '',
                gender: 'Male',
                address: '',
                complaint: '',
                isEmergency: false,
                appointmentDate: todayStr,
                selectedShift: defaultShift,
              });
              setShowAddModal(true);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span className="text-base font-black leading-none">+</span>
            <span>Add Patient (FREE)</span>
            <span className="text-[11px] bg-emerald-700/60 px-2 py-0.5 rounded-lg text-emerald-100 font-mono">
              Next #{nextDisplayToken}
            </span>
          </button>

          {/* Button 2: Live OPD Queue (Doctor AVAILABLE hone par hi Clickable) */}
          <button
            type="button"
            disabled={currentDoctor?.status !== 'AVAILABLE'}
            onClick={() => setActiveTab('QUEUE')}
            className={`w-full rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'QUEUE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                : currentDoctor?.status === 'AVAILABLE'
                ? 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title={
              currentDoctor?.status !== 'AVAILABLE'
                ? 'Doctor Available hone par hi Queue access hogi'
                : 'Live OPD Queue View'
            }
          >
            <span>📋 Live OPD Queue</span>
            {currentDoctor?.status !== 'AVAILABLE' && <span className="text-xs">🔒</span>}
          </button>

          {/* Button 3: Clinic Summary & Stats */}
          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'REPORTS'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            }`}
          >
            <span>📊 Clinic Summary & Stats</span>
          </button>
        </div>

        {/* Jab REPORTS (Summary) tab click ho, tab ye teeno Stats Cards dikhein */}
        {activeTab === 'REPORTS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        )}

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

          {/* Date & Shift Filter with Search bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white shadow-xs focus:border-blue-500 focus:outline-none"
            />

            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white shadow-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
            </select>

            <div className="relative w-full sm:w-64">
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
        </div>

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
                  currentActiveDate={currentActiveDate}
                  currentActiveShift={currentActiveShift}
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

        {/* TAB 4: SUMMARY & REPORTS */}
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

      {/* ADD WALK-IN PATIENT MODAL */}
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
                onClick={() => {
                  setShowAddModal(false);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const defaultShift = isMorningShiftActiveForDoctor(todayStr, currentDoctor) ? 'Morning' : 'Evening';
                  setWalkInForm({
                    name: '',
                    mobile: '',
                    age: '',
                    gender: 'Male',
                    address: '',
                    complaint: '',
                    isEmergency: false,
                    appointmentDate: todayStr,
                    selectedShift: defaultShift,
                  });
                }}
                className="text-white hover:opacity-75 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkInSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={walkInForm.appointmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium bg-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={walkInForm.selectedShift}
                    onChange={(e) => setWalkInForm({ ...walkInForm, selectedShift: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {isMorningShiftActiveForDoctor(walkInForm.appointmentDate, currentDoctor) && (
                      <option value="Morning">Morning Shift</option>
                    )}
                    <option value="Evening">Evening Shift</option>
                  </select>
                </div>
              </div>

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
