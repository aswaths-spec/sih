export type UserRole = 'PATIENT' | 'ASHA_WORKER' | 'HOSPITAL_DOCTOR' | 'ADMIN';
export type AnyUserRole = UserRole | 'HEALTH_WORKER' | 'DOCTOR' | 'FACILITY_ADMIN' | 'SYSTEM_ADMIN';

export type TriageUrgency = 'RED' | 'ORANGE' | 'GREEN';

export type ReferralStatus =
  | 'CREATED'
  | 'SENT'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'APPOINTMENT_ASSIGNED'
  | 'PATIENT_ARRIVED'
  | 'CONSULTATION_COMPLETED'
  | 'FOLLOWUP_REQUIRED'
  | 'COMPLETED';

export type AppointmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'REFERRED'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'MISSED';

export type CareGapStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CONTACTED' | 'RESOLVED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  patientId?: string;
  workerId?: string;
  doctorId?: string;
  facilityId?: string;
  active?: boolean;
}

export interface Patient {
  id: string;
  userId: string;
  abhaId?: string;
  name: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  addressVillage: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  assignedWorkerId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
}

export type FacilityType =
  | 'PHC'
  | 'CHC'
  | 'Sub-District Hospital'
  | 'District Hospital'
  | 'Specialist Medical College'
  | 'Private Empanelled';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  category: 'Public' | 'Private' | 'Trust' | 'Associated';
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  phone: string;
  emergencyCapability: boolean;
  totalBeds: number;
  occupiedBeds: number;
  icuBeds: number;
  occupiedIcuBeds: number;
  currentQueueLength: number;
  averageWaitTimeMin: number;
  specialists: { specialty: string; available: boolean; doctorName: string }[];
  services: string[];
  availableDiagnostics: string[];
  medicineStockRatio: number;
}

export interface ScoredFacility {
  facility: Facility;
  totalScore: number;
  distanceKm: number;
  estimatedTravelTimeMin: number;
  reasons: string[];
  scoreBreakdown: {
    capabilityMatch: number;
    specialistMatch: number;
    capacityScore: number;
    diagnosticAvailability: number;
    medicineAvailability: number;
    distanceScore: number;
  };
}

export interface TriageRecord {
  id: string;
  patientId: string;
  symptoms: string;
  symptomsList: string[];
  duration: string;
  vitals?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    spo2?: number;
    temperatureF?: number;
  };
  urgency: TriageUrgency;
  reasons: string[];
  warningSigns: string[];
  recommendedAction: string;
  confidenceScore: number;
  humanConfirmed: boolean;
  confirmedByWorkerId?: string;
  confirmedByWorkerName?: string;
  aiClinicalSummary?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referralCode: string;
  patientId: string;
  triageId?: string;
  referringWorkerId?: string;
  referringWorkerName?: string;
  targetFacilityId: string;
  targetFacilityName: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  reasonForReferral: string;
  clinicalSummary: string;
  status: ReferralStatus;
  rejectionReason?: string;
  alternativeFacilityId?: string;
  alternativeFacilityName?: string;
  priorityLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  statusHistory: {
    status: ReferralStatus;
    notes?: string;
    updatedBy: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  tokenNumber: string;
  patientId: string;
  patientName?: string;
  facilityId: string;
  facilityName: string;
  department: string;
  doctorId?: string;
  doctorName?: string;
  disease?: string;
  healthIssue?: string;
  declineReason?: string;
  referredFacilityId?: string;
  referredFacilityName?: string;
  referralId?: string;
  scheduledFor: string;
  status: AppointmentStatus;
  estimatedWaitMinutes: number;
  notes?: string;
  createdAt: string;
}

export interface CareJourneyStep {
  id: string;
  stepOrder: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' | 'DELAYED';
  scheduledAt?: string;
  completedAt?: string;
  notes?: string;
  actionRequired?: string;
}

export interface CareJourney {
  id: string;
  patientId: string;
  patientName?: string;
  referralId?: string;
  appointmentId?: string;
  facilityName?: string;
  tokenNumber?: string;
  title: string;
  overallStatus: 'ACTIVE' | 'COMPLETED' | 'DELAYED';
  currentStage: string;
  nextBestAction: string;
  steps: CareJourneyStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CareGap {
  id: string;
  patientId: string;
  patientName: string;
  gapType:
    | 'MISSED_APPOINTMENT'
    | 'PENDING_REFERRAL'
    | 'DIAGNOSTIC_OVERDUE'
    | 'FOLLOWUP_OVERDUE'
    | 'HIGH_RISK_UNREVIEWED';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  dueDate: string;
  detectedDate: string;
  responsibleWorkerId?: string;
  responsibleWorkerName?: string;
  status: CareGapStatus;
  actionTaken?: string;
  resolutionNotes?: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  facilityId: string;
  name: string;
  category: string;
  stockCount: number;
  unit: string;
  isAvailable: boolean;
  lastUpdated: string;
}

export interface DiagnosticRequest {
  id: string;
  testName: string;
  patientId: string;
  patientName: string;
  facilityId: string;
  facilityName: string;
  status: 'REQUESTED' | 'AVAILABLE' | 'SCHEDULED' | 'COMPLETED' | 'OVERDUE';
  requiredDate: string;
  resultSummary?: string;
  createdAt: string;
}

export interface Consent {
  id: string;
  patientId: string;
  requestedBy: string;
  purpose: string;
  dataScope: 'ALL' | 'CONSULTATIONS' | 'DIAGNOSTICS' | 'MEDICATIONS';
  status: 'GRANT' | 'REVOKE' | 'EXPIRE';
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'EMERGENCY' | 'REFERRAL' | 'APPOINTMENT' | 'CARE_GAP' | 'DIAGNOSTIC';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}
