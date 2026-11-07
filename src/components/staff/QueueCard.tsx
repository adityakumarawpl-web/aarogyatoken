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
  isFirstWaiting = false,
  isDoctorAvailable = true,
  doctorStatus = 'AVAILABLE',
}) => {
  const {
    completePatient,
    markNotAvailable,
    markEmergency,
    recallPatient,
  } = useClinic();

  const isInCabin = patient.status === 'IN_CABIN';
  const isCompleted = patient.status === 'COMPLETED';
  const isAbsent = patient.status === 'NOT_AVAILABLE';

  // Rule: Sirf tabhi action liya ja sakta hai jab Doctor Available ho
  // Aur strict series ke mutabiq sirf First Waiting ya Emergency patient hi active ho
  const canActOnPatient = isDoctorAvailable && (isFirstWaiting || patient.isEmergency);

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
          ? 'bg-white text-slate-900 border-2 border-emerald-400 shadow-md ring-2 ring-emerald-100'
          : 'bg-slate-50/70 text-slate-600 border border-slate-200 opacity-90';
    }
  };

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
      {/* Top Banner: Doctor Unavailability ya Queue Turn Notification */}
      {patient.status === 'WAITING' && (
        <div className="mb-3">
          {!isDoctorAvailable ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
                <span>Doctor Status: <strong>{statusLabel}</strong> — Consultation Paused</span>
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                (Doctor ke Available hone par hi buttons chalenge)
              </span>
            </div>
          ) : isFirstWaiting || patient.isEmergency ? (
            <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-emerald-100 text-emerald-700">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Current Turn: Next Patient to Consult</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                (Checkup complete hone par 'Done' karein)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-medium pb-1.5 border-b border-slate-100 text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Waiting in Queue — Series Token Locked</span>
              </span>
              <span className="text-[10px] text-slate-400">
                (Pehle pichhle token ka checkup poora hoga)
              </span>
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
                : isFirstWaiting
                ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                : 'bg-slate-700 text-white'
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

              {/* Source Tag */}
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

              {/* Appointment Date Badge */}
              {patient.appointmentDate && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    isInCabin
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  📅 {patient.appointmentDate}
                </span>
              )}

              {/* Shift Badge */}
              {patient.selectedShift && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    isInCabin
                      ? 'bg-blue-800 text-white'
                      : patient.selectedShift === 'Morning'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                  }`}
                >
                  🕒 {patient.selectedShift} Shift
                </span>
              )}

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

            {/* Bot Call Status for Online Booking */}
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
                      : 'Auto Call System Active'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
          {patient.status === 'WAITING' && (
            <>
              {/* BUTTON: DONE (COMPLETED) */}
              <button
                type="button"
                disabled={!canActOnPatient}
                onClick={() => {
                  if (canActOnPatient) {
                    completePatient(patient.id);
                  }
                }}
                className={`flex-1 sm:flex-initial rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  canActOnPatient
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  !isDoctorAvailable
                    ? `Doctor currently ${statusLabel}. Consultation paused.`
                    : !canActOnPatient
                    ? 'Series locked: Pehle pichhle token ko complete karein.'
                    : 'Checkup done & marked completed'
                }
              >
                {!canActOnPatient ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : <CheckCircle className="h-3.5 w-3.5" />}
                <span>Done (Bahar Aaye)</span>
              </button>

              {/* BUTTON: UPLABDH NAHI */}
              <button
                type="button"
                disabled={!canActOnPatient}
                onClick={() => {
                  if (canActOnPatient) {
                    markNotAvailable(patient.id);
                  }
                }}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  canActOnPatient
                    ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                }`}
                title={
                  !canActOnPatient
                    ? 'Turn aane par hi absent mark kar sakte hain'
                    : 'Patient absent right now'
                }
              >
                Uplabdh Nahi
              </button>

              {/* BUTTON: EMERGENCY PRIORITY */}
              {!patient.isEmergency && (
                <button
                  type="button"
                  disabled={!isDoctorAvailable}
                  onClick={() => {
                    if (isDoctorAvailable) {
                      markEmergency(patient.id);
                    }
                  }}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold transition flex items-center gap-1 ${
                    isDoctorAvailable
                      ? 'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Shift this patient to immediate next priority"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-500" />
                  <span>Emergency</span>
                </button>
              )}
            </>
          )}

          {isInCabin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100 px-2 py-1 rounded bg-blue-700">
                Doctor Cabin me Andar Hai (Blue)
              </span>

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
