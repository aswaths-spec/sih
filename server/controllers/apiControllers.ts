import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { db } from '../repositories/db';
import { ENV } from '../config/env';
import { evaluateTriage } from '../services/triageService';
import { recommendFacilities } from '../services/facilityRoutingService';
import { createReferral, updateReferralStatus } from '../services/referralService';
import { createAppointment, updateAppointmentStatus } from '../services/appointmentService';
import { scanAndDetectCareGaps, updateCareGapStatus } from '../services/careGapService';
import { generateSmartCarePack, processOfflineSync } from '../services/offlineSyncService';
import { teleconsultationService } from '../integrations/eSanjeevaniAdapter';
import { abdmService } from '../integrations/abdmAdapter';
import { UserRole } from '../models/types';

// ================= AUTH CONTROLLER =================

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials. Please verify email and password.' });
    return;
  }

  // Support demo password or bcrypt compare
  const isMatch = password === 'CareGrid@123' || bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid password. (Demo password is "CareGrid@123")' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  let patient = user.role === 'PATIENT' ? db.patients.find(p => p.userId === user.id) : undefined;
  let healthWorker = user.role === 'HEALTH_WORKER' ? db.healthWorkers.find(w => w.userId === user.id) : undefined;
  let doctor = user.role === 'DOCTOR' ? db.doctors.find(d => d.userId === user.id) : undefined;
  let facilityAdmin = user.role === 'FACILITY_ADMIN' ? db.facilityAdmins.find(f => f.userId === user.id) : undefined;

  db.logAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    resource: `User/${user.id}`,
    details: `Successful authentication with role ${user.role}`
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    },
    profile: patient || healthWorker || doctor || facilityAdmin || null
  });
}

// Quick Switcher for Demo / Hackathon Evaluators
export async function switchPersona(req: AuthRequest, res: Response) {
  const { role, userId } = req.body;
  let targetUser = userId ? db.users.find(u => u.id === userId) : db.users.find(u => u.role === role);

  if (!targetUser) {
    targetUser = db.users[0];
  }

  const token = jwt.sign(
    { id: targetUser.id, email: targetUser.email, role: targetUser.role, name: targetUser.name },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  let patient = targetUser.role === 'PATIENT' ? db.patients.find(p => p.userId === targetUser.id) : undefined;
  let healthWorker = targetUser.role === 'HEALTH_WORKER' ? db.healthWorkers.find(w => w.userId === targetUser.id) : undefined;
  let doctor = targetUser.role === 'DOCTOR' ? db.doctors.find(d => d.userId === targetUser.id) : undefined;
  let facilityAdmin = targetUser.role === 'FACILITY_ADMIN' ? db.facilityAdmins.find(f => f.userId === targetUser.id) : undefined;

  db.logAudit({
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'PERSONA_SWITCHED',
    resource: `User/${targetUser.id}`,
    details: `Evaluator switched persona to ${targetUser.role} (${targetUser.name})`
  });

  res.json({
    token,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      phone: targetUser.phone
    },
    profile: patient || healthWorker || doctor || facilityAdmin || null
  });
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let patient = user.role === 'PATIENT' ? db.patients.find(p => p.userId === user.id) : undefined;
  let healthWorker = user.role === 'HEALTH_WORKER' ? db.healthWorkers.find(w => w.userId === user.id) : undefined;
  let doctor = user.role === 'DOCTOR' ? db.doctors.find(d => d.userId === user.id) : undefined;
  let facilityAdmin = user.role === 'FACILITY_ADMIN' ? db.facilityAdmins.find(f => f.userId === user.id) : undefined;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    },
    profile: patient || healthWorker || doctor || facilityAdmin || null
  });
}

export async function resetDemo(req: AuthRequest, res: Response) {
  db.resetToDemo();
  db.logAudit({
    userName: req.user?.name || 'System Admin',
    action: 'DEMO_DATA_RESET',
    resource: 'System',
    details: 'Database restored to initial pristine demo scenario'
  });
  res.json({ success: true, message: 'CareGrid database restored to initial scenario data' });
}

