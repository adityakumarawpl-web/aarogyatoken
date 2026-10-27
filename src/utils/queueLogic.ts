import { Doctor, Patient, PatientStatus, SummaryReport, AdminAnalytics } from '../types';

/**
 * Calculates the next sequential token number for a doctor on the current day.
 */
export function getNextTokenNumber(patients: Patient[], doctorId: string): number {
  const doctorPatients = patients.filter((p) => p.doctorId === doctorId);
  if (doctorPatients.length === 0) return 1;
  const maxToken = Math.max(...doctorPatients.map((p) => p.tokenNumber || 0));
  return maxToken + 1;
}

/**
 * Returns the token currently being served (status = IN_CABIN).
 * If no one is inside the cabin, returns the next WAITING patient or 0 if none.
 */
export function getCurrentlyServingToken(patients: Patient[], doctorId: string): number {
  const doctorPatients = patients.filter((p) => p.doctorId === doctorId);
  const inCabin = doctorPatients.find((p) => p.status === 'IN_CABIN');
  if (inCabin) {
    return inCabin.tokenNumber;
  }
  return 0;
}

/**
 * Calculates how many patients are ahead of a specific patient in the queue.
 */
export function getPatientsAheadCount(patients: Patient[], targetPatientId: string): number {
  const target = patients.find((p) => p.id === targetPatientId);
  if (!target) return 0;
  if (target.status === 'COMPLETED' || target.status === 'IN_CABIN') return 0;

  const doctorPatients = patients.filter((p) => p.doctorId === target.doctorId);
  
  // Active queue consists of currently in cabin + waiting patients before this token
  const inCabinCount = doctorPatients.filter((p) => p.status === 'IN_CABIN').length;
  
  // Count waiting patients with higher priority (emergencies first, then lower token number)
  const waitingAhead = doctorPatients.filter((p) => {
    if (p.id === target.id) return false;
    if (p.status !== 'WAITING') return false;

    // If target is normal and other is emergency, other is ahead
    if (!target.isEmergency && p.isEmergency) return true;
    // If target is emergency and other is normal, other is NOT ahead
    if (target.isEmergency && !p.isEmergency) return false;
    
    // Otherwise earlier token is ahead
    return p.tokenNumber < target.tokenNumber;
  }).length;

  return inCabinCount + waitingAhead;
}

/**
 * Determines if an online booked patient should receive the automated Bot Call alert.
 * As requested: Trigger alert when 3 to 4 patients are left before their turn!
 */
export function shouldSendBotCallAlert(
  patients: Patient[],
  patient: Patient,
  threshold: number = 4
): boolean {
  if (patient.bookingType !== 'ONLINE') return false;
  if (patient.status !== 'WAITING') return false;
  if (patient.botCallAlertSent) return false;

  const ahead = getPatientsAheadCount(patients, patient.id);
  // Alert fires when 1 to threshold patients are ahead (configured in Super Admin, default 3-4)
  return ahead >= 1 && ahead <= threshold;
}

/**
 * State transition for queue:
 * Slide Left-to-Right: Move patient into Doctor Cabin -> status = 'IN_CABIN' (BLUE)
 * If another patient was already in cabin, that previous patient is marked 'COMPLETED' (GREEN).
 */
export function callPatientInCabin(patients: Patient[], patientId: string): Patient[] {
  const now = new Date().toISOString();
  const target = patients.find((p) => p.id === patientId);
  if (!target) return patients;

  return patients.map((p) => {
    // If another patient of the same doctor was IN_CABIN, auto-complete them
    if (p.doctorId === target.doctorId && p.id !== patientId && p.status === 'IN_CABIN') {
      return {
        ...p,
        status: 'COMPLETED',
        completedAt: now,
      };
    }
    if (p.id === patientId) {
      return {
        ...p,
        status: 'IN_CABIN',
        calledInAt: now,
      };
    }
    return p;
  });
}

/**
 * State transition for queue:
 * Slide Right-to-Left: Patient consultation done -> status = 'COMPLETED' (GREEN)
 */
