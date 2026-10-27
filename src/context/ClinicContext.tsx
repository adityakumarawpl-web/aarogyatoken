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
import { db } from '../firebase';
import { collection, onSnapshot, setDoc, updateDoc, doc } from 'firebase/firestore';

export const DEFAULT_VOICE_BOT_SETTINGS: VoiceBotSettings = {
  enabled: true,
  triggerThreshold: 4,
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
    status: 'IN_CABIN',
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
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);

  // Doctors Real-time Sync with Firestore
  useEffect(() => {
    const unsubscribeDoc = onSnapshot(collection(db, 'doctors'), async (snapshot) => {
      if (snapshot.empty) {
        for (const d of INITIAL_DOCTORS) {
          await setDoc(doc(db, 'doctors', d.id), d);
        }
      } else {
        const loadedDocs: Doctor[] = snapshot.docs.map((docSnap) => docSnap.data() as Doctor);
        setDoctors(loadedDocs);
      }
    }, (error) => {
      console.error("Error fetching live doctors:", error);
    });

    return () => unsubscribeDoc();
  }, []);

  // Patients Real-time Sync with Firestore
  useEffect(() => {
    const unsubscribePat = onSnapshot(collection(db, 'patients'), async (snapshot) => {
      if (snapshot.empty) {
        for (const p of INITIAL_PATIENTS) {
          await setDoc(doc(db, 'patients', p.id), p);
        }
      } else {
        const loadedPatients: Patient[] = snapshot.docs.map((docSnap) => docSnap.data() as Patient);
        setPatients(loadedPatients);
      }
    }, (error) => {
      console.error("Error fetching live patients:", error);
    });

    return () => unsubscribePat();
  }, []);

  const [currentView, setCurrentView] = useState<'PUBLIC' | 'STAFF' | 'ADMIN'>('PUBLIC');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');
  const [staffDoctorId, setStaffDoctorId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('opd_staff_session');
    } catch {
      return null;
    }
  });

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

  const checkBotAlerts = useCallback((currentPatients: Patient[]) => {
    if (!voiceBotSettings.enabled) return;

    let triggeredAny = false;
    let newlyAlertedPatient: Patient | null = null;

    currentPatients.forEach((p) => {
      if (shouldSendBotCallAlert(currentPatients, p, voiceBotSettings.triggerThreshold) && !p.botCallAlertSent) {
        triggeredAny = true;
        const alerted = {
          ...p,
          botCallAlertSent: true,
          botCallAlertSentAt: new Date().toISOString(),
        };
        if (!newlyAlertedPatient) {
          newlyAlertedPatient = alerted;
        }
        updateDoc(doc(db, 'patients', p.id), {
          botCallAlertSent: true,
          botCallAlertSentAt: alerted.botCallAlertSent
        }).catch(err => console.error("Error updating bot alert:", err));
      }
    });

    if (triggeredAny && newlyAlertedPatient) {
      setActiveBotCallPatient(newlyAlertedPatient);
    }
  }, [voiceBotSettings]);

  const addWalkInPatient = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>): Patient => {
    const nextToken = getNextTokenNumber(patients, data.doctorId);
    const customId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newPatient: Patient = {
      ...data,
      id: customId,
      tokenNumber: nextToken,
      bookingType: 'WALK_IN',
      status: 'WAITING',
      paymentStatus: 'FREE',
      paymentAmount: 0,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    };

    setDoc(doc(db, 'patients', customId), newPatient).catch(err => {
      console.error("Error adding walk-in patient:", err);
    });

    setLastGeneratedTokenPatient(newPatient);
    setTimeout(() => checkBotAlerts([...patients, newPatient]), 50);
    return newPatient;
  }, [patients, checkBotAlerts]);

  const bookOnlineAppointment = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>) => {
    const nextToken = getNextTokenNumber(patients, data.doctorId);
    const paymentId = `pay_rzp_${Date.now()}`;
    const customId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newPatient: Patient = {
      ...data,
      id: customId,
      tokenNumber: nextToken,
      bookingType: 'ONLINE',
      status: 'WAITING',
      paymentStatus: 'PAID',
      paymentAmount: 20,
      paymentId,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    };

    setDoc(doc(db, 'patients', customId), newPatient).catch(err => {
      console.error("Error adding online patient:", err);
    });

    setLastGeneratedTokenPatient(newPatient);
    setTimeout(() => checkBotAlerts([...patients, newPatient]), 50);
    return { patient: newPatient, paymentId };
  }, [patients, checkBotAlerts]);

  const callPatient = useCallback((patientId: string) => {
    const updated = callPatientInCabin(patients, patientId);
    const target = updated.find(p => p.id === patientId);
    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status,
        calledInAt: target.calledInAt
      }).catch(err => console.error("Error updating callPatient:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const completePatient = useCallback((patientId: string) => {
    const updated = completePatientConsultation(patients, patientId);
    const target = updated.find(p => p.id === patientId);
    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status,
        completedAt: target.completedAt
      }).catch(err => console.error("Error updating completePatient:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const markNotAvailable = useCallback((patientId: string) => {
    const updated = markPatientNotAvailable(patients, patientId);
    const target = updated.find(p => p.id === patientId);
    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status
      }).catch(err => console.error("Error updating markNotAvailable:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const markEmergency = useCallback((patientId: string) => {
    const updated = markPatientEmergency(patients, patientId);
    updated.forEach(p => {
      updateDoc(doc(db, 'patients', p.id), { status: p.status }).catch(() => {});
    });
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const recallPatient = useCallback((patientId: string) => {
    const updated = recallPatientLogic(patients, patientId);
    const target = updated.find(p => p.id === patientId);
    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status
      }).catch(err => console.error("Error updating recallPatient:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const updateDoctorStatus = useCallback((doctorId: string, status: DoctorStatus, note?: string) => {
    setDoctors((prev) =>
      prev.map((docItem) => {
        if (docItem.id === doctorId) {
          const updatedNote = note !== undefined ? note : docItem.statusNote;
          updateDoc(doc(db, 'doctors', doctorId), {
            status: status,
            statusNote: updatedNote
          }).catch(err => console.error("Error updating doctor status:", err));

          return {
            ...docItem,
            status,
            statusNote: updatedNote,
          };
        }
        return docItem;
      })
    );
  }, []);

  const addNewDoctor = useCallback((data: Omit<Doctor, 'id' | 'status' | 'onlineTokenFee' | 'createdAt'>): Doctor => {
    const customId = `doc-${Date.now()}`;
    const newDoc: Doctor = {
      ...data,
      id: customId,
      status: 'AVAILABLE',
      onlineTokenFee: 20,
      createdAt: new Date().toISOString(),
    };

    setDoc(doc(db, 'doctors', customId), newDoc).catch(err => {
      console.error("Error adding new doctor:", err);
    });

    setDoctors((prev) => [...prev, newDoc]);
    return newDoc;
  }, []);

  const staffLogin = useCallback((username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();
    const docFound = doctors.find(
      (d) => d.staffUsername.toLowerCase() === cleanUser && d.staffPassword === cleanPass
    );
    if (docFound) {
      setStaffDoctorId(docFound.id);
      setSelectedDoctorId(docFound.id);
      return { success: true, message: `Welcome ${docFound.name}'s Staff Desk!`, doctor: docFound };
    }
    return { success: false, message: 'Invalid Staff ID or Password. Check credentials.' };
  }, [doctors]);

  const staffLogout = useCallback(() => {
    setStaffDoctorId(null);
  }, []);

  const adminLogin = useCallback((username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();
    if ((cleanUser === 'admin' || cleanUser === 'owner') && (cleanPass === 'admin123' || cleanPass === 'superadmin786')) {
      setAdminAuthenticated(true);
      return { success: true, message: 'Layer 1 Master Credentials Verified. Proceed to 2FA PIN.' };
    }
    return { success: false, message: 'Invalid Admin ID or Password.' };
  }, []);

  const adminVerify2FA = useCallback((pin: string) => {
    const cleanPin = pin.trim();
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
    setStaffDoctorId(null);
    setAdminAuthenticated(false);
    setAdminTwoFactorVerified(false);
    setVoiceBotSettings(DEFAULT_VOICE_BOT_SETTINGS);
    setRazorpaySettings(DEFAULT_RAZORPAY_SETTINGS);
    setSelectedDoctorId('doc-1');
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