import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { calculatePlatformAnalytics } from '../../utils/queueLogic';
import { voiceBot } from '../../utils/voiceBot';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Key,
  Plus,
  Search,
  CheckCircle2,
  Stethoscope,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  PhoneCall,
  CreditCard,
  Settings,
  Sliders,
  Sparkles,
  Volume2,
  Save,
  Radio,
  AlertCircle,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const {
    doctors,
    patients,
    addNewDoctor,
    setCurrentView,
    setSelectedDoctorId,
    staffLogin,
    adminAuthenticated,
    adminTwoFactorVerified,
    adminLogin,
    adminVerify2FA,
    adminLogout,
    voiceBotSettings,
    updateVoiceBotSettings,
    razorpaySettings,
    updateRazorpaySettings,
  } = useClinic();

  // Admin Login Form States
  const [adminUsernameInput, setAdminUsernameInput] = useState('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState('admin123');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pinError, setPinError] = useState('');

  // Dashboard Sub-tabs
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'DOCTORS' | 'RAZORPAY' | 'CALL_AUTOMATION'>('OVERVIEW');

  // Modals & UI states
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [doctorSearch, setDoctorSearch] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Settings local edit states
  const [localVoiceSettings, setLocalVoiceSettings] = useState(voiceBotSettings);
  const [localRazorpaySettings, setLocalRazorpaySettings] = useState(razorpaySettings);

  // New Doctor Form with Razorpay settings
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    degree: 'MBBS, MD',
    specialty: '',
    clinicName: '',
    cabinNumber: 'Cabin 1',
    address: '',
    city: 'Kanpur, UP',
    phone: '',
    profilePic: '',
    clinicImages: ['', ''], // Do clinic images ke liye
    timings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
    consultationFee: 500,
    staffUsername: '',
    staffPassword: '',
    avgTimePerPatientMinutes: 10,
    // Razorpay per-doctor setting
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_new_doc',
    razorpayKeySecret: 'sec_new_doc_live',
    razorpayAccountType: 'PLATFORM_SPLIT' as 'DIRECT' | 'PLATFORM_SPLIT',
  });

