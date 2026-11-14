import React, { useState } from 'react';
import { Doctor } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { 
  MapPin, 
  Clock, 
  Sparkles, 
  Search, 
  X, 
  Phone, 
  Stethoscope 
} from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onBookOnline: (doctor: Doctor) => void;
}

const formatShortDate = (isoDate?: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const getLocalTodayYYYYMMDD = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBookOnline,
}) => {
  const { patients } = useClinic();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const maskMobile = (mobileStr?: string) => {
    if (!mobileStr) return 'N/A';
    const clean = mobileStr.trim();
    if (clean.length < 4) return '****';
    return `********${clean.slice(-2)}`;
  };

  const todayStr = getLocalTodayYYYYMMDD();
  const doctorActiveShift = doctor.activeShift || 'Morning';
  const activeShiftLower = doctorActiveShift.toLowerCase();

  const isLeaveActiveToday = Boolean(
    doctor.status === 'LEAVE' &&
      doctor.leaveStartDate &&
      doctor.leaveEndDate &&
      todayStr >= doctor.leaveStartDate &&
      todayStr <= doctor.leaveEndDate
  );

  const effectiveStatusToday =
    doctor.status === 'LEAVE' && !isLeaveActiveToday ? 'AVAILABLE' : doctor.status;

  const leaveRangeLabel =
    doctor.leaveStartDate && doctor.leaveEndDate
      ? doctor.leaveStartDate === doctor.leaveEndDate
        ? `${formatShortDate(doctor.leaveStartDate)}`
        : `${formatShortDate(doctor.leaveStartDate)} - ${formatShortDate(doctor.leaveEndDate)}`
      : 'On Leave';

  // Live Serving Details Logic for 4 Categories
  const getLiveServingDetails = () => {
    if (effectiveStatusToday === 'OPD_CLOSE') {
      return {
        displayText: 'OPD Closed',
        textColor: 'text-rose-600 text-xl sm:text-2xl font-bold',
        label: '',
        urgencyBadge: null,
        recalledBadge: null,
      };
    }
    if (effectiveStatusToday === 'SURGERY') {
      return {
        displayText: 'In Surgery',
        textColor: 'text-rose-600 text-xl sm:text-2xl font-bold',
        label: '',
        urgencyBadge: null,
        recalledBadge: null,
      };
    }
    if (isLeaveActiveToday) {
      return {
        displayText: leaveRangeLabel,
        textColor: 'text-blue-600 text-base sm:text-lg font-bold',
        label: '',
        urgencyBadge: null,
        recalledBadge: null,
      };
    }

    const todaysShiftPatients = patients.filter((p) => {
      if (p.doctorId !== doctor.id) return false;
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
      return pDate === todayStr && pShift === activeShiftLower;
    });

    const remainingCount = todaysShiftPatients.filter(
      (p) => p.status === 'IN_CABIN' || p.status === 'WAITING'
    ).length;

    const urgencyBadge =
      doctor.isSessionActive && remainingCount > 0 && remainingCount <= 3
        ? remainingCount === 1 ? '🚨 Last Patient' : `⚡ Last ${remainingCount} Left`
        : null;

    const inCabinPatient = todaysShiftPatients.find((p) => p.status === 'IN_CABIN');
    if (inCabinPatient) {
      const recalledSource = inCabinPatient.originalShift || (inCabinPatient as any).selectedShift || (inCabinPatient as any).shift || 'Morning';
      const recalledBadge = inCabinPatient.isRecalled ? `🔄 Recalled (${recalledSource} #${inCabinPatient.tokenNumber})` : null;

      return {
        displayText: `#${inCabinPatient.tokenNumber}`,
        textColor: 'text-emerald-600 text-2xl sm:text-3xl font-black',
        label: inCabinPatient.name,
        urgencyBadge,
        recalledBadge,
      };
    }

    const hasCompletedAny = todaysShiftPatients.some((p) => p.status === 'COMPLETED');
    const waitingQueue = todaysShiftPatients
      .filter((p) => p.status === 'WAITING')
      .sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      });

    if (doctor.isSessionActive) {
      if (hasCompletedAny && waitingQueue.length > 0) {
        const nextPatient = waitingQueue[0];
        return {
          displayText: `Waiting #${nextPatient.tokenNumber}`,
          textColor: 'text-blue-600 text-xl sm:text-2xl font-bold',
          label: '',
          urgencyBadge,
          recalledBadge: null,
        };
      }
      if (!hasCompletedAny && waitingQueue.length > 0) {
        return {
          displayText: 'Token Start',
          textColor: 'text-emerald-600 animate-pulse text-xl sm:text-2xl font-bold',
          label: '',
          urgencyBadge,
          recalledBadge: null,
        };
      }
      if (hasCompletedAny && waitingQueue.length === 0) {
        return {
          displayText: 'Queue Clear',
          textColor: 'text-emerald-600 text-xl sm:text-2xl font-bold',
          label: '',
          urgencyBadge: null,
          recalledBadge: null,
        };
      }
      return {
        displayText: 'Token Start',
        textColor: 'text-emerald-600 animate-pulse text-xl sm:text-2xl font-bold',
        label: '',
        urgencyBadge,
        recalledBadge: null,
      };
    }

    return {
      displayText: 'Not Started',
      textColor: 'text-slate-500 text-xl sm:text-2xl font-bold',
      label: '',
      urgencyBadge: null,
      recalledBadge: null,
    };
  };

  const servingInfo = getLiveServingDetails();

  // Status Badge for 4 Categories
  const getStatusBadgeText = () => {
    if (isLeaveActiveToday) {
      return { text: 'On Leave', color: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' };
    }
    switch (effectiveStatusToday) {
      case 'AVAILABLE':
        return { text: 'Available (OPD Open)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
      case 'OPD_CLOSE':
        return { text: 'OPD Close', color: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
      case 'SURGERY':
        return { text: 'In Surgery', color: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-500' };
      default:
        return { text: 'Available', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
    }
  };

  const statusInfo = getStatusBadgeText();

  return (
    <div className="group rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between w-full">
      
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* 1. TOP SECTION: Doctor DP, Name, Degree, Speciality */}
        <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
          <img
            src={doctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
            alt={doctor.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-slate-900 truncate">{doctor.name}</h3>
            <p className="text-xs font-semibold text-blue-600 truncate">{doctor.degree}</p>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {doctor.specialty?.startsWith('http') ? 'Specialist' : doctor.specialty}
            </p>
          </div>
        </div>

        {/* 2. ROW 1: Left Box (Status & Shift) | Right Box (Book Online Token - Hamesha Active) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Status & Shift Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isLeaveActiveToday ? 'Status' : 'Status & Shift'}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${statusInfo.dot} ${!isLeaveActiveToday ? 'animate-pulse' : ''}`}></span>
              <span className="text-xs font-extrabold text-slate-800 leading-tight">
                {statusInfo.text}
              </span>
            </div>
            {!isLeaveActiveToday && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5">{doctorActiveShift} Shift</span>
            )}
          </div>

          {/* Book Online Token Button Box (Hamesha Active) */}
          <button
            type="button"
            onClick={() => onBookOnline(doctor)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm shadow-blue-500/20 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-blue-200 mb-0.5" />
            <span className="text-xs font-bold leading-tight">Book Online</span>
            <span className="text-[10px] text-blue-100 font-medium">₹20 (Instant)</span>
          </button>
        </div>

        {/* 3. CLINIC NAME & ADDRESS */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
            <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{doctor.clinicName} • {doctor.cabinNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pl-5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.address || doctor.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pl-5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.timings || `${doctor.morningShift || '10:00 AM - 02:00 PM'} & ${doctor.eveningShift || '05:00 PM - 08:00 PM'}`}</span>
          </div>
        </div>

        {/* 4. ROW 2: Left Box (Running Token) | Right Box (Know Your Token Button) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Running Token Box */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-2.5 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Running Token</span>
            <div className={`my-0.5 font-mono tracking-tight leading-snug ${servingInfo.textColor}`}>
              {servingInfo.displayText}
            </div>
            {servingInfo.label && (
              <span className="text-[10px] text-emerald-600 font-medium leading-tight">
                {servingInfo.label}
              </span>
            )}
          </div>

          {/* Know Your Token Button Box */}
          <button
            type="button"
            disabled={isLeaveActiveToday}
            onClick={() => {
              if (!isLeaveActiveToday) setShowTokenModal(true);
            }}
            className={`rounded-2xl p-2.5 text-center flex flex-col items-center justify-center transition shadow-2xs ${
              isLeaveActiveToday
                ? 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 text-blue-700 cursor-pointer'
            }`}
          >
            <Search className={`h-4 w-4 mb-1 ${isLeaveActiveToday ? 'text-slate-400' : 'text-blue-600'}`} />
            <span className="text-xs font-bold leading-tight">Know Token</span>
            <span className="text-[10px] text-slate-500 font-medium">खोजें (Search)</span>
          </button>
        </div>

        {/* 5. CLINIC PHOTOS (LAST SECTION) */}
        {(() => {
          const imgs = doctor.clinicImages;
          if (!imgs) return null;
          const imagesArray = Array.isArray(imgs) ? imgs : Object.values(imgs);
          const validImages = imagesArray.filter(url => typeof url === 'string' && url.trim().length > 0);
          if (validImages.length === 0) return null;

          return (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Clinic Photos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {validImages.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Clinic ${index + 1}`}
                    className="w-full h-20 object-cover rounded-xl border border-slate-200 shadow-2xs"
                  />
                ))}
              </div>
            </div>
          );
        })()}

      </div>

      {/* KNOW YOUR TOKEN POPUP SEARCH MODAL */}
      {showTokenModal && !isLeaveActiveToday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Know Your Token</h3>
                <p className="text-xs text-blue-100">{doctor.name} • {doctor.clinicName}</p>
              </div>
              <button
                onClick={() => { setShowTokenModal(false); setPatientSearchTerm(''); }}
                className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Search & List */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  placeholder="Mareez ka naam ya mobile number likhein..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Queue List / Patients ({doctorActiveShift} Shift)
                </span>
                
                {patients
                  .filter((p) => {
                    if (p.doctorId !== doctor.id) return false;
                    const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
                    const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
                    if (pDate !== todayStr || pShift !== activeShiftLower) return false;

                    const query = patientSearchTerm.toLowerCase().trim();
                    if (!query) return true;
                    return p.name.toLowerCase().includes(query) || String(p.mobile).includes(query) || String(p.tokenNumber).includes(query);
                  })
                  .sort((a, b) => Number(a.tokenNumber) - Number(b.tokenNumber))
                  .map((pat) => (
                    <div key={pat.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            #{pat.tokenNumber}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{pat.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                          <Phone className="h-2.5 w-2.5 text-slate-400" />
                          <span>Mo: {maskMobile(pat.mobile)}</span>
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pat.status === 'IN_CABIN' ? 'bg-amber-100 text-amber-800' :
                        pat.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {pat.status === 'IN_CABIN' ? 'In Cabin' : pat.status === 'COMPLETED' ? 'Done' : 'Waiting'}
                      </span>
                    </div>
                  ))}

                {patients.filter((p) => {
                  if (p.doctorId !== doctor.id) return false;
                  const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
                  const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
                  return pDate === todayStr && pShift === activeShiftLower;
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Aaj ki is shift mein koi patient available nahi hai.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => { setShowTokenModal(false); setPatientSearchTerm(''); }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
