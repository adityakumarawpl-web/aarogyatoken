import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { calculatePlatformAnalytics } from '../../utils/queueLogic';
import { voiceBot } from '../../utils/voiceBot';
import { getAutoTagSuggestions } from '../../utils/tagEngine';
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
  Tag,
  X,
  ChevronDown,
  ChevronUp,
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

  // Hierarchy Accordion States (Folder-View)
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] = useState<string | null>(null);

  // Settings local edit states
  const [localVoiceSettings, setLocalVoiceSettings] = useState(voiceBotSettings);
  const [localRazorpaySettings, setLocalRazorpaySettings] = useState(razorpaySettings);

  // Custom Tag Input State
  const [customTagInput, setCustomTagInput] = useState('');

  // New Doctor Form State (Separate address and city)
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    degree: '',
    specialty: '',
    clinicName: '',
    cabinNumber: '',
    address: '',
    city: '',
    phone: '',
    profilePic: '',
    clinicImages: ['', ''],
    tags: [] as string[],
    timings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
    morningShift: '10:00 AM - 02:00 PM',
    eveningShift: '05:00 PM - 08:00 PM',
    consultationFee: 20,
    staffUsername: '',
    staffPassword: '',
    avgTimePerPatientMinutes: 10,
  });

  // Type: Clinic ya Hospital
  const [establishmentType, setEstablishmentType] = useState<'CLINIC' | 'HOSPITAL'>('CLINIC');

  // Hospital ke liye multiple doctors ki list
  const [hospitalDoctors, setHospitalDoctors] = useState<Array<{
    name: string;
    degree: string;
    specialty: string;
    cabinNumber: string;
    profilePic: string;
    morningShift: string;
    eveningShift: string;
  }>>([
    {
      name: '',
      degree: '',
      specialty: '',
      cabinNumber: 'Cabin 1',
      profilePic: '',
      morningShift: '10:00 AM - 02:00 PM',
      eveningShift: '05:00 PM - 08:00 PM',
    },
  ]);

  // SMART USERNAME AUTO-GENERATOR
  useEffect(() => {
    const cleanCity = newDoctorForm.city
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    const cleanClinic = newDoctorForm.clinicName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (establishmentType === 'CLINIC') {
      const cleanDoc = newDoctorForm.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const parts = [cleanDoc, cleanClinic, cleanCity].filter(Boolean);
      const generated = parts.join('_');
      if (generated) {
        setNewDoctorForm((prev) => ({ ...prev, staffUsername: generated }));
      }
    } else {
      const parts = [cleanClinic, cleanCity].filter(Boolean);
      const generated = parts.join('_');
      if (generated) {
        setNewDoctorForm((prev) => ({ ...prev, staffUsername: generated }));
      }
    }
  }, [
    establishmentType,
    newDoctorForm.name,
    newDoctorForm.clinicName,
    newDoctorForm.city,
  ]);

  // Unique Username Check Helper
  const isUsernameTaken = (username: string): boolean => {
    if (!username.trim()) return false;
    const clean = username.trim().toLowerCase();
    return doctors.some((doc) => doc.staffUsername?.trim().toLowerCase() === clean);
  };

  const isCurrentUsernameTaken = isUsernameTaken(newDoctorForm.staffUsername);

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
              Verify Layer 1 Credentials →
            </button>
          </form>

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

    if (!newDoctorForm.clinicName.trim()) {
      alert('Kripya Clinic / Hospital ka Naam bharein!');
      return;
    }
    if (!newDoctorForm.city.trim()) {
      alert('Kripya City (Shahar) bharein!');
      return;
    }
    if (!newDoctorForm.staffUsername.trim()) {
      alert('Kripya Reception / Staff ID bharein!');
      return;
    }

    // UNIQUE USERNAME VALIDATION GUARD
    const cleanStaffUser = newDoctorForm.staffUsername.trim().toLowerCase();
    const duplicateExists = doctors.some(
      (doc) => doc.staffUsername?.trim().toLowerCase() === cleanStaffUser
    );

    if (duplicateExists) {
      alert(`Staff ID "${newDoctorForm.staffUsername}" pehle se kisi dusre clinic/hospital ke dwara li ja chuki hai!\n\nKripya koi alag unique username chunein.`);
      return;
    }

    const defaultPic = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300';
    
    // 🔹 AUTOMATIC IN-BUILT RAZORPAY CONFIGURATION FROM CENTRAL VERCEL ENV
    const autoRazorpayData = {
      razorpayEnabled: true,
      razorpayKeyId: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '',
      razorpayAccountType: 'PLATFORM_SPLIT' as 'DIRECT' | 'PLATFORM_SPLIT',
    };

    const formattedPublicAddress = newDoctorForm.address.trim()
      ? `${newDoctorForm.address.trim()}, ${newDoctorForm.city.trim()}`
      : newDoctorForm.city.trim();

    if (establishmentType === 'CLINIC') {
      if (!newDoctorForm.name.trim()) {
        alert('Kripya Doctor ka Naam bharein!');
        return;
      }

      const picToSave = newDoctorForm.profilePic?.trim() ? newDoctorForm.profilePic.trim() : defaultPic;
      const clinicBaseId = newDoctorForm.staffUsername.trim();

      addNewDoctor({
        ...newDoctorForm,
        ...autoRazorpayData,
        establishmentType: 'CLINIC',
        hospitalId: clinicBaseId,
        address: formattedPublicAddress,
        city: newDoctorForm.city.trim(),
        cabinNumber: 'Chamber',
        tags: newDoctorForm.tags || [],
        profilePic: picToSave,
        clinicImages: newDoctorForm.clinicImages || ['', ''],
        morningShift: newDoctorForm.morningShift || '10:00 AM - 02:00 PM',
        eveningShift: newDoctorForm.eveningShift || '05:00 PM - 08:00 PM',
      });
      setSaveSuccessMsg(`Clinic "${newDoctorForm.clinicName}" created successfully with in-built Razorpay!`);
    } else {
      const validDoctors = hospitalDoctors.filter((doc) => doc.name.trim());
      if (validDoctors.length === 0) {
        alert('Kripya kam se kam ek Doctor ka naam add karein!');
        return;
      }

      const hospitalBaseId = newDoctorForm.staffUsername.trim();

      validDoctors.forEach((doc, idx) => {
        addNewDoctor({
          ...newDoctorForm,
          ...autoRazorpayData,
          establishmentType: 'HOSPITAL',
          hospitalId: hospitalBaseId,
          address: formattedPublicAddress,
          city: newDoctorForm.city.trim(),
          name: doc.name.trim(),
          degree: doc.degree.trim(),
          specialty: doc.specialty.trim(),
          cabinNumber: doc.cabinNumber.trim() || `Cabin ${idx + 1}`,
          tags: newDoctorForm.tags || [],
          morningShift: doc.morningShift || newDoctorForm.morningShift || '10:00 AM - 02:00 PM',
          eveningShift: doc.eveningShift || newDoctorForm.eveningShift || '05:00 PM - 08:00 PM',
          staffUsername: hospitalBaseId,
          staffPassword: newDoctorForm.staffPassword.trim() || 'hospital123',
          profilePic: doc.profilePic?.trim() ? doc.profilePic.trim() : defaultPic,
          clinicImages: newDoctorForm.clinicImages || ['', ''],
        });
      });
      setSaveSuccessMsg(`Hospital "${newDoctorForm.clinicName}" with ${validDoctors.length} doctors onboarded!`);
    }

    setShowAddDoctorModal(false);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    setHospitalDoctors([
      {
        name: '',
        degree: '',
        specialty: '',
        cabinNumber: 'Cabin 1',
        profilePic: '',
        morningShift: '10:00 AM - 02:00 PM',
        eveningShift: '05:00 PM - 08:00 PM',
      },
    ]);

    setNewDoctorForm({
      name: '',
      degree: '',
      specialty: '',
      clinicName: '',
      cabinNumber: '',
      address: '',
      city: '',
      phone: '',
      profilePic: '',
      clinicImages: ['', ''],
      tags: [],
      timings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
      morningShift: '10:00 AM - 02:00 PM',
      eveningShift: '05:00 PM - 08:00 PM',
      consultationFee: 20,
      staffUsername: '',
      staffPassword: '',
      avgTimePerPatientMinutes: 10,
    });
  };

  const handleSaveRazorpaySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateRazorpaySettings(localRazorpaySettings);
    setSaveSuccessMsg('Razorpay settings saved! (Public checkout will strictly use Vercel Key)');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSaveVoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateVoiceBotSettings(localVoiceSettings);
    setSaveSuccessMsg('Automatic Call Bot settings & IVR script saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Group Doctors by Hospital / Clinic ID
  const hospitalGroups = Array.from(
    new Set(doctors.map((d) => d.hospitalId || d.clinicName))
  ).map((groupKey) => {
    const groupDocs = doctors.filter(
      (d) => (d.hospitalId || d.clinicName) === groupKey
    );
    return {
      groupKey,
      firstDoc: groupDocs[0],
      doctors: groupDocs,
    };
  }).filter((group) => {
    if (!doctorSearch.trim()) return true;
    const q = doctorSearch.toLowerCase();
    return (
      group.firstDoc?.clinicName.toLowerCase().includes(q) ||
      group.firstDoc?.city.toLowerCase().includes(q) ||
      group.firstDoc?.staffUsername.toLowerCase().includes(q) ||
      group.doctors.some((d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q))
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
            <span>Hospitals & Doctor Directory ({hospitalGroups.length} Establishments)</span>
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
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aaj Ki Kamai (Today's Revenue)
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

            {/* REAL-TIME ONLINE TRANSACTIONS FEED */}
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

        {/* TAB 2: HIERARCHICAL FOLDER VIEW */}
        {adminTab === 'DOCTORS' && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Hospital & Doctor Directory (Organized Hierarchy)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Hospital par click karke doctors list dekhein, aur doctor par click karke unke patients ki live queue dekhein
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Hospital, doctor ya shahar dhoondhein..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {hospitalGroups.length === 0 ? (
              <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-slate-500 text-sm">
                Koi Hospital ya Clinic nahi mila.
              </div>
            ) : (
              hospitalGroups.map(({ groupKey, firstDoc, doctors: groupDocs }) => {
                const isExpanded = expandedHospital === groupKey;
                const totalHospPatients = patients.filter((p) =>
                  groupDocs.some((d) => d.id === p.doctorId)
                );
                const isHospital = groupDocs.length > 1 || firstDoc?.establishmentType === 'HOSPITAL';

                return (
                  <div
                    key={groupKey}
                    className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedHospital(isExpanded ? null : groupKey)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition select-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                          isHospital
                            ? 'bg-blue-50 border border-blue-200 text-blue-600'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                        }`}>
                          {isHospital ? '🏥' : '🩺'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-900 text-base">
                              {firstDoc?.clinicName}
                            </h4>
                            <span className={`rounded-full text-[10px] font-bold px-2.5 py-0.5 border ${
                              isHospital
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isHospital ? `Hospital (${groupDocs.length} Doctors / Cabins)` : 'Private Clinic'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>ID: <strong className="font-mono text-slate-700">{firstDoc?.staffUsername}</strong></span>
                            <span>•</span>
                            <span>{firstDoc?.city}</span>
                            <span>•</span>
                            <span>{firstDoc?.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {totalHospPatients.length} Total Patients
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span>{isExpanded ? 'Hide Cabins' : 'View Cabins'}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
                          <span>Cabins & Doctors in this Facility ({groupDocs.length})</span>
                          <span>Staff Login: {firstDoc?.staffUsername} / {firstDoc?.staffPassword}</span>
                        </div>

                        {groupDocs.map((doc) => {
                          const docPatients = patients.filter((p) => p.doctorId === doc.id);
                          const isViewingPatients = selectedDoctorForPatients === doc.id;
                          const completed = docPatients.filter((p) => p.status === 'COMPLETED').length;

                          return (
                            <div
                              key={doc.id}
                              className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs space-y-3"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={doc.profilePic || ''}
                                    alt={doc.name}
                                    className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                      <span>{doc.name}</span>
                                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                                        {doc.cabinNumber}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-bold ${
                                          doc.status === 'AVAILABLE'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        ● {doc.status}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      {doc.specialty} • {doc.degree} • Shift: {doc.morningShift} & {doc.eveningShift}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedDoctorForPatients(isViewingPatients ? null : doc.id)
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                                      isViewingPatients
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    <Users className="h-3.5 w-3.5 text-blue-500" />
                                    <span>{docPatients.length} Patients ({completed} Seen)</span>
                                    {isViewingPatients ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      staffLogin(doc.staffUsername, doc.staffPassword);
                                      setCurrentView('STAFF');
                                    }}
                                    className="rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                                  >
                                    Staff Desk
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDoctorId(doc.id);
                                      setCurrentView('PUBLIC');
                                    }}
                                    className="rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                                  >
                                    Public Page
                                  </button>
                                </div>
                              </div>

                              {isViewingPatients && (
                                <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
                                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                                    <span>Mareezon ki List ({doc.name} - {doc.cabinNumber}):</span>
                                    <span className="text-[11px] text-slate-500">Live Queue Status</span>
                                  </div>

                                  {docPatients.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                                      Abhi is cabin/doctor ke paas koi registered patient nahi hai.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-xs bg-slate-50/50 rounded-xl overflow-hidden">
                                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                        <tr>
                                          <th className="py-2.5 px-3 font-bold">Token #</th>
                                          <th className="py-2.5 px-3 font-bold">Patient Name</th>
                                          <th className="py-2.5 px-3 font-bold">Mobile</th>
                                          <th className="py-2.5 px-3 font-bold">Booking Type</th>
                                          <th className="py-2.5 px-3 font-bold">Payment</th>
                                          <th className="py-2.5 px-3 font-bold text-right">Queue Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {docPatients.map((p) => (
                                          <tr key={p.id} className="hover:bg-white transition">
                                            <td className="py-2 px-3 font-mono font-bold text-blue-600">
                                              #{p.tokenNumber}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-slate-800">{p.name}</td>
                                            <td className="py-2 px-3 text-slate-600">{p.mobile || 'N/A'}</td>
                                            <td className="py-2 px-3">
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                                {p.bookingType}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3">
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                p.paymentStatus === 'PAID'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-slate-200 text-slate-700'
                                              }`}>
                                                {p.paymentStatus}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <span
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                  p.status === 'COMPLETED'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : p.status === 'IN_CABIN'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}
                                              >
                                                {p.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: RAZORPAY PAYMENT GATEWAY SETTINGS */}
        {adminTab === 'RAZORPAY' && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Razorpay API & Payment Gateway Configuration</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Global checkout uses central environment credentials (VITE_RAZORPAY_KEY_ID)
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Central Vercel Key Active</span>
              </span>
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                ℹ️ Platform Central Key Note:
              </span>
              <p>
                Aapke sabhi doctors aur clinics par ₹20 ka online booking payment direct central Vercel key (<code>VITE_RAZORPAY_KEY_ID</code>) ke through aapke main account me jama hoga. Naye doctor banate waqt alag se Razorpay key bharne ki zaroorat nahi hai.
              </p>
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
                    <option value="test">Test / Sandbox Mode</option>
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
                  Razorpay Key ID (Fallback Key)
                </label>
                <input
                  type="text"
                  value={localRazorpaySettings.keyId}
                  onChange={(e) =>
                    setLocalRazorpaySettings({ ...localRazorpaySettings, keyId: e.target.value })
                  }
                  placeholder="rzp_test_..."
                  className="w-full rounded-xl border border-slate-300 font-mono px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Razorpay Key Secret (Fallback Secret)
                </label>
                <input
                  type="password"
                  value={localRazorpaySettings.keySecret}
                  onChange={(e) =>
                    setLocalRazorpaySettings({ ...localRazorpaySettings, keySecret: e.target.value })
                  }
                  placeholder="••••••••••••••••••••"
                  className="w-full rounded-xl border border-slate-300 font-mono px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
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
                  Configure automated telephony call alerts dispatched when an online patient's turn is near
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

      {/* CREATE NEW DOCTOR / CLINIC / HOSPITAL MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Platform Setup
                </span>
                <h3 className="text-base font-bold mt-1">Add New Doctor / Hospital</h3>
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
              {/* 1. Establishment Type Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Establishment Type *
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      establishmentType === 'CLINIC'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="establishmentType"
                      value="CLINIC"
                      checked={establishmentType === 'CLINIC'}
                      onChange={() => setEstablishmentType('CLINIC')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm block leading-none">Private Clinic</span>
                      <span className="text-[10px] text-slate-500 font-normal">Single doctor practice</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      establishmentType === 'HOSPITAL'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="establishmentType"
                      value="HOSPITAL"
                      checked={establishmentType === 'HOSPITAL'}
                      onChange={() => setEstablishmentType('HOSPITAL')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm block leading-none">Hospital</span>
                      <span className="text-[10px] text-slate-500 font-normal">Multi-doctor & 1 Common Reception ID</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Common Establishment Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {establishmentType === 'CLINIC' ? 'Clinic Name *' : 'Hospital Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.clinicName}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, clinicName: e.target.value })}
                    placeholder={establishmentType === 'CLINIC' ? 'e.g. Rai Clinic' : 'e.g. Aditya Hospital'}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Address (Gali / Mohalla / Landmark) *</label>
                    <input
                      type="text"
                      required
                      value={newDoctorForm.address}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, address: e.target.value })}
                      placeholder="e.g. Rewa Road, Near Old Bus Stand"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City (Shahar) *</label>
                    <input
                      type="text"
                      required
                      value={newDoctorForm.city}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, city: e.target.value })}
                      placeholder="e.g. Shahdol"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Helpline *</label>
                  <input
                    type="tel"
                    required
                    value={newDoctorForm.phone}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Common Staff / Receptionist Login Credentials */}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 space-y-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                    {establishmentType === 'CLINIC' ? 'Staff Login Credentials' : 'Hospital Reception Common Login (एक ही लॉगिन आईडी/पासवर्ड)'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Receptionist / Staff ID * (Auto Generated)
                        </label>
                        {newDoctorForm.staffUsername.trim() && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isCurrentUsernameTaken
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {isCurrentUsernameTaken ? '❌ Already Taken' : '✓ Available'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={newDoctorForm.staffUsername}
                        onChange={(e) => {
                          const cleanVal = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setNewDoctorForm({ ...newDoctorForm, staffUsername: cleanVal });
                        }}
                        placeholder="e.g. dr_ramesh_rai_rai_clinic_shahdol"
                        className={`w-full rounded-xl border px-3 py-1.5 font-mono text-xs font-bold focus:outline-none ${
                          isCurrentUsernameTaken
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-600'
                            : 'border-amber-300 bg-white text-slate-800'
                        }`}
                      />
                      {isCurrentUsernameTaken && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          Yeh Staff ID pehle se li ja chuki hai. Kripya naya number ya naam jodein.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDoctorForm.staffPassword}
                        onChange={(e) => setNewDoctorForm({ ...newDoctorForm, staffPassword: e.target.value })}
                        placeholder="e.g. amrita123"
                        className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-mono text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3A. SINGLE CLINIC DOCTOR SECTION */}
              {establishmentType === 'CLINIC' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Doctor Profile Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newDoctorForm.name}
                        onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                        placeholder="e.g. Dr. Ramesh Rai"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                      <input
                        type="text"
                        required
                        value={newDoctorForm.degree}
                        onChange={(e) => setNewDoctorForm({ ...newDoctorForm, degree: e.target.value })}
                        placeholder="e.g. MBBS, MD (Medicine)"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specialty / Department *</label>
                    <input
                      type="text"
                      required
                      value={newDoctorForm.specialty}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, specialty: e.target.value })}
                      placeholder="e.g. Cardiologist & Heart Specialist"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Doctor DP / Profile Picture URL</label>
                    <input
                      type="text"
                      value={newDoctorForm.profilePic}
                      onChange={(e) => setNewDoctorForm({ ...newDoctorForm, profilePic: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Morning Shift</label>
                      <input
                        type="text"
                        value={newDoctorForm.morningShift}
                        onChange={(e) => setNewDoctorForm({ ...newDoctorForm, morningShift: e.target.value })}
                        placeholder="10:00 AM - 02:00 PM"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Evening Shift</label>
                      <input
                        type="text"
                        value={newDoctorForm.eveningShift}
                        onChange={(e) => setNewDoctorForm({ ...newDoctorForm, eveningShift: e.target.value })}
                        placeholder="05:00 PM - 08:00 PM"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3B. MULTI-DOCTOR HOSPITAL SECTION */}
              {establishmentType === 'HOSPITAL' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                        Hospital Doctors & Cabins ({hospitalDoctors.length})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Har doctor ke liye cabin aur unki apni profile photo set karein
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setHospitalDoctors((prev) => [
                          ...prev,
                          {
                            name: '',
                            degree: '',
                            specialty: '',
                            cabinNumber: `Cabin ${prev.length + 1}`,
                            profilePic: '',
                            morningShift: '10:00 AM - 02:00 PM',
                            eveningShift: '05:00 PM - 08:00 PM',
                          },
                        ])
                      }
                      className="rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-blue-700 transition cursor-pointer"
                    >
                      + Add Another Doctor
                    </button>
                  </div>

                  {hospitalDoctors.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 relative shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md">
                          Doctor #{idx + 1}
                        </span>
                        {hospitalDoctors.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setHospitalDoctors(hospitalDoctors.filter((_, i) => i !== idx))
                            }
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Doctor Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.name}
                            onChange={(e) => {
                              const updated = [...hospitalDoctors];
                              updated[idx].name = e.target.value;
                              setHospitalDoctors(updated);
                            }}
                            placeholder="e.g. Dr. Vinamra Jain"
                            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Cabin Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.cabinNumber}
                            onChange={(e) => {
                              const updated = [...hospitalDoctors];
                              updated[idx].cabinNumber = e.target.value;
                              setHospitalDoctors(updated);
                            }}
                            placeholder="e.g. Cabin 1"
                            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Degree / Qualification *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.degree}
                            onChange={(e) => {
                              const updated = [...hospitalDoctors];
                              updated[idx].degree = e.target.value;
                              setHospitalDoctors(updated);
                            }}
                            placeholder="e.g. MBBS, MS (General Surgery)"
                            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Specialty / Department *
                          </label>
                          <input
                            type="text"
                            required
                            value={doc.specialty}
                            onChange={(e) => {
                              const updated = [...hospitalDoctors];
                              updated[idx].specialty = e.target.value;
                              setHospitalDoctors(updated);
                            }}
                            placeholder="e.g. Laparoscopic Surgeon"
                            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Doctor Profile Photo (DP URL)
                        </label>
                        <input
                          type="text"
                          value={doc.profilePic}
                          onChange={(e) => {
                            const updated = [...hospitalDoctors];
                            updated[idx].profilePic = e.target.value;
                            setHospitalDoctors(updated);
                          }}
                          placeholder="Doctor ki photo ka direct image URL paste karein"
                          className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SMART AUTO-TAGS BLOCK */}
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Search Keywords & Tags (सर्च टैग्स)</span>
                  </span>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100 px-2 py-0.5 rounded-full">
                    Hidden from Public UI
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {(!newDoctorForm.tags || newDoctorForm.tags.length === 0) ? (
                    <span className="text-[11px] text-slate-400 italic">
                      Abhi koi tag add nahi hai. Niche suggestions par click karein ya apna tag likhein.
                    </span>
                  ) : (
                    newDoctorForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewDoctorForm({
                              ...newDoctorForm,
                              tags: newDoctorForm.tags.filter((t) => t !== tag),
                            })
                          }
                          className="hover:text-indigo-200 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="pt-1.5 border-t border-indigo-200/60">
                  <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
                    ✨ Auto-Suggested (Click karke add karein):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const currentSpecialty =
                        establishmentType === 'CLINIC'
                          ? newDoctorForm.specialty
                          : (hospitalDoctors[0]?.specialty || newDoctorForm.specialty || '');

                      const currentDocName =
                        establishmentType === 'CLINIC'
                          ? newDoctorForm.name
                          : (hospitalDoctors[0]?.name || newDoctorForm.name || '');

                      const suggested = getAutoTagSuggestions(
                        currentSpecialty || 'General',
                        newDoctorForm.city || '',
                        currentDocName || ''
                      );

                      return suggested
                        .filter((tag) => !(newDoctorForm.tags || []).includes(tag))
                        .map((suggestedTag) => (
                          <button
                            key={suggestedTag}
                            type="button"
                            onClick={() =>
                              setNewDoctorForm((prev) => ({
                                ...prev,
                                tags: [...(prev.tags || []), suggestedTag],
                              }))
                            }
                            className="text-[11px] bg-white border border-indigo-300 text-indigo-900 font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition cursor-pointer shadow-2xs"
                          >
                            + {suggestedTag}
                          </button>
                        ));
                    })()}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customTagInput.trim();
                        if (val && !(newDoctorForm.tags || []).includes(val)) {
                          setNewDoctorForm((prev) => ({
                            ...prev,
                            tags: [...(prev.tags || []), val],
                          }));
                          setCustomTagInput('');
                        }
                      }
                    }}
                    placeholder="Apna koi keyword likhein (e.g. Pathri, Sugar) aur Add dabayein..."
                    className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customTagInput.trim();
                      if (val && !(newDoctorForm.tags || []).includes(val)) {
                        setNewDoctorForm((prev) => ({
                          ...prev,
                          tags: [...(prev.tags || []), val],
                        }));
                        setCustomTagInput('');
                      }
                    }}
                    className="rounded-xl bg-indigo-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* HOSPITAL / CLINIC PHOTOS */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {establishmentType === 'CLINIC' ? 'Clinic Photos' : 'Hospital Building Photos'}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Campus Image 1 URL</label>
                    <input
                      type="text"
                      value={newDoctorForm.clinicImages?.[0] || ''}
                      onChange={(e) => {
                        const imgs = [...(newDoctorForm.clinicImages || ['', ''])];
                        imgs[0] = e.target.value;
                        setNewDoctorForm({ ...newDoctorForm, clinicImages: imgs });
                      }}
                      placeholder="Building image link 1"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Campus Image 2 URL</label>
                    <input
                      type="text"
                      value={newDoctorForm.clinicImages?.[1] || ''}
                      onChange={(e) => {
                        const imgs = [...(newDoctorForm.clinicImages || ['', ''])];
                        imgs[1] = e.target.value;
                        setNewDoctorForm({ ...newDoctorForm, clinicImages: imgs });
                      }}
                      placeholder="Building image link 2"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCurrentUsernameTaken}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                    isCurrentUsernameTaken
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {establishmentType === 'CLINIC' ? 'Create & Launch Clinic' : 'Create & Launch Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
