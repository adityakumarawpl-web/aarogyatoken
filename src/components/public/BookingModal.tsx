import React, { useState } from 'react';
import { Doctor, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { getPatientsAheadCount } from '../../utils/queueLogic';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  PhoneCall,
  AlertCircle,
  Sparkles,
  Lock,
  Calendar,
} from 'lucide-react';

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
}

const formatDateDDMMYYYY = (isoDate?: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose }) => {
  const { patients, bookOnlineAppointment, triggerBotCallAlert, razorpaySettings } = useClinic();

  const todayStr = new Date().toISOString().split('T')[0];

  // Staff jab tak "Morning Shift Complete" click nahi karega, aaj ki Morning Shift open rahegi
  const isMorningShiftActiveForDoctor = (targetDate: string, doc: Doctor) => {
    if (targetDate > todayStr) return true;
    return (doc.activeShift || 'Morning') === 'Morning';
  };

  // Check karein ki chuni gayi tarikh doctor ki Leave date range me toh nahi aati
  const isDateOnLeave = (targetDate: string, doc: Doctor) => {
    if (doc.status !== 'LEAVE') return false;
    if (doc.leaveStartDate && doc.leaveEndDate) {
      return targetDate >= doc.leaveStartDate && targetDate <= doc.leaveEndDate;
    }
    return targetDate === todayStr;
  };

  const initialMorningActive = isMorningShiftActiveForDoctor(todayStr, doctor);

  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'SUCCESS'>('DETAILS');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    appointmentDate: todayStr,
    selectedShift: initialMorningActive ? 'Morning' : 'Evening',
    address: '',
    complaint: '',
  });

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    const morningAllowed = isMorningShiftActiveForDoctor(newDate, doctor);
    setFormData((prev) => ({
      ...prev,
      appointmentDate: newDate,
      selectedShift: (!morningAllowed && prev.selectedShift === 'Morning') ? 'Evening' : prev.selectedShift,
    }));
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedPatient, setConfirmedPatient] = useState<Patient | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const matchingShiftPatients = patients.filter((p) => {
    const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
    const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim();
    return (
      p.doctorId === doctor.id &&
      pDate === formData.appointmentDate &&
      pShift.toLowerCase() === formData.selectedShift.toLowerCase()
    );
  });

  const nextEstimatedToken = matchingShiftPatients.reduce((max, p) => {
    const num = typeof p.tokenNumber === 'number' ? p.tokenNumber : parseInt(String(p.tokenNumber), 10) || 0;
    return num > max ? num : max;
  }, 0) + 1;

  // PRIORITY 1: Central Vercel Key, PRIORITY 2: Doctor Key, PRIORITY 3: Razorpay Settings
  const activeRazorpayKey =
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
    doctor.razorpayKeyId ||
    razorpaySettings.keyId;

  const selectedDateBlockedByLeave = isDateOnLeave(formData.appointmentDate, doctor);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDateBlockedByLeave) {
      setErrorMsg(
        `Doctor ${formatDateDDMMYYYY(doctor.leaveStartDate)} se ${formatDateDDMMYYYY(doctor.leaveEndDate)} tak chhutti (Leave) par hain. Kripya uske baad ki date chunein.`
      );
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Kripya mareez ka naam bharein (Enter Patient Name)');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length !== 10) {
      setErrorMsg('Kripya 10 ankon ka valid mobile number bharein');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Kripya pata bharein (Enter address / locality)');
      return;
    }
    setErrorMsg('');
    setStep('PAYMENT');
  };

  const sendWhatsAppNotification = async (patientData: {
    phone: string;
    name: string;
    tokenNumber: number;
    doctorName: string;
    clinicName: string;
  }) => {
    try {
      const cleanDigits = patientData.phone.replace(/\D/g, '');
      const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          patientName: patientData.name,
          doctorName: patientData.doctorName,
          tokenNumber: `#${patientData.tokenNumber}`,
          clinicName: patientData.clinicName,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log('WhatsApp message sent successfully:', result);
      } else {
        console.warn('WhatsApp API Response:', result);
      }
    } catch (err) {
      console.error('Error triggering WhatsApp notification:', err);
    }
  };

  const handleProcessPayment = () => {
    const razorpayKey = activeRazorpayKey;

    if (!razorpayKey) {
      setErrorMsg('Payment gateway key configure nahi hai. Kripya admin se sampark karein.');
      return;
    }

    if (!(window as any).Razorpay) {
      setErrorMsg('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    setIsProcessingPayment(true);
    setErrorMsg('');

    const resolvedHospitalId = doctor.hospitalId || doctor.staffUsername || doctor.id;

    const options = {
      key: razorpayKey,
      amount: 20 * 100, // ₹20 in paise
      currency: 'INR',
      name: doctor.clinicName || 'Aarogya Token Clinic',
      description: `OPD Consultation Fee - Dr. ${doctor.name}`,
      handler: function (response: any) {
        setIsProcessingPayment(false);

        const result = bookOnlineAppointment({
          doctorId: doctor.id,
          hospitalId: resolvedHospitalId,
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          age: parseInt(formData.age, 10) || 28,
          gender: formData.gender,
          appointmentDate: formData.appointmentDate,
          selectedShift: formData.selectedShift,
          shift: formData.selectedShift,
          address: formData.address.trim(),
          complaint: formData.complaint.trim() || 'General OPD Consultation',
          isEmergency: false,
          paymentId: response.razorpay_payment_id || `pay_online_${Date.now()}`,
        } as any);

        setConfirmedPatient(result.patient);
        setStep('SUCCESS');

        sendWhatsAppNotification({
          phone: formData.mobile.trim(),
          name: formData.name.trim(),
          tokenNumber: result.patient.tokenNumber,
          doctorName: doctor.name,
          clinicName: doctor.clinicName || 'Aarogya Clinic',
        });

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // confetti fallback ignore
        }
      },
      prefill: {
        name: formData.name.trim(),
        contact: formData.mobile.trim(),
      },
      theme: {
        color: '#2563eb',
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setIsProcessingPayment(false);
      setErrorMsg('Payment gateway initialization failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 flex flex-col max-h-[92vh]">
        {/* FIXED HEADER */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Online Token
              </span>
              <span className="text-[11px] text-blue-100">घर बैठे टोकन लें</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold mt-0.5 truncate">{doctor.name}</h3>
            <p className="text-[11px] text-blue-100 truncate">{doctor.clinicName} • {doctor.cabinNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/25 transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="sticky top-[68px] sm:top-[76px] z-10 bg-slate-50 border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className={`flex items-center gap-1 sm:gap-1.5 font-semibold ${step === 'DETAILS' ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'DETAILS' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span className="text-[11px] sm:text-xs">Details</span>
          </div>
          <div className="h-0.5 flex-1 max-w-[40px] sm:max-w-[60px] bg-slate-200 mx-1"></div>
          <div className={`flex items-center gap-1 sm:gap-1.5 font-semibold ${step === 'PAYMENT' ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'PAYMENT' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span className="text-[11px] sm:text-xs">₹20 Fee</span>
          </div>
          <div className="h-0.5 flex-1 max-w-[40px] sm:max-w-[60px] bg-slate-200 mx-1"></div>
          <div className={`flex items-center gap-1 sm:gap-1.5 font-semibold ${step === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span className="text-[11px] sm:text-xs">Token</span>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-2.5 sm:p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PATIENT DETAILS */}
          {step === 'DETAILS' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-950">Next Available Token: #{nextEstimatedToken}</span>
                  <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                    Online token fee is ₹20. Clinic walk-in is free. Live tracking & call alert included!
                  </p>
                </div>
              </div>

              {/* Date & Shift Selection (Strictly DD/MM/YYYY visual display across Desktop & Mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <div className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold bg-white text-slate-800 flex items-center justify-between">
                      <span>{formatDateDDMMYYYY(formData.appointmentDate)}</span>
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <input
                      type="date"
                      min={todayStr}
                      value={formData.appointmentDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                    Preferred Shift
                  </label>
                  <select
                    value={formData.selectedShift}
                    onChange={(e) => setFormData({ ...formData, selectedShift: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium bg-white focus:outline-none focus:border-blue-500"
                  >
                    {isMorningShiftActiveForDoctor(formData.appointmentDate, doctor) && (
                      <option value="Morning">Morning Shift</option>
                    )}
                    <option value="Evening">Evening Shift</option>
                  </select>
                </div>
              </div>

              {selectedDateBlockedByLeave && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-900 font-semibold">
                  ⚠️ Doctor {formatDateDDMMYYYY(doctor.leaveStartDate)} se {formatDateDDMMYYYY(doctor.leaveEndDate)} tak chhutti par hain. Kripya koi aur date chunein.
                </div>
              )}

              {/* Patient Name */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                  1. Patient Full Name (मरीज़ का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Mobile Number & Age/Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                    2. Mobile Number (मोबाइल नंबर) *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-3 bg-slate-100 border-r border-slate-300 rounded-l-xl text-xs font-bold text-slate-700 select-none pointer-events-none">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('91') && val.length > 10) {
                          val = val.slice(2);
                        } else if (val.startsWith('0')) {
                          val = val.slice(1);
                        }
                        setFormData({ ...formData, mobile: val.slice(0, 10) });
                      }}
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-slate-300 pl-16 pr-3 py-2 text-xs sm:text-sm font-medium tracking-wide focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Alert Bot isi number par WhatsApp aur Call alert bhejega
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                    Age & Gender (उम्र / लिंग) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={110}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Age"
                      className="w-20 rounded-xl border border-slate-300 px-2.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="flex-1 rounded-xl border border-slate-300 px-2.5 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                  3. Address / Colony / City (मरीज़ का पता) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Ghanghri Naka, Umaria"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Complaint */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaint / Reason (समस्या / लक्षण)
                </label>
                <input
                  type="text"
                  value={formData.complaint}
                  onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                  placeholder="e.g. Fever & Cough, BP checkup, Knee pain"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={selectedDateBlockedByLeave}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Proceed to Pay ₹20 (आगे बढ़ें)</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: RAZORPAY / UPI ₹20 PAYMENT GATEWAY */}
          {step === 'PAYMENT' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900 text-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      ₹
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide">Aarogya Instant Pay</span>
                      <span className="text-[10px] text-blue-400 block font-mono">
                        Key: {activeRazorpayKey ? `${String(activeRazorpayKey).slice(0, 12)}...` : 'Not Set'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                    Secured
                  </span>
                </div>

                <div className="pt-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Online Token Fee</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹20.00</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-200 font-bold block">
                      Token #{nextEstimatedToken}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      For {formData.name} ({formatDateDDMMYYYY(formData.appointmentDate)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic ₹20 QR Code */}
              <div className="rounded-2xl border-2 border-dashed border-blue-300 p-4 text-center bg-blue-50/40 flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 mb-2.5">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan to Pay ₹20 (QR कोड स्कैन करें)</span>
                </div>

                <div className="relative h-40 w-40 bg-white p-2.5 rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=aarogya.opd@icici%26pn=${encodeURIComponent(doctor.name)}%26am=20.00%26cu=INR%26tn=Token_${doctor.id}_${Date.now()}`}
                    alt="Scan ₹20 QR Code"
                    className="h-34 w-34"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 rounded-md px-1.5 py-0.5 text-[9px] font-black text-blue-700 shadow-xs border border-blue-200">
                      ₹20
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <span className="text-xs font-mono font-bold text-slate-800 block">
                    UPI ID: aarogya.opd@icici
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5 max-w-xs">
                    <strong>GPay, PhonePe, Paytm, BHIM</strong> se scan karein ya neeche button dabayein.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleProcessPayment}
                  className="w-full rounded-2xl bg-emerald-600 py-3 px-4 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      <span>₹20 Payment Verify Ho Rahi Hai...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-white" />
                      <span>Pay ₹20 Now (पेमेंट पूरा करें)</span>
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
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Pay hone par hi token banega
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMED TOKEN PASS */}
          {step === 'SUCCESS' && confirmedPatient && (
            <div className="space-y-4">
              <div className="rounded-2xl sm:rounded-3xl border-2 border-emerald-500 bg-emerald-50/40 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h4 className="mt-2 text-sm sm:text-base font-extrabold text-slate-900">
                  Token Confirmed! (टोकन जारी हुआ)
                </h4>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Razorpay Verified • TXN: {confirmedPatient.paymentId}
                </p>

                {/* Token Box */}
                <div className="my-3 rounded-2xl bg-white border border-emerald-200 p-3 sm:p-4 shadow-sm">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Aapka Token Number
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight my-1">
                    #{confirmedPatient.tokenNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {confirmedPatient.name} ({confirmedPatient.gender}, {confirmedPatient.age} yrs)
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-600">
                    Date: <span className="font-mono text-slate-800">{formatDateDDMMYYYY(confirmedPatient.appointmentDate)}</span> • Shift: <span className="text-blue-700">{confirmedPatient.selectedShift || (confirmedPatient as any).shift}</span>
                  </div>
                </div>

                {/* Queue Details */}
                <div className="rounded-xl sm:rounded-2xl bg-slate-900 text-white p-3 text-left space-y-1.5 text-xs">
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

              {/* Bot Call Reminder Notice */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-blue-200 p-3 text-xs text-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <PhoneCall className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                  <span>Automatic Voice Bot Call Reminder Active!</span>
                </div>
                <p className="text-slate-600 text-[10px] leading-relaxed">
                  Jaise hi 3 se 4 mareez bachenge, <span className="font-bold text-slate-900">+91 {confirmedPatient.mobile}</span> par IVR call aayegi.
                </p>
                <button
                  type="button"
                  onClick={() => triggerBotCallAlert(confirmedPatient)}
                  className="w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Test Automated Bot Call (सुनकर देखें)</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `AarogyaToken Pass - Dr. ${doctor.name}, Token #${confirmedPatient.tokenNumber} (${formatDateDDMMYYYY(confirmedPatient.appointmentDate)}). Clinic: ${doctor.clinicName}.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
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
