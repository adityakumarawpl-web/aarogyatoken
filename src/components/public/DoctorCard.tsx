import React, { useState } from 'react';
import { Doctor } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  MapPin,
  Clock,
  AlertTriangle,
  Stethoscope,
  Activity,
  Sparkles,
  Search,
  Phone,
  X,
} from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onBookOnline: (doctor: Doctor) => void;
}

const formatDateDDMMYYYY = (isoDate?: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBookOnline,
}) => {
  const { patients } = useClinic();
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  const maskMobile = (mobileStr?: string) => {
    if (!mobileStr) return 'N/A';
    const clean = mobileStr.trim();
    if (clean.length < 4) return '****';
    return `********${clean.slice(-2)}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const isDoctorOnLeaveToday = Boolean(
    doctor.status === 'LEAVE' &&
      (!doctor.leaveStartDate ||
        !doctor.leaveEndDate ||
        (todayStr >= doctor.leaveStartDate && todayStr <= doctor.leaveEndDate))
  );

  const leaveRangeLabel =
    doctor.leaveStartDate && doctor.leaveEndDate
      ? doctor.leaveStartDate === doctor.leaveEndDate
        ? `${formatDateDDMMYYYY(doctor.leaveStartDate)}`
        : `${formatDateDDMMYYYY(doctor.leaveStartDate)} - ${formatDateDDMMYYYY(doctor.leaveEndDate)}`
      : '';

  const doctorActiveShift = doctor.activeShift || 'Morning';

  const getLiveServingDetails = () => {
    // 1. Doctor Break / Surgery / Leave States
    if (doctor.status === 'LUNCH') {
      return {
        displayText: 'Lunch Break',
        textColor: 'text-amber-500 text-2xl sm:text-3xl drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        label: 'Doctor abhi lunch break par hain',
        urgencyBadge: null,
      };
    }
    if (doctor.status === 'SURGERY') {
      return {
        displayText: 'In Surgery',
        textColor: 'text-rose-600 text-2xl sm:text-3xl drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]',
        label: 'Doctor OT / Surgery me vyast hain',
        urgencyBadge: null,
      };
    }
    if (doctor.status === 'LEAVE') {
      return {
        displayText: leaveRangeLabel ? `Leave (${leaveRangeLabel})` : 'On Leave',
        textColor: 'text-blue-600 text-lg sm:text-xl font-mono drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]',
        label:
          doctor.leaveStartDate && doctor.leaveEndDate
            ? `Doctor ${formatDateDDMMYYYY(doctor.leaveStartDate)} se ${formatDateDDMMYYYY(doctor.leaveEndDate)} tak chhutti par hain`
            : 'Doctor aaj upalabdha nahi hain',
        urgencyBadge: null,
      };
    }

    const currentShiftLower = doctorActiveShift.toLowerCase();

    // Aaj ki active shift ke sabhi patients nikaalein
    const todaysShiftPatients = patients.filter((p) => {
      if (p.doctorId !== doctor.id) return false;
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
      return pDate === todayStr && pShift === currentShiftLower;
    });

    // Active shift me bache hue total patients (IN_CABIN + WAITING)
    const remainingCount = todaysShiftPatients.filter(
      (p) => p.status === 'IN_CABIN' || p.status === 'WAITING'
    ).length;

    const urgencyBadge =
      doctor.isSessionActive && remainingCount > 0 && remainingCount <= 3
        ? remainingCount === 1
          ? '🚨 Last Patient Left'
          : `⚡ Last ${remainingCount} Patients Left`
        : null;

    // 2. Cabin me patient chal raha hai toh hamesha token number dikhega
    const inCabinPatient = patients.find(
      (p) => p.doctorId === doctor.id && p.status === 'IN_CABIN'
    );
    if (inCabinPatient) {
      return {
        displayText: `#${inCabinPatient.tokenNumber}`,
        textColor: 'text-emerald-600 text-3xl sm:text-4xl drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        label: 'Doctor Cabin me abhi chal raha hai',
        urgencyBadge,
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

    // 3. Agar Session Active hai:
    if (doctor.isSessionActive) {
      if (hasCompletedAny && waitingQueue.length > 0) {
        const nextPatient = waitingQueue[0];
        return {
          displayText: `Waiting #${nextPatient.tokenNumber}`,
          textColor: nextPatient.isEmergency
            ? 'text-rose-600 text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]'
            : 'text-blue-600 text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]',
          label: `Agla Token #${nextPatient.tokenNumber} cabin me bulaya ja raha hai`,
          urgencyBadge,
        };
      }

      if (!hasCompletedAny && waitingQueue.length > 0) {
        return {
          displayText: 'Token Start',
          textColor: 'text-emerald-600 animate-pulse text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
          label: `${doctorActiveShift} Shift shuru ho gayi hai • Cabin me bulaya ja raha hai`,
          urgencyBadge,
        };
      }

      if (hasCompletedAny && waitingQueue.length === 0) {
        return {
          displayText: 'Queue Clear',
          textColor: 'text-emerald-600 text-2xl sm:text-3xl',
          label: `${doctorActiveShift} Shift ke sabhi tokens complete ho chuke hain`,
          urgencyBadge: null,
        };
      }

      return {
        displayText: 'Token Start',
        textColor: 'text-emerald-600 animate-pulse text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        label: `${doctorActiveShift} Shift shuru ho gayi hai • Cabin me bulaya ja raha hai`,
        urgencyBadge: null,
      };
    }

    // 4. Staff ne abhi tak Shift Start nahi dabaya hai
    return {
      displayText: 'Not Started',
      textColor: 'text-slate-500 text-2xl sm:text-3xl',
      label: `${doctorActiveShift} Shift token session shuru nahi hua hai`,
      urgencyBadge: null,
    };
  };

  const servingInfo = getLiveServingDetails();

  const getStatusBadge = () => {
    switch (doctor.status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Available (OPD Open)</span>
          </span>
        );
      case 'LUNCH':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>In Lunch (Break)</span>
          </span>
        );
      case 'SURGERY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-300 shadow-2xs">
            <Activity className="h-3 w-3 text-rose-600" />
            <span>In Surgery (OT)</span>
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-mono font-bold text-slate-700 border border-slate-300 shadow-2xs">
            <AlertTriangle className="h-3 w-3 text-slate-500" />
            <span>{leaveRangeLabel ? `On Leave (${leaveRangeLabel})` : 'On Leave'}</span>
          </span>
        );
    }
  };

  const activeShiftLower = doctorActiveShift.toLowerCase();

  const matchedPatients = tokenSearchQuery.trim() === ''
    ? []
    : patients.filter((p) => {
        if (p.doctorId !== doctor.id) return false;

        const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
        const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();

        if (pDate !== todayStr || pShift !== activeShiftLower) return false;

        const q = tokenSearchQuery.toLowerCase().trim();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.includes(q);

        return nameMatch || mobileMatch;
      });

  return (
    <div className="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between w-full">
      {/* Top Details Section */}
      <div className="p-3.5 sm:p-5 space-y-2.5">
        {/* 1. Status Badge */}
        <div className="flex justify-center w-full">
          {getStatusBadge()}
        </div>

        {/* 2. Doctor Profile Details */}
        <div className="flex items-center gap-3 pt-0.5">
          <img
            src={doctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
            alt={doctor.name}
            className="h-13 w-13 sm:h-14 sm:w-14 rounded-xl object-cover border-2 border-slate-100 shadow-2xs shrink-0"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="font-black text-slate-900 text-base leading-snug">
              {doctor.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-blue-600 font-bold mt-0.5">
              {doctor.degree}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {doctor.specialty?.startsWith('http') ? 'Specialist' : doctor.specialty}
            </p>
          </div>
        </div>

        {/* 3. Search Token Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 sm:p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Search className="h-3 w-3 text-blue-600" />
              <span>Know Your Token (खोजें)</span>
            </span>
            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
              {doctorActiveShift} Shift
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={tokenSearchQuery}
              onChange={(e) => setTokenSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Apna Naam ya Mobile Number likhein..."
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
            {tokenSearchQuery.trim() && (
              <button
                type="button"
                onClick={() => setTokenSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Search Result Dropdown List */}
          {tokenSearchQuery.trim() !== '' && (
            <div className="pt-0.5 space-y-1.5 max-h-48 overflow-y-auto">
              {matchedPatients.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-center text-[10px] text-amber-800 font-semibold">
                  Aaj ki is shift mein is naam/number ka koi token nahi mila.
                </div>
              ) : (
                matchedPatients.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-white border border-blue-200 p-2 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                          #{p.tokenNumber}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 break-words leading-tight">
                          {p.name}
                        </span>
                        {p.isRecalled && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                            🔄 Recalled
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 whitespace-nowrap ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'IN_CABIN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'IN_CABIN' ? 'In Cabin' : p.status === 'COMPLETED' ? 'Done' : 'Waiting'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-1.5 border border-slate-100 text-[10px] text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1 font-mono text-slate-700">
                        <Phone className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                        <span>Mo: <strong className="font-bold">{maskMobile(p.mobile)}</strong></span>
                      </div>
                      <div className="flex items-start gap-1 text-slate-700">
                        <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words leading-tight">
                          Pata: <strong className="font-semibold text-slate-800">{p.address || 'Umaria'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4. Clinic info */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-1 text-xs text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{doctor.clinicName} • {doctor.cabinNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.address || doctor.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.timings || `${doctor.morningShift || '10:00 AM - 02:00 PM'} & ${doctor.eveningShift || '05:00 PM - 08:00 PM'}`}</span>
          </div>
        </div>

        {/* 5. Clinic Photos */}
        {(() => {
          const imgs = doctor.clinicImages;
          if (!imgs) return null;

          const imagesArray = Array.isArray(imgs) ? imgs : Object.values(imgs);
          const validImages = imagesArray.filter(url => typeof url === 'string' && url.trim().length > 0);

          if (validImages.length === 0) return null;

          return (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Clinic Photos
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {validImages.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Clinic ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-slate-200 shadow-2xs"
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* 6. Live Token Box */}
        <div className="rounded-xl bg-slate-100/90 border border-slate-300/80 py-2.5 px-3 text-center shadow-inner relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Current Running Token ({doctorActiveShift} Shift)
          </span>
          <div className={`my-0.5 font-mono font-black tracking-tight ${servingInfo.textColor}`}>
            {servingInfo.displayText}
          </div>

          {/* Last 3 Patients Urgency Highlight */}
          {servingInfo.urgencyBadge && (
            <div className="my-1 flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black text-rose-700 animate-pulse shadow-2xs">
                {servingInfo.urgencyBadge}
              </span>
            </div>
          )}

          <span className="text-[10px] font-medium text-slate-600 block">
            {servingInfo.label}
          </span>
        </div>
      </div>

      {/* Book Online Token Action Footer */}
      <div className="p-3 bg-slate-50/90 border-t border-slate-100">
        <button
          type="button"
          disabled={isDoctorOnLeaveToday}
          onClick={() => onBookOnline(doctor)}
          className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Book Online Token (Instant)</span>
          </div>
          <span className="rounded-md bg-blue-700 px-2 py-0.5 text-xs font-extrabold text-white font-mono">₹20</span>
        </button>
      </div>
    </div>
  );
};
