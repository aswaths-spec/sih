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
router.post('/triage/confirm', authenticateToken, requireRole('HEALTH_WORKER', 'DOCTOR', 'SYSTEM_ADMIN'), ctrl.confirmTriage);

// ================= FACILITIES & CAPACITY ROUTING =================
router.get('/facilities', authenticateToken, ctrl.getFacilities);
router.get('/facilities/:id', authenticateToken, ctrl.getFacilityById);
router.post('/facilities', authenticateToken, ctrl.createFacility);
router.post('/facilities/recommend', authenticateToken, ctrl.recommendFacilitiesController);
router.patch(
  '/facilities/:id/capacity',
  authenticateToken,
  requireRole('FACILITY_ADMIN', 'SYSTEM_ADMIN'),
  ctrl.updateFacilityCapacity
);

// ================= REFERRALS & HANDSHAKE =================
router.get('/referrals', authenticateToken, ctrl.getReferrals);
router.post('/referrals', authenticateToken, ctrl.createReferralController);
router.patch('/referrals/:id/status', authenticateToken, ctrl.updateReferralStatusController);

// ================= APPOINTMENTS & QUEUE =================
router.get('/appointments', authenticateToken, ctrl.getAppointments);
router.post('/appointments', authenticateToken, ctrl.createAppointmentController);
router.patch('/appointments/:id/status', authenticateToken, ctrl.updateAppointmentStatusController);

// ================= CARE JOURNEY =================
router.get('/care-journey', authenticateToken, ctrl.getCareJourney);
router.get('/care-journey/:patientId', authenticateToken, ctrl.getCareJourney);

// ================= CARE-GAP RADAR =================
router.get('/care-gaps', authenticateToken, ctrl.getCareGaps);
router.patch(
  '/care-gaps/:id',
  authenticateToken,
  requireRole('HEALTH_WORKER', 'DOCTOR', 'SYSTEM_ADMIN'),
  ctrl.resolveCareGap
);

// ================= PATIENTS & RECORDS =================
router.get('/patients', authenticateToken, ctrl.getPatients);
router.get('/patients/:id', authenticateToken, ctrl.getPatientById);
router.post('/patients', authenticateToken, requireRole('HEALTH_WORKER', 'DOCTOR', 'SYSTEM_ADMIN'), ctrl.registerPatient);

// ================= CONSENTS =================
router.get('/consents', authenticateToken, ctrl.getConsents);
router.get('/consents/:patientId', authenticateToken, ctrl.getConsents);
router.patch('/consents', authenticateToken, ctrl.updateConsent);

// ================= DIAGNOSTICS =================
router.get('/diagnostics', authenticateToken, ctrl.getDiagnostics);
router.post('/diagnostics', authenticateToken, requireRole('DOCTOR', 'HEALTH_WORKER', 'SYSTEM_ADMIN'), ctrl.createDiagnostic);
router.patch('/diagnostics/:id/status', authenticateToken, ctrl.updateDiagnosticStatus);

// ================= MEDICINE AVAILABILITY =================
router.get('/medicines', authenticateToken, ctrl.getMedicines);
router.patch(
  '/medicines/:id',
  authenticateToken,
  requireRole('FACILITY_ADMIN', 'SYSTEM_ADMIN'),
  ctrl.updateMedicineStock
);

// ================= TELECONSULTATION (eSanjeevani) =================
router.post('/teleconsultation/request', authenticateToken, ctrl.requestTeleconsultation);

// ================= OFFLINE SMART CARE PACK & SYNC =================
router.get(
  '/offline/care-pack',
  authenticateToken,
  requireRole('HEALTH_WORKER', 'SYSTEM_ADMIN'),
  ctrl.getSmartCarePack
);
router.post(
  '/offline/sync',
  authenticateToken,
  requireRole('HEALTH_WORKER', 'SYSTEM_ADMIN'),
  ctrl.syncOfflineData
);

// ================= DASHBOARD & ANALYTICS =================
router.get('/dashboard/stats', authenticateToken, ctrl.getDashboardStats);

// ================= AUDIT LOGS =================
router.get(
  '/audit',
  authenticateToken,
  requireRole('SYSTEM_ADMIN', 'FACILITY_ADMIN', 'DOCTOR', 'HEALTH_WORKER'),
  ctrl.getAuditLogs
);

// ================= NOTIFICATIONS =================
router.get('/notifications', authenticateToken, ctrl.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, ctrl.markNotificationRead);

export default router;
