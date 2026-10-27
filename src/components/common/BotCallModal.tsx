import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { voiceBot } from '../../utils/voiceBot';
import { getPatientsAheadCount } from '../../utils/queueLogic';
import { Phone, PhoneOff, PhoneCall, Volume2, ShieldCheck, User, Clock, Bell } from 'lucide-react';

export const BotCallModal: React.FC = () => {
  const { activeBotCallPatient, closeBotCallModal, doctors, patients } = useClinic();
  const [callState, setCallState] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [speaking, setSpeaking] = useState<boolean>(false);

  const doctor = doctors.find((d) => d.id === activeBotCallPatient?.doctorId);
  const patientsAhead = activeBotCallPatient ? getPatientsAheadCount(patients, activeBotCallPatient.id) : 3;

  useEffect(() => {
    if (!activeBotCallPatient) {
      setCallState('RINGING');
      setSpeaking(false);
      voiceBot.stopAll();
      return;
    }

    // Play ringing tone automatically
    setCallState('RINGING');
    voiceBot.playPhoneRing(2800).catch(() => {});

    return () => {
      voiceBot.stopAll();
    };
  }, [activeBotCallPatient]);

  if (!activeBotCallPatient) return null;

  const handleAnswerCall = async () => {
    setCallState('CONNECTED');
    setSpeaking(true);

    if (doctor) {
      await voiceBot.speakAlert({
        patientName: activeBotCallPatient.name,
        doctorName: doctor.name,
        tokenNumber: activeBotCallPatient.tokenNumber,
        patientsAhead,
      });
    }
    setSpeaking(false);
  };

  const handleDeclineCall = () => {
    voiceBot.stopAll();
    setCallState('ENDED');
    setTimeout(() => {
      closeBotCallModal();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      {/* Mobile Phone Mockup Frame */}
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border-4 border-slate-700 overflow-hidden">
        {/* Phone Speaker Notch */}
        <div className="mx-auto mt-3 h-4 w-32 rounded-full bg-slate-800 flex items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-950"></div>
          <div className="ml-2 h-2 w-2 rounded-full bg-slate-950"></div>
        </div>

        <div className="p-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            <Bell className="h-3.5 w-3.5 animate-bounce" />
            <span>Automated OPD Turn Alert</span>
          </div>

          <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
            {doctor?.clinicName || 'Aarogya Clinic'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            IVR Voice Bot - {doctor?.name}
          </p>

          {/* Caller Avatar / Status */}
          <div className="my-6 flex justify-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 p-1 flex items-center justify-center shadow-xl">
                <div className="h-full w-full rounded-full bg-slate-900 flex flex-col items-center justify-center">
                  <PhoneCall className={`h-10 w-10 ${callState === 'RINGING' ? 'text-blue-400 animate-pulse' : 'text-emerald-400'}`} />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-1">
                    {callState === 'RINGING' ? 'Incoming...' : callState === 'CONNECTED' ? '00:18 Live' : 'Call Ended'}
                  </span>
                </div>
              </div>
              {callState === 'RINGING' && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 items-center justify-center text-[10px] font-bold">!</span>
                </span>
              )}
            </div>
          </div>

          {/* Patient Card info */}
          <div className="rounded-2xl bg-slate-800/80 p-3.5 text-left border border-slate-700/60 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-blue-400" />
                {activeBotCallPatient.name}
              </span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 font-bold text-blue-300">
                Token #{activeBotCallPatient.tokenNumber}
              </span>
            </div>
            <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Aapke aage {patientsAhead} mareez hain. Clinic pahunche!</span>
            </div>
          </div>

          {/* Voice transcript dialog */}
          {callState === 'CONNECTED' && (
            <div className="rounded-xl bg-slate-950/70 p-3 text-xs text-left text-slate-300 border border-slate-800 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span>IVR Automated Bot Audio:</span>
              </div>
              <p className="italic text-slate-200">
                &ldquo;Namaste {activeBotCallPatient.name} ji! Dr. {doctor?.name} ke clinic par aapka Token #{activeBotCallPatient.tokenNumber} aane wala hai. Aapke aage keval {patientsAhead} mareez bache hain. Kripya clinic pahunche!&rdquo;
              </p>
              {speaking && (
                <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
                  AI Voice is speaking in Hindi...
                </div>
              )}
            </div>
          )}

          {/* Call Control Buttons */}
          <div className="mt-2 flex items-center justify-around px-4">
            {callState === 'RINGING' ? (
              <>
                <button
                  type="button"
                  onClick={handleDeclineCall}
                  className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
                  aria-label="Decline Call"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 shadow-lg shadow-rose-900/40 transition group-hover:scale-110 active:scale-95">
                    <PhoneOff className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Decline</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
                  aria-label="Answer Call"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/40 transition group-hover:scale-110 active:scale-95 animate-bounce">
                    <Phone className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">Answer Bot Call</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDeclineCall}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none mx-auto"
                aria-label="End Call"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 shadow-lg shadow-rose-900/40 transition group-hover:scale-110 active:scale-95">
                  <PhoneOff className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-300">Cut Call</span>
              </button>
            )}
          </div>

          <p className="mt-5 text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-slate-400" />
            Sent automatically 3-4 patients prior to turn
          </p>
        </div>
      </div>
    </div>
  );
};
