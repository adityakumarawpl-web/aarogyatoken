import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { QueueCard } from './QueueCard';
import { DoctorStatus, Patient } from '../../types';
import { generateDoctorSummary } from '../../utils/queueLogic';
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
  ArrowRightCircle,
  SlidersHorizontal,
} from 'lucide-react';

// Universal Short Date Formatter (e.g., 28 Nov)
export const formatShortDate = (dateObj: Date): string => {
  return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

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
    completeDoctorShift,
    moveRemainingToNextShift,
    addWalkInPatient,
    setSelectedDoctorId,
  } = useClinic();

  // Live Clock State (Updates every second - Short Format Hour:Minute)
  const [nowDateTime, setNowDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const shortFormattedDate = formatShortDate(nowDateTime);
  const shortFormattedTime = nowDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
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

  const isDateInLeaveRange = (targetDate: string, doctor: any) => {
    if (!doctor || doctor.status !== 'LEAVE') return false;
    if (doctor.leaveStartDate && doctor.leaveEndDate) {
      return targetDate >= doctor.leaveStartDate && targetDate <= doctor.leaveEndDate;
    }
    return targetDate === realTodayDate;
  };

  const getNextAvailableDateAfterLeave = (doctor: any) => {
    if (doctor?.status === 'LEAVE' && doctor?.leaveEndDate && doctor.leaveEndDate >= realTodayDate) {
      const [y, m, d] = doctor.leaveEndDate.split('-').map(Number);
      const nextDay = new Date(y, m - 1, d + 1);
      return nextDay.toISOString().split('T')[0];
    }
    return realTodayDate;
  };

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
  // VIEW 1: STAFF LOGIN SCREEN
  // ==========================================
  if (!staffDoctorId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
              <Lock className="h-7 w-7" />
            </div>

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
  // VIEW 2: HOSPITAL MULTI-DOCTOR SELECTION
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
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Hospital Central Reception Desk
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {loggedInDoctor?.clinicName}
              </h1>
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
                    <div>
                      <span className="inline-block bg-blue-50 text-blue-700 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-md border border-blue-200">
                        {doc.cabinNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{doc.name}</h3>
                      <p className="text-[11px] text-slate-500">{doc.degree}</p>
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
  // VIEW 3: LIVE OPD DESK
  // ==========================================
  if (!currentDoctor) return null;

  const isSessionActive = Boolean(currentDoctor.isSessionActive);
  const isDoctorOnLeaveToday = isDateInLeaveRange(realTodayDate, currentDoctor);
  const isLeaveStartLocked = Boolean(
    currentDoctor.status === 'LEAVE' &&
    currentDoctor.leaveStartDate &&
    realTodayDate > currentDoctor.leaveStartDate
  );

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
    return (
      (p.tokenNumber ? p.tokenNumber.toString() : '').includes(term) ||
      (p.name ? p.name.toLowerCase() : '').includes(term) ||
      (p.mobile || p.phone || '').includes(term)
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
        `Doctor ${formatDateDDMMYYYY(currentDoctor.leaveStartDate || realTodayDate)} se ${formatDateDDMMYYYY(currentDoctor.leaveEndDate || realTodayDate)} tak Leave par hain.`
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
              </div>
              <p className="text-xs text-slate-500">
                {currentDoctor.clinicName} • Operator Desk
              </p>
            </div>
          </div>

          {/* Short Date/Time Badge + Status Dropdown + Shift Controller Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Short Form Date & Time (jaise: 28 Nov, 03:33 PM) */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-mono shadow-xs border border-slate-700">
              <span className="text-blue-300 font-bold">📅 {shortFormattedDate}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-300 font-bold">🕒 {shortFormattedTime}</span>
            </div>

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
                  : currentDoctor.status === 'OPD_CLOSE'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : currentDoctor.status === 'SURGERY'
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <option value="AVAILABLE">🟢 Available (OPD Open)</option>
              <option value="OPD_CLOSE">🔴 OPD Close</option>
              <option value="SURGERY">🟣 In Surgery</option>
              <option value="LEAVE">⚪ Leave</option>
            </select>

            {/* Shift Controller Dropdown (Status ke theek right side) */}
            <div className="relative">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'START') {
                    startDoctorSession(currentDoctor.id);
                  } else if (val === 'COMPLETE') {
                    if (window.confirm(`Kya aap ${activeDoctorShift} Shift complete karna chahte hain? Status automatic OPD Close ho jayega.`)) {
                      completeDoctorShift(currentDoctor.id);
                    }
                  } else if (val === 'MOVE') {
                    moveRemainingToNextShift(currentDoctor.id).then((result) => {
                      alert(`✅ Transfer Complete! ${result.movedCount} patients moved.`);
                    });
                  }
                  e.target.value = ''; // Reset selection
                }}
                defaultValue=""
                className="text-xs font-bold rounded-xl px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-900 shadow-xs outline-none cursor-pointer"
              >
                <option value="" disabled>⚙️ Shift Controller</option>
                <option value="START" disabled={!canStartShift}>▶️ {activeDoctorShift} Shift Start</option>
                <option value="COMPLETE" disabled={!canPauseOrCompleteShift}>✅ {activeDoctorShift} Shift Complete</option>
                <option value="MOVE">⏩ Move to Next Shift</option>
              </select>
            </div>

            <button
              type="button"
              onClick={staffLogout}
              className="ml-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Staff Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* LEAVE DATE RANGE BAR */}
        {currentDoctor.status === 'LEAVE' && (
          <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                  Doctor Leave Schedule (Chhutti Ki Tarikh)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Kab Se (DD/MM/YYYY)</label>
                <div className="relative">
                  <div className="rounded-xl border px-3 py-1.5 text-xs font-mono font-bold flex items-center justify-between gap-2 bg-white border-slate-300">
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
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Kab Tak (DD/MM/YYYY)</label>
                <div className="relative">
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800 flex items-center justify-between gap-2">
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
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
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 cursor-pointer'
                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer'
            }`}
          >
            <span>📋 Live OPD Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full rounded-2xl p-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'REPORTS'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-700'
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
                  activeTab === 'QUEUE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Queue ({waitingPatients.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({completedPatients.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ABSENT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === 'ABSENT' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Not Available / Absent ({absentPatients.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FUTURE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'FUTURE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Future Tokens</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {activeTab === 'FUTURE' && (
                <>
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
                    className="rounded-xl border border-blue-300 px-3 py-1.5 text-xs font-medium text-slate-800 bg-blue-50/50 shadow-xs outline-none"
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
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ACTIVE QUEUE */}
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
                  </div>
                );
              }

              const hasPatientInCabin = liveShiftWaiting.some((p) => p.status === 'IN_CABIN');
              const regularWaitingList = liveShiftWaiting.filter((p) => p.status === 'WAITING' && !p.isRecalled);
              const firstRegularWaitingId = regularWaitingList[0]?.id || null;
              const recalledWaitingList = liveShiftWaiting.filter((p) => p.status === 'WAITING' && Boolean(p.isRecalled));
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

        {/* TAB 2: COMPLETED */}
        {activeTab === 'COMPLETED' && (
          <div className="space-y-3">
            {completedPatients.map((patient) => (
              <QueueCard
                key={patient.id}
                patient={patient}
                isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                isSessionActive={isSessionActive}
                doctorStatus={currentDoctor.status}
              />
            ))}
          </div>
        )}

        {/* TAB 3: ABSENT */}
        {activeTab === 'ABSENT' && (
          <div className="space-y-3">
            {absentPatients.map((patient) => (
              <QueueCard
                key={patient.id}
                patient={patient}
                isDoctorAvailable={currentDoctor.status === 'AVAILABLE'}
                isSessionActive={isSessionActive}
                doctorStatus={currentDoctor.status}
              />
            ))}
          </div>
        )}

        {/* TAB 4: FUTURE */}
        {activeTab === 'FUTURE' && (
          <div className="space-y-4">
            {doctorPatients.map((patient) => (
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
            ))}
          </div>
        )}

        {/* TAB 5: REPORTS */}
        {activeTab === 'REPORTS' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>OPD Visit Summary & Analytics ({currentDoctor.name})</span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['day', 'week', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setReportPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                      reportPeriod === p ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
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
                <span className="text-[10px] font-bold uppercase text-emerald-700">Completed</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">{summary.totalCompleted}</div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200 text-center">
                <span className="text-[10px] font-bold uppercase text-blue-700">Walk-In</span>
                <div className="text-2xl font-black text-blue-800 mt-1">{summary.totalWalkIn}</div>
              </div>
              <div className="rounded-2xl bg-purple-50 p-4 border border-purple-200 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-700">Online</span>
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
          </div>
        )}
      </div>

      {/* ADD WALK-IN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Add Walk-In Patient (FREE)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddWalkInSubmit} className="p-6 space-y-4">
              {walkInError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
                  ⚠️ {walkInError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={walkInForm.name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                  placeholder="e.g. Ram Kumar"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={walkInForm.mobile}
                  onChange={(e) => setWalkInForm({ ...walkInForm, mobile: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit phone"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 cursor-pointer"
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
