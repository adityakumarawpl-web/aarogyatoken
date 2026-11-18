import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/Navbar';
import { PublicOPDView } from './components/public/PublicOPDView';
import { StaffPortal } from './components/staff/StaffPortal';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { BotCallModal } from './components/common/BotCallModal';
import { DoctorRegisterPage } from './components/public/DoctorRegisterPage';
import { Phone, Mail, ShieldCheck, FileText, RefreshCw, X, Clock } from 'lucide-react';

type PolicyModalType = 'CONTACT' | 'PRIVACY' | 'TERMS' | 'REFUND' | null;

const AppContent: React.FC = () => {
  const { currentView, setCurrentView } = useClinic();
  const [routePath, setRoutePath] = useState(window.location.pathname);
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyModalType>(null);

  // URL Path change detect karne ke liye listener
  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // URL ke hisaab se automatic view set karna
  useEffect(() => {
    if (routePath === '/staff') {
      setCurrentView('STAFF');
    } else if (routePath === '/admin') {
      setCurrentView('ADMIN');
    } else if (routePath === '/doctor-register') {
      // Register route ke liye special handling
    } else {
      setCurrentView('PUBLIC');
    }
  }, [routePath, setCurrentView]);

  // Agar URL /doctor-register hai toh direct DoctorRegisterPage component dikhayein
  if (routePath === '/doctor-register') {
    return <DoctorRegisterPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {currentView === 'PUBLIC' && <PublicOPDView />}
        {currentView === 'STAFF' && <StaffPortal />}
        {currentView === 'ADMIN' && <SuperAdminDashboard />}
      </main>

      {/* Simulated Automated Voice Bot Incoming Call Screen */}
      <BotCallModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 font-semibold text-slate-700 text-center sm:text-left">
            <span>AarogyaToken OPD Platform</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-600">Live Queue & Smart WhatsApp Alert</span>
          </div>

          {/* 4 Compliance & Support Policy Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActivePolicyModal('CONTACT')}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold transition cursor-pointer"
            >
              Contact Us
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setActivePolicyModal('PRIVACY')}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setActivePolicyModal('TERMS')}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold transition cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setActivePolicyModal('REFUND')}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold transition cursor-pointer"
            >
              Refund & Cancellation
            </button>
          </div>
        </div>
      </footer>

      {/* Policy & Contact Popup Modals */}
      {activePolicyModal && (
        <div
          onClick={() => setActivePolicyModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activePolicyModal === 'CONTACT' && <Phone className="h-5 w-5 text-emerald-400" />}
                {activePolicyModal === 'PRIVACY' && <ShieldCheck className="h-5 w-5 text-blue-400" />}
                {activePolicyModal === 'TERMS' && <FileText className="h-5 w-5 text-amber-400" />}
                {activePolicyModal === 'REFUND' && <RefreshCw className="h-5 w-5 text-rose-400" />}
                <h3 className="text-base font-black tracking-tight">
                  {activePolicyModal === 'CONTACT' && 'Contact Us — AarogyaToken Support'}
                  {activePolicyModal === 'PRIVACY' && 'Privacy Policy'}
                  {activePolicyModal === 'TERMS' && 'Terms & Conditions'}
                  {activePolicyModal === 'REFUND' && 'Refund & Cancellation Policy'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* 1. CONTACT US */}
              {activePolicyModal === 'CONTACT' && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    For any query regarding online OPD token booking, payment support, or onboarding your clinic/hospital on <strong>AarogyaToken</strong>, please reach out to us:
                  </p>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">Support Email</span>
                        <a
                          href="mailto:adityakumar123@gmail.com"
                          className="font-bold text-slate-900 hover:text-blue-600"
                        >
                          adityakumar123@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">Helpline / WhatsApp</span>
                        <a
                          href="tel:+911234567890"
                          className="font-bold text-slate-900 hover:text-emerald-600"
                        >
                          +91 1234567890
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">Support Hours</span>
                        <span className="font-semibold text-slate-800">
                          Monday – Saturday, 10:00 AM to 07:00 PM IST
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950">
                    <strong className="block mb-1">हिंदी सारांश (Hindi Summary):</strong>
                    ऑनलाइन टोकन बुकिंग, पेमेंट सहायता या अपने क्लिनिक/अस्पताल को AarogyaToken से जोड़ने के लिए आप हमें <strong>adityakumar123@gmail.com</strong> या <strong>+91 1234567890</strong> (सोमवार–शनिवार, सुबह 10 से शाम 7 बजे) पर संपर्क कर सकते हैं।
                  </div>
                </div>
              )}

              {/* 2. PRIVACY POLICY */}
              {activePolicyModal === 'PRIVACY' && (
                <div className="space-y-3.5">
                  <p>
                    <strong>AarogyaToken</strong> respects patient and clinic privacy and follows a strict minimal-data architecture:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-700">
                    <li>
                      <strong>Minimal Information Collected:</strong> We only collect the patient's <strong>Name, Mobile Number, and Appointment Date/Shift</strong> required to generate an OPD queue token. We do not collect or store sensitive medical reports, prescriptions, or government IDs.
                    </li>
                    <li>
                      <strong>Purpose-Limited Alerts:</strong> Your mobile number is used strictly to send your booking confirmation via WhatsApp and automated voice-call queue alerts when your turn approaches.
                    </li>
                    <li>
                      <strong>Zero Data Selling:</strong> We never sell, rent, or share patient phone numbers or clinic records with third-party advertisers or marketing agencies.
                    </li>
                    <li>
                      <strong>Encrypted Payments & Cloud Security:</strong> All online platform fee transactions (₹20) are processed securely via <strong>Razorpay's PCI-DSS compliant gateway</strong>. AarogyaToken never stores your UPI PIN, card details, or bank credentials. Queue data is hosted securely on Google Firebase Cloud.
                    </li>
                  </ul>

                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-950">
                    <strong className="block mb-1">हिंदी सारांश (Hindi Summary):</strong>
                    AarogyaToken पर टोकन बुक करने के लिए केवल मरीज का <strong>नाम, मोबाइल नंबर और तारीख/शिफ्ट</strong> ली जाती है—कोई मेडिकल रिपोर्ट या आधार कार्ड स्टोर नहीं होता। आपका नंबर केवल व्हाट्सएप टोकन और बारी आने की कॉल अलर्ट भेजने के लिए उपयोग होता है और किसी को बेचा नहीं जाता। सभी ऑनलाइन पेमेंट Razorpay के सुरक्षित गेटवे से होते हैं।
                  </div>
                </div>
              )}

              {/* 3. TERMS & CONDITIONS */}
              {activePolicyModal === 'TERMS' && (
                <div className="space-y-3.5">
                  <p>
                    By booking an online OPD token through <strong>AarogyaToken</strong>, you agree to the following terms:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-700">
                    <li>
                      <strong>Platform Role:</strong> AarogyaToken is a digital queue and live token tracking service. The online charge of <strong>₹20</strong> is strictly a digital convenience & alert platform fee and is separate from the doctor's clinic consultation fee.
                    </li>
                    <li>
                      <strong>Doctor Unavailability / Clinic Closure:</strong> If you have generated an online token and the doctor is unavailable on that day or shift due to an emergency or unscheduled leave, your token will <strong>automatically be carried forward / valid for the next active shift or next working day</strong> at no extra platform charge.
                    </li>
                    <li>
                      <strong>Patient Arrival & Missed Turn:</strong> Patients must monitor the live queue status and arrive at the clinic before their token number is called. If your turn passes (token skipped) because you were not present at the clinic on time, <strong>no refund will be issued</strong> (re-entry into the queue is subject to clinic reception discretion).
                    </li>
                  </ul>

                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-950">
                    <strong className="block mb-1">हिंदी सारांश (Hindi Summary):</strong>
                    यदि आपका टोकन बन गया है और किसी कारणवश डॉक्टर उस दिन या शिफ्ट में उपलब्ध नहीं हैं, तो आपका टोकन <strong>अगली शिफ्ट या अगले कार्यदिवस में अपने आप मान्य (ट्रांसफर) हो जाएगा</strong>। लेकिन यदि आपने नंबर लगाया है और समय पर क्लिनिक न पहुँचने के कारण आपका नंबर निकल जाता है, तो <strong>कोई रिफंड नहीं होगा</strong>।
                  </div>
                </div>
              )}

              {/* 4. REFUND & CANCELLATION POLICY */}
              {activePolicyModal === 'REFUND' && (
                <div className="space-y-3.5">
                  <p>
                    Please review our cancellation and refund rules before making an online token booking on <strong>AarogyaToken</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-700">
                    <li>
                      <strong>Non-Refundable After Token Generation:</strong> Once the ₹20 platform fee is paid and a valid OPD Token Number is generated, the fee is <strong>non-refundable</strong> if the patient cancels, fails to visit the clinic, or misses their turn due to late arrival.
                    </li>
                    <li>
                      <strong>Doctor Absence Rescheduling:</strong> If the doctor is unavailable during the booked shift/day, the token automatically carries over to the next available shift/day instead of a cash refund.
                    </li>
                    <li>
                      <strong>Eligible Conditions for Full Refund:</strong> A 100% refund of the ₹20 platform fee will be processed only in the following cases:
                      <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>Amount was debited from your bank/UPI, but no token number was generated due to a technical failure.</li>
                        <li>Duplicate payment was charged twice for the same appointment.</li>
                        <li>The clinic/hospital permanently cancelled the OPD schedule and no next-day/next-shift slot is available.</li>
                      </ol>
                    </li>
                    <li>
                      <strong>Refund Processing Time:</strong> Approved refunds are credited back to the original payment method (UPI / Bank Account / Card) within <strong>5 to 7 working days</strong>.
                    </li>
                  </ul>

                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-950">
                    <strong className="block mb-1">हिंदी सारांश (Hindi Summary):</strong>
                    एक बार टोकन नंबर जनरेट हो जाने के बाद, क्लिनिक न जाने या देरी से पहुँचने पर नंबर निकल जाने की स्थिति में <strong>रिफंड नहीं मिलेगा</strong>। डॉक्टर के उपलब्ध न होने पर टोकन अगले दिन/शिफ्ट में मान्य होगा। रिफंड केवल तभी मिलेगा जब <strong>पैसे कटने के बाद टोकन न बना हो, दो बार पेमेंट कट गया हो, या क्लिनिक ने OPD स्थायी रूप से रद्द कर दी हो</strong> (5–7 कार्यदिवसों में खाते में वापसी)।
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}
