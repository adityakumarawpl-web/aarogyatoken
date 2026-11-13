import React from 'react';
import { DoctorStatus, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  PhoneCall,
  CheckCircle,
  RotateCcw,
  Phone,
  Flame,
  Lock,
  Calendar,
} from 'lucide-react';

interface QueueCardProps {
  patient: Patient;
  isFirstWaiting?: boolean;
  isDoctorAvailable?: boolean;
  isSessionActive?: boolean;
  doctorStatus?: DoctorStatus;
  currentActiveDate?: string;
  currentActiveShift?: string;
}

const formatDateDDMMYYYY = (isoDate?: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const QueueCard: React.FC<QueueCardProps> = ({
  patient,
  isFirstWaiting = false,
  isDoctorAvailable = true,
  isSessionActive = true,
  doctorStatus = 'AVAILABLE',
  currentActiveDate,
  currentActiveShift = 'Morning',
}) => {
  const {
    callPatient,
    completePatient,
    markNotAvailable,
    markEmergency,
    recallPatient,
  } = useClinic();

  const isInCabin = patient.status === 'IN_CABIN';
  const isCompleted = patient.status === 'COMPLETED';
  const isAbsent = patient.status === 'NOT_AVAILABLE';

  // 1. DATE VALIDATION
  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = currentActiveDate || todayStr;
  const patientDate = patient.appointmentDate || (patient.createdAt ? patient.createdAt.split('T')[0] : todayStr);
  const formattedPatientDate = formatDateDDMMYYYY(patientDate);
  const isDateMatched = patientDate === activeDate;

  // 2. SHIFT VALIDATION
  const patientShift = (patient.selectedShift || (patient as any).shift || 'Morning').trim();
  const isShiftMatched =
    !currentActiveShift ||
    currentActiveShift === 'ALL' ||
    patientShift.toLowerCase() === currentActiveShift.toLowerCase();

  // Rule: Action tabhi valid hoga jab:
  // - Emergency ho (Emergency hamesha bypass karegi)
  // YA
  // - Doctor Available ho + Session Active ho + Sahi Date ho + Sahi Shift ho + (Top-1 Regular ya Top-1 Recalled ya Cabin me ho)
  const isScheduledNow = isDateMatched && isShiftMatched;
  const canActOnPatient =
    isDoctorAvailable &&
    (patient.isEmergency || (isSessionActive && isScheduledNow && (isFirstWaiting || isInCabin)));

  const recalledSourceShift = patient.originalShift || patientShift;

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
        if (!isScheduledNow) {
          return 'bg-slate-50 text-slate-500 border border-slate-200 opacity-75';
        }
        if (patient.isRecalled && isFirstWaiting && isSessionActive) {
          return 'bg-amber-50/40 text-slate-900 border-2 border-amber-400 shadow-md ring-2 ring-amber-100';
        }
        return isFirstWaiting && isSessionActive
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
      {/* Top Banner Status Info */}
      {patient.status === 'WAITING' && (
        <div className="mb-3">
          {!isDoctorAvailable ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
                <span>Doctor Status: <strong>{statusLabel}</strong> — Cabin Entry Paused</span>
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                (Doctor ke Available hone par hi buttons chalenge)
              </span>
            </div>
          ) : !isSessionActive && !patient.isEmergency ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
                <span>OPD Token Session Shuru Nahi Hua — Calling Locked</span>
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                (Upar <strong>"Shift Start"</strong> dabane par hi ye button unlock hoga)
              </span>
            </div>
          ) : !isDateMatched && !patient.isEmergency ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Future / Other Date Token: <strong>{formattedPatientDate}</strong> ({patientShift} Shift)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                (Buttons sirf {formattedPatientDate} ko active honge)
              </span>
            </div>
          ) : !isShiftMatched && !patient.isEmergency ? (
            <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>Scheduled for <strong>{patientShift} Shift</strong> — Current Shift Mismatch</span>
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                ({patientShift} Shift aane par buttons active honge)
              </span>
            </div>
          ) : isFirstWaiting || patient.isEmergency ? (
            <div
              className={`flex items-center justify-between text-[11px] font-bold pb-2 border-b ${
                patient.isRecalled
                  ? 'border-amber-200 text-amber-800'
                  : 'border-emerald-100 text-emerald-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full animate-ping ${
                    patient.isRecalled ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                ></span>
                <span>
                  {patient.isRecalled
                    ? `🔄 Recalled Priority (${recalledSourceShift} #${patient.tokenNumber}): Ready to Call`
                    : 'Current Turn: Next Patient to Call'}
                </span>
              </span>
              <span
                className={`text-[10px] font-medium ${
                  patient.isRecalled ? 'text-amber-700' : 'text-emerald-600'
                }`}
              >
                ('Andar Gaye' dabakar cabin me bhejein)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-medium pb-1.5 border-b border-slate-100 text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>
                  {patient.isRecalled
                    ? `Waiting in Recalled Queue (${recalledSourceShift} #${patient.tokenNumber}) — Locked`
                    : 'Waiting in Queue — Series Token Locked'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400">
                (Pehle aage wale token ka checkup hoga)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Token Number & Details */}
        <div className="flex items-start gap-3.5">
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
                : patient.isRecalled && isFirstWaiting && isSessionActive
                ? 'bg-amber-500 text-white shadow-amber-200 shadow-md'
                : isFirstWaiting && isScheduledNow && isSessionActive
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

              {/* Recalled Indicator Badge */}
              {patient.isRecalled && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                    isInCabin
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  🔄 Recalled ({recalledSourceShift} #{patient.tokenNumber})
                </span>
              )}

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isInCabin
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {patient.gender}, {patient.age} yrs
              </span>

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

              {/* Appointment Date Badge (DD/MM/YYYY) */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold ${
                  isInCabin
                    ? 'bg-blue-800 text-white'
                    : !isDateMatched
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                📅 {formattedPatientDate}
              </span>

              {/* Shift Badge */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                  isInCabin
                    ? 'bg-blue-800 text-white'
                    : patientShift === 'Morning'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                }`}
              >
                🕒 {patientShift} Shift
              </span>

              {patient.isEmergency && (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Flame className="h-3 w-3" />
                  <span>Emergency Priority</span>
                </span>
              )}
            </div>

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

        {/* Right Actions */}
        <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
          {patient.status === 'WAITING' && (
            <>
              {/* BUTTON 1: ANDAR GAYE */}
              <button
                type="button"
                disabled={!canActOnPatient}
                onClick={() => {
                  if (canActOnPatient) {
                    callPatient(patient.id);
                  }
                }}
                className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  canActOnPatient
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  !isDoctorAvailable
                    ? 'Doctor abhi available nahi hain'
                    : !isSessionActive && !patient.isEmergency
                    ? 'Pehle upar "Shift Start" button dabayein'
                    : !isDateMatched && !patient.isEmergency
                    ? `Token date ${formattedPatientDate} hai. Aaj attend nahi kiya ja sakta.`
                    : !isShiftMatched && !patient.isEmergency
                    ? `Token ${patientShift} shift ka hai.`
                    : !canActOnPatient
                    ? 'Series locked: Pehle aage wale patient ko attend karein.'
                    : 'Patient ko cabin ke andar bulayein'
                }
              >
                {!canActOnPatient ? (
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
                )}
                <span>➡️ Andar Gaye (In Cabin)</span>
              </button>

              {/* BUTTON 2: DONE (WAITING state me locked) */}
              <button
                type="button"
                disabled={true}
                className="flex-1 sm:flex-initial rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-50 flex items-center gap-1"
                title="Pehle mareez ko cabin ke andar bhejein, tab bahar aane ka button active hoga"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Done (Bahar Aaye)</span>
              </button>

              {/* BUTTON 3: UPLABDH NAHI */}
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
              >
                Uplabdh Nahi
              </button>

              {/* BUTTON 4: EMERGENCY PRIORITY */}
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
                >
                  <Flame className="h-3.5 w-3.5 text-rose-500" />
                  <span>Emergency</span>
                </button>
              )}
            </>
          )}

          {/* IN CABIN STATE */}
          {isInCabin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100 px-2 py-1 rounded bg-blue-700">
                Doctor Cabin me Andar Hai
              </span>

              <button
                type="button"
                disabled={!isDoctorAvailable}
                onClick={() => completePatient(patient.id)}
                className="rounded-xl bg-white text-emerald-800 font-extrabold px-4 py-2.5 text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Done (Bahar Aaye)</span>
              </button>
            </div>
          )}

{/* ABSENT STATE (Recall sirf Same Day ke liye valid hai) */}
          {isAbsent && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-800">
                ⚠️ Absent / Uplabdh Nahi Tha
              </span>
              {(patient.originalDate || patientDate) === todayStr ? (
                <button
                  type="button"
                  onClick={() => recallPatient(patient.id)}
                  className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Recall back to Queue</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 text-slate-600 px-2.5 py-1 text-[11px] font-bold">
                  <Lock className="h-3 w-3" />
                  <span>Recall Expired (Keval {formattedPatientDate} ko valid tha)</span>
                </span>
              )}
            </div>
          )}

          {/* COMPLETED STATE */}
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Completed / Checkup Done</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
