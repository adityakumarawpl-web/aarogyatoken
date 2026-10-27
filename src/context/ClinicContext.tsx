import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Doctor, Patient, DoctorStatus, VoiceBotSettings, GlobalRazorpaySettings } from '../types';
import {
  getNextTokenNumber,
  callPatientInCabin,
  completePatientConsultation,
  markPatientNotAvailable,
  markPatientEmergency,
  recallPatient as recallPatientLogic,
  shouldSendBotCallAlert,
} from '../utils/queueLogic';

export const DEFAULT_VOICE_BOT_SETTINGS: VoiceBotSettings = {
  enabled: true,
  triggerThreshold: 4, // Trigger alert when 1 to 4 (crucially 3-4) patients are ahead
  telephonyProvider: 'IN_APP_VOICE',
  apiKey: 'ex_live_7891238910',
  callerId: '+91 80 4719 3200',
  messageTemplate: 'Namaste {patient_name} ji! Dr. {doctor_name} ke cabin me aapka Token #{token_number} aane wala hai. Aapke aage keval {patients_ahead} mareez bache hain. Kripya clinic pahunche! Dhanyawad.',
  autoRetryFailed: true,
  maxRetries: 2,
};

export const DEFAULT_RAZORPAY_SETTINGS: GlobalRazorpaySettings = {
  enabled: true,
  mode: 'test',
  keyId: 'rzp_test_OPD93481289',
  keySecret: 'sec_live_98127391823',
  merchantName: 'AarogyaToken OPD Platform',
  themeColor: '#2563EB',
};

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Rajesh Sharma',
    degree: 'MBBS, MD (Medicine)',
    specialty: 'Senior Consultant Physician & Diabetologist',
    clinicName: 'Aarogya Clinic & Heart Care',
    cabinNumber: 'Cabin No. 2',
    address: '14/82 Civil Lines, Near Green Park',
    city: 'Kanpur, UP',
    phone: '+91 98390 12345',
    timings: '10:00 AM - 02:00 PM & 05:30 PM - 08:30 PM',
    consultationFee: 400,
    onlineTokenFee: 20,
    status: 'AVAILABLE',
    statusNote: 'Doctor is in clinic seeing patients',
    staffUsername: 'staff_rajesh',
    staffPassword: 'clinic123',
    profilePic: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    avgTimePerPatientMinutes: 10,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_rajesh_9823',
    razorpayKeySecret: 'sec_rajesh_live_98',
    razorpayAccountType: 'PLATFORM_SPLIT',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Patel',
    degree: 'MBBS, MS (Obs & Gynae)',
    specialty: 'Gynecologist & Women Health Specialist',
    clinicName: 'Matritva Maternity & Laparoscopy Clinic',
    cabinNumber: 'Cabin No. 1',
    address: '3rd Floor, Sharda Plaza, Hazratganj',
    city: 'Lucknow, UP',
    phone: '+91 94150 98765',
    timings: '11:00 AM - 03:00 PM & 06:00 PM - 09:00 PM',
    consultationFee: 500,
    onlineTokenFee: 20,
    status: 'LUNCH',
    statusNote: 'Lunch break till 03:30 PM',
    staffUsername: 'staff_priya',
    staffPassword: 'clinic123',
    profilePic: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    avgTimePerPatientMinutes: 12,
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_priya_3481',
    razorpayKeySecret: 'sec_priya_live_77',
    razorpayAccountType: 'PLATFORM_SPLIT',
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Verma',
    degree: 'MBBS, DNB (Orthopedics)',
    specialty: 'Bone, Joint & Spine Care Specialist',
    clinicName: 'Sanjeevani Bone & Joint Clinic',
    cabinNumber: 'Cabin No. 4',
    address: 'Opp. Sigra Stadium, Sigra',
    city: 'Varanasi, UP',
    phone: '+91 97210 54321',
    timings: '09:30 AM - 01:30 PM & 05:00 PM - 08:00 PM',
    consultationFee: 450,
    onlineTokenFee: 20,
    status: 'AVAILABLE',
    statusNote: 'OPD in progress',
    staffUsername: 'staff_amit',
    staffPassword: 'clinic123',
    profilePic: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    avgTimePerPatientMinutes: 10,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_amit_1109',
    razorpayKeySecret: 'sec_amit_live_44',
    razorpayAccountType: 'PLATFORM_SPLIT',
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  // Dr. Rajesh Sharma's Patients for today
  {
    id: 'p-1',
    doctorId: 'doc-1',
    tokenNumber: 1,
    name: 'Suresh Chandra Tiwari',
    mobile: '9839112233',
    age: 54,
    gender: 'Male',
    address: 'Govind Nagar, Kanpur',
    complaint: 'Sugar checkup & high BP',
    bookingType: 'WALK_IN',
    status: 'COMPLETED',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    calledInAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p-2',
    doctorId: 'doc-1',
    tokenNumber: 2,
    name: 'Anjali Saxena',
    mobile: '9450334455',
    age: 36,
    gender: 'Female',
    address: 'Swaroop Nagar, Kanpur',
    complaint: 'Thyroid & severe fatigue',
    bookingType: 'WALK_IN',
    status: 'IN_CABIN', // Currently In Cabin -> Blue color
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    calledInAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p-3',
    doctorId: 'doc-1',
    tokenNumber: 3,
    name: 'Rohan Gupta',
    mobile: '9792445566',
    age: 28,
    gender: 'Male',
    address: 'Kidwai Nagar, Kanpur',
    complaint: 'Viral fever & body ache for 3 days',
    bookingType: 'WALK_IN',
    status: 'WAITING',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p-4',
    doctorId: 'doc-1',
    tokenNumber: 4,
    name: 'Pooja Srivastava',
    mobile: '9935556677',
    age: 31,
    gender: 'Female',
    address: 'Civil Lines, Kanpur',
    complaint: 'Chest heaviness & acidity',
    bookingType: 'ONLINE',
    status: 'WAITING',
    paymentStatus: 'PAID',
    paymentAmount: 20,
    paymentId: 'pay_rzp_782341',
    isEmergency: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    botCallAlertSent: true, // 2 ahead -> bot call alert sent!
    botCallAlertSentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-5',
    doctorId: 'doc-1',
    tokenNumber: 5,
    name: 'Mohd. Imran',
    mobile: '9336667788',
    age: 44,
    gender: 'Male',
    address: 'Chamanganj, Kanpur',
    complaint: 'Diabetes routine follow-up',
    bookingType: 'ONLINE',
    status: 'WAITING',
    paymentStatus: 'PAID',
    paymentAmount: 20,
    paymentId: 'pay_rzp_782390',
    isEmergency: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    botCallAlertSent: true,
    botCallAlertSentAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-6',
    doctorId: 'doc-1',
    tokenNumber: 6,
    name: 'Sunita Devi',
    mobile: '9838778899',
    age: 62,
    gender: 'Female',
    address: 'Kalyanpur, Kanpur',
    complaint: 'Severe knee pain and dizziness',
    bookingType: 'WALK_IN',
    status: 'WAITING',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    botCallAlertSent: false,
  },
];

