import React, { useState, useEffect } from 'react';
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
  Building2,
  ChevronLeft,
  PlayCircle,
  PauseCircle,
  ArrowRightCircle,
} from 'lucide-react';

// Universal DD/MM/YYYY Formatter
export const formatDateDDMMYYYY = (isoDate?: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const StaffPortal: React.FC = () => {
  const {
    doctors,
    patients,
    staffDoctorId,
    staffLogin,
    staffLogout,
    updateDoctorStatus,
    startDoctorSession,
    pauseDoctorSession,
    completeDoctorShift,
    moveRemainingToNextShift,
    addWalkInPatient,
    setSelectedDoctorId,
  } = useClinic();

  // Live Clock State (Updates every second)
  const [nowDateTime, setNowDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveFormattedDate = `${String(nowDateTime.getDate()).padStart(2, '0')}/${String(
    nowDateTime.getMonth() + 1
  ).padStart(2, '0')}/${nowDateTime.getFullYear()}`;

  const liveFormattedTime = nowDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Login credentials state
  const [loginType, setLoginType] = useState<'CLINIC' | 'HOSPITAL'>('CLINIC');
  const [loginUsername, setLoginUsername] = useState('staff_rajesh');
  const [loginPassword, setLoginPassword] = useState('clinic123');
  const [loginError, setLoginError] = useState('');

  // Hospital Desk Cabin Directory Switcher
  const [selectedHospitalCabinId, setSelectedHospitalCabinId] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'COMPLETED' | 'ABSENT' | 'REPORTS' | 'FUTURE'>('QUEUE');
  const [searchFilter, setSearchFilter] = useState('');
  const realTodayDate = new Date().toISOString().split('T')[0];

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(realTodayDate);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');

  // Leave Date Range State
  const [leaveStartInput, setLeaveStartInput] = useState<string>(realTodayDate);
  const [leaveEndInput, setLeaveEndInput] = useState<string>(realTodayDate);

  // Effective current doctor
  const activeDoctorId = (loginType === 'HOSPITAL' && selectedHospitalCabinId) ? selectedHospitalCabinId : staffDoctorId;
  const currentDoctor = doctors.find((d) => d.id === activeDoctorId);

  // Sync Leave inputs when currentDoctor changes
  useEffect(() => {
    if (currentDoctor) {
      setLeaveStartInput(currentDoctor.leaveStartDate || realTodayDate);
      setLeaveEndInput(currentDoctor.leaveEndDate || realTodayDate);
    }
  }, [currentDoctor?.id, currentDoctor?.leaveStartDate, currentDoctor?.leaveEndDate, realTodayDate]);

  // Helper: Check karein ki koi date doctor ki Leave range me padti hai ya nahi
  const isDateInLeaveRange = (targetDate: string, doctor: any) => {
    if (!doctor || doctor.status !== 'LEAVE') return false;
    if (doctor.leaveStartDate && doctor.leaveEndDate) {
      return targetDate >= doctor.leaveStartDate && targetDate <= doctor.leaveEndDate;
    }
    return targetDate === realTodayDate;
  };

  // Helper: Leave khatam hone ke agle din ki date nikaalein
  const getNextAvailableDateAfterLeave = (doctor: any) => {
    if (doctor?.status === 'LEAVE' && doctor?.leaveEndDate && doctor.leaveEndDate >= realTodayDate) {
      const [y, m, d] = doctor.leaveEndDate.split('-').map(Number);
      const nextDay = new Date(y, m - 1, d + 1);
      return nextDay.toISOString().split('T')[0];
    }
    return realTodayDate;
  };

  // Staff-Controlled Active Shift (Time-based auto-jump disabled until Morning Shift Complete)
  const activeDoctorShift: 'Morning' | 'Evening' = currentDoctor?.activeShift || 'Morning';
  const realCurrentShift = activeDoctorShift;

  const isMorningShiftActiveForDoctor = (targetDate: string, doctor: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (targetDate > todayStr) return true;
    return (doctor?.activeShift || 'Morning') === 'Morning';
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    complaint: '',
    isEmergency: false,
    appointmentDate: realTodayDate,
    selectedShift: 'Morning',
  });

  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const handleDateChange = (newDate: string) => {
    setWalkInError('');
    const morningAllowed = isMorningShiftActiveForDoctor(newDate, currentDoctor);
    setWalkInForm((prev) => ({
      ...prev,
      appointmentDate: newDate,
      selectedShift: (!morningAllowed && prev.selectedShift === 'Morning') ? 'Evening' : prev.selectedShift,
    }));
  };

  // ==========================================
  // VIEW 1: STAFF LOGIN SCREEN (CLINIC vs HOSPITAL)
  // ==========================================
  if (!staffDoctorId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
              <Lock className="h-7 w-7" />
            </div>

            {/* Radio Button: Clinic vs Hospital Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5 border border-slate-200">
              <label
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loginType === 'CLINIC'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="portalLoginType"
                  checked={loginType === 'CLINIC'}
                  onChange={() => {
                    setLoginType('CLINIC');
                    setLoginUsername('staff_rajesh');
                    setLoginPassword('clinic123');
                    setLoginError('');
                  }}
                  className="hidden"
                />
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Private Clinic</span>
              </label>

              <label
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loginType === 'HOSPITAL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="portalLoginType"
                  checked={loginType === 'HOSPITAL'}
                  onChange={() => {
                    setLoginType('HOSPITAL');
                    setLoginUsername('');
                    setLoginPassword('');
                    setLoginError('');
                  }}
                  className="hidden"
                />
                <Building2 className="h-3.5 w-3.5" />
                <span>Hospital Desk</span>
              </label>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {loginType === 'CLINIC' ? 'Doctor Clinic Staff Login' : 'Hospital Central Reception Login'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {loginType === 'CLINIC'
                ? 'Single clinic doctor ke desk me login karein'
                : 'Hospital Reception ID daalein aur sabhi OPD Cabins manage karein'}
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
                setSelectedHospitalCabinId(null);
              }
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {loginType === 'CLINIC' ? 'Staff ID / Username *' : 'Hospital Reception ID *'}
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={loginType === 'CLINIC' ? 'e.g. staff_rajesh' : 'e.g. amrita_desk'}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Password *
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
              {loginType === 'CLINIC' ? 'Sign In to Clinic Desk' : 'Sign In to Hospital Reception'}
            </button>
          </form>

          {/* Quick Demo Login Credentials Chips */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quick 1-Click Demo Login:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {doctors
                .filter((d) => (loginType === 'CLINIC' ? (d.cabinNumber === 'Chamber' || !d.cabinNumber) : d.cabinNumber !== 'Chamber'))
                .map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setLoginUsername(doc.staffUsername);
                      setLoginPassword(doc.staffPassword);
                      staffLogin(doc.staffUsername, doc.staffPassword);
                      setSelectedHospitalCabinId(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{doc.name}</span>
                      <span className="text-slate-500 block text-[10px]">{doc.clinicName} ({doc.cabinNumber})</span>
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

  // ==========================================
  // VIEW 2: HOSPITAL MULTI-DOCTOR SELECTION DIRECTORY
  // ==========================================
  const loggedInDoctor = doctors.find((d) => d.id === staffDoctorId);
  const hospitalDoctorsList = doctors.filter(
    (d) => d.clinicName === loggedInDoctor?.clinicName || (d.staffUsername && d.staffUsername === loggedInDoctor?.staffUsername)
  );
  const isHospitalMultiDoctor = hospitalDoctorsList.length > 1;

  if (isHospitalMultiDoctor && !selectedHospitalCabinId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 sm:p-8 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Hospital Central Reception Desk
                </span>
                <span className="text-xs text-slate-500">ID: {loggedInDoctor?.staffUsername}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {loggedInDoctor?.clinicName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kripya jis OPD Cabin ka live queue chalana hai, use select karein:
              </p>
            </div>

            <button
              type="button"
              onClick={staffLogout}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Desk Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospitalDoctorsList.map((doc) => {
              const docWaitingPatients = patients.filter(
                (p) => p.doctorId === doc.id && (p.status === 'WAITING' || p.status === 'IN_CABIN')
              );
              const docCompletedPatients = patients.filter(
                (p) => p.doctorId === doc.id && p.status === 'COMPLETED'
              );

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={doc.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
                      alt={doc.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <span className="inline-block bg-blue-50 text-blue-700 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-md border border-blue-200">
                        {doc.cabinNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{doc.degree}</p>
                      <p className="text-[10px] text-blue-600 font-bold">{doc.specialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Waiting</span>
                      <span className="text-sm font-black text-blue-700">{docWaitingPatients.length} Patients</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Done Today</span>
                      <span className="text-sm font-black text-emerald-700">{docCompletedPatients.length} Seen</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHospitalCabinId(doc.id);
                      setSelectedDoctorId(doc.id);
                    }}
                    className="w-full rounded-xl bg-blue-600 text-white py-2.5 text-xs font-bold hover:bg-blue-700 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open {doc.cabinNumber} Desk</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: LIVE OPD DESK (Single Doctor / Selected Cabin)
  // ==========================================
  if (!currentDoctor) return null;

  const isSessionActive = Boolean(currentDoctor.isSessionActive);

  // Check karein ki aaj ki current date doctor ki fed Leave date range me aati hai ya nahi
  const isDoctorOnLeaveToday = isDateInLeaveRange(realTodayDate, currentDoctor);

  // Leave Start Date Lock Check
  const isLeaveStartLocked = Boolean(
    currentDoctor.status === 'LEAVE' &&
    currentDoctor.leaveStartDate &&
    realTodayDate > currentDoctor.leaveStartDate
  );

  // Button Enable/Disable Conditions
  const canStartShift = !isDoctorOnLeaveToday && currentDoctor.status === 'AVAILABLE' && !isSessionActive;
  const canPauseOrCompleteShift = !isDoctorOnLeaveToday && currentDoctor.status === 'AVAILABLE' && isSessionActive;
  const canAccessLiveQueue = !isDoctorOnLeaveToday && currentDoctor.status === 'AVAILABLE';

  const doctorPatients = patients.filter((p) => {
    if (p.doctorId !== currentDoctor?.id) return false;

    const patientDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
    if (selectedDateFilter && patientDate && patientDate !== selectedDateFilter) return false;

    if (selectedShiftFilter && selectedShiftFilter !== 'ALL') {
      const patientShift = (p.selectedShift || (p as any).shift || '').trim();
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

  const summary = generateDoctorSummary(patients, currentDoctor?.id, reportPeriod);

  const defaultBookingDate = getNextAvailableDateAfterLeave(currentDoctor);
  const currentActiveShift = (selectedShiftFilter && selectedShiftFilter !== 'ALL') ? selectedShiftFilter : activeDoctorShift;

  const matchingShiftPatients = patients.filter((p) => {
    const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
    const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim();
    return (
      p.doctorId === currentDoctor?.id &&
      pDate === defaultBookingDate &&
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

    if (isDateInLeaveRange(walkInForm.appointmentDate, currentDoctor)) {
      setWalkInError(
        `Doctor ${formatDateDDMMYYYY(currentDoctor.leaveStartDate || realTodayDate)} se ${formatDateDDMMYYYY(currentDoctor.leaveEndDate || realTodayDate)} tak Leave par hain. Kripya leave date ko chhod kar koi aur tarikh chunein.`
      );
      return;
    }

    setWalkInError('');

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

    const nextValidDate = getNextAvailableDateAfterLeave(currentDoctor);
    const defaultShift = isMorningShiftActiveForDoctor(nextValidDate, currentDoctor) ? 'Morning' : 'Evening';

    setWalkInForm({
      name: '',
      mobile: '',
      age: '',
      gender: 'Male',
      address: '',
      complaint: '',
      isEmergency: false,
      appointmentDate: nextValidDate,
      selectedShift: defaultShift,
    });

    setShowAddModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 pb-20">
      {/* Clinic Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isHospitalMultiDoctor && (
              <button
                type="button"
                onClick={() => setSelectedHospitalCabinId(null)}
                className="rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-3 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Wapas Sabhi Cabins Ki List Par Jayein"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>All Cabins</span>
              </button>
            )}

            <img
              src={currentDoctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
              alt={currentDoctor.name}
              className="h-12 w-12 rounded-2xl object-cover border-2 border-slate-200"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{currentDoctor.name}</h1>
                <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                  {currentDoctor.cabinNumber}
                </span>
                <span className="rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5">
                  {activeDoctorShift} Shift
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSessionActive && !isDoctorOnLeaveToday
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isDoctorOnLeaveToday
                    ? '⚪ Doctor On Leave Today'
                    : isSessionActive
                    ? '🟢 Session Active'
                    : '🔴 Session Not Started'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentDoctor.clinicName} • Operator Staff Desk ({currentDoctor.staffUsername})
              </p>
            </div>
          </div>

          {/* Live Date/Time Clock + Doctor Status Dropdown + Switcher + Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Date & Time Badge (Status ke left side) */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-mono shadow-xs border border-slate-700">
              <span className="text-blue-300 font-bold">📅 {liveFormattedDate}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-300 font-bold">🕒 {liveFormattedTime}</span>
            </div>

            {isHospitalMultiDoctor && (
              <select
                value={currentDoctor.id}
                onChange={(e) => {
                  setSelectedHospitalCabinId(e.target.value);
                  setSelectedDoctorId(e.target.value);
                }}
                className="text-xs font-bold rounded-xl px-3 py-2 border border-blue-200 bg-blue-50 text-blue-900 outline-none cursor-pointer"
              >
                {hospitalDoctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Switch to {doc.cabinNumber}: {doc.name}
                  </option>
                ))}
              </select>
            )}

            <span className="text-xs font-bold text-slate-700">Status:</span>
            <select
              value={currentDoctor.status || 'AVAILABLE'}
              onChange={(e) => {
                const newStatus = e.target.value as DoctorStatus;
                if (newStatus === 'LEAVE') {
                  const defaultStart = currentDoctor.leaveStartDate || realTodayDate;
                  const defaultEnd = currentDoctor.leaveEndDate || realTodayDate;
                  setLeaveStartInput(defaultStart);
                  setLeaveEndInput(defaultEnd);
                  updateDoctorStatus(currentDoctor.id, 'LEAVE', undefined, defaultStart, defaultEnd);
                } else {
                  updateDoctorStatus(currentDoctor.id, newStatus);
                }
              }}
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

        {/* LEAVE DATE RANGE SELECTOR BAR (Strictly DD/MM/YYYY display across Mobile & Laptop) */}
        {currentDoctor.status === 'LEAVE' && (
          <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                  Doctor Leave Schedule (Chhutti Ki Tarikh)
                </span>
                <span className="text-[11px] text-slate-500">
                  {isLeaveStartLocked
                    ? 'Leave shuru ho chuki hai isliye Start Date lock hai. Aap End Date badha ya ghata sakte hain.'
                    : 'Kab se kab tak doctor chhutti par rahenge, date set karein (Public OPD par dikhega).'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Kab Se (DD/MM/YYYY) {isLeaveStartLocked && '🔒'}
                </label>
                <div className="relative">
                  <div
                    className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold flex items-center justify-between gap-2 min-w-[130px] ${
                      isLeaveStartLocked
                        ? 'bg-slate-200 text-slate-500 border-slate-300'
                        : 'bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    <span>{formatDateDDMMYYYY(leaveStartInput)}</span>
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    disabled={isLeaveStartLocked}
                    value={leaveStartInput}
                    min={realTodayDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setLeaveStartInput(val);
                      const adjustedEnd = leaveEndInput < val ? val : leaveEndInput;
                      if (leaveEndInput < val) setLeaveEndInput(val);
                      updateDoctorStatus(currentDoctor.id, 'LEAVE', undefined, val, adjustedEnd);
                    }}
                    className={`absolute inset-0 opacity-0 w-full h-full ${
                      isLeaveStartLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Kab Tak (DD/MM/YYYY)
                </label>
                <div className="relative">
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800 flex items-center justify-between gap-2 min-w-[130px]">
                    <span>{formatDateDDMMYYYY(leaveEndInput)}</span>
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={leaveEndInput}
                    min={leaveStartInput || realTodayDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setLeaveEndInput(val);
                      updateDoctorStatus(currentDoctor.id, 'LEAVE', undefined, leaveStartInput, val);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Staff Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 4-BUTTON SHIFT & TOKEN SESSION CONTROLLER BAR */}
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isSessionActive && !isDoctorOnLeaveToday
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              }`}>
                {isSessionActive && !isDoctorOnLeaveToday ? <PlayCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {activeDoctorShift} Shift Session Control
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isDoctorOnLeaveToday
                      ? 'bg-slate-200 text-slate-700 border border-slate-300'
                      : isSessionActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isDoctorOnLeaveToday
                      ? '⚪ Doctor On Leave Today (Session Locked)'
                      : isSessionActive
                      ? `🟢 ${activeDoctorShift} Shift Running`
                      : `⏸️ ${activeDoctorShift} Shift Paused / Not Started`}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isDoctorOnLeaveToday
                    ? 'Aaj Doctor Leave par hain. Aap advance dates ke liye "Add Patient" kar sakte hain ya "Move to Next Shift" chala sakte hain.'
                    : !isSessionActive
                    ? `Pehle "${activeDoctorShift} Shift Start" dabayein, tabhi Pause aur Shift Complete button chalu honge.`
                    : `Session active hai. Session khatam hone par "${activeDoctorShift} Shift Complete" dabayein.`}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Action Buttons Grid: Start | Pause | Complete | Move to Next Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              disabled={!canStartShift}
              onClick={() => startDoctorSession(currentDoctor.id)}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-black transition flex items-center justify-center gap-1.5 ${
                !canStartShift
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 cursor-pointer active:scale-95'
              }`}
            >
              <PlayCircle className="h-4 w-4 shrink-0" />
              <span>{activeDoctorShift} Shift Start</span>
            </button>

            <button
              type="button"
              disabled={!canPauseOrCompleteShift}
              onClick={() => pauseDoctorSession(currentDoctor.id)}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                !canPauseOrCompleteShift
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer active:scale-95'
              }`}
            >
              <PauseCircle className="h-4 w-4 shrink-0" />
              <span>Pause</span>
            </button>

            <button
              type="button"
              disabled={!canPauseOrCompleteShift}
              onClick={() => {
                const confirmMsg =
                  activeDoctorShift === 'Morning'
                    ? 'Kya aap Morning Shift complete karna chahte hain? Iske baad Evening Shift auto-select ho jayegi.'
                    : 'Kya aap Evening Shift complete karna chahte hain?';
                if (window.confirm(confirmMsg)) {
                  completeDoctorShift(currentDoctor.id);
                }
              }}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                !canPauseOrCompleteShift
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer active:scale-95'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${canPauseOrCompleteShift ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{activeDoctorShift} Shift Complete</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const nextShiftLabel = activeDoctorShift === 'Morning' ? 'Aaj ki Evening Shift' : 'Kal ki Morning Shift';
                const confirmMove = window.confirm(
                  `Urgent Shift Transfer:\n\nJo patients Done (Completed) ho chuke hain unhe chhodkar, is shift ke sabhi bache hue patients ${nextShiftLabel} ke sabse upar (#1, #2...) lag jayenge aur pehle se book patients niche shift ho jayenge.\n\nSabhi online patients ko naye token ka WhatsApp message bhi jayega. Kya aap aage badhna chahte hain?`
                );
                if (!confirmMove) return;

                const result = await moveRemainingToNextShift(currentDoctor.id);
                alert(
                  `✅ Transfer Complete!\n${result.movedCount} bache hue patients ko ${result.targetShift} Shift (${formatDateDDMMYYYY(result.targetDate)}) ke top par shift kar diya gaya hai aur online patients ko WhatsApp bhej diya gaya hai.`
                );
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              title="Urgent kaam aane par bache hue sabhi patients ko agli shift ke sabse upar transfer karein (Hamesha Active)"
            >
              <ArrowRightCircle className="h-4 w-4 text-indigo-200 shrink-0" />
              <span>Move to Next Shift</span>
            </button>
          </div>
        </div>

        {/* 3 Main Action Buttons Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              const nextValidDate = getNextAvailableDateAfterLeave(currentDoctor);
              const defaultShift = isMorningShiftActiveForDoctor(nextValidDate, currentDoctor) ? 'Morning' : 'Evening';
              setWalkInError('');
              setWalkInForm({
                name: '',
                mobile: '',
                age: '',
                gender: 'Male',
                address: '',
                complaint: '',
                isEmergency: false,
                appointmentDate: nextValidDate,
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

          <button
            type="button"
            disabled={!canAccessLiveQueue}
            onClick={() => {
              if (canAccessLiveQueue) setActiveTab('QUEUE');
            }}
            className={`w-full rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              !canAccessLiveQueue
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-70'
                : activeTab === 'QUEUE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400 cursor-pointer'
                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer'
            }`}
          >
            <span>📋 Live OPD Queue</span>
            {!canAccessLiveQueue && <span className="text-xs">🔒</span>}
          </button>

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

        {/* Search & Tabs Toolbar */}
        {activeTab !== 'REPORTS' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
                onClick={() => setActiveTab('FUTURE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'FUTURE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Future Tokens</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {activeTab === 'FUTURE' && (
                <>
                  {/* Future Date Filter with DD/MM/YYYY visual display */}
                  <div className="relative">
                    <div className="rounded-xl border border-blue-300 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 bg-blue-50/50 shadow-xs flex items-center gap-1.5">
                      <span>{formatDateDDMMYYYY(selectedDateFilter)}</span>
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <input
                      type="date"
                      value={selectedDateFilter}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDateFilter(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>

                  <select
                    value={selectedShiftFilter}
                    onChange={(e) => setSelectedShiftFilter(e.target.value)}
                    className="rounded-xl border border-blue-300 px-3 py-1.5 text-xs font-medium text-slate-800 bg-blue-50/50 shadow-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Shifts</option>
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                  </select>
                </>
              )}

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search token #, name..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Doctor Status Pause Alert Banner */}
        {currentDoctor.status !== 'AVAILABLE' && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Doctor Status: {currentDoctor.status === 'LUNCH' ? 'Lunch Break (लंच)' : currentDoctor.status === 'SURGERY' ? 'In Surgery (सर्जरी)' : `On Leave (${formatDateDDMMYYYY(currentDoctor.leaveStartDate)} se ${formatDateDDMMYYYY(currentDoctor.leaveEndDate)})`} — Patient Calling Blocked
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {isDoctorOnLeaveToday
                    ? 'Aaj Doctor Leave par hain. Kewal "Add Patient (Leave date chhod kar)", "Move to Next Shift", aur "Clinic Summary" chalu hain.'
                    : 'Doctor abhi mareez nahi dekh rahe hain. Cabin me bulane ke sabhi buttons band hain. Doctor ke aane par upar Available par click karein.'}
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

        {/* Session Inactive Warning Banner when Doctor is AVAILABLE */}
        {currentDoctor.status === 'AVAILABLE' && !isSessionActive && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-200 flex items-center justify-center shrink-0 font-bold text-amber-900">
                🔒
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  "{activeDoctorShift} Shift Start" Button Dabana Zaroori Hai
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  OPD cabin shuru karne ke liye pehle upar <strong>"{activeDoctorShift} Shift Start"</strong> button dabayein, tabhi Pause, Shift Complete aur "Andar Gaye" buttons unlock honge.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startDoctorSession(currentDoctor.id)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <PlayCircle className="h-4 w-4" />
              <span>{activeDoctorShift} Shift Start</span>
            </button>
          </div>
        )}

        {/* TAB 1: ACTIVE QUEUE (Top-1 Regular + Top-1 Recalled Priority Calling) */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-3">
            {(() => {
              const liveShiftWaiting = sortedWaitingPatients.filter((p) => {
                const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
                const pShift = (p.selectedShift || (p as any).shift || 'Morning').trim();
                return p.isEmergency || (pDate === realTodayDate && pShift.toLowerCase() === realCurrentShift.toLowerCase());
              });

              if (liveShiftWaiting.length === 0) {
                return (
                  <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                    <h3 className="mt-3 text-base font-bold text-slate-900">Current Slot Queue is Clear!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Abhi {realCurrentShift} Shift me koi waiting mareez nahi hai.
                    </p>
                  </div>
                );
              }

              // Check karein ki koi patient pehle se IN_CABIN hai ya nahi
              const hasPatientInCabin = liveShiftWaiting.some((p) => p.status === 'IN_CABIN');

              // 1. Regular (Non-Recalled) Waiting Patients me se sabse top 1 patient
              const regularWaitingList = liveShiftWaiting.filter(
                (p) => p.status === 'WAITING' && !p.isRecalled
              );
              const firstRegularWaitingId = regularWaitingList[0]?.id || null;

              // 2. Recalled Waiting Patients me se sabse top 1 patient (Token number ke series se)
              const recalledWaitingList = liveShiftWaiting
                .filter((p) => p.status === 'WAITING' && Boolean(p.isRecalled))
                .sort((a, b) => Number(a.tokenNumber) - Number(b.tokenNumber));
              const firstRecalledWaitingId = recalledWaitingList[0]?.id || null;

              return liveShiftWaiting.map((patient) => {
                const isEligibleToCall =
                  !hasPatientInCabin &&
                  patient.status === 'WAITING' &&
                  (patient.id === firstRegularWaitingId || patient.id === firstRecalledWaitingId);

                return (
                  <QueueCard
                    key={patient.id}
                    patient={patient}
                    isFirstWaiting={isEligibleToCall}
                    isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                    isSessionActive={isSessionActive}
                    doctorStatus={currentDoctor.status}
                    currentActiveDate={realTodayDate}
                    currentActiveShift={realCurrentShift}
                  />
                );
              });
            })()}
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
                  isSessionActive={isSessionActive}
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
                  isSessionActive={isSessionActive}
                  doctorStatus={currentDoctor.status}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 4: FUTURE / ADVANCE TOKENS VIEW */}
        {activeTab === 'FUTURE' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-extrabold uppercase tracking-wide">Advance & Future Date Inspector</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Aane wale dino ya dusri shift ke tokens check karne ke liye upar Date ({formatDateDDMMYYYY(selectedDateFilter)}) aur Shift filter ka prayog karein.
                  </p>
                </div>
              </div>
              <span className="font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs shrink-0">
                Found: {doctorPatients.length} Tokens
              </span>
            </div>

            {doctorPatients.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-xs text-slate-500">
                Is chuni gayi date/shift ke liye koi token book nahi hai.
              </div>
            ) : (
              doctorPatients.map((patient) => (
                <QueueCard
                  key={patient.id}
                  patient={patient}
                  isFirstWaiting={false}
                  isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                  isSessionActive={isSessionActive}
                  doctorStatus={currentDoctor.status}
                  currentActiveDate={realTodayDate}
                  currentActiveShift={realCurrentShift}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 5: SUMMARY & REPORTS */}
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
                  setWalkInError('');
                }}
                className="text-white hover:opacity-75 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkInSubmit} className="p-6 space-y-4">
              {walkInError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
                  ⚠️ {walkInError}
                </div>
              )}

              {currentDoctor.status === 'LEAVE' && currentDoctor.leaveStartDate && currentDoctor.leaveEndDate && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] font-semibold text-amber-900">
                  📅 Doctor <strong>{formatDateDDMMYYYY(currentDoctor.leaveStartDate)}</strong> se <strong>{formatDateDDMMYYYY(currentDoctor.leaveEndDate)}</strong> tak Leave par hain. Leave dates ko chhod kar hi token banega.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <div className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold bg-white flex items-center justify-between">
                      <span>{formatDateDDMMYYYY(walkInForm.appointmentDate)}</span>
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      min={realTodayDate}
                      value={walkInForm.appointmentDate}
                      onChange={(e) => {
                        if (e.target.value) handleDateChange(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      required
                    />
                  </div>
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

              {isDateInLeaveRange(walkInForm.appointmentDate, currentDoctor) && (
                <div className="rounded-xl bg-rose-50 border border-rose-300 p-2 text-xs font-bold text-rose-800">
                  🚫 Yeh tarikh doctor ki Leave date me aati hai! Kripya {formatDateDDMMYYYY(currentDoctor.leaveEndDate)} ke baad ki tarikh chunein.
                </div>
              )}

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
                  disabled={isDateInLeaveRange(walkInForm.appointmentDate, currentDoctor)}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
