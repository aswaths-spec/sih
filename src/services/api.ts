import {
  User,
  UserRole,
  Patient,
  Facility,
  ScoredFacility,
  TriageRecord,
  Referral,
  Appointment,
  CareJourney,
  CareGap,
  AuditLog,
  Notification
} from '../types';

const TOKEN_KEY = 'caregrid_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User; profile: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  switchPersona: (role: UserRole, userId?: string) =>
    request<{ token: string; user: User; profile: any }>('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ role, userId })
    }),

  getCurrentUser: () =>
    request<{ user: User; profile: any }>('/auth/me'),

  resetDemo: () =>
    request<{ success: boolean; message: string }>('/auth/reset-demo', {
      method: 'POST'
    }),

  // Triage
  assessTriage: (payload: {
    patientId?: string;
    symptoms?: string;
    symptomsList?: string[];
    duration?: string;
    vitals?: any;
    language?: string;
  }) =>
    request<{ triage: TriageRecord; evaluation: any }>('/triage/assess', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  confirmTriage: (triageId: string, overrideUrgency?: string, clinicalNotes?: string) =>
    request<{ success: boolean; triage: TriageRecord }>('/triage/confirm', {
      method: 'POST',
      body: JSON.stringify({ triageId, overrideUrgency, clinicalNotes })
    }),

  // Facilities & Capacity Routing
  getFacilities: () => request<Facility[]>('/facilities'),

  recommendFacilities: (payload: {
    patientLatitude?: number;
    patientLongitude?: number;
    urgency?: string;
    requiredSpecialty?: string;
    requiredDiagnostics?: string[];
    patientId?: string;
  }) =>
    request<{
      recommendations: ScoredFacility[];
      patientLocation: { latitude: number; longitude: number };
      criteria: any;
    }>('/facilities/recommend', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateFacilityCapacity: (
    facilityId: string,
    capacity: {
      occupiedBeds?: number;
      occupiedIcuBeds?: number;
      currentQueueLength?: number;
      averageWaitTimeMin?: number;
    }
  ) =>
    request<{ success: boolean; facility: Facility }>(`/facilities/${facilityId}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify(capacity)
    }),

  // Referrals
  getReferrals: () => request<Referral[]>('/referrals'),

  createReferral: (payload: {
    patientId: string;
    triageId?: string;
    targetFacilityId: string;
    reasonForReferral: string;
    clinicalSummary: string;
    priorityLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  }) =>
    request<Referral>('/referrals', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateReferralStatus: (
    referralId: string,
    status: string,
    notes?: string,
    rejectionReason?: string
  ) =>
    request<Referral>(`/referrals/${referralId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, rejectionReason })
    }),

  // Appointments
  getAppointments: () => request<Appointment[]>('/appointments'),

  createAppointment: (payload: {
    patientId: string;
    facilityId: string;
    referralId?: string;
    scheduledFor: string;
    department: string;
    notes?: string;
  }) =>
    request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAppointmentStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Care Journey
  getCareJourney: (patientId?: string) =>
    request<CareJourney>(patientId ? `/care-journey/${patientId}` : '/care-journey'),

  // Care-Gap Radar
  getCareGaps: () => request<CareGap[]>('/care-gaps'),

  resolveCareGap: (id: string, status: string, actionTaken: string, resolutionNotes?: string) =>
    request<CareGap>(`/care-gaps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actionTaken, resolutionNotes })
    }),

  // Patients
  getPatients: () => request<Patient[]>('/patients'),

  getPatientById: (id: string) => request<Patient>(`/patients/${id}`),

  registerPatient: (payload: any) =>
    request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Consents
  getConsents: (patientId?: string) =>
    request<any[]>(patientId ? `/consents/${patientId}` : '/consents'),

  updateConsent: (consentId: string, status: 'GRANT' | 'REVOKE') =>
    request<{ success: boolean; consent: any }>('/consents', {
      method: 'PATCH',
      body: JSON.stringify({ consentId, status })
    }),

  // Diagnostics
  getDiagnostics: () => request<any[]>('/diagnostics'),

  createDiagnostic: (payload: any) =>
    request<any>('/diagnostics', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateDiagnosticStatus: (id: string, status: string, resultSummary?: string) =>
    request<any>(`/diagnostics/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resultSummary })
    }),

  // Medicines
  getMedicines: (facilityId?: string) =>
    request<any[]>(facilityId ? `/medicines?facilityId=${facilityId}` : '/medicines'),

  updateMedicineStock: (id: string, stockCount: number, isAvailable: boolean) =>
    request<any>(`/medicines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stockCount, isAvailable })
    }),

  // Teleconsultation (eSanjeevani)
  requestTeleconsultation: (payload: any) =>
    request<any>('/teleconsultation/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Offline Smart Care Pack
  getSmartCarePack: () => request<any>('/offline/care-pack'),

  syncOfflineData: (actions: any[]) =>
    request<any>('/offline/sync', {
      method: 'POST',
      body: JSON.stringify({ actions })
    }),

  // Dashboard & Analytics
  getDashboardStats: () => request<any>('/dashboard/stats'),

  // Audit
  getAuditLogs: () => request<AuditLog[]>('/audit'),

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    })
};