// ================= TRIAGE CONTROLLER =================

export async function assessTriage(req: AuthRequest, res: Response) {
  try {
    const { patientId, symptoms, symptomsList, duration, vitals, language } = req.body;
    if (!symptoms && (!symptomsList || symptomsList.length === 0)) {
      res.status(400).json({ error: 'Symptoms description or symptoms list required' });
      return;
    }

    const triageResult = await evaluateTriage({
      patientId: patientId || req.user?.patientId || 'pat-1',
      symptoms: symptoms || (symptomsList || []).join(', '),
      symptomsList,
      duration: duration || 'Not specified',
      vitals,
      language: language || 'en'
    });

    const activePatientId = patientId || req.user?.patientId || 'pat-1';

    // Store triage record in database
    const triageRecord = {
      id: 'trg-' + Date.now(),
      patientId: activePatientId,
      symptoms: symptoms || (symptomsList || []).join(', '),
      symptomsList: symptomsList || [],
      duration: duration || 'Recent onset',
      vitals,
      urgency: triageResult.urgency,
      reasons: triageResult.reasons,
      warningSigns: triageResult.warningSigns,
      recommendedAction: triageResult.recommendedAction,
      confidenceScore: triageResult.confidenceScore,
      humanConfirmed: req.user?.role === 'HEALTH_WORKER' || req.user?.role === 'DOCTOR',
      confirmedByWorkerId: req.user?.workerId,
      confirmedByWorkerName: req.user?.workerId ? req.user.name : undefined,
      aiClinicalSummary: triageResult.aiClinicalSummary,
      createdAt: new Date().toISOString()
    };

    db.triages.unshift(triageRecord);

    // If emergency RED, immediately alert health workers & facility
    if (triageResult.urgency === 'RED') {
      db.createNotification({
        userId: 'usr-hw-1',
        title: 'EMERGENCY RED Triage Alert!',
        message: `Emergency triage detected for patient. Recommended immediate evaluation!`,
        type: 'EMERGENCY',
        linkUrl: '/triage'
      });
    }

    db.logAudit({
      userName: req.user?.name || 'Triage Engine',
      userRole: req.user?.role,
      action: 'TRIAGE_EVALUATION',
      resource: `TriageAssessment/${triageRecord.id}`,
      details: `Evaluated triage as ${triageResult.urgency}. Vitals: ${JSON.stringify(vitals || {})}`
    });

    db.save();

    res.json({
      triage: triageRecord,
      evaluation: triageResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing triage' });
  }
}

export async function confirmTriage(req: AuthRequest, res: Response) {
  const { triageId, overrideUrgency, clinicalNotes } = req.body;
  const triage = db.triages.find(t => t.id === triageId);
  if (!triage) {
    res.status(404).json({ error: 'Triage assessment not found' });
    return;
  }

  triage.humanConfirmed = true;
  triage.confirmedByWorkerId = req.user?.workerId || req.user?.id;
  triage.confirmedByWorkerName = req.user?.name || 'Authorized Health Worker';
  if (overrideUrgency) {
    triage.urgency = overrideUrgency;
  }
  if (clinicalNotes) {
    triage.aiClinicalSummary = (triage.aiClinicalSummary || '') + ` [Clinician Notes: ${clinicalNotes}]`;
  }

  db.logAudit({
    userName: req.user?.name || 'Health Worker',
    action: 'TRIAGE_CONFIRMED',
    resource: `TriageAssessment/${triage.id}`,
    details: `Human confirmed by ${req.user?.name}. Urgency: ${triage.urgency}`
  });

  db.save();
  res.json({ success: true, triage });
}

// ================= FACILITY CONTROLLER =================

export async function getFacilities(req: AuthRequest, res: Response) {
  res.json(db.facilities);
}

export async function getFacilityById(req: AuthRequest, res: Response) {
  const fac = db.facilities.find(f => f.id === req.params.id);
  if (!fac) {
    res.status(404).json({ error: 'Facility not found' });
    return;
  }
  res.json(fac);
}

export async function recommendFacilitiesController(req: AuthRequest, res: Response) {
  const {
    patientLatitude,
    patientLongitude,
    urgency,
    requiredSpecialty,
    requiredDiagnostics,
    maxDistanceKm
  } = req.body;

  let lat = patientLatitude;
  let lon = patientLongitude;

  // Fallback to patient's recorded location if not passed
  if (!lat || !lon) {
    const patientId = req.user?.patientId || req.body.patientId || 'pat-1';
    const patient = db.patients.find(p => p.id === patientId);
    if (patient) {
      lat = patient.latitude;
      lon = patient.longitude;
    } else {
      lat = 18.825;
      lon = 74.378;
    }
  }

  const recommendations = recommendFacilities({
    patientLatitude: Number(lat),
    patientLongitude: Number(lon),
    urgency: urgency || 'ORANGE',
    requiredSpecialty,
    requiredDiagnostics,
    maxDistanceKm
  });

  res.json({
    recommendations,
    patientLocation: { latitude: lat, longitude: lon },
    criteria: { urgency, requiredSpecialty, requiredDiagnostics }
  });
}

export async function updateFacilityCapacity(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { occupiedBeds, occupiedIcuBeds, currentQueueLength, averageWaitTimeMin } = req.body;

  const fac = db.facilities.find(f => f.id === id);
  if (!fac) {
    res.status(404).json({ error: 'Facility not found' });
    return;
  }

  if (occupiedBeds !== undefined) fac.occupiedBeds = Number(occupiedBeds);
  if (occupiedIcuBeds !== undefined) fac.occupiedIcuBeds = Number(occupiedIcuBeds);
  if (currentQueueLength !== undefined) fac.currentQueueLength = Number(currentQueueLength);
  if (averageWaitTimeMin !== undefined) fac.averageWaitTimeMin = Number(averageWaitTimeMin);

  db.logAudit({
    userName: req.user?.name || 'Facility Admin',
    action: 'FACILITY_CAPACITY_UPDATED',
    resource: `Facility/${fac.id}`,
    details: `Updated capacity: ${fac.occupiedBeds}/${fac.totalBeds} beds, queue: ${fac.currentQueueLength}`
  });

  db.save();
  res.json({ success: true, facility: fac });
}

// ================= REFERRAL CONTROLLER =================

export async function getReferrals(req: AuthRequest, res: Response) {
  let referrals = db.referrals;

  // Role-based scoping
  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    referrals = referrals.filter(r => r.patientId === req.user?.patientId);
  } else if (req.user?.role === 'HEALTH_WORKER' && req.user.workerId) {
    referrals = referrals.filter(
      r => r.referringWorkerId === req.user?.workerId || db.patients.some(p => p.assignedWorkerId === req.user?.workerId && p.id === r.patientId)
    );
  } else if ((req.user?.role === 'DOCTOR' || req.user?.role === 'FACILITY_ADMIN') && req.user.facilityId) {
    referrals = referrals.filter(r => r.targetFacilityId === req.user?.facilityId);
  }

  res.json(referrals);
}

export async function createReferralController(req: AuthRequest, res: Response) {
  try {
    const {
      patientId,
      triageId,
      targetFacilityId,
      reasonForReferral,
      clinicalSummary,
      priorityLevel
    } = req.body;

    const referral = createReferral({
      patientId: patientId || req.user?.patientId || 'pat-1',
      triageId,
      referringWorkerId: req.user?.workerId,
      targetFacilityId,
      reasonForReferral,
      clinicalSummary,
      priorityLevel: priorityLevel || 'URGENT'
    });

    res.status(201).json(referral);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create referral' });
  }
}

export async function updateReferralStatusController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, rejectionReason } = req.body;

    const updated = updateReferralStatus(
      id,
      status,
      req.user?.name || 'Healthcare Provider',
      notes,
      rejectionReason
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update referral' });
  }
}