{/* Clinic Image 2 Input */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-1">Clinic Image 2 URL</label>
  <input
    type="text"
    value={newDoctorForm.clinicImages[1]}
    onChange={(e) => {
      const updatedImages = [...newDoctorForm.clinicImages];
      updatedImages[1] = e.target.value;
      setNewDoctorForm({ ...newDoctorForm, clinicImages: updatedImages });
    }}
    placeholder="Clinic photo link 2"
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
  />
</div>

  // ==========================================
  // LAYER 1: ADMIN USERNAME & PASSWORD LOGIN
  // ==========================================
  if (!adminAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-950 p-8 shadow-2xl border border-slate-800 text-white">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
              <Shield className="h-8 w-8 stroke-[2.2]" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Layer 1 of 2 Security
            </div>
            <h2 className="mt-2 text-2xl font-black text-white tracking-tight">
              Super Admin Master Login
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Platform owner access to revenue, doctor pages & call automation
            </p>
          </div>

          {loginError && (
            <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = adminLogin(adminUsernameInput, adminPasswordInput);
              if (!res.success) {
                setLoginError(res.message);
              } else {
                setLoginError('');
              }
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Master Admin ID *
              </label>
              <input
                type="text"
                required
                value={adminUsernameInput}
                onChange={(e) => setAdminUsernameInput(e.target.value)}
                placeholder="e.g. admin"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Master Password *
              </label>
              <input
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
            >
              Verify Layer 1 Credentials &rarr;
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <span className="text-[11px] text-slate-500 block">Default Master Credentials:</span>
            <span className="font-mono text-xs text-amber-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 mt-1 inline-block">
              ID: admin • Pass: admin123
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LAYER 2: 2-FACTOR AUTHENTICATION (2FA PIN)
  // ==========================================
  if (!adminTwoFactorVerified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-950 p-8 shadow-2xl border border-slate-800 text-white">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10">
              <Lock className="h-8 w-8 stroke-[2.2]" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              Layer 1 Verified ✓ • Layer 2: 2FA PIN
            </div>
            <h2 className="mt-2 text-2xl font-black text-white tracking-tight">
              Two-Layer Security Check
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Enter your Master 2FA Security PIN to access the Founder Dashboard
            </p>
          </div>

          {pinError && (
            <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{pinError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = adminVerify2FA(adminPinInput);
              if (!res.success) {
                setPinError(res.message);
              } else {
                setPinError('');
              }
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 text-center">
                Enter 4-Digit Security PIN *
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                required
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="• • • •"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono rounded-xl border border-blue-500/50 bg-slate-900 px-3.5 py-3 text-white focus:border-blue-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition cursor-pointer"
            >
              Verify 2FA & Access Dashboard
            </button>

            <button
              type="button"
              onClick={adminLogout}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition py-1 cursor-pointer"
            >
              Cancel & Return to Login
            </button>
          </form>

          {/* Quick Demo PIN Chip */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <span className="text-[11px] text-slate-500 block">Default 2FA Security PIN:</span>
            <span className="font-mono text-xs text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 mt-1 inline-block">
              PIN: 7869 (ya 123456)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL SUPER ADMIN DASHBOARD (2FA VERIFIED)
  // ==========================================
  const analytics = calculatePlatformAnalytics(patients, doctors);

  const onlineTransactions = patients
    .filter((p) => p.bookingType === 'ONLINE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorForm.name.trim() || !newDoctorForm.clinicName.trim() || !newDoctorForm.staffUsername.trim()) {
      return;
    }

    addNewDoctor({
      ...newDoctorForm,
      profilePic: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    });

    setShowAddDoctorModal(false);
    setSaveSuccessMsg(`New Doctor Clinic "${newDoctorForm.name}" created successfully with Razorpay payment setting!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    setNewDoctorForm({
      name: '',
      degree: 'MBBS, MD',
      specialty: '',
      clinicName: '',
      cabinNumber: 'Cabin 1',
      address: '',
      city: 'Kanpur, UP',
      phone: '',
      timings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
      consultationFee: 500,
      staffUsername: '',
      staffPassword: '',
      avgTimePerPatientMinutes: 10,
      razorpayEnabled: true,
      razorpayKeyId: 'rzp_test_new_doc',
      razorpayKeySecret: 'sec_new_doc_live',
      razorpayAccountType: 'PLATFORM_SPLIT',
    });
  };

  const handleSaveRazorpaySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateRazorpaySettings(localRazorpaySettings);
    setSaveSuccessMsg('Razorpay API credentials & payment settings saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSaveVoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateVoiceBotSettings(localVoiceSettings);
    setSaveSuccessMsg('Automatic Call Bot settings & IVR script saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = doctorSearch.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.clinicName.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.staffUsername.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Founder Control Center • 2-Layer Security Active
              </span>
              <span className="text-xs text-slate-400">मेरा कंट्रोल डैशबोर्ड</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              SaaS Business & Doctor Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ₹20 revenue tracking, Razorpay payment gateway API, and automatic voice call configuration
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddDoctorModal(true)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Naya Doctor Clinic Banayein</span>
            </button>

            <button
              type="button"
              onClick={adminLogout}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800 transition cursor-pointer flex items-center gap-1.5"
              title="Lock Admin Session"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAdminTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              adminTab === 'OVERVIEW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Business Analytics (₹20 Revenue)</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('DOCTORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              adminTab === 'DOCTORS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-blue-400" />
            <span>Doctor Pages & Staff IDs ({doctors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('RAZORPAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              adminTab === 'RAZORPAY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
            <span>Razorpay API Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('CALL_AUTOMATION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              adminTab === 'CALL_AUTOMATION'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
            <span>Automatic Call Bot Settings</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* TAB 1: OVERVIEW & REVENUE ANALYTICS */}
        {adminTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Today's Revenue */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aaj Ki Kamai (Today&apos;s Revenue)
                  </span>
                  <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <DollarSign className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-4xl font-black text-emerald-600 tracking-tight mt-3 flex items-center">
                  <span>₹</span><span>{analytics.todayRevenue}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {analytics.todayOnlineBookings} online bookings today @ ₹20 each
                </p>
              </div>

              {/* 2. Total Lifetime Revenue */}
              <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Kul Kamai (Total SaaS Revenue)
                  </span>
                  <span className="rounded-full bg-slate-800 p-2 text-amber-400">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-4xl font-black text-amber-400 tracking-tight mt-3 flex items-center">
                  <span>₹</span><span>{analytics.totalRevenue}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {analytics.totalOnlineBookings} paid online bookings
                </p>
              </div>

              {/* 3. Total Patient Footfall */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kul Mareez (All Clinics)
                  </span>
                  <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight mt-3">
                  {analytics.totalOnlineBookings + analytics.totalWalkInPatients}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Online ({analytics.totalOnlineBookings}) + Walk-in ({analytics.totalWalkInPatients})
                </p>
              </div>

              {/* 4. Active Doctors */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Registered Doctors
                  </span>
                  <span className="rounded-full bg-purple-100 p-2 text-purple-700">
                    <Building className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-4xl font-black text-purple-700 tracking-tight mt-3">
                  {analytics.totalDoctors}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {analytics.activeDoctors} OPDs currently active & seeing patients
                </p>
              </div>
            </div>

            {/* REAL-TIME ONLINE TRANSACTIONS FEED (₹20 FEES LEDGER) */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span>Online Booking Payments Ledger (₹20 Platform Fee)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit log of online payments made by patients via Razorpay gateway
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {onlineTransactions.length} Total Online Transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">TXN ID (Razorpay)</th>
                      <th className="py-2.5 px-3 font-bold">Patient Name</th>
                      <th className="py-2.5 px-3 font-bold">Doctor / Clinic</th>
                      <th className="py-2.5 px-3 font-bold">Token #</th>
                      <th className="py-2.5 px-3 font-bold">Amount</th>
                      <th className="py-2.5 px-3 font-bold">Date & Time</th>
                      <th className="py-2.5 px-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {onlineTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                          {tx.paymentId || 'pay_rzp_offline'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{tx.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {doctors.find((d) => d.id === tx.doctorId)?.name || 'Unknown'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{tx.tokenNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">+₹20.00</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                            PAID ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR CLINICS & STAFF CREDENTIALS */}
        {adminTab === 'DOCTORS' && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Doctor Clinics & Staff Credentials Directory</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage doctor pages, staff ID/password credentials, and Razorpay API links
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Doctor ya clinic dhoondhein..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Doctor & Clinic</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Staff ID & Password</th>
                    <th className="py-3 px-4 font-bold">Razorpay API</th>
                    <th className="py-3 px-4 font-bold">Patients Seen</th>
                    <th className="py-3 px-4 font-bold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map((doc) => {
                    const docPatients = patients.filter((p) => p.doctorId === doc.id);
                    const completed = docPatients.filter((p) => p.status === 'COMPLETED').length;
                    const isPassVisible = showPasswords[doc.id] || false;

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={doc.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
                              alt={doc.name}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                              <div className="text-slate-500 text-[11px]">{doc.clinicName} ({doc.cabinNumber})</div>
                              <div className="text-blue-600 text-[10px]">{doc.specialty} • {doc.city}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              doc.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'LUNCH'
                                ? 'bg-amber-100 text-amber-800'
                                : doc.status === 'SURGERY'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {doc.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1 font-mono text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-sans text-[10px]">ID:</span>
                              <span className="font-bold text-slate-800">{doc.staffUsername}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(doc.staffUsername, `user-${doc.id}`)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy username"
                              >
                                {copiedKey === `user-${doc.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-1">
                              <span className="text-slate-500 font-sans text-[10px]">Pass:</span>
                              <span className="font-bold text-slate-800">
                                {isPassVisible ? doc.staffPassword : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, [doc.id]: !isPassVisible })}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Toggle password view"
                              >
                                {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5 font-mono text-[10px] font-bold border border-blue-200">
                              <CreditCard className="h-3 w-3" />
                              {doc.razorpayKeyId || 'rzp_test_live'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {doc.razorpayAccountType || 'PLATFORM_SPLIT'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{completed} seen</div>
                          <div className="text-[10px] text-slate-500">
                            {docPatients.length} total registered
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                staffLogin(doc.staffUsername, doc.staffPassword);
                                setCurrentView('STAFF');
                              }}
                              className="rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                            >
                              Staff Desk
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctorId(doc.id);
                                setCurrentView('PUBLIC');
                              }}
                              className="rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                            >
                              Public Page
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RAZORPAY PAYMENT GATEWAY SETTINGS */}
        {adminTab === 'RAZORPAY' && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Razorpay API & Payment Gateway Configuration</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Connect your official Razorpay API credentials to accept ₹20 online token payments from patients
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Razorpay Gateway Active</span>
              </span>
            </div>

            <form onSubmit={handleSaveRazorpaySettings} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Environment Mode
                  </label>
                  <select
                    value={localRazorpaySettings.mode}
                    onChange={(e) =>
                      setLocalRazorpaySettings({ ...localRazorpaySettings, mode: e.target.value as 'test' | 'live' })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="test">Test / Sandbox Mode (Recommended for demo)</option>
                    <option value="live">Live Production Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Merchant Business Name
                  </label>
                  <input
                    type="text"
                    value={localRazorpaySettings.merchantName}
                    onChange={(e) =>
                      setLocalRazorpaySettings({ ...localRazorpaySettings, merchantName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Razorpay Key ID (Key_ID) *
                </label>
                <input
                  type="text"
                  required
                  value={localRazorpaySettings.keyId}
                  onChange={(e) =>
                    setLocalRazorpaySettings({ ...localRazorpaySettings, keyId: e.target.value })
                  }
                  placeholder="rzp_test_..."
                  className="w-full rounded-xl border border-slate-300 font-mono px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Available from your Razorpay Dashboard &rarr; Settings &rarr; API Keys</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Razorpay Key Secret (Key_Secret) *
                </label>
                <input
                  type="password"
                  required
                  value={localRazorpaySettings.keySecret}
                  onChange={(e) =>
                    setLocalRazorpaySettings({ ...localRazorpaySettings, keySecret: e.target.value })
                  }
                  placeholder="••••••••••••••••••••"
                  className="w-full rounded-xl border border-slate-300 font-mono px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Platform Webhook URL (For auto payment status callback)
                </label>
                <input
                  type="text"
                  readOnly
                  value="https://api.aarogyatoken.com/api/webhooks/razorpay"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 font-mono px-3 py-2 text-xs text-slate-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Razorpay API Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: AUTOMATIC CALL BOT SETTINGS */}
        {adminTab === 'CALL_AUTOMATION' && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-emerald-600" />
                  <span>Automatic Call Bot Settings (कॉल ऑटोमेशन सेटिंग)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure automated telephony call alerts dispatched when an online patient&apos;s turn is near
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">Auto Bot Call Active</span>
                <input
                  type="checkbox"
                  checked={localVoiceSettings.enabled}
                  onChange={(e) =>
                    setLocalVoiceSettings({ ...localVoiceSettings, enabled: e.target.checked })
                  }
                  className="h-5 w-5 text-emerald-600 rounded"
                />
              </label>
            </div>

            <form onSubmit={handleSaveVoiceSettings} className="space-y-6 max-w-2xl">
              {/* Trigger Threshold: 3-4 Patients Ahead */}
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-2">
                <label className="block text-xs font-bold uppercase text-amber-900">
                  Turn Alert Timing: Kitne Mareez Pehle Call Jaye? *
                </label>
                <div className="flex items-center gap-3">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLocalVoiceSettings({ ...localVoiceSettings, triggerThreshold: num })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        localVoiceSettings.triggerThreshold === num
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {num} Mareez Pehle {num === 4 ? '(Recommended)' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-amber-800">
                  System queue aage badhte hi {localVoiceSettings.triggerThreshold} mareez bachte hi mareez ko automatic bot call bhejega.
                </p>
              </div>

              {/* Telephony Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Telephony / Voice Bot Provider
                  </label>
                  <select
                    value={localVoiceSettings.telephonyProvider}
                    onChange={(e) =>
                      setLocalVoiceSettings({
                        ...localVoiceSettings,
                        telephonyProvider: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="IN_APP_VOICE">In-App Voice Bot (AI Hindi Speech + Simulator)</option>
                    <option value="EXOTEL">Exotel Cloud Telephony</option>
                    <option value="TWILIO">Twilio Voice API</option>
                    <option value="SARV">Sarv Voice Solutions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Caller ID / Outbound Phone *
                  </label>
                  <input
                    type="text"
                    value={localVoiceSettings.callerId || ''}
                    onChange={(e) =>
                      setLocalVoiceSettings({ ...localVoiceSettings, callerId: e.target.value })
                    }
                    placeholder="+91 80 4719 3200"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* IVR Voice Announcement Message Script Template */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Automated Voice Call Script (IVR Text-to-Speech Template)
                </label>
                <textarea
                  rows={4}
                  value={localVoiceSettings.messageTemplate}
                  onChange={(e) =>
                    setLocalVoiceSettings({ ...localVoiceSettings, messageTemplate: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none font-sans"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                  <span>Available Variables:</span>
                  <span className="font-mono bg-slate-200 px-1 rounded text-slate-700">{'{patient_name}'}</span>
                  <span className="font-mono bg-slate-200 px-1 rounded text-slate-700">{'{doctor_name}'}</span>
                  <span className="font-mono bg-slate-200 px-1 rounded text-slate-700">{'{token_number}'}</span>
                  <span className="font-mono bg-slate-200 px-1 rounded text-slate-700">{'{patients_ahead}'}</span>
                </div>
              </div>

              {/* Auto Retry on Unanswered */}
              <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Auto Retry If Call Busy / Unanswered
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically redial up to 2 times after 3 minutes if patient does not pick up
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localVoiceSettings.autoRetryFailed}
                  onChange={(e) =>
                    setLocalVoiceSettings({ ...localVoiceSettings, autoRetryFailed: e.target.checked })
                  }
                  className="h-5 w-5 text-blue-600 rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Call Automation Settings</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await voiceBot.playPhoneRing(1500);
                    await voiceBot.speakAlert({
                      patientName: 'Ramesh Kumar',
                      doctorName: 'Dr. Rajesh Sharma',
                      tokenNumber: 8,
                      patientsAhead: localVoiceSettings.triggerThreshold,
                    });
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Volume2 className="h-4 w-4 text-blue-600" />
                  <span>Test Voice Call Announcement Now</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* CREATE NEW DOCTOR / CLINIC MODAL (WITH RAZORPAY SETTING) */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Platform Setup
                </span>
                <h3 className="text-base font-bold mt-1">Add New Doctor & Payment Configuration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="text-white hover:opacity-75 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const cleanSlug = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
                      setNewDoctorForm({
                        ...newDoctorForm,
                        name,
                        staffUsername: `staff_${cleanSlug}`,
                        staffPassword: `doc${Math.floor(100 + Math.random() * 900)}`,
                        razorpayKeyId: `rzp_test_${cleanSlug}_${Math.floor(1000 + Math.random() * 9000)}`,
                      });
                    }}
                    placeholder="e.g. Dr. Alok Nath"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Degree / Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.degree}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, degree: e.target.value })}
                    placeholder="e.g. MBBS, MD (Medicine)"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialty / Dept *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.specialty}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, specialty: e.target.value })}
                    placeholder="e.g. Cardiologist & Heart Specialist"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cabin Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.cabinNumber}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, cabinNumber: e.target.value })}
                    placeholder="e.g. Cabin No. 3"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinic / Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorForm.clinicName}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, clinicName: e.target.value })}
                  placeholder="e.g. Sanjeevani Heart & Medical Center"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinic Address & City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.address}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, address: e.target.value })}
                    placeholder="e.g. Station Road, Civil Lines"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="tel"
                    value={newDoctorForm.phone}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* STAFF LOGIN CREDENTIALS SECTION */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Staff Login Credentials (स्टाफ़ को देने के लिए आईडी और पासवर्ड)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Staff Username / ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoctorForm.staffUsername}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, staffUsername: e.target.value })}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Staff Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoctorForm.staffPassword}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, staffPassword: e.target.value })}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* RAZORPAY PAYMENT SETTING SECTION FOR DOCTOR (AS REQUESTED) */}
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Razorpay Payment Setting for this Doctor (रेज़रपे पेमेंट सेटिंग)</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-blue-800 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDoctorForm.razorpayEnabled}
                      onChange={(e) =>
                        setNewDoctorForm({ ...newDoctorForm, razorpayEnabled: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Doctor Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={newDoctorForm.razorpayKeyId}
                      onChange={(e) =>
                        setNewDoctorForm({ ...newDoctorForm, razorpayKeyId: e.target.value })
                      }
                      className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Settlement Routing
                    </label>
                    <select
                      value={newDoctorForm.razorpayAccountType}
                      onChange={(e) =>
                        setNewDoctorForm({
                          ...newDoctorForm,
                          razorpayAccountType: e.target.value as 'DIRECT' | 'PLATFORM_SPLIT',
                        })
                      }
                      className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="PLATFORM_SPLIT">Platform Split (₹20 SaaS Fee to Admin)</option>
                      <option value="DIRECT">Direct Platform Account</option>
                    </select>
                  </div>
                </div>

{/* ========================================== */}
{/* SAFE DEVICE UPLOAD WITH COMPRESSION & STATUS */}
{/* ========================================== */}
<div className="space-y-4 pt-2 border-t border-slate-200">
  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Doctor & Clinic Photos (Device Upload)</h4>

  {/* Doctor Profile Photo */}
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">
      Doctor Profile Photo (DP) *
    </label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setNewDoctorForm(prev => ({ ...prev, profilePic: compressedBase64 }));
          };
        };
        reader.readAsDataURL(file);
      }}
      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
    />
    {newDoctorForm.profilePic && (
      <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Doctor DP loaded successfully</p>
    )}
  </div>

  {/* Clinic Images (1 & 2 Side-by-Side) */}
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        Clinic Image 1
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              setNewDoctorForm(prev => {
                const imgs = [...(prev.clinicImages || ['', ''])];
                imgs[0] = compressedBase64;
                return { ...prev, clinicImages: imgs };
              });
            };
          };
          reader.readAsDataURL(file);
        }}
        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
      />
      {newDoctorForm.clinicImages?.[0] && (
        <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Clinic Img 1 ready</p>
      )}
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        Clinic Image 2
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              setNewDoctorForm(prev => {
                const imgs = [...(prev.clinicImages || ['', ''])];
                imgs[1] = compressedBase64;
                return { ...prev, clinicImages: imgs };
              });
            };
          };
          reader.readAsDataURL(file);
        }}
        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
      />
      {newDoctorForm.clinicImages?.[1] && (
        <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Clinic Img 2 ready</p>
      )}
    </div>
  </div>

  <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinic Image 2
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                      if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                      }
                    } else {
                      if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                      }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setNewDoctorForm(prev => {
                      const imgs = [...(prev.clinicImages || ['', ''])];
                      imgs[1] = compressedBase64;
                      return { ...prev, clinicImages: imgs };
                    });
                  };
                };
                reader.readAsDataURL(file);
              }}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {newDoctorForm.clinicImages?.[1] && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Clinic Img 2 ready</p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinic Image 2
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                      if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                      }
                    } else {
                      if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                      }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setNewDoctorForm(prev => {
                      const imgs = [...(prev.clinicImages || ['', ''])];
                      imgs[1] = compressedBase64;
                      return { ...prev, clinicImages: imgs };
                    });
                  };
                };
                reader.readAsDataURL(file);
              }}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {newDoctorForm.clinicImages?.[1] && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Clinic Img 2 ready</p>
            )}
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddDoctorModal(false)}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500"
          >
            Create & Launch Clinic
          </button>
        </div>
      </form>
    </div>
  </div>
)}
