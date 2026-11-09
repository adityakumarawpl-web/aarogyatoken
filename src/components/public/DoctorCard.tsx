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
    // 1. Agar Doctor AVAILABLE nahi hai toh status text show hoga
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

    // 2. Doctor AVAILABLE hone par: Token ya Ready (Dono Green)
    const todayStr = new Date().toISOString().split('T')[0];

    // Cabin me andar patient
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

    // Waiting queue me pehla active patient
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

    // Agar queue poori khali hai
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>🟢 Available (OPD Open)</span>
          </span>
        );
      case 'LUNCH':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 shrink-0">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>🟡 In Lunch (Lunch Break)</span>
          </span>
        );
      case 'SURGERY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shrink-0">
            <Activity className="h-3.5 w-3.5 text-rose-600" />
            <span>🔴 In Surgery (In OT)</span>
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-300 shrink-0">
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

        // Strictly check appointment date & current shift
        if (pDate !== todayDateStr || pShift !== activeShift) return false;

        const q = tokenSearchQuery.toLowerCase().trim();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.includes(q);

        return nameMatch || mobileMatch;
      });

  return (
    <div className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top Details */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <img
              src={doctor.profilePic || ''}
              alt={doctor.name}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                {doctor.name}
              </h3>
              <p className="text-xs text-blue-600 font-semibold">{doctor.degree}</p>
              <p className="text-xs text-slate-500 mt-0.5">{doctor.specialty}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* 🔍 STATUS KE THEEK NICHE: KNOW YOUR TOKEN SEARCH BOX */}
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
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
              placeholder="Apna Naam ya Mobile Number likhein..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
            {tokenSearchQuery.trim() && (
              <button
                type="button"
                onClick={() => setTokenSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Result Dropdown List */}
          {tokenSearchQuery.trim() !== '' && (
            <div className="pt-1 space-y-1.5 max-h-40 overflow-y-auto">
              {matchedPatients.length === 0 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center text-[10px] text-amber-800 font-semibold">
                  Aaj ki is shift mein is naam/number ka koi token nahi mila.
                </div>
              ) : (
                matchedPatients.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-white border border-blue-200 p-2 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-black text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-200 shrink-0">
                        #{p.tokenNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          Mo: {maskMobile(p.mobile)} • Add: {p.address || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
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
                ))
              )}
            </div>
          )}
        </div>

        {/* Clinic info */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <span>{doctor.clinicName} • {doctor.cabinNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.address}, {doctor.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{doctor.timings}</span>
          </div>
        </div>

        {/* Clinic Images Gallery Section */}
        {(() => {
          const imgs = doctor.clinicImages;
          if (!imgs) return null;

          const imagesArray = Array.isArray(imgs) ? imgs : Object.values(imgs);
          const validImages = imagesArray.filter(url => typeof url === 'string' && url.trim().length > 0);

          if (validImages.length === 0) return null;

          return (
            <div className="mt-4">
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

        {/* LIVE TOKEN / DOCTOR STATUS DISPLAY BOX (Dark White Theme) */}
        <div className="mt-5 rounded-2xl bg-slate-100/90 border border-slate-300/80 p-4 text-center shadow-inner relative overflow-hidden">
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
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-[1.01]"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Book Online Token (Instant Token)</span>
          <span className="rounded-lg bg-blue-700 px-2 py-0.5 text-xs font-extrabold text-white">₹20</span>
        </button>
      </div>
    </div>
  );
};