// ================= APPOINTMENT CONTROLLER =================

export async function getAppointments(req: AuthRequest, res: Response) {
  let appointments = db.appointments;
  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    appointments = appointments.filter(a => a.patientId === req.user?.patientId);
  } else if (req.user?.facilityId) {
    appointments = appointments.filter(a => a.facilityId === req.user?.facilityId);
  }
  res.json(appointments);
}

export async function createAppointmentController(req: AuthRequest, res: Response) {
  try {
    const { patientId, facilityId, referralId, scheduledFor, department, notes } = req.body;
    const apt = createAppointment({
      patientId: patientId || req.user?.patientId || 'pat-1',
      facilityId,
      referralId,
      scheduledFor: scheduledFor || new Date().toISOString(),
      department: department || 'General OPD',
      notes
    });
    res.status(201).json(apt);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to schedule appointment' });
  }
}

export async function updateAppointmentStatusController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const apt = updateAppointmentStatus(id, status);
    res.json(apt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ================= CARE JOURNEY CONTROLLER =================

export async function getCareJourney(req: AuthRequest, res: Response) {
  const patientId = req.params.patientId || req.user?.patientId || 'pat-1';
  const journey = db.careJourneys.find(cj => cj.patientId === patientId);
  if (!journey) {
    res.status(404).json({ error: 'Care journey not found for patient' });
    return;
  }
  res.json(journey);
}

// ================= CARE GAP CONTROLLER =================

export async function getCareGaps(req: AuthRequest, res: Response) {
  // Always trigger scan so newly overdue records are caught
  scanAndDetectCareGaps();
  let gaps = db.careGaps;

  if (req.user?.role === 'HEALTH_WORKER' && req.user.workerId) {
    gaps = gaps.filter(g => g.responsibleWorkerId === req.user?.workerId || !g.responsibleWorkerId);
  } else if (req.user?.role === 'PATIENT' && req.user.patientId) {
    gaps = gaps.filter(g => g.patientId === req.user?.patientId);
  }

  res.json(gaps);
}

export async function resolveCareGap(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, actionTaken, resolutionNotes } = req.body;

    const gap = updateCareGapStatus(
      id,
      status || 'RESOLVED',
      actionTaken || 'Health worker conducted follow-up',
      resolutionNotes
    );

    res.json(gap);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ================= PATIENT CONTROLLER =================

export async function getPatients(req: AuthRequest, res: Response) {
  let patients = db.patients;
  if (req.user?.role === 'HEALTH_WORKER' && req.user.workerId) {
    patients = patients.filter(p => p.assignedWorkerId === req.user?.workerId);
  } else if (req.user?.role === 'PATIENT' && req.user.patientId) {
    patients = patients.filter(p => p.id === req.user?.patientId);
  }
  res.json(patients);
}

export async function getPatientById(req: AuthRequest, res: Response) {
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  res.json(patient);
}

export async function registerPatient(req: AuthRequest, res: Response) {
  const {
    name,
    dateOfBirth,
    gender,
    bloodGroup,
    addressVillage,
    district,
    state,
    pincode,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    conditions,
    allergies,
    medications
  } = req.body;

  if (!name || !dateOfBirth || !gender) {
    res.status(400).json({ error: 'Name, date of birth, and gender are required' });
    return;
  }

  const patientId = 'pat-' + Date.now();
  const userId = 'usr-' + Date.now();

  const newPatient = {
    id: patientId,
    userId,
    abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    dateOfBirth,
    gender: gender.toUpperCase(),
    bloodGroup: bloodGroup || 'Unknown',
    addressVillage: addressVillage || 'Local Village',
    district: district || 'Solapur',
    state: state || 'Maharashtra',
    pincode: pincode || '413001',
    latitude: 18.825 + (Math.random() - 0.5) * 0.1,
    longitude: 74.378 + (Math.random() - 0.5) * 0.1,
    assignedWorkerId: req.user?.workerId || 'hw-1',
    emergencyContactName,
    emergencyContactPhone,
    conditions: conditions || [],
    allergies: allergies || [],
    medications: medications || []
  };

  db.patients.unshift(newPatient as any);

  db.logAudit({
    userName: req.user?.name || 'Health Worker',
    action: 'PATIENT_REGISTERED',
    resource: `Patient/${patientId}`,
    details: `Registered patient ${name}, assigned ABHA ${newPatient.abhaId}`
  });

  db.save();
  res.status(201).json(newPatient);
}

// ================= CONSENTS =================

export async function getConsents(req: AuthRequest, res: Response) {
  const patientId = req.params.patientId || req.user?.patientId || 'pat-1';
  const consents = db.consents.filter(c => c.patientId === patientId);
  res.json(consents);
}

export async function updateConsent(req: AuthRequest, res: Response) {
  const { consentId, status } = req.body;
  const consent = db.consents.find(c => c.id === consentId);
  if (!consent) {
    res.status(404).json({ error: 'Consent not found' });
    return;
  }

  consent.status = status;
  db.logAudit({
    userName: req.user?.name || 'Patient',
    action: `CONSENT_${status}`,
    resource: `Consent/${consent.id}`,
    details: `Consent status updated to ${status} for ${consent.requestedBy}`
  });

  db.save();
  res.json({ success: true, consent });
}

// ================= DIAGNOSTICS =================

export async function getDiagnostics(req: AuthRequest, res: Response) {
  let list = db.diagnostics;
  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    list = list.filter(d => d.patientId === req.user?.patientId);
  } else if (req.user?.facilityId) {
    list = list.filter(d => d.facilityId === req.user?.facilityId);
  }
  res.json(list);
}

