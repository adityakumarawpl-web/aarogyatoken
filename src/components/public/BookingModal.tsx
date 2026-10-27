import React, { useState } from 'react';
import { Doctor, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { getNextTokenNumber, getPatientsAheadCount } from '../../utils/queueLogic';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  PhoneCall,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose }) => {
  const { patients, bookOnlineAppointment, triggerBotCallAlert, razorpaySettings } = useClinic();

  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'SUCCESS'>('DETAILS');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    complaint: '',
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedPatient, setConfirmedPatient] = useState<Patient | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const nextEstimatedToken = getNextTokenNumber(patients, doctor.id);
  const activeRazorpayKey = doctor.razorpayKeyId || razorpaySettings.keyId;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Kripya mareez ka naam bharein (Enter Patient Name)');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length < 10) {
      setErrorMsg('Kripya 10 ankon ka mobile number bharein (Enter valid 10-digit mobile)');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Kripya pata bharein (Enter address / locality)');
      return;
    }
    setErrorMsg('');
    setStep('PAYMENT');
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const result = bookOnlineAppointment({
        doctorId: doctor.id,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        age: parseInt(formData.age, 10) || 28,
        gender: formData.gender,
        address: formData.address.trim(),
        complaint: formData.complaint.trim() || 'General OPD Consultation',
        isEmergency: false,
      });

      setConfirmedPatient(result.patient);
      setStep('SUCCESS');

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Online Token Booking
              </span>
              <span className="text-xs text-blue-100">घर बैठे टोकन लें</span>
            </div>
            <h3 className="text-lg font-bold mt-1">{doctor.name}</h3>
            <p className="text-xs text-blue-100">{doctor.clinicName} • {doctor.cabinNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'DETAILS' ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'DETAILS' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Mareez Details</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200"></div>
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'PAYMENT' ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'PAYMENT' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Razorpay ₹20 Fee</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200"></div>
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Confirmed Token</span>
          </div>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PATIENT DETAILS */}
          {step === 'DETAILS' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="rounded-2xl bg-blue-50/70 border border-blue-200/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-bold">Next Available Token: #{nextEstimatedToken}</span>
                  <p className="text-blue-700 text-[11px] mt-0.5 leading-relaxed">
                    Online token fee is ₹20. Staff/Walk-in at clinic is free. You will get live token tracking & automated bot call reminder!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Patient Full Name (मरीज़ का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Mobile Number (मोबाइल नंबर) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10 digit mobile"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-[10px] text-slate-500">Alert Bot will call this number</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age & Gender *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={110}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Age"
                      className="w-20 rounded-xl border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="flex-1 rounded-xl border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Address / Colony / City (मरीज़ का पता) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Civil Lines, Kanpur"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaint / Reason (समस्या / लक्षण)
                </label>
                <input
                  type="text"
                  value={formData.complaint}
                  onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                  placeholder="e.g. Fever & Cough, BP checkup, Knee pain"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Pay ₹20 (आगे बढ़ें)</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: RAZORPAY / UPI ₹20 PAYMENT GATEWAY */}
          {step === 'PAYMENT' && (
            <div className="space-y-4">
              {/* Payment Summary Header */}
              <div className="rounded-2xl bg-slate-900 text-white p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      ₹
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide">Aarogya Instant Pay</span>
                      <span className="text-[10px] text-blue-400 block font-mono">
                        Key: {activeRazorpayKey}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                    Secured Payment Gateway
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Online Token Convenience Fee</span>
                    <div className="text-3xl font-black text-emerald-400">₹20.00</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-200 font-bold block">
                      Token #{nextEstimatedToken}
                    </span>
                    <span className="text-[10px] text-slate-400">Hold for {formData.name}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic ₹20 QR Code Display */}
              <div className="rounded-3xl border-2 border-dashed border-blue-300 p-5 text-center bg-blue-50/40 flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold px-3 py-1 mb-3">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan to Pay ₹20 (QR कोड स्कैन करें)</span>
                </div>

                <div className="relative h-44 w-44 bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=aarogya.opd@icici%26pn=${encodeURIComponent(doctor.name)}%26am=20.00%26cu=INR%26tn=Token_${doctor.id}_${Date.now()}`}
                    alt="Scan ₹20 QR Code"
                    className="h-38 w-38"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 rounded-md px-1.5 py-0.5 text-[9px] font-black text-blue-700 shadow-xs border border-blue-200">
                      ₹20
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-mono font-bold text-slate-800 block">
                    UPI ID: aarogya.opd@icici
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5 max-w-xs">
                    Kisi bhi mobile se <strong>Google Pay, PhonePe, Paytm, BHIM</strong> se QR scan karein ya neeche diye gaye button par click karein.
                  </p>
                </div>
              </div>

              {/* Direct Pay Button beneath the QR Code */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleProcessPayment}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 px-4 text-sm font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      <span>₹20 Payment Verify Ho Rahi Hai...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5 text-white" />
                      <span>Pay ₹20 Now / Payment Complete (आगे बढ़ें)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setStep('DETAILS')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    ← Back (Edit Details)
                  </button>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Pay hone par hi token generate hoga
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMED TOKEN PASS */}
          {step === 'SUCCESS' && confirmedPatient && (
            <div className="space-y-4">
              <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/40 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="mt-2 text-base font-extrabold text-slate-900">
                  Token Confirmed! (टोकन जारी हुआ)
                </h4>
                <p className="text-xs text-emerald-800 font-medium">
                  Razorpay Verified • TXN: {confirmedPatient.paymentId}
                </p>

                {/* Big Token Number Callout */}
                <div className="my-4 rounded-2xl bg-white border border-emerald-200 p-4 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Aapka Token Number
                  </span>
                  <div className="text-5xl font-black text-blue-600 tracking-tight my-1">
                    #{confirmedPatient.tokenNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {confirmedPatient.name} ({confirmedPatient.gender}, {confirmedPatient.age} yrs)
                  </div>
                </div>

                {/* Queue status breakdown */}
                <div className="rounded-2xl bg-slate-900 text-white p-3.5 text-left space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doctor:</span>
                    <span className="font-bold text-white">{doctor.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cabin:</span>
                    <span className="font-semibold text-amber-300">{doctor.cabinNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Clinic Address:</span>
                    <span className="text-slate-300 text-right text-[11px] max-w-[200px] truncate">{doctor.address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-400" />
                      Patients Ahead:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {getPatientsAheadCount(patients, confirmedPatient.id)} Patients
                    </span>
                  </div>
                </div>
              </div>

              {/* Bot Alert feature showcase */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-blue-200 p-4 text-xs text-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <PhoneCall className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span>Automatic Voice Bot Call Reminder Active!</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Jaise hi aapke aage 3 se 4 mareez bachenge, hamara system aapke number{' '}
                  <span className="font-bold text-slate-900">+91 {confirmedPatient.mobile}</span> par ek
                  automatic IVR Call bhejega taki aap samay par clinic pahunch sakein.
                </p>
                <button
                  type="button"
                  onClick={() => triggerBotCallAlert(confirmedPatient)}
                  className="w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Test Automated Bot Call Now (सुनकर देखें)</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `AarogyaToken Pass - Dr. ${doctor.name}, Token #${confirmedPatient.tokenNumber}. Clinic: ${doctor.clinicName}.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
