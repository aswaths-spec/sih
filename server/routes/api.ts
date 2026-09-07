import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/apiControllers';

const router = Router();

// ================= PUBLIC AUTH & DEMO ROUTES =================
router.post('/auth/login', ctrl.login);
router.post('/auth/register', ctrl.register);
router.post('/auth/switch-persona', ctrl.switchPersona);
router.post('/auth/reset-demo', ctrl.resetDemo);
router.get('/auth/me', authenticateToken, ctrl.getCurrentUser);

// ================= TRIAGE =================
router.post('/triage/assess', authenticateToken, ctrl.assessTriage);
router.post(
  '/triage/confirm',
  authenticateToken,
  requireRole('ASHA_WORKER', 'HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.confirmTriage
);

// ================= FACILITIES & CAPACITY ROUTING =================
router.get('/facilities', authenticateToken, ctrl.getFacilities);
router.get('/facilities/:id', authenticateToken, ctrl.getFacilityById);
router.post('/facilities', authenticateToken, requireRole('ADMIN'), ctrl.createFacility);
router.post('/facilities/recommend', authenticateToken, ctrl.recommendFacilitiesController);
router.patch(
  '/facilities/:id/capacity',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.updateFacilityCapacity
);

// ================= REFERRALS & HANDSHAKE =================
router.get('/referrals', authenticateToken, ctrl.getReferrals);
router.post(
  '/referrals',
  authenticateToken,
  requireRole('PATIENT', 'ASHA_WORKER', 'ADMIN'),
  ctrl.createReferralController
);
router.patch(
  '/referrals/:id/status',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.updateReferralStatusController
);

// ================= APPOINTMENTS & QUEUE =================
router.get('/appointments', authenticateToken, ctrl.getAppointments);
router.post('/appointments', authenticateToken, ctrl.createAppointmentController);
router.post(
  '/appointments/:id/accept',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.acceptAppointmentController
);
router.post(
  '/appointments/:id/decline',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.declineAppointmentController
);
router.post(
  '/appointments/:id/refer',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.referAppointmentController
);
router.patch(
  '/appointments/:id/status',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.updateAppointmentStatusController
);

// ================= CARE JOURNEY =================
router.get('/care-journey', authenticateToken, ctrl.getCareJourney);
router.get('/care-journey/:patientId', authenticateToken, ctrl.getCareJourney);
router.post('/care-journey/:patientId/advance', authenticateToken, ctrl.advanceCareJourney);
router.post('/care-journey/:patientId/treat-full', authenticateToken, ctrl.treatPatientFull);
router.post('/care-journey/:patientId/reset', authenticateToken, ctrl.resetCareJourney);

// ================= CARE-GAP RADAR =================
router.get(
  '/care-gaps',
  authenticateToken,
  requireRole('ASHA_WORKER', 'HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.getCareGaps
);
router.patch(
  '/care-gaps/:id',
  authenticateToken,
  requireRole('ASHA_WORKER', 'HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.resolveCareGap
);

// ================= PATIENTS & RECORDS =================
router.get('/patients', authenticateToken, ctrl.getPatients);
router.get('/patients/:id', authenticateToken, ctrl.getPatientById);
router.post(
  '/patients',
  authenticateToken,
  requireRole('ASHA_WORKER', 'ADMIN'),
  ctrl.registerPatient
);

// ================= CONSENTS =================
router.get('/consents', authenticateToken, ctrl.getConsents);
router.get('/consents/:patientId', authenticateToken, ctrl.getConsents);
router.patch('/consents', authenticateToken, ctrl.updateConsent);

// ================= DIAGNOSTICS =================
router.get('/diagnostics', authenticateToken, ctrl.getDiagnostics);
router.post(
  '/diagnostics',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.createDiagnostic
);
router.patch(
  '/diagnostics/:id/status',
  authenticateToken,
  requireRole('HOSPITAL_DOCTOR', 'ADMIN'),
  ctrl.updateDiagnosticStatus
);

// ================= MEDICINE AVAILABILITY =================
router.get('/medicines', authenticateToken, ctrl.getMedicines);
router.patch(
  '/medicines/:id',
  authenticateToken,
  requireRole('ADMIN'),
  ctrl.updateMedicineStock
);

// ================= TELECONSULTATION (eSanjeevani) =================
router.post('/teleconsultation/request', authenticateToken, ctrl.requestTeleconsultation);

// ================= OFFLINE SMART CARE PACK & SYNC =================
router.get(
  '/offline/care-pack',
  authenticateToken,
  requireRole('ASHA_WORKER', 'ADMIN'),
  ctrl.getSmartCarePack
);
router.post(
  '/offline/sync',
  authenticateToken,
  requireRole('ASHA_WORKER', 'ADMIN'),
  ctrl.syncOfflineData
);

// ================= DASHBOARD & ANALYTICS =================
router.get('/dashboard/stats', authenticateToken, ctrl.getDashboardStats);

// ================= AUDIT LOGS =================
router.get(
  '/audit',
  authenticateToken,
  requireRole('ADMIN'),
  ctrl.getAuditLogs
);

// ================= NOTIFICATIONS =================
router.get('/notifications', authenticateToken, ctrl.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, ctrl.markNotificationRead);

// ================= ADMIN RBAC & USER MANAGEMENT =================
router.get('/admin/users', authenticateToken, requireRole('ADMIN'), ctrl.getAdminUsers);
router.patch('/admin/users/:id/role', authenticateToken, requireRole('ADMIN'), ctrl.updateAdminUserRole);
router.patch('/admin/users/:id/status', authenticateToken, requireRole('ADMIN'), ctrl.updateAdminUserStatus);
router.get('/admin/doctors', authenticateToken, requireRole('ADMIN'), ctrl.getAdminDoctors);

export default router;
