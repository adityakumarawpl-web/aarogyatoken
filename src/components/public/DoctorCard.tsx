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

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBookOnline,
}) => {
  const { patients } = useClinic();
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  // Mobile number mask karne ka helper (1234567890 -> ********90)
  const maskMobile = (mobileStr?: string) => {
    if (!mobileStr) return 'N/A';
    const clean = mobileStr.trim();
    if (clean.length < 4) return '****';
    return `********${clean.slice(-2)}`;
  };

  // Smart Live Display Calculation: Doctor status + Queue Token
  const getLiveServingDetails = () => {
    if (doctor.status === 'LUNCH') {
      return {
        displayText: 'Lunch Break',
        textColor: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        label: 'Doctor abhi lunch break par hain',
      };
    }
    if (doctor.status === 'SURGERY') {
      return {
        displayText: 'In Surgery',
        textColor: 'text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]',
        label: 'Doctor OT / Surgery me vyast hain',
      };
    }
    if (doctor.status === 'LEAVE') {
      return {
        displayText: 'On Leave',
        textColor: 'text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]',
        label: 'Doctor aaj upalabdha nahi hain',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const inCabinPatient = patients.find(
      (p) => p.doctorId === doctor.id && p.status === 'IN_CABIN'
    );
    if (inCabinPatient) {
      return {
        displayText: `#${inCabinPatient.tokenNumber}`,
        textColor: 'text-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        label: 'Doctor Cabin me abhi chal raha hai',
      };
    }

    const activeWaiting = patients
      .filter((p) => {
        const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
        return p.doctorId === doctor.id && p.status === 'WAITING' && pDate === todayStr;
      })
      .sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      });

    if (activeWaiting.length > 0) {
      const nextInLine = activeWaiting[0];
      return {
        displayText: `#${nextInLine.tokenNumber}`,
        textColor: nextInLine.isEmergency
          ? 'text-rose-600 drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]'
          : 'text-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        label: nextInLine.isEmergency
          ? '🚨 Emergency Case (Turn Active)'
          : 'Calling / Current Turn Active',
      };
    }

    return {
      displayText: 'Ready',
      textColor: 'text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      label: 'Cabin Ready for Patients',
    };
  };

  const servingInfo = getLiveServingDetails();

  const getStatusBadge = () => {
    switch (doctor.status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>🟢 Available (OPD Open)</span>
          </span>
        );
      case 'LUNCH':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>🟡 In Lunch (Lunch Break)</span>
          </span>
        );
      case 'SURGERY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-300 shadow-2xs">
            <Activity className="h-3.5 w-3.5 text-rose-600" />
            <span>🔴 In Surgery (In OT)</span>
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-700 border border-slate-300 shadow-2xs">
            <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
            <span>⚪ On Leave (Unavailable)</span>
          </span>
        );
    }
  };

  // Current Date & Active Shift
  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeShift = new Date().getHours() < 14 ? 'morning' : 'evening';

  // Search matching patients under this doctor
  const matchedPatients = tokenSearchQuery.trim() === ''
    ? []
    : patients.filter((p) => {
        if (p.doctorId !== doctor.id) return false;

        const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
        const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();

        if (pDate !== todayDateStr || pShift !== activeShift) return false;

        const q = tokenSearchQuery.toLowerCase().trim();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.includes(q);

        return nameMatch || mobileMatch;
      });

  return (
    <div className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between w-full">
      {/* Top Details Section */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* 1. TOP CENTER STATUS BADGE */}
        <div className="flex justify-center w-full">
          {getStatusBadge()}
        </div>

        {/* 2. DOCTOR PROFILE DETAILS (Full Width without text cuts) */}
        <div className="flex items-center gap-3.5 pt-1">
          <img
            src={doctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
            alt={doctor.name}
            className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-900 text-lg leading-tight">
              {doctor.name}
            </h3>
            <p className="text-xs text-blue-600 font-bold mt-1">
              {doctor.degree}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              {doctor.specialty?.startsWith('http') ? 'Specialist' : doctor.specialty}
            </p>
          </div>
        </div>

        {/* 3. 🔍 KNOW YOUR TOKEN SEARCH BOX */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Search className="h-3 w-3 text-blue-600" />
              <span>Know Your Token (टोकन खोजें)</span>
            </span>
            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
              {activeShift === 'morning' ? 'Morning Shift' : 'Evening Shift'}
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
            {tokenSearchQuery.trim() && (
              <button
                type="button"
                onClick={() => setTokenSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Result Dropdown List (2-Line Responsive Layout: No horizontal slide needed) */}
          {tokenSearchQuery.trim() !== '' && (
            <div className="pt-1 space-y-2 max-h-56 overflow-y-auto">
              {matchedPatients.length === 0 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center text-xs text-amber-800 font-semibold">
                  Aaj ki is shift mein is naam/number ka koi token nahi mila.
                </div>
              ) : (
                matchedPatients.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white border border-blue-200 p-3 shadow-xs space-y-2"
                  >
                    {/* Top Row: Token Badge + Name + Queue Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-black text-blue-700 text-sm bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 shrink-0">
                          #{p.tokenNumber}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 break-words leading-tight">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.status === 'IN_CABIN'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status === 'IN_CABIN' ? 'In Cabin' : p.status === 'COMPLETED' ? 'Done' : 'Waiting'}
                      </span>
                    </div>

                    {/* Details Row: Mobile Number & Complete Address (Full View, No Truncation) */}
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>Mo: <strong className="font-bold">{maskMobile(p.mobile)}</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words leading-snug">
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
        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{doctor.clinicName} • {doctor.cabinNumber}</span>
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

        {/* 5. Clinic Images Gallery Section */}
        {(() => {
          const imgs = doctor.clinicImages;
          if (!imgs) return null;

          const imagesArray = Array.isArray(imgs) ? imgs : Object.values(imgs);
          const validImages = imagesArray.filter(url => typeof url === 'string' && url.trim().length > 0);

          if (validImages.length === 0) return null;

          return (
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Clinic Photos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {validImages.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Clinic ${index + 1}`}
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* 6. LIVE TOKEN / DOCTOR STATUS DISPLAY BOX */}
        <div className="rounded-2xl bg-slate-100/90 border border-slate-300/80 p-4 text-center shadow-inner relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block">
            Current Running Token (Live Token)
          </span>
          <div className={`my-1 text-4xl sm:text-5xl font-mono font-black tracking-tight ${servingInfo.textColor}`}>
            {servingInfo.displayText}
          </div>
          <span className="text-[11px] font-medium text-slate-600">
            {servingInfo.label}
          </span>
        </div>
      </div>

      {/* Book Online Token Action Footer */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100">
        <button
          type="button"
          disabled={doctor.status === 'LEAVE'}
          onClick={() => onBookOnline(doctor)}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Book Online Token (Instant Token)</span>
          </div>
          <span className="rounded-lg bg-blue-700 px-2 py-0.5 text-xs font-extrabold text-white font-mono">₹20</span>
        </button>
      </div>
    </div>
  );
};