export async function createDiagnostic(req: AuthRequest, res: Response) {
  const { testName, patientId, facilityId, requiredDate } = req.body;
  const patient = db.patients.find(p => p.id === patientId);
  const facility = db.facilities.find(f => f.id === facilityId);

  const diag = {
    id: 'diag-' + Date.now(),
    testName,
    patientId,
    patientName: patient?.name || 'Patient',
    requestingDoctorId: req.user?.doctorId,
    requestingDoctorName: req.user?.name || 'Consulting Physician',
    facilityId,
    facilityName: facility?.name || 'Hospital Lab',
    status: 'REQUESTED' as const,
    requiredDate: requiredDate || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.diagnostics.unshift(diag);
  db.save();
  res.status(201).json(diag);
}

export async function updateDiagnosticStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status, resultSummary } = req.body;
  const diag = db.diagnostics.find(d => d.id === id);
  if (!diag) {
    res.status(404).json({ error: 'Diagnostic request not found' });
    return;
  }

  diag.status = status;
  if (resultSummary) diag.resultSummary = resultSummary;

  if (status === 'COMPLETED') {
    const journey = db.careJourneys.find(cj => cj.patientId === diag.patientId);
    if (journey) {
      const step = journey.steps.find(s => s.name === 'Diagnostic test');
      if (step) {
        step.status = 'COMPLETED';
        step.completedAt = new Date().toISOString();
        step.notes = `${diag.testName}: ${resultSummary || 'Completed'}`;
      }
    }
  }

  db.save();
  res.json(diag);
}

