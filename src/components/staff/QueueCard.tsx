import React, { useState } from 'react';
import { DoctorStatus, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  PhoneCall,
  UserCheck,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Phone,
  Flame,
  Lock,
  AlertTriangle,
} from 'lucide-react';

interface QueueCardProps {
  patient: Patient;
  isFirstWaiting?: boolean;
  isDoctorAvailable?: boolean;
  doctorStatus?: DoctorStatus;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  patient,
  isFirstWaiting,
  isDoctorAvailable = true,
  doctorStatus = 'AVAILABLE',
}) => {
  const {
    callPatient,
    completePatient,
    markNotAvailable,
    markEmergency,
    recallPatient,
    triggerBotCallAlert,
  } = useClinic();

  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Status-based styling matching user's exact specification:
  // IN_CABIN = BLUE
  // COMPLETED = GREEN
  // NOT_AVAILABLE = AMBER
  // EMERGENCY = RED / CRIMSON
  const getCardStyle = () => {
    switch (patient.status) {
      case 'IN_CABIN':
        return 'bg-blue-600 text-white border-2 border-blue-700 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50';
      case 'COMPLETED':
        return 'bg-emerald-50 text-slate-800 border-2 border-emerald-500/70 opacity-80';
      case 'NOT_AVAILABLE':
        return 'bg-amber-50 text-slate-800 border-2 border-amber-300';
      case 'WAITING':
      default:
        if (patient.isEmergency) {
          return 'bg-rose-50 text-slate-900 border-2 border-rose-500 ring-2 ring-rose-400/40 shadow-sm';
        }
        return isFirstWaiting
          ? 'bg-white text-slate-900 border-2 border-blue-300 shadow-md ring-1 ring-blue-200'
          : 'bg-white text-slate-800 border border-slate-200 shadow-xs hover:border-slate-300';
    }
  };

  const isInCabin = patient.status === 'IN_CABIN';
  const isCompleted = patient.status === 'COMPLETED';
  const isAbsent = patient.status === 'NOT_AVAILABLE';

  const statusLabel =
    doctorStatus === 'LUNCH'
      ? 'Lunch Break'
      : doctorStatus === 'SURGERY'
      ? 'In Surgery'
      : doctorStatus === 'LEAVE'
      ? 'On Leave'
      : 'Available';

  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 overflow-hidden ${getCardStyle()}`}
    >
      {/* Visual Slide Guides / Labels */}
      {patient.status === 'WAITING' && (
        <div className="mb-3">
          {!isDoctorAvailable ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
                <span>Doctor Status: <strong>{statusLabel}</strong> — Cabin Calling Paused</span>
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                (Doctor ke Available hone par hi andar bula sakeinge)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                <span>Slide ➡️ Left-to-Right:</span>
                <span>Blue (Andar Cabin me)</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <span>Slide ⬅️ Right-to-Left:</span>
                <span>Green (Completed)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Token Number & Patient Details */}
        <div className="flex items-start gap-3.5">
          {/* Big Token Badge */}
          <div
            className={`flex flex-col items-center justify-center rounded-2xl h-14 w-14 shrink-0 font-mono font-black shadow-sm ${
              isInCabin
                ? 'bg-white text-blue-700'
                : isCompleted
                ? 'bg-emerald-600 text-white'
                : isAbsent
                ? 'bg-amber-200 text-amber-900'
                : patient.isEmergency
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">Token</span>
            <span className="text-xl sm:text-2xl font-black">#{patient.tokenNumber}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className={`text-base font-bold ${isInCabin ? 'text-white' : 'text-slate-900'}`}>
                {patient.name}
              </h4>

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isInCabin
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {patient.gender}, {patient.age} yrs
              </span>

              {/* Source Tag: Free Staff vs Online Book */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase ${
                  patient.bookingType === 'ONLINE'
                    ? isInCabin
                    ? 'bg-purple-300 text-purple-950'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                    : isInCabin
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {patient.bookingType === 'ONLINE' ? 'Online Book' : 'Staff Walk-in (Free)'}
              </span>

              {patient.isEmergency && (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Flame className="h-3 w-3" />
                  <span>Emergency Priority</span>
                </span>
              )}
            </div>

            {/* Mobile & Complaint */}
            <div
              className={`mt-1.5 flex flex-wrap items-center gap-3 text-xs ${
                isInCabin ? 'text-blue-100' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1 font-mono font-medium">
                <Phone className="h-3 w-3 opacity-70" />
                +91 {patient.mobile}
              </span>
              <span>•</span>
              <span className="font-medium line-clamp-1">
                Reason: {patient.complaint || 'General Consultation'}
              </span>
              <span>•</span>
              <span className="opacity-75">{patient.address}</span>
            </div>

            {/* Purely Automatic Call Status for Online Booking */}
            {patient.bookingType === 'ONLINE' && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                    isInCabin
                      ? 'bg-blue-700 text-blue-100'
                      : patient.botCallAlertSent
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <PhoneCall className="h-3 w-3" />
                  <span>
                    {patient.botCallAlertSent
                      ? '✓ Automated Bot Call Alert Sent'
                      : 'Auto Call System Active (3-4 Mareez Pehle Auto Call Hoga)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Slide Actions & Quick Option Buttons */}
        <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
          {patient.status === 'WAITING' && (
            <>
              {/* SLIDE LEFT-TO-RIGHT EQUIVALENT BUTTON (BLUE - IN CABIN) */}
              <button
                type="button"
                disabled={!isDoctorAvailable}
                onClick={() => {
                  if (isDoctorAvailable) {
                    callPatient(patient.id);
                  }
                }}
                className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  isDoctorAvailable
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  isDoctorAvailable
                    ? 'Slide Left-to-Right: Patient inside Doctor Cabin (Blue)'
                    : `Doctor currently ${statusLabel}. Set status to Available to call patient.`
                }
              >
                {isDoctorAvailable ? (
                  <>
                    <span>➡️ Andar Bulayein (In Cabin)</span>
                    <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Andar Bulayein (Locked)</span>
                  </>
                )}
              </button>

              {/* SLIDE RIGHT-TO-LEFT EQUIVALENT BUTTON (GREEN - COMPLETED) */}
              <button
                type="button"
                disabled={!isDoctorAvailable}
                onClick={() => {
                  if (isDoctorAvailable) {
                    completePatient(patient.id);
                  }
                }}
                className={`flex-1 sm:flex-initial rounded-xl px-3 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1 ${
                  isDoctorAvailable
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  isDoctorAvailable
                    ? 'Slide Right-to-Left: Mark consultation done & out (Green)'
                    : `Doctor currently ${statusLabel}`
                }
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Done (Bahar Aaye)</span>
              </button>

              {/* 3.a Option: Not Available */}
              <button
                type="button"
                onClick={() => markNotAvailable(patient.id)}
                className="rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                title="Patient is not available / absent right now"
              >
                Uplabdh Nahi
              </button>

              {/* 3.a Option: Emergency Priority */}
              {!patient.isEmergency && (
                <button
                  type="button"
                  onClick={() => markEmergency(patient.id)}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Move to top priority as Emergency"
                >
                  🚨 Emergency
                </button>
              )}
            </>
          )}

          {isInCabin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100 px-2 py-1 rounded bg-blue-700">
                Doctor Cabin me Andar Hai (Blue)
              </span>

              {/* Complete consultation button */}
              <button
                type="button"
                onClick={() => completePatient(patient.id)}
                className="rounded-xl bg-white text-emerald-800 font-extrabold px-4 py-2.5 text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Consultation Complete (Bahar Nikle)</span>
              </button>
            </div>
          )}

          {isAbsent && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800">
                ⚠️ Absent / Uplabdh Nahi Tha
              </span>
              <button
                type="button"
                onClick={() => recallPatient(patient.id)}
                className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Recall back to Queue</span>
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Completed / Checkup Done (Green)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