export function completePatientConsultation(patients: Patient[], patientId: string): Patient[] {
  const now = new Date().toISOString();
  return patients.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        status: 'COMPLETED',
        completedAt: now,
      };
    }
    return p;
  });
}

/**
 * Marks patient as Not Available / Skipped
 */
export function markPatientNotAvailable(patients: Patient[], patientId: string): Patient[] {
  return patients.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        status: 'NOT_AVAILABLE',
      };
    }
    return p;
  });
}

/**
 * Marks patient as Emergency -> gives them urgent priority
 */
export function markPatientEmergency(patients: Patient[], patientId: string): Patient[] {
  return patients.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        isEmergency: true,
        // Keep status as WAITING so they are placed at top of waiting list
        status: 'WAITING',
      };
    }
    return p;
  });
}

/**
 * Re-activates a skipped / not-available patient back into the waiting queue
 */
export function recallPatient(patients: Patient[], patientId: string): Patient[] {
  return patients.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        status: 'WAITING',
      };
    }
    return p;
  });
}

/**
 * Computes summary reports for a doctor: Day, Week, Month, Year
 */
export function generateDoctorSummary(
  patients: Patient[],
  doctorId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'day'
): SummaryReport {
  const now = new Date();
  const doctorPatients = patients.filter((p) => {
    if (p.doctorId !== doctorId) return false;
    const pDate = new Date(p.createdAt);

    if (period === 'day') {
      return (
        pDate.getDate() === now.getDate() &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear()
      );
    } else if (period === 'week') {
      const diffTime = Math.abs(now.getTime() - pDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } else if (period === 'month') {
      return (
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear()
      );
    } else {
      // year
      return pDate.getFullYear() === now.getFullYear();
    }
  });

  const totalRegistered = doctorPatients.length;
  const totalCompleted = doctorPatients.filter((p) => p.status === 'COMPLETED').length;
  const totalWaiting = doctorPatients.filter((p) => p.status === 'WAITING' || p.status === 'IN_CABIN').length;
  const totalWalkIn = doctorPatients.filter((p) => p.bookingType === 'WALK_IN').length;
  const totalOnline = doctorPatients.filter((p) => p.bookingType === 'ONLINE').length;
  const totalEmergency = doctorPatients.filter((p) => p.isEmergency).length;
  const totalNotAvailable = doctorPatients.filter((p) => p.status === 'NOT_AVAILABLE').length;

  return {
    period,
    totalRegistered,
    totalCompleted,
    totalWaiting,
    totalWalkIn,
    totalOnline,
    totalEmergency,
    totalNotAvailable,
    avgWaitTimeMinutes: 12,
    totalOnlineRevenueDoctorTokens: totalOnline * 20,
  };
}

/**
 * Calculates platform SaaS analytics for Super Admin (Owner):
 * Revenue is 100% derived from ₹20 online booking fees.
 */
export function calculatePlatformAnalytics(patients: Patient[], doctors: Doctor[]): AdminAnalytics {
  const now = new Date();
  
  let totalRevenue = 0;
  let todayRevenue = 0;
  let totalOnlineBookings = 0;
  let todayOnlineBookings = 0;
  let totalWalkInPatients = 0;
  let todayWalkInPatients = 0;

  patients.forEach((p) => {
    const isToday =
      new Date(p.createdAt).toDateString() === now.toDateString();

    if (p.bookingType === 'ONLINE') {
      totalOnlineBookings += 1;
      totalRevenue += 20;
      if (isToday) {
        todayOnlineBookings += 1;
        todayRevenue += 20;
      }
    } else {
      totalWalkInPatients += 1;
      if (isToday) {
        todayWalkInPatients += 1;
      }
    }
  });

  const activeDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;

  return {
    totalRevenue,
    todayRevenue,
    totalOnlineBookings,
    todayOnlineBookings,
    totalWalkInPatients,
    todayWalkInPatients,
    totalDoctors: doctors.length,
    activeDoctors,
  };
}