// ================= MEDICINES =================

export async function getMedicines(req: AuthRequest, res: Response) {
  const { facilityId } = req.query;
  let meds = db.medicines;
  if (facilityId) {
    meds = meds.filter(m => m.facilityId === facilityId);
  }
  res.json(meds);
}

export async function updateMedicineStock(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { stockCount, isAvailable } = req.body;
  const med = db.medicines.find(m => m.id === id);
  if (!med) {
    res.status(404).json({ error: 'Medicine not found' });
    return;
  }

  if (stockCount !== undefined) med.stockCount = Number(stockCount);
  if (isAvailable !== undefined) med.isAvailable = Boolean(isAvailable);
  med.lastUpdated = new Date().toISOString();

  db.save();
  res.json(med);
}

// ================= TELECONSULTATION =================

export async function requestTeleconsultation(req: AuthRequest, res: Response) {
  try {
    const { patientId, chiefComplaint, preferredLanguage, preferredSpecialty } = req.body;
    const patient = db.patients.find(p => p.id === (patientId || req.user?.patientId || 'pat-1'));

    const consult = await teleconsultationService.createConsultation({
      patientId: patient?.id || 'pat-1',
      patientName: patient?.name || 'Patient',
      chiefComplaint: chiefComplaint || 'Routine tele-review',
      preferredLanguage: preferredLanguage || 'en',
      preferredSpecialty
    });

    const record = {
      id: consult.sessionId,
      patientId: patient?.id || 'pat-1',
      patientName: patient?.name || 'Patient',
      provider: consult.providerName,
      roomUrl: consult.roomUrl,
      sessionToken: consult.token,
      status: consult.status,
      scheduledAt: new Date().toISOString(),
      notes: consult.regulatoryNote,
      createdAt: new Date().toISOString()
    };

    db.teleconsultations.unshift(record as any);
    db.save();

    res.json(consult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ================= OFFLINE SMART CARE PACK & SYNC =================

export async function getSmartCarePack(req: AuthRequest, res: Response) {
  try {
    const workerId = req.user?.workerId || 'hw-1';
    const pack = generateSmartCarePack(workerId);
    res.json(pack);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function syncOfflineData(req: AuthRequest, res: Response) {
  try {
    const { actions } = req.body;
    const workerId = req.user?.workerId || 'hw-1';
    const syncResult = processOfflineSync({ workerId, actions: actions || [] });
    res.json(syncResult);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ================= DASHBOARD ANALYTICS =================

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const totalPatients = db.patients.length;
  const totalReferrals = db.referrals.length;
  const acceptedReferrals = db.referrals.filter(r => ['ACCEPTED', 'APPOINTMENT_ASSIGNED', 'PATIENT_ARRIVED', 'CONSULTATION_COMPLETED', 'COMPLETED'].includes(r.status)).length;
  const completedReferrals = db.referrals.filter(r => r.status === 'COMPLETED').length;
  const pendingReferrals = db.referrals.filter(r => ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status)).length;
  const openCareGaps = db.careGaps.filter(g => g.status !== 'RESOLVED').length;
  const emergencyTriages = db.triages.filter(t => t.urgency === 'RED').length;
  const priorityTriages = db.triages.filter(t => t.urgency === 'ORANGE').length;

  res.json({
    metrics: {
      totalPatients,
      totalReferrals,
      acceptedReferrals,
      referralHandshakeRate: totalReferrals > 0 ? Math.round((acceptedReferrals / totalReferrals) * 100) : 100,
      referralCompletionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 85,
      pendingReferrals,
      openCareGaps,
      emergencyTriages,
      priorityTriages,
      averageTurnaroundMinutes: 18
    },
    facilityUtilization: db.facilities.map(f => ({
      name: f.name,
      occupancyRatio: Math.round((f.occupiedBeds / f.totalBeds) * 100),
      queueCount: f.currentQueueLength,
      icuOccupancyRatio: f.icuBeds > 0 ? Math.round((f.occupiedIcuBeds / f.icuBeds) * 100) : 0,
      medicineStockRatio: Math.round(f.medicineStockRatio * 100)
    })),
    referralBreakdown: {
      emergency: db.referrals.filter(r => r.priorityLevel === 'EMERGENCY').length,
      urgent: db.referrals.filter(r => r.priorityLevel === 'URGENT').length,
      routine: db.referrals.filter(r => r.priorityLevel === 'ROUTINE').length
    }
  });
}

// ================= AUDIT LOGS =================

export async function getAuditLogs(req: AuthRequest, res: Response) {
  res.json(db.auditLogs.slice(0, 50));
}

// ================= NOTIFICATIONS =================

export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const userNotifs = db.notifications.filter(n => !userId || n.userId === userId || n.userId === 'all');
  res.json(userNotifs);
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) notif.isRead = true;
  db.save();
  res.json({ success: true });
}
