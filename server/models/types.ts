export type UserRole = 'PATIENT' | 'HEALTH_WORKER' | 'DOCTOR' | 'FACILITY_ADMIN' | 'SYSTEM_ADMIN';

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
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'MISSED';

export type CareGapStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CONTACTED' | 'RESOLVED';

export type ConsentStatus = 'GRANT' | 'REVOKE' | 'EXPIRE';

export type DiagnosticStatus = 'REQUESTED' | 'AVAILABLE' | 'SCHEDULED' | 'COMPLETED' | 'OVERDUE';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
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

export interface HealthWorker {
  id: string;
  userId: string;
  name: string;
  workerType: 'ASHA' | 'ANM' | 'CHO' | 'MPW';
  assignedVillage: string;
  assignedDistrict: string;
  facilityId?: string;
  phone: string;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  facilityId: string;
  phone: string;
}

export interface FacilityAdmin {
  id: string;
  userId: string;
  name: string;
  facilityId: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'PHC' | 'CHC' | 'Sub-District Hospital' | 'District Hospital' | 'Specialist Medical College';
  category: 'Public' | 'Trust' | 'Associated';
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
  medicineStockRatio: number; // 0.0 to 1.0 (e.g. 0.85 = 85% essential medicines in stock)
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

export interface TriageAssessment {
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
  facilityId: string;
  facilityName: string;
  referralId?: string;
  scheduledFor: string;
  status: AppointmentStatus;
  department: string;
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
  referralId?: string;
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

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  responsibleWorkerId?: string;
  dueDate: string;
  reason: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  missedAlertRaised: boolean;
}

export interface DiagnosticRequest {
  id: string;
  testName: string;
  patientId: string;
  patientName: string;
  requestingDoctorId?: string;
  requestingDoctorName?: string;
  facilityId: string;
  facilityName: string;
  status: DiagnosticStatus;
  requiredDate: string;
  scheduledDate?: string;
  resultSummary?: string;
  createdAt: string;
}

export interface Consent {
  id: string;
  patientId: string;
  requestedBy: string;
  purpose: string;
  dataScope: 'ALL' | 'CONSULTATIONS' | 'DIAGNOSTICS' | 'MEDICATIONS';
  status: ConsentStatus;
  createdAt: string;
  expiresAt: string;
}

export interface Teleconsultation {
  id: string;
  patientId: string;
  patientName: string;
  provider: string;
  roomUrl: string;
  sessionToken: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  notes?: string;
  doctorName?: string;
  createdAt: string;
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
