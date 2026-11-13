import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Doctor, Patient, DoctorStatus, VoiceBotSettings, GlobalRazorpaySettings } from '../types';
import {
  getNextTokenNumber,
  callPatientInCabin,
  completePatientConsultation,
  markPatientNotAvailable,
  markPatientEmergency,
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
    establishmentType: 'CLINIC',
    hospitalId: 'staff_rajesh',
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_rajesh_9823',
    razorpayKeySecret: 'sec_rajesh_live_98',
    razorpayAccountType: 'PLATFORM_SPLIT',
    isSessionActive: false,
    activeShift: 'Morning',
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
    establishmentType: 'CLINIC',
    hospitalId: 'staff_priya',
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_priya_3481',
    razorpayKeySecret: 'sec_priya_live_77',
    razorpayAccountType: 'PLATFORM_SPLIT',
    isSessionActive: false,
    activeShift: 'Morning',
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
    establishmentType: 'CLINIC',
    hospitalId: 'staff_amit',
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_amit_1109',
    razorpayKeySecret: 'sec_amit_live_44',
    razorpayAccountType: 'PLATFORM_SPLIT',
    isSessionActive: false,
    activeShift: 'Morning',
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    doctorId: 'doc-1',
    hospitalId: 'staff_rajesh',
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
    hospitalId: 'staff_rajesh',
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
    hospitalId: 'staff_rajesh',
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
  updateDoctorStatus: (doctorId: string, status: DoctorStatus, note?: string, leaveStart?: string, leaveEnd?: string) => void;
  startDoctorSession: (doctorId: string) => Promise<void>;
  pauseDoctorSession: (doctorId: string) => Promise<void>;
  completeDoctorShift: (doctorId: string) => Promise<void>;
  moveRemainingToNextShift: (doctorId: string) => Promise<{ movedCount: number; targetShift: string; targetDate: string }>;
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

  // Automated WhatsApp Turn Reminder Dispatch
  const sendTurnReminderWhatsApp = async (patient: Patient, doctor: Doctor | undefined, aheadCount: number) => {
    try {
      const rawDigits = String(patient.mobile || '').replace(/\D/g, '');
      const cleanPhone = rawDigits.startsWith('91') && rawDigits.length === 12
        ? rawDigits
        : `91${rawDigits.slice(-10)}`;

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          templateName: 'opd_token_confirmation',
          patientName: patient.name,
          doctorName: `${doctor?.name || 'Doctor'} (Alert: Keval ${aheadCount} Mareez Bache Hain)`,
          tokenNumber: `#${patient.tokenNumber} - Kripya Clinic Pahunche`,
          clinicName: doctor?.clinicName || 'Aarogya Clinic',
        }),
      });

      const resData = await response.json();
      console.log(`WhatsApp Turn Alert sent for Token #${patient.tokenNumber}:`, resData);
    } catch (err) {
      console.error('Failed to send turn reminder WhatsApp:', err);
    }
  };

  // Shift Reschedule / Carry Forward WhatsApp Dispatch
  const sendShiftRescheduleWhatsApp = async (
    patient: Patient,
    doctor: Doctor | undefined,
    newTokenNumber: number,
    newShift: string,
    newDate: string,
    reasonType: 'MOVED' | 'REORDERED'
  ) => {
    try {
      const rawDigits = String(patient.mobile || '').replace(/\D/g, '');
      const cleanPhone = rawDigits.startsWith('91') && rawDigits.length === 12
        ? rawDigits
        : `91${rawDigits.slice(-10)}`;

      const infoNote =
        reasonType === 'MOVED'
          ? `${doctor?.name || 'Doctor'} (Urgent Kaam Ke Karan Shift Badli Hai)`
          : `${doctor?.name || 'Doctor'} (Queue Update: Purani Shift Ke Mareez Upar Lage Hain)`;

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          templateName: 'opd_token_confirmation',
          patientName: patient.name,
          doctorName: infoNote,
          tokenNumber: `Naya Token #${newTokenNumber} (${newShift} Shift - ${newDate})`,
          clinicName: doctor?.clinicName || 'Aarogya Clinic',
        }),
      });

      const resData = await response.json();
      console.log(`WhatsApp Shift Update sent for New Token #${newTokenNumber}:`, resData);
    } catch (err) {
      console.error('Failed to send shift reschedule WhatsApp:', err);
    }
  };

  const checkBotAlerts = useCallback((currentPatients: Patient[]) => {
    if (!voiceBotSettings.enabled) return;

    let triggeredAny = false;
    let newlyAlertedPatient: Patient | null = null;
    const threshold = voiceBotSettings.triggerThreshold || 4;

    currentPatients.forEach((p) => {
      if (p.status !== 'WAITING' || p.bookingType !== 'ONLINE' || p.botCallAlertSent) {
        return;
      }

      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();

      const shiftWaitingQueue = currentPatients
        .filter((other) => {
          const otherDate = other.appointmentDate || (other.createdAt ? other.createdAt.split('T')[0] : '');
          const otherShift = ((other as any).selectedShift || (other as any).shift || 'Morning').trim().toLowerCase();
          return (
            other.doctorId === p.doctorId &&
            otherDate === pDate &&
            otherShift === pShift &&
            other.status === 'WAITING'
          );
        })
        .sort((a, b) => {
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;
          return Number(a.tokenNumber) - Number(b.tokenNumber);
        });

      const aheadCount = shiftWaitingQueue.findIndex((item) => item.id === p.id);

      if (aheadCount !== -1 && aheadCount <= threshold) {
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
          botCallAlertSentAt: alerted.botCallAlertSentAt,
        }).catch((err) => console.error("Error updating bot alert:", err));

        const matchedDoc = doctors.find((d) => d.id === p.doctorId);
        sendTurnReminderWhatsApp(p, matchedDoc, aheadCount);
      }
    });

    if (triggeredAny && newlyAlertedPatient) {
      setActiveBotCallPatient(newlyAlertedPatient);
    }
  }, [voiceBotSettings, doctors]);

  // 🔹 1. Start Shift Session: Staff clicks "Morning Shift Start" / "Evening Shift Start"
  const startDoctorSession = useCallback(async (doctorId: string) => {
    const matchedDoc = doctors.find((d) => d.id === doctorId);
    const currentShift = matchedDoc?.activeShift || 'Morning';

    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, isSessionActive: true, activeShift: currentShift } : d))
    );

    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isSessionActive: true,
        activeShift: currentShift,
      });
    } catch (e) {
      console.error("Error setting isSessionActive in Firestore:", e);
    }

    const targetDate = new Date().toISOString().split('T')[0];

    const targetPatients = patients.filter((p) => {
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
      return (
        p.doctorId === doctorId &&
        pDate === targetDate &&
        pShift === currentShift.toLowerCase() &&
        p.status === 'WAITING'
      );
    }).sort((a, b) => Number(a.tokenNumber) - Number(b.tokenNumber));

    // Top 4 waiting list me se SIRF ONLINE booking walo ko message jayega
    const topWaitingList = targetPatients.slice(0, 4);

    topWaitingList.forEach((patient) => {
      if (patient.bookingType !== 'ONLINE' || patient.botCallAlertSent) {
        return;
      }

      const aheadCount = targetPatients.filter(
        (other) => Number(other.tokenNumber) < Number(patient.tokenNumber)
      ).length;

      updateDoc(doc(db, 'patients', patient.id), {
        botCallAlertSent: true,
        botCallAlertSentAt: new Date().toISOString(),
      }).catch(console.error);

      sendTurnReminderWhatsApp(patient, matchedDoc, aheadCount);
    });
  }, [doctors, patients]);

  // 🔹 2. Pause Session
  const pauseDoctorSession = useCallback(async (doctorId: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, isSessionActive: false } : d))
    );

    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isSessionActive: false,
      });
    } catch (e) {
      console.error("Error pausing session in Firestore:", e);
    }
  }, []);

  // 🔹 3. Complete Shift (Morning -> Evening switch, aur bache hue patients automatic Absent/NOT_AVAILABLE me jayenge)
  const completeDoctorShift = useCallback(async (doctorId: string) => {
    const matchedDoc = doctors.find((d) => d.id === doctorId);
    const currentShift = matchedDoc?.activeShift || 'Morning';
    const todayStr = new Date().toISOString().split('T')[0];

    // Current shift ke jo patients WAITING ya IN_CABIN me bache hain (bina Move to Next Shift dabaye),
    // unhe automatic NOT_AVAILABLE (Absent tab) me bhej dein
    const remainingUnseenPatients = patients.filter((p) => {
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
      return (
        p.doctorId === doctorId &&
        pDate === todayStr &&
        pShift === currentShift.toLowerCase() &&
        (p.status === 'WAITING' || p.status === 'IN_CABIN')
      );
    });

    if (remainingUnseenPatients.length > 0) {
      const remainingIds = new Set(remainingUnseenPatients.map((p) => p.id));

      setPatients((prev) =>
        prev.map((p) =>
          remainingIds.has(p.id) ? { ...p, status: 'NOT_AVAILABLE' } : p
        )
      );

      for (const p of remainingUnseenPatients) {
        updateDoc(doc(db, 'patients', p.id), {
          status: 'NOT_AVAILABLE',
        }).catch((err) =>
          console.error(`Error auto-marking patient ${p.id} as NOT_AVAILABLE:`, err)
        );
      }
    }

    const nextShift: 'Morning' | 'Evening' = currentShift === 'Morning' ? 'Evening' : 'Morning';
    const morningDoneDate = currentShift === 'Morning' ? todayStr : '';

    setDoctors((prev) =>
      prev.map((d) =>
        d.id === doctorId
          ? {
              ...d,
              isSessionActive: false,
              activeShift: nextShift,
              morningCompletedDate: morningDoneDate,
            }
          : d
      )
    );

    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isSessionActive: false,
        activeShift: nextShift,
        morningCompletedDate: morningDoneDate,
      });
    } catch (e) {
      console.error("Error completing shift in Firestore:", e);
    }
  }, [doctors, patients]);

  // 🔹 4. Move Remaining Patients to Next Shift (Urgent Doctor Unavailability)
  const moveRemainingToNextShift = useCallback(async (doctorId: string) => {
    const matchedDoc = doctors.find((d) => d.id === doctorId);
    const currentShift = matchedDoc?.activeShift || 'Morning';
    const todayStr = new Date().toISOString().split('T')[0];

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

    const targetShift: 'Morning' | 'Evening' = currentShift === 'Morning' ? 'Evening' : 'Morning';
    const targetDate = currentShift === 'Morning' ? todayStr : tomorrowStr;

    const remainingCurrentPatients = patients
      .filter((p) => {
        const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
        const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
        return (
          p.doctorId === doctorId &&
          pDate === todayStr &&
          pShift === currentShift.toLowerCase() &&
          p.status !== 'COMPLETED'
        );
      })
      .sort((a, b) => Number(a.tokenNumber) - Number(b.tokenNumber));

    const existingTargetPatients = patients
      .filter((p) => {
        const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
        const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim().toLowerCase();
        return (
          p.doctorId === doctorId &&
          pDate === targetDate &&
          pShift === targetShift.toLowerCase()
        );
      })
      .sort((a, b) => Number(a.tokenNumber) - Number(b.tokenNumber));

    const movedCount = remainingCurrentPatients.length;
    const updatesMap = new Map<string, Partial<Patient>>();

    remainingCurrentPatients.forEach((p, index) => {
      const newToken = index + 1;
      updatesMap.set(p.id, {
        tokenNumber: newToken,
        appointmentDate: targetDate,
        selectedShift: targetShift,
        status: p.status === 'IN_CABIN' ? 'WAITING' : p.status,
        botCallAlertSent: false,
      });

      if (p.bookingType === 'ONLINE') {
        sendShiftRescheduleWhatsApp(p, matchedDoc, newToken, targetShift, targetDate, 'MOVED');
      }
    });

    if (movedCount > 0) {
      existingTargetPatients.forEach((p, index) => {
        const shiftedToken = movedCount + index + 1;
        updatesMap.set(p.id, {
          tokenNumber: shiftedToken,
          botCallAlertSent: false,
        });

        if (p.bookingType === 'ONLINE') {
          sendShiftRescheduleWhatsApp(p, matchedDoc, shiftedToken, targetShift, targetDate, 'REORDERED');
        }
      });
    }

    if (updatesMap.size > 0) {
      setPatients((prev) =>
        prev.map((p) => {
          const patch = updatesMap.get(p.id);
          return patch ? ({ ...p, ...patch, shift: patch.selectedShift || (p as any).shift } as Patient) : p;
        })
      );

      for (const [patientId, patch] of updatesMap.entries()) {
        const firestorePayload: any = { ...patch };
        if (patch.selectedShift) {
          firestorePayload.shift = patch.selectedShift;
        }
        updateDoc(doc(db, 'patients', patientId), firestorePayload).catch((err) =>
          console.error(`Error updating moved patient ${patientId}:`, err)
        );
      }
    }

    const nextDoctorShift: 'Morning' | 'Evening' = currentShift === 'Morning' ? 'Evening' : 'Morning';
    const morningDoneDate = currentShift === 'Morning' ? todayStr : '';

    setDoctors((prev) =>
      prev.map((d) =>
        d.id === doctorId
          ? {
              ...d,
              isSessionActive: false,
              activeShift: nextDoctorShift,
              morningCompletedDate: morningDoneDate,
            }
          : d
      )
    );

    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isSessionActive: false,
        activeShift: nextDoctorShift,
        morningCompletedDate: morningDoneDate,
      });
    } catch (e) {
      console.error("Error switching shift after carry forward:", e);
    }

    return { movedCount, targetShift, targetDate };
  }, [doctors, patients]);

  const addWalkInPatient = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>): Patient => {
    const matchedDoctor = doctors.find((d) => d.id === data.doctorId);
    const targetDate = (data as any).appointmentDate || new Date().toISOString().split('T')[0];
    const fallbackShift = matchedDoctor?.activeShift || 'Morning';
    const targetShift = ((data as any).selectedShift || (data as any).shift || fallbackShift).trim();

    const matchingPatients = patients.filter((p) => {
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim();

      return (
        p.doctorId === data.doctorId &&
        pDate === targetDate &&
        pShift.toLowerCase() === targetShift.toLowerCase()
      );
    });

    const maxToken = matchingPatients.reduce((max, p) => {
      const num = typeof p.tokenNumber === 'number' ? p.tokenNumber : parseInt(String(p.tokenNumber), 10) || 0;
      return num > max ? num : max;
    }, 0);

    const nextToken = maxToken + 1;
    const customId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const resolvedHospitalId = (data as any).hospitalId || matchedDoctor?.hospitalId || matchedDoctor?.staffUsername || '';

    const newPatient: Patient = {
      ...data,
      id: customId,
      hospitalId: resolvedHospitalId,
      tokenNumber: nextToken,
      appointmentDate: targetDate,
      selectedShift: targetShift,
      shift: targetShift,
      bookingType: 'WALK_IN',
      status: 'WAITING',
      paymentStatus: 'FREE',
      paymentAmount: 0,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    } as any;

    setDoc(doc(db, 'patients', customId), newPatient).catch((err) => {
      console.error("Error adding walk-in patient:", err);
    });

    setPatients((prev) => [...prev, newPatient]);
    setLastGeneratedTokenPatient(newPatient);
    setTimeout(() => checkBotAlerts([...patients, newPatient]), 50);
    return newPatient;
  }, [patients, doctors, checkBotAlerts]);

  const bookOnlineAppointment = useCallback((data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'bookingType' | 'paymentStatus' | 'paymentAmount' | 'createdAt' | 'botCallAlertSent'>) => {
    const matchedDoctor = doctors.find((d) => d.id === data.doctorId);
    const targetDate = (data as any).appointmentDate || new Date().toISOString().split('T')[0];
    const fallbackShift = matchedDoctor?.activeShift || 'Morning';
    const targetShift = ((data as any).selectedShift || (data as any).shift || fallbackShift).trim();

    const matchingPatients = patients.filter((p) => {
      const pDate = p.appointmentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const pShift = ((p as any).selectedShift || (p as any).shift || 'Morning').trim();

      return (
        p.doctorId === data.doctorId &&
        pDate === targetDate &&
        pShift.toLowerCase() === targetShift.toLowerCase()
      );
    });

    const maxToken = matchingPatients.reduce((max, p) => {
      const num = typeof p.tokenNumber === 'number' ? p.tokenNumber : parseInt(String(p.tokenNumber), 10) || 0;
      return num > max ? num : max;
    }, 0);

    const nextToken = maxToken + 1;
    const paymentId = (data as any).paymentId || `pay_rzp_${Date.now()}`;
    const customId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const resolvedHospitalId = (data as any).hospitalId || matchedDoctor?.hospitalId || matchedDoctor?.staffUsername || '';

    const newPatient: Patient = {
      ...data,
      id: customId,
      hospitalId: resolvedHospitalId,
      tokenNumber: nextToken,
      appointmentDate: targetDate,
      selectedShift: targetShift,
      shift: targetShift,
      bookingType: 'ONLINE',
      status: 'WAITING',
      paymentStatus: 'PAID',
      paymentAmount: 20,
      paymentId,
      createdAt: new Date().toISOString(),
      botCallAlertSent: false,
    } as any;

    setDoc(doc(db, 'patients', customId), newPatient).catch((err) => {
      console.error("Error adding online patient:", err);
    });

    setPatients((prev) => [...prev, newPatient]);
    setLastGeneratedTokenPatient(newPatient);
    setTimeout(() => checkBotAlerts([...patients, newPatient]), 50);
    return { patient: newPatient, paymentId };
  }, [patients, doctors, checkBotAlerts]);

  const callPatient = useCallback((patientId: string) => {
    const updated = callPatientInCabin(patients, patientId);
    const target = updated.find((p) => p.id === patientId);
    setPatients(updated);

    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status,
        calledInAt: target.calledInAt,
      }).catch((err) => console.error("Error updating callPatient:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const completePatient = useCallback((patientId: string) => {
    const updated = completePatientConsultation(patients, patientId);
    const target = updated.find((p) => p.id === patientId);
    setPatients(updated);

    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status,
        completedAt: target.completedAt,
      }).catch((err) => console.error("Error updating completePatient:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const markNotAvailable = useCallback((patientId: string) => {
    const updated = markPatientNotAvailable(patients, patientId);
    const target = updated.find((p) => p.id === patientId);
    setPatients(updated);

    if (target) {
      updateDoc(doc(db, 'patients', patientId), {
        status: target.status,
      }).catch((err) => console.error("Error updating markNotAvailable:", err));
    }
    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  const markEmergency = useCallback((patientId: string) => {
    const updated = patients.map((p) =>
      p.id === patientId ? { ...p, isEmergency: true } : p
    );
    setPatients(updated);

    try {
      if (db) {
        updateDoc(doc(db, 'patients', patientId), { isEmergency: true }).catch((err) =>
          console.error("Firestore emergency update error:", err)
        );
      }
    } catch (e) {
      console.error("Emergency update exception:", e);
    }

    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, checkBotAlerts]);

  // 🔹 Recall Patient: Naya token nahi banega, purana token & original shift safe rahega aur current active shift me visible hoga
  const recallPatient = useCallback((patientId: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    const matchedDoc = doctors.find((d) => d.id === targetPatient.doctorId);
    const todayStr = new Date().toISOString().split('T')[0];
    const currentDoctorShift = matchedDoc?.activeShift || 'Morning';

    const pDate = targetPatient.appointmentDate || (targetPatient.createdAt ? targetPatient.createdAt.split('T')[0] : todayStr);
    const pShift = ((targetPatient as any).selectedShift || (targetPatient as any).shift || 'Morning').trim();
    const preservedOriginalShift = targetPatient.originalShift || pShift;

    const isSameCurrentShift =
      pDate === todayStr && pShift.toLowerCase() === currentDoctorShift.toLowerCase();

    const updatedDate = isSameCurrentShift ? pDate : todayStr;
    const updatedShift = isSameCurrentShift ? pShift : currentDoctorShift;

    const updated = patients.map((p) =>
      p.id === patientId
        ? ({
            ...p,
            status: 'WAITING',
            appointmentDate: updatedDate,
            selectedShift: updatedShift,
            shift: updatedShift,
            isRecalled: true,
            originalShift: preservedOriginalShift,
            botCallAlertSent: false,
          } as Patient)
        : p
    );

    setPatients(updated);

    updateDoc(doc(db, 'patients', patientId), {
      status: 'WAITING',
      appointmentDate: updatedDate,
      selectedShift: updatedShift,
      shift: updatedShift,
      isRecalled: true,
      originalShift: preservedOriginalShift,
      botCallAlertSent: false,
    }).catch((err) => console.error("Error updating recallPatient:", err));

    setTimeout(() => checkBotAlerts(updated), 50);
  }, [patients, doctors, checkBotAlerts]);

  // 🔹 Update Doctor Status + Leave Start & End Dates
  const updateDoctorStatus = useCallback(
    (doctorId: string, status: DoctorStatus, note?: string, leaveStart?: string, leaveEnd?: string) => {
      const todayStr = new Date().toISOString().split('T')[0];

      setDoctors((prev) =>
        prev.map((docItem) => {
          if (docItem.id === doctorId) {
            const updatedNote = (note !== undefined ? note : (docItem.statusNote || '')) || '';
            const resolvedLeaveStart =
              status === 'LEAVE' ? (leaveStart || docItem.leaveStartDate || todayStr) : '';
            const resolvedLeaveEnd =
              status === 'LEAVE' ? (leaveEnd || docItem.leaveEndDate || todayStr) : '';

            updateDoc(doc(db, 'doctors', doctorId), {
              status: status,
              statusNote: updatedNote,
              leaveStartDate: resolvedLeaveStart,
              leaveEndDate: resolvedLeaveEnd,
            }).catch((err) => console.error("Error updating doctor status:", err));

            return {
              ...docItem,
              status,
              statusNote: updatedNote,
              leaveStartDate: resolvedLeaveStart,
              leaveEndDate: resolvedLeaveEnd,
            };
          }
          return docItem;
        })
      );
    },
    []
  );

  const addNewDoctor = useCallback((data: Omit<Doctor, 'id' | 'status' | 'onlineTokenFee' | 'createdAt'>): Doctor => {
    const baseUsername = (data.staffUsername || data.name || 'doctor')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_');

    const customId = data.cabinNumber && data.cabinNumber !== 'Chamber'
      ? `${baseUsername}_${data.cabinNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      : baseUsername;

    const centralKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';

    const cleanedData = {
      ...data,
      profilePic: data.profilePic && data.profilePic.trim() !== ''
        ? data.profilePic.trim()
        : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
      clinicImages: Array.isArray(data.clinicImages)
        ? data.clinicImages.filter((img) => typeof img === 'string' && img.trim() !== '')
        : [],
      razorpayKeyId: data.razorpayKeyId || centralKey,
    };

    const newDoc: Doctor = {
      ...cleanedData,
      id: customId,
      status: 'AVAILABLE',
      onlineTokenFee: 20,
      createdAt: new Date().toISOString(),
      establishmentType: (data as any).establishmentType || 'CLINIC',
      hospitalId: (data as any).hospitalId || baseUsername,
      isSessionActive: false,
      activeShift: 'Morning',
    };

    const safePayload = JSON.parse(JSON.stringify(newDoc));

    setDoc(doc(db, 'doctors', customId), safePayload).catch((err) => {
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
        startDoctorSession,
        pauseDoctorSession,
        completeDoctorShift,
        moveRemainingToNextShift,
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
