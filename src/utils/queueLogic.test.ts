import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextTokenNumber,
  getCurrentlyServingToken,
  getPatientsAheadCount,
  shouldSendBotCallAlert,
  callPatientInCabin,
  completePatientConsultation,
  markPatientNotAvailable,
  markPatientEmergency,
  calculatePlatformAnalytics,
} from './queueLogic';
import { Doctor, Patient } from '../types';

const mockDoctor: Doctor = {
  id: 'doc-1',
  name: 'Dr. Rajesh Sharma',
  degree: 'MBBS, MD',
  specialty: 'Senior Physician',
  clinicName: 'Aarogya Clinic',
  cabinNumber: 'Cabin 1',
  address: 'Civil Lines, Kanpur',
  city: 'Kanpur',
  phone: '9876543210',
  timings: '10 AM - 2 PM',
  consultationFee: 400,
  onlineTokenFee: 20,
  status: 'AVAILABLE',
  staffUsername: 'staff1',
  staffPassword: 'pwd',
  avgTimePerPatientMinutes: 10,
  createdAt: new Date().toISOString(),
};

const mockPatients: Patient[] = [
  {
    id: 'p1',
    doctorId: 'doc-1',
    tokenNumber: 1,
    name: 'Amit Kumar',
    mobile: '9876500001',
    age: 32,
    gender: 'Male',
    address: 'Kanpur',
    complaint: 'Fever',
    bookingType: 'WALK_IN',
    status: 'IN_CABIN',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date().toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p2',
    doctorId: 'doc-1',
    tokenNumber: 2,
    name: 'Sunita Devi',
    mobile: '9876500002',
    age: 45,
    gender: 'Female',
    address: 'Kanpur',
    complaint: 'Cold',
    bookingType: 'WALK_IN',
    status: 'WAITING',
    paymentStatus: 'FREE',
    paymentAmount: 0,
    isEmergency: false,
    createdAt: new Date().toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p3',
    doctorId: 'doc-1',
    tokenNumber: 3,
    name: 'Rohan Gupta',
    mobile: '9876500003',
    age: 28,
    gender: 'Male',
    address: 'Lucknow',
    complaint: 'Joint Pain',
    bookingType: 'ONLINE',
    status: 'WAITING',
    paymentStatus: 'PAID',
    paymentAmount: 20,
    paymentId: 'PAY_123',
    isEmergency: false,
    createdAt: new Date().toISOString(),
    botCallAlertSent: false,
  },
  {
    id: 'p4',
    doctorId: 'doc-1',
    tokenNumber: 4,
    name: 'Pooja Singh',
    mobile: '9876500004',
    age: 24,
    gender: 'Female',
    address: 'Unnao',
    complaint: 'Headache',
    bookingType: 'ONLINE',
    status: 'WAITING',
    paymentStatus: 'PAID',
    paymentAmount: 20,
    paymentId: 'PAY_124',
    isEmergency: false,
    createdAt: new Date().toISOString(),
    botCallAlertSent: false,
  },
];

test('getNextTokenNumber returns sequential token', () => {
  const nextToken = getNextTokenNumber(mockPatients, 'doc-1');
  assert.equal(nextToken, 5);

  const emptyDocToken = getNextTokenNumber([], 'doc-new');
  assert.equal(emptyDocToken, 1);
});

test('getCurrentlyServingToken detects in-cabin token', () => {
  const serving = getCurrentlyServingToken(mockPatients, 'doc-1');
  assert.equal(serving, 1);
});

test('getPatientsAheadCount accurately counts patients in front', () => {
  // For p3 (token 3): p1 (in cabin) + p2 (waiting) = 2 ahead
  const aheadForP3 = getPatientsAheadCount(mockPatients, 'p3');
  assert.equal(aheadForP3, 2);

  // For p4 (token 4): p1 + p2 + p3 = 3 ahead
  const aheadForP4 = getPatientsAheadCount(mockPatients, 'p4');
  assert.equal(aheadForP4, 3);
});

test('shouldSendBotCallAlert triggers when 3-4 patients are ahead for online booking', () => {
  // p4 has 3 ahead -> should trigger bot call alert!
  const alertP4 = shouldSendBotCallAlert(mockPatients, mockPatients[3]);
  assert.equal(alertP4, true);

  // p2 is WALK_IN -> should NOT trigger online bot call
  const alertP2 = shouldSendBotCallAlert(mockPatients, mockPatients[1]);
  assert.equal(alertP2, false);
});

test('callPatientInCabin moves patient to IN_CABIN and completes previous', () => {
  const updated = callPatientInCabin(mockPatients, 'p2');
  const p1 = updated.find((p) => p.id === 'p1');
  const p2 = updated.find((p) => p.id === 'p2');

  assert.equal(p1?.status, 'COMPLETED');
  assert.equal(p2?.status, 'IN_CABIN');
});

test('completePatientConsultation moves patient to COMPLETED', () => {
  const updated = completePatientConsultation(mockPatients, 'p1');
  const p1 = updated.find((p) => p.id === 'p1');
  assert.equal(p1?.status, 'COMPLETED');
});

test('markPatientNotAvailable sets status to NOT_AVAILABLE', () => {
  const updated = markPatientNotAvailable(mockPatients, 'p2');
  const p2 = updated.find((p) => p.id === 'p2');
  assert.equal(p2?.status, 'NOT_AVAILABLE');
});

test('markPatientEmergency flags patient as emergency', () => {
  const updated = markPatientEmergency(mockPatients, 'p4');
  const p4 = updated.find((p) => p.id === 'p4');
  assert.equal(p4?.isEmergency, true);
  assert.equal(p4?.status, 'WAITING');
});

test('calculatePlatformAnalytics computes revenue strictly from ₹20 online bookings', () => {
  const analytics = calculatePlatformAnalytics(mockPatients, [mockDoctor]);
  // 2 online bookings (p3, p4) * ₹20 = ₹40
  assert.equal(analytics.totalRevenue, 40);
  assert.equal(analytics.totalOnlineBookings, 2);
  // 2 walk-in patients (p1, p2)
  assert.equal(analytics.totalWalkInPatients, 2);
  assert.equal(analytics.activeDoctors, 1);
});
