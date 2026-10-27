import React from 'react';
import { Doctor } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { getCurrentlyServingToken } from '../../utils/queueLogic';
import {
  MapPin,
  Clock,
  AlertTriangle,
  Stethoscope,
  Activity,
  Sparkles,
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
  const currentServingToken = getCurrentlyServingToken(patients, doctor.id);

  const getStatusBadge = () => {
    switch (doctor.status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>🟢 Available (OPD Open)</span>
          </span>
        );
      case 'LUNCH':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>🟡 In Lunch (Lunch Break)</span>
          </span>
        );
      case 'SURGERY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <Activity className="h-3.5 w-3.5 text-rose-600" />
            <span>🔴 In Surgery (In OT)</span>
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-300">
            <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
            <span>⚪ On Leave (Unavailable)</span>
          </span>
        );
    }
  };

  return (
    <div className="group rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top Details */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <img
              src={doctor.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
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

        {/* Clinic info */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5 text-xs text-slate-600">
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

        {/* ONLY CURRENT TOKEN DISPLAY (Zero Privacy Leak - No Patient Names or Lists) */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 p-4 text-center text-white shadow-md relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-blue-300 tracking-wider block">
            Current Running Token (Live Token)
          </span>
          <div className="my-1 text-5xl font-mono font-black text-blue-400 tracking-tight drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]">
            {currentServingToken > 0 ? `#${currentServingToken}` : 'Ready'}
          </div>
          <span className="text-[11px] text-blue-200">
            {currentServingToken > 0 ? 'Doctor Cabin me abhi chal raha hai' : 'Cabin Ready for Patients'}
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