interface ClinicContextType {
  doctors: Doctor[];
  patients: Patient[];
  currentView: 'PUBLIC' | 'STAFF' | 'ADMIN';
  setCurrentView: (view: 'PUBLIC' | 'STAFF' | 'ADMIN') => void;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  staffDoctorId: string | null;
  addWalkInPatient: (patient: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>) => Patient;
  bookOnlineAppointment: (patient: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>) => { patient: Patient; paymentId: string };
  callPatient: (patientId: string) => void;
  completePatient: (patientId: string) => void;
  markNotAvailable: (patientId: string) => void;
  markEmergency: (patientId: string) => void;
  recallPatient: (patientId: string) => void;
  updateDoctorStatus: (doctorId: string, status: DoctorStatus, note?: string) => void;
  addNewDoctor: (doctor: Omit<Doctor, 'id' | 'status' | 'onlineTokenFee' | 'createdAt'>) => Doctor;
  staffLogin: (username: string, password: string) => { success: boolean; message: string; doctor?: Doctor };
  staffLogout: () => void;
  resetToDemoData: () => void;
  activeBotCallPatient: Patient | null;
  triggerBotCallAlert: (patient: Patient) => void;
  closeBotCallModal: () => void;
  lastGeneratedTokenPatient: Patient | null;
  setLastGeneratedTokenPatient: (p: Patient | null) => void;
  // Super Admin 2-Layer Security & Settings
  adminAuthenticated: boolean;
  adminTwoFactorVerified: boolean;
  adminLogin: (username: string, password: string) => { success: boolean; message: string };
  adminVerify2FA: (pin: string) => { success: boolean; message: string };
  adminLogout: () => void;
  voiceBotSettings: VoiceBotSettings;
  updateVoiceBotSettings: (settings: VoiceBotSettings) => void;
  razorpaySettings: GlobalRazorpaySettings;
  updateRazorpaySettings: (settings: GlobalRazorpaySettings) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('opd_doctors_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((d: Doctor) => {
          if (d.id === 'doc-2' && d.profilePic?.includes('5858066f286f')) {
            return { ...d, profilePic: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80' };
          }
          return d;
        });
      }
      return INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('opd_patients_data');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [currentView, setCurrentView] = useState<'PUBLIC' | 'STAFF' | 'ADMIN'>('PUBLIC');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');
  const [staffDoctorId, setStaffDoctorId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('opd_staff_session');
    } catch {
      return null;
    }
  });

  // Super Admin 2-Layer Authentication state
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('opd_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [adminTwoFactorVerified, setAdminTwoFactorVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem('opd_admin_2fa') === 'true';
    } catch {
      return false;
    }
  });

  // Super Admin Configurable Settings
  const [voiceBotSettings, setVoiceBotSettings] = useState<VoiceBotSettings>(() => {
    try {
      const saved = localStorage.getItem('opd_voice_bot_settings');
      return saved ? JSON.parse(saved) : DEFAULT_VOICE_BOT_SETTINGS;
    } catch {
      return DEFAULT_VOICE_BOT_SETTINGS;
    }
  });

  const [razorpaySettings, setRazorpaySettings] = useState<GlobalRazorpaySettings>(() => {
    try {
      const saved = localStorage.getItem('opd_razorpay_settings');
      return saved ? JSON.parse(saved) : DEFAULT_RAZORPAY_SETTINGS;
    } catch {
      return DEFAULT_RAZORPAY_SETTINGS;
    }
  });

  const [activeBotCallPatient, setActiveBotCallPatient] = useState<Patient | null>(null);
  const [lastGeneratedTokenPatient, setLastGeneratedTokenPatient] = useState<Patient | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('opd_doctors_data', JSON.stringify(doctors));
    } catch (e) {
      console.error('Failed to save doctors to localStorage', e);
    }
  }, [doctors]);

  useEffect(() => {
    try {
      localStorage.setItem('opd_patients_data', JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patients to localStorage', e);
    }
  }, [patients]);

  useEffect(() => {
    try {
      if (staffDoctorId) {
        localStorage.setItem('opd_staff_session', staffDoctorId);
      } else {
        localStorage.removeItem('opd_staff_session');
      }
    } catch (e) {
      console.error('Failed to sync staff session', e);
    }
  }, [staffDoctorId]);

  useEffect(() => {
    try {
      localStorage.setItem('opd_admin_auth', adminAuthenticated ? 'true' : 'false');
      localStorage.setItem('opd_admin_2fa', adminTwoFactorVerified ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to sync admin auth', e);
    }
  }, [adminAuthenticated, adminTwoFactorVerified]);

  useEffect(() => {
    try {
      localStorage.setItem('opd_voice_bot_settings', JSON.stringify(voiceBotSettings));
    } catch (e) {
      console.error('Failed to sync voice bot settings', e);
    }
  }, [voiceBotSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('opd_razorpay_settings', JSON.stringify(razorpaySettings));
    } catch (e) {
      console.error('Failed to sync razorpay settings', e);
    }
  }, [razorpaySettings]);

  // Check automated bot call alert triggers automatically when queue changes!
  const checkBotAlerts = useCallback((currentPatients: Patient[]) => {
    if (!voiceBotSettings.enabled) return;

    let triggeredAny = false;
    let newlyAlertedPatient: Patient | null = null;

    const updated = currentPatients.map((p) => {
      if (shouldSendBotCallAlert(currentPatients, p, voiceBotSettings.triggerThreshold)) {
        triggeredAny = true;
        const alerted = {
          ...p,
          botCallAlertSent: true,
          botCallAlertSentAt: new Date().toISOString(),
        };
        if (!newlyAlertedPatient) {
          newlyAlertedPatient = alerted;
        }
        return alerted;
      }
      return p;
    });

    if (triggeredAny) {
      setPatients(updated);
      // Automatically trigger the phone voice bot simulator in background!
      if (newlyAlertedPatient) {
        setActiveBotCallPatient(newlyAlertedPatient);
      }
    }
  }, [voiceBotSettings]);

  const addWalkInPatient = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>): Patient => {
    const nextToken = getNextTokenNumber(patients, data.doctorId);
    const newPatient: Patient = {
      ...data,
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: nextToken,
      bookingType: 'WALK_IN',
      status: 'WAITING',
      paymentStatus: 'FREE',
      paymentAmount: 0,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    };

    setPatients((prev) => {
      const updated = [...prev, newPatient];
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });

    setLastGeneratedTokenPatient(newPatient);
    return newPatient;
  }, [patients, checkBotAlerts]);

  const bookOnlineAppointment = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>) => {
    const nextToken = getNextTokenNumber(patients, data.doctorId);
    const paymentId = `pay_rzp_${Date.now()}`;
    const newPatient: Patient = {
      ...data,
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: nextToken,
      bookingType: 'ONLINE',
      status: 'WAITING',
      paymentStatus: 'PAID',
      paymentAmount: 20, // 20 Rupees SaaS fee
      paymentId,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    };

    setPatients((prev) => {
      const updated = [...prev, newPatient];
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });

    setLastGeneratedTokenPatient(newPatient);
    return { patient: newPatient, paymentId };
  }, [patients, checkBotAlerts]);

  // Slide Left-to-Right: In Cabin (Blue)
  const callPatient = useCallback((patientId: string) => {
    setPatients((prev) => {
      const updated = callPatientInCabin(prev, patientId);
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });
  }, [checkBotAlerts]);

  // Slide Right-to-Left: Completed (Green)
  const completePatient = useCallback((patientId: string) => {
    setPatients((prev) => {
      const updated = completePatientConsultation(prev, patientId);
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });
  }, [checkBotAlerts]);

  // Option: Not Available
  const markNotAvailable = useCallback((patientId: string) => {
    setPatients((prev) => {
      const updated = markPatientNotAvailable(prev, patientId);
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });
  }, [checkBotAlerts]);

  // Option: Emergency (Bump to top of waiting)
  const markEmergency = useCallback((patientId: string) => {
    setPatients((prev) => {
      const updated = markPatientEmergency(prev, patientId);
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });
  }, [checkBotAlerts]);

  // Recall skipped patient
  const recallPatient = useCallback((patientId: string) => {
    setPatients((prev) => {
      const updated = recallPatientLogic(prev, patientId);
      setTimeout(() => checkBotAlerts(updated), 50);
      return updated;
    });
  }, [checkBotAlerts]);

  const updateDoctorStatus = useCallback((doctorId: string, status: DoctorStatus, note?: string) => {
    setDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id === doctorId) {
          return {
            ...doc,
            status,
            statusNote: note !== undefined ? note : doc.statusNote,
          };
        }
        return doc;
      })
    );
  }, []);

  const addNewDoctor = useCallback((data: Omit<Doctor, 'id' | 'status' | 'onlineTokenFee' | 'createdAt'>): Doctor => {
    const newDoc: Doctor = {
      ...data,
      id: `doc-${Date.now()}`,
      status: 'AVAILABLE',
      onlineTokenFee: 20,
      createdAt: new Date().toISOString(),
    };
    setDoctors((prev) => [...prev, newDoc]);
    return newDoc;
  }, []);

  const staffLogin = useCallback((username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();
    const doc = doctors.find(
      (d) => d.staffUsername.toLowerCase() === cleanUser && d.staffPassword === cleanPass
    );
    if (doc) {
      setStaffDoctorId(doc.id);
      setSelectedDoctorId(doc.id);
      return { success: true, message: `Welcome ${doc.name}'s Staff Desk!`, doctor: doc };
    }
    return { success: false, message: 'Invalid Staff ID or Password. Check credentials.' };
  }, [doctors]);

  const staffLogout = useCallback(() => {
    setStaffDoctorId(null);
  }, []);

  // Super Admin 2-Layer Security:
  // Layer 1: Admin ID & Password
  const adminLogin = useCallback((username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();
    if ((cleanUser === 'admin' || cleanUser === 'owner') && (cleanPass === 'admin123' || cleanPass === 'superadmin786')) {
      setAdminAuthenticated(true);
      return { success: true, message: 'Layer 1 Master Credentials Verified. Proceed to 2FA PIN.' };
    }
    return { success: false, message: 'Invalid Admin ID or Password.' };
  }, []);

  // Layer 2: 2FA Security PIN / OTP Verification
  const adminVerify2FA = useCallback((pin: string) => {
    const cleanPin = pin.trim();
    // Default security PIN: 7869 or 123456
    if (cleanPin === '7869' || cleanPin === '123456') {
      setAdminTwoFactorVerified(true);
      return { success: true, message: '2FA Verification Successful. Welcome Super Admin!' };
    }
    return { success: false, message: 'Incorrect 2FA Security PIN. Try 7869 or 123456.' };
  }, []);

  const adminLogout = useCallback(() => {
    setAdminAuthenticated(false);
    setAdminTwoFactorVerified(false);
  }, []);

  const updateVoiceBotSettings = useCallback((newSettings: VoiceBotSettings) => {
    setVoiceBotSettings(newSettings);
  }, []);

  const updateRazorpaySettings = useCallback((newSettings: GlobalRazorpaySettings) => {
    setRazorpaySettings(newSettings);
  }, []);

  const resetToDemoData = useCallback(() => {
    setDoctors(INITIAL_DOCTORS);
    setPatients(INITIAL_PATIENTS);
    setStaffDoctorId(null);
    setAdminAuthenticated(false);
    setAdminTwoFactorVerified(false);
    setVoiceBotSettings(DEFAULT_VOICE_BOT_SETTINGS);
    setRazorpaySettings(DEFAULT_RAZORPAY_SETTINGS);
    setSelectedDoctorId('doc-1');
    localStorage.removeItem('opd_doctors_data');
    localStorage.removeItem('opd_patients_data');
    localStorage.removeItem('opd_staff_session');
    localStorage.removeItem('opd_admin_auth');
    localStorage.removeItem('opd_admin_2fa');
    localStorage.removeItem('opd_voice_bot_settings');
    localStorage.removeItem('opd_razorpay_settings');
  }, []);

  const triggerBotCallAlert = useCallback((patient: Patient) => {
    setActiveBotCallPatient(patient);
  }, []);

  const closeBotCallModal = useCallback(() => {
    setActiveBotCallPatient(null);
  }, []);

  return (
    <ClinicContext.Provider
      value={{
        doctors,
        patients,
        currentView,
        setCurrentView,
        selectedDoctorId,
        setSelectedDoctorId,
        staffDoctorId,
        addWalkInPatient,
        bookOnlineAppointment,
        callPatient,
        completePatient,
        markNotAvailable,
        markEmergency,
        recallPatient,
        updateDoctorStatus,
        addNewDoctor,
        staffLogin,
        staffLogout,
        resetToDemoData,
        activeBotCallPatient,
        triggerBotCallAlert,
        closeBotCallModal,
        lastGeneratedTokenPatient,
        setLastGeneratedTokenPatient,
        adminAuthenticated,
        adminTwoFactorVerified,
        adminLogin,
        adminVerify2FA,
        adminLogout,
        voiceBotSettings,
        updateVoiceBotSettings,
        razorpaySettings,
        updateRazorpaySettings,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider');
  return ctx;
};
