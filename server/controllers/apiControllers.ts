import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest, normalizeRole } from '../middleware/auth';
import { db } from '../repositories/db';
import { ENV } from '../config/env';
import { evaluateTriage } from '../services/triageService';
import { recommendFacilities } from '../services/facilityRoutingService';
import { createReferral, updateReferralStatus } from '../services/referralService';
import {
  createAppointment,
  updateAppointmentStatus,
  acceptAppointment,
  declineAppointment,
  referAppointment
} from '../services/appointmentService';
import { scanAndDetectCareGaps, updateCareGapStatus } from '../services/careGapService';
import { generateSmartCarePack, processOfflineSync } from '../services/offlineSyncService';
import { teleconsultationService } from '../integrations/eSanjeevaniAdapter';
import { abdmService } from '../integrations/abdmAdapter';
import { User, UserRole } from '../models/types';

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

  if (user.active === false) {
    res.status(403).json({ error: 'Account is deactivated. Please contact your system administrator.' });
    return;
  }

  // Support demo password or bcrypt compare
  const isMatch = password === 'CareGrid@123' || bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid password. (Demo password is "CareGrid@123")' });
    return;
  }

  const userRole = normalizeRole(user.role);

  let patient = userRole === 'PATIENT' ? (db.patients.find(p => p.userId === user.id) || (user.patientId ? db.patients.find(p => p.id === user.patientId) : undefined)) : undefined;
  let healthWorker = userRole === 'ASHA_WORKER' ? (db.healthWorkers.find(w => w.userId === user.id) || (user.workerId ? db.healthWorkers.find(w => w.id === user.workerId) : undefined)) : undefined;
  let doctor = userRole === 'HOSPITAL_DOCTOR' ? (db.doctors.find(d => d.userId === user.id) || (user.doctorId ? db.doctors.find(d => d.id === user.doctorId) : undefined)) : undefined;
  let facilityAdmin = userRole === 'ADMIN' ? db.facilityAdmins.find(f => f.userId === user.id) : undefined;

  const patientId = patient?.id || user.patientId || (userRole === 'PATIENT' ? 'pat-1' : undefined);
  const workerId = healthWorker?.id || user.workerId || (userRole === 'ASHA_WORKER' ? 'hw-1' : undefined);
  const doctorId = doctor?.id || user.doctorId || (userRole === 'HOSPITAL_DOCTOR' ? 'doc-1' : undefined);
  const facilityId = facilityAdmin?.facilityId || doctor?.facilityId || user.facilityId || (userRole === 'HOSPITAL_DOCTOR' ? 'fac-cbe-mch' : undefined);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: userRole, name: user.name, patientId, workerId, doctorId, facilityId },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

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
      phone: user.phone,
      patientId,
      workerId,
      doctorId,
      facilityId
    },
    profile: patient || healthWorker || doctor || facilityAdmin || null
  });
}

export async function register(req: AuthRequest, res: Response) {
  const {
    name,
    email,
    password,
    role,
    phone,
    assignedVillage,
    assignedDistrict,
    abhaId,
    gender,
    bloodGroup,
    dateOfBirth,
    specialization,
    licenseNumber,
    facilityId
  } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Name, email, password, and role are required' });
    return;
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'A user with this email address already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(8);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = 'usr-' + Date.now();
  const isoNow = new Date().toISOString();

  const newUser: User = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    phone: phone || '+91 94430 ' + Math.floor(10000 + Math.random() * 90000),
    role: role as UserRole,
    createdAt: isoNow
  };

  db.addUser(newUser);

  let profile: any = null;

  if (role === 'PATIENT') {
    const generatedAbha = abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const patientObj = {
      id: 'pat-' + Date.now(),
      userId,
      abhaId: generatedAbha,
      name,
      dateOfBirth: dateOfBirth || '1985-06-15',
      gender: (gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
      bloodGroup: bloodGroup || 'B+',
      addressVillage: assignedVillage || 'Kinathukadavu Village',
      district: assignedDistrict || 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642109',
      latitude: 10.825,
      longitude: 77.021,
      assignedWorkerId: 'hw-1',
      emergencyContactName: 'Family Member',
      emergencyContactPhone: phone || '+91 94430 00000',
      conditions: [],
      allergies: [],
      medications: []
    };
    db.patients.push(patientObj);
    profile = patientObj;
    newUser.patientId = patientObj.id;

    const defaultFacility = db.facilities.find(f => f.district === patientObj.district) || db.facilities[0];
    const initialCareJourney = {
      id: 'cj-' + Date.now(),
      patientId: patientObj.id,
      patientName: patientObj.name,
      facilityName: defaultFacility ? defaultFacility.name : 'Coimbatore Medical College Hospital',
      title: `${patientObj.name}'s Comprehensive Care Pathway`,
      currentStage: 'Initial Consultation & Doorstep Triage',
      nextBestAction: `New patient registered. Complete doorstep health evaluation or AI digital triage to determine clinical urgency and facility referral in ${patientObj.district || 'Tamil Nadu'}.`,
      overallStatus: 'ACTIVE' as const,
      steps: [
        {
          id: 'step-1',
          stepOrder: 1,
          name: 'Initial Field Consultation',
          status: 'COMPLETED' as const,
          completedAt: new Date().toISOString(),
          notes: `Patient registered under CareGrid Tamil Nadu (ABHA: ${patientObj.abhaId}). Doorstep intake recorded.`
        },
        {
          id: 'step-2',
          stepOrder: 2,
          name: 'AI-Assisted Digital Triage',
          status: 'IN_PROGRESS' as const,
          actionRequired: 'Assess vital signs and symptoms in Digital Triage to assign clinical priority.'
        },
        {
          id: 'step-3',
          stepOrder: 3,
          name: 'Facility Routing & Referral',
          status: 'UPCOMING' as const,
          notes: `Target hospital routing scoped to ${defaultFacility ? defaultFacility.name : 'District Hospital'}.`
        },
        {
          id: 'step-4',
          stepOrder: 4,
          name: 'Hospital Acceptance & Bed Lock',
          status: 'UPCOMING' as const
        },
        {
          id: 'step-5',
          stepOrder: 5,
          name: 'Appointment & Priority OPD Token',
          status: 'UPCOMING' as const
        },
        {
          id: 'step-6',
          stepOrder: 6,
          name: 'Diagnostic Test Verification',
          status: 'UPCOMING' as const
        },
        {
          id: 'step-7',
          stepOrder: 7,
          name: 'Specialist Consultation',
          status: 'UPCOMING' as const
        },
        {
          id: 'step-8',
          stepOrder: 8,
          name: 'Medical Treatment & Optimization',
          status: 'UPCOMING' as const
        },
        {
          id: 'step-9',
          stepOrder: 9,
          name: 'Community Post-Discharge Follow-up',
          status: 'UPCOMING' as const
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.careJourneys.unshift(initialCareJourney);
  } else if (role === 'HEALTH_WORKER') {
    const hwObj = {
      id: 'hw-' + Date.now(),
      userId,
      name,
      workerType: 'VHN' as const,
      assignedVillage: assignedVillage || 'Kinathukadavu Village',
      assignedDistrict: assignedDistrict || 'Coimbatore',
      facilityId: facilityId || 'fac-cbe-phc',
      phone: newUser.phone
    };
    db.healthWorkers.push(hwObj);
    profile = hwObj;
    newUser.workerId = hwObj.id;
  } else if (role === 'DOCTOR') {
    const docObj = {
      id: 'doc-' + Date.now(),
      userId,
      name,
      specialization: specialization || 'General Medicine',
      licenseNumber: licenseNumber || 'TNMC-2026-' + Math.floor(10000 + Math.random() * 90000),
      facilityId: facilityId || 'fac-cbe-mch',
      phone: newUser.phone
    };
    db.doctors.push(docObj);
    profile = docObj;
    newUser.doctorId = docObj.id;
  } else if (role === 'FACILITY_ADMIN') {
    const faObj = {
      id: 'fa-' + Date.now(),
      userId,
      name,
      facilityId: facilityId || 'fac-cbe-mch'
    };
    db.facilityAdmins.push(faObj);
    profile = faObj;
    newUser.facilityId = faObj.facilityId;
  }

  db.save();

  db.logAudit({
    userId,
    userName: name,
    userRole: role,
    action: 'USER_REGISTERED',
    resource: `User/${userId}`,
    details: `User registered with role ${role} in Tamil Nadu CareGrid`
  });

  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      patientId: newUser.patientId,
      workerId: newUser.workerId,
      doctorId: newUser.doctorId,
      facilityId: newUser.facilityId
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      patientId: newUser.patientId,
      workerId: newUser.workerId,
      doctorId: newUser.doctorId,
      facilityId: newUser.facilityId
    },
    profile
  });
}

// Quick Switcher for Demo / Hackathon Evaluators
export async function switchPersona(req: AuthRequest, res: Response) {
  const { role, userId } = req.body;
  let targetUser = userId ? db.users.find(u => u.id === userId) : db.users.find(u => u.role === role);

  if (!targetUser) {
    targetUser = db.users[0];
  }

  let patient = targetUser.role === 'PATIENT' ? (db.patients.find(p => p.userId === targetUser.id) || (targetUser.patientId ? db.patients.find(p => p.id === targetUser.patientId) : undefined)) : undefined;
  let healthWorker = targetUser.role === 'ASHA_WORKER' ? db.healthWorkers.find(w => w.userId === targetUser.id) : undefined;
  let doctor = targetUser.role === 'HOSPITAL_DOCTOR' ? db.doctors.find(d => d.userId === targetUser.id) : undefined;
  let facilityAdmin = targetUser.role === 'ADMIN' ? db.facilityAdmins.find(f => f.userId === targetUser.id) : undefined;

  const patientId = patient?.id || targetUser.patientId;
  const workerId = healthWorker?.id || targetUser.workerId;
  const doctorId = doctor?.id || targetUser.doctorId;
  const facilityId = facilityAdmin?.facilityId || doctor?.facilityId || targetUser.facilityId;

  const token = jwt.sign(
    { id: targetUser.id, email: targetUser.email, role: targetUser.role, name: targetUser.name, patientId, workerId, doctorId, facilityId },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

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
      phone: targetUser.phone,
      patientId,
      workerId,
      doctorId,
      facilityId
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

  let patient = user.role === 'PATIENT' ? (db.patients.find(p => p.userId === user.id) || (user.patientId ? db.patients.find(p => p.id === user.patientId) : undefined)) : undefined;
  let healthWorker = user.role === 'ASHA_WORKER' ? db.healthWorkers.find(w => w.userId === user.id) : undefined;
  let doctor = user.role === 'HOSPITAL_DOCTOR' ? db.doctors.find(d => d.userId === user.id) : undefined;
  let facilityAdmin = user.role === 'ADMIN' ? db.facilityAdmins.find(f => f.userId === user.id) : undefined;

  const patientId = patient?.id || user.patientId;
  const workerId = healthWorker?.id || user.workerId;
  const doctorId = doctor?.id || user.doctorId;
  const facilityId = facilityAdmin?.facilityId || doctor?.facilityId || user.facilityId;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      patientId,
      workerId,
      doctorId,
      facilityId
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
      humanConfirmed: req.user?.role === 'ASHA_WORKER' || req.user?.role === 'HOSPITAL_DOCTOR',
      confirmedByWorkerId: req.user?.workerId,
      confirmedByWorkerName: req.user?.workerId ? req.user.name : undefined,
      aiClinicalSummary: triageResult.aiClinicalSummary,
      createdAt: new Date().toISOString()
    };

    db.triages.unshift(triageRecord);

    // Update or link Care Journey
    let journey = db.careJourneys.find(cj => cj.patientId === activePatientId);
    const patientObj = db.patients.find(p => p.id === activePatientId);
    const nowIso = new Date().toISOString();
    if (!journey && patientObj) {
      journey = {
        id: 'cj-' + Date.now(),
        patientId: patientObj.id,
        patientName: patientObj.name,
        facilityName: 'Coimbatore Medical College Hospital',
        title: `${patientObj.name}'s Comprehensive Care Pathway`,
        currentStage: 'Facility Routing & Referral',
        nextBestAction: `Triage evaluated as ${triageResult.urgency}. Proceed to Facility Routing to book bed and issue referral.`,
        overallStatus: 'ACTIVE',
        steps: [
          { id: 'step-1', stepOrder: 1, name: 'Initial Field Consultation', status: 'COMPLETED', completedAt: nowIso, notes: 'Doorstep intake completed.' },
          { id: 'step-2', stepOrder: 2, name: 'AI-Assisted Digital Triage', status: 'COMPLETED', completedAt: nowIso, notes: `Classified as ${triageResult.urgency}. Vitals: BP ${vitals?.bpSystolic || '--'}/${vitals?.bpDiastolic || '--'}, SpO2 ${vitals?.spo2 || '--'}%.` },
          { id: 'step-3', stepOrder: 3, name: 'Facility Routing & Referral', status: 'IN_PROGRESS', actionRequired: 'Select capacity-aware hospital and issue referral.' },
          { id: 'step-4', stepOrder: 4, name: 'Hospital Acceptance & Bed Lock', status: 'UPCOMING' },
          { id: 'step-5', stepOrder: 5, name: 'Appointment & Priority OPD Token', status: 'UPCOMING' },
          { id: 'step-6', stepOrder: 6, name: 'Diagnostic Test Verification', status: 'UPCOMING' },
          { id: 'step-7', stepOrder: 7, name: 'Specialist Consultation', status: 'UPCOMING' },
          { id: 'step-8', stepOrder: 8, name: 'Medical Treatment & Optimization', status: 'UPCOMING' },
          { id: 'step-9', stepOrder: 9, name: 'Community Post-Discharge Follow-up', status: 'UPCOMING' }
        ],
        createdAt: nowIso,
        updatedAt: nowIso
      };
      db.careJourneys.unshift(journey);
    } else if (journey) {
      const step2 = journey.steps.find(s => s.stepOrder === 2 || s.name.toLowerCase().includes('triage'));
      if (step2) {
        step2.status = 'COMPLETED';
        step2.completedAt = nowIso;
        step2.notes = `Triage classified as ${triageResult.urgency}. Vitals: BP ${vitals?.bpSystolic || '--'}/${vitals?.bpDiastolic || '--'}, SpO2 ${vitals?.spo2 || '--'}%.`;
      }
      const step3 = journey.steps.find(s => s.stepOrder === 3 || s.name.toLowerCase().includes('routing') || s.name.toLowerCase().includes('referral'));
      if (step3) {
        step3.status = 'IN_PROGRESS';
        step3.actionRequired = 'Select optimal hospital based on bed & specialist availability.';
      }
      journey.currentStage = 'Facility Routing & Referral';
      journey.nextBestAction = `Triage evaluated as ${triageResult.urgency}. Select recommended hospital to reserve emergency bed and initiate referral.`;
      journey.updatedAt = nowIso;
    }

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

export async function createFacility(req: AuthRequest, res: Response) {
  const {
    name,
    type,
    category,
    address,
    district,
    phone,
    emergencyCapability,
    totalBeds,
    occupiedBeds,
    icuBeds,
    occupiedIcuBeds,
    currentQueueLength,
    averageWaitTimeMin,
    specialists,
    services,
    availableDiagnostics,
    medicineStockRatio,
    latitude,
    longitude
  } = req.body;

  if (!name || !type || !district) {
    res.status(400).json({ error: 'Name, facility type, and district are required' });
    return;
  }

  // Default coordinate offsets based on Tamil Nadu district centers
  const districtCoords: Record<string, { lat: number; lng: number }> = {
    Coimbatore: { lat: 11.002, lng: 76.967 },
    Chennai: { lat: 13.081, lng: 80.279 },
    Madurai: { lat: 9.928, lng: 78.134 },
    Salem: { lat: 11.664, lng: 78.146 },
    Tiruchirappalli: { lat: 10.812, lng: 78.686 },
    Thanjavur: { lat: 10.758, lng: 79.106 },
    Tirunelveli: { lat: 8.714, lng: 77.747 },
    Vellore: { lat: 12.916, lng: 79.132 },
    Nilgiris: { lat: 11.410, lng: 76.695 },
    Dindigul: { lat: 10.367, lng: 77.980 }
  };

  const defaultCoord = districtCoords[district] || { lat: 11.01, lng: 76.96 };
  const lat = typeof latitude === 'number' ? latitude : defaultCoord.lat + (Math.random() - 0.5) * 0.05;
  const lng = typeof longitude === 'number' ? longitude : defaultCoord.lng + (Math.random() - 0.5) * 0.05;

  const newFacility = {
    id: 'fac-tn-' + Date.now(),
    name,
    type: type || 'CHC',
    category: category || 'Public',
    latitude: lat,
    longitude: lng,
    address: address || `${name}, ${district}, Tamil Nadu`,
    district,
    phone: phone || '044-' + Math.floor(10000000 + Math.random() * 90000000),
    emergencyCapability: Boolean(emergencyCapability),
    totalBeds: Number(totalBeds) || 50,
    occupiedBeds: Number(occupiedBeds) || Math.floor((Number(totalBeds) || 50) * 0.6),
    icuBeds: Number(icuBeds) || 4,
    occupiedIcuBeds: Number(occupiedIcuBeds) || 2,
    currentQueueLength: Number(currentQueueLength) || 10,
    averageWaitTimeMin: Number(averageWaitTimeMin) || 20,
    specialists: Array.isArray(specialists) && specialists.length > 0 ? specialists : [
      { specialty: 'General Medicine', available: true, doctorName: 'Dr. Duty Medical Officer' }
    ],
    services: Array.isArray(services) && services.length > 0 ? services : [
      '24x7 Emergency Care',
      'Outpatient Consultation',
      'Pharmacy',
      'Basic Pathology'
    ],
    availableDiagnostics: Array.isArray(availableDiagnostics) && availableDiagnostics.length > 0 ? availableDiagnostics : [
      'ECG 12-Lead',
      'Digital X-Ray',
      'Complete Blood Count'
    ],
    medicineStockRatio: typeof medicineStockRatio === 'number' ? medicineStockRatio : 0.92
  };

  db.addFacility(newFacility);

  db.logAudit({
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'FACILITY_ADMIN',
    action: 'FACILITY_REGISTERED',
    resource: `Facility/${newFacility.id}`,
    details: `Added new hospital ${newFacility.name} (${newFacility.type}) in ${district}, Tamil Nadu`
  });

  res.status(201).json(newFacility);
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
  } else if (req.user?.role === 'ASHA_WORKER' && req.user.workerId) {
    referrals = referrals.filter(
      r => r.referringWorkerId === req.user?.workerId || db.patients.some(p => p.assignedWorkerId === req.user?.workerId && p.id === r.patientId)
    );
  } else if ((req.user?.role === 'HOSPITAL_DOCTOR' || req.user?.role === 'ADMIN') && req.user.facilityId) {
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
  let appointments = [...db.appointments];
  if (req.user?.role === 'PATIENT') {
    const patientId = req.user.patientId || db.patients.find(p => p.userId === req.user?.id)?.id;
    appointments = appointments.filter(a => a.patientId === patientId);
  } else if (req.user?.role === 'ASHA_WORKER') {
    const assignedIds = new Set(db.patients.filter(p => p.assignedWorkerId === req.user?.workerId).map(p => p.id));
    appointments = appointments.filter(a => assignedIds.has(a.patientId) || a.patientId === 'pat-1');
  } else if (req.user?.role === 'HOSPITAL_DOCTOR') {
    const facilityId = req.user?.facilityId || 'fac-cbe-mch';
    appointments = appointments.filter(a => a.facilityId === facilityId || a.doctorId === req.user?.doctorId);
  }
  // ADMIN gets all appointments
  res.json(appointments);
}

export async function createAppointmentController(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role === 'HOSPITAL_DOCTOR') {
      res.status(403).json({ error: 'Access Denied: Hospital doctors cannot book appointments for themselves. Only patients and health workers can request appointments.' });
      return;
    }

    const { patientId, facilityId, referralId, scheduledFor, department, disease, healthIssue, notes } = req.body;
    let targetPatientId = patientId;

    if (req.user?.role === 'PATIENT') {
      targetPatientId = req.user.patientId || db.patients.find(p => p.userId === req.user?.id)?.id || 'pat-1';
    }

    const apt = createAppointment({
      patientId: targetPatientId || 'pat-1',
      facilityId: facilityId || 'fac-cbe-mch',
      referralId,
      scheduledFor: scheduledFor || new Date().toISOString(),
      department: department || 'General OPD',
      disease: disease || healthIssue,
      healthIssue: healthIssue || disease,
      notes,
      initialStatus: 'PENDING'
    });
    res.status(201).json(apt);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to schedule appointment' });
  }
}

export async function acceptAppointmentController(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'HOSPITAL_DOCTOR' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access Denied: Only hospital doctors or administrators can accept appointments.' });
      return;
    }
    const { id } = req.params;
    const { notes } = req.body;
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const updated = acceptAppointment(id, req.user?.name, notes);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to accept appointment' });
  }
}

export async function declineAppointmentController(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'HOSPITAL_DOCTOR' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access Denied: Only hospital doctors or administrators can decline appointments.' });
      return;
    }
    const { id } = req.params;
    const { reason } = req.body;
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const updated = declineAppointment(id, req.user?.name, reason);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to decline appointment' });
  }
}

export async function referAppointmentController(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'HOSPITAL_DOCTOR' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access Denied: Only hospital doctors or administrators can refer appointments to higher facilities.' });
      return;
    }
    const { id } = req.params;
    const { targetFacilityId, reason, priority, specialty } = req.body;
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const result = referAppointment(id, req.user?.name, {
      targetFacilityId,
      reason,
      priority,
      specialty
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to refer appointment' });
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
  let patientId = req.params.patientId;
  if (!patientId && req.user?.role === 'PATIENT') {
    patientId = req.user.patientId || db.patients.find(p => p.userId === req.user?.id)?.id;
  }
  if (!patientId) {
    patientId = req.user?.patientId || 'pat-1';
  }

  let journey = db.careJourneys.find(cj => cj.patientId === patientId);
  const patient = db.patients.find(p => p.id === patientId);

  // Auto-initialize CareJourney if not present yet
  if (!journey && patient) {
    const now = new Date();
    const isoNow = now.toISOString();
    const defaultFacility = db.facilities.find(f => f.district === patient.district) || db.facilities[0];

    journey = {
      id: 'cj-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      facilityName: defaultFacility ? defaultFacility.name : 'Coimbatore Medical College Hospital',
      title: `${patient.name}'s Comprehensive Care Pathway`,
      currentStage: 'Initial Consultation & Doorstep Triage',
      nextBestAction: `New patient registered under CareGrid Tamil Nadu. Initiate doorstep assessment or digital triage to determine clinical urgency in ${patient.district || 'Tamil Nadu'}.`,
      overallStatus: 'ACTIVE',
      steps: [
        {
          id: 'step-1',
          stepOrder: 1,
          name: 'Initial Field Consultation',
          status: 'COMPLETED',
          completedAt: isoNow,
          notes: `Patient registered under CareGrid Tamil Nadu (ABHA: ${patient.abhaId}). Doorstep intake recorded.`
        },
        {
          id: 'step-2',
          stepOrder: 2,
          name: 'AI-Assisted Digital Triage',
          status: 'IN_PROGRESS',
          actionRequired: 'Assess vital signs and symptoms in Digital Triage to assign clinical priority.'
        },
        {
          id: 'step-3',
          stepOrder: 3,
          name: 'Facility Routing & Referral',
          status: 'UPCOMING',
          notes: `Target hospital routing scoped to ${defaultFacility ? defaultFacility.name : 'District Hospital'}.`
        },
        {
          id: 'step-4',
          stepOrder: 4,
          name: 'Hospital Acceptance & Bed Lock',
          status: 'UPCOMING'
        },
        {
          id: 'step-5',
          stepOrder: 5,
          name: 'Appointment & Priority OPD Token',
          status: 'UPCOMING'
        },
        {
          id: 'step-6',
          stepOrder: 6,
          name: 'Diagnostic Test Verification',
          status: 'UPCOMING'
        },
        {
          id: 'step-7',
          stepOrder: 7,
          name: 'Specialist Consultation',
          status: 'UPCOMING'
        },
        {
          id: 'step-8',
          stepOrder: 8,
          name: 'Medical Treatment & Optimization',
          status: 'UPCOMING'
        },
        {
          id: 'step-9',
          stepOrder: 9,
          name: 'Community Post-Discharge Follow-up',
          status: 'UPCOMING'
        }
      ],
      createdAt: isoNow,
      updatedAt: isoNow
    };

    db.careJourneys.unshift(journey);
    db.save();
  }

  if (!journey) {
    res.status(404).json({ error: 'Care journey not found for patient' });
    return;
  }

  res.json(journey);
}

export async function advanceCareJourney(req: AuthRequest, res: Response) {
  const patientId = req.params.patientId || req.user?.patientId || 'pat-1';
  let journey = db.careJourneys.find(cj => cj.patientId === patientId);
  const patient = db.patients.find(p => p.id === patientId);

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const defaultFacility = db.facilities.find(f => f.district === patient.district) || db.facilities[0];
  const facName = journey?.facilityName || (defaultFacility ? defaultFacility.name : 'Coimbatore Medical College Hospital');

  if (!journey) {
    journey = {
      id: 'cj-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      facilityName: facName,
      title: `${patient.name}'s Comprehensive Care Pathway`,
      currentStage: 'Initial Consultation & Doorstep Triage',
      nextBestAction: 'Assess vital signs and symptoms in Digital Triage.',
      overallStatus: 'ACTIVE',
      steps: [
        { id: 'step-1', stepOrder: 1, name: 'Initial Field Consultation', status: 'COMPLETED', completedAt: isoNow, notes: 'Doorstep intake recorded.' },
        { id: 'step-2', stepOrder: 2, name: 'AI-Assisted Digital Triage', status: 'IN_PROGRESS', actionRequired: 'Assess vital signs in Triage.' },
        { id: 'step-3', stepOrder: 3, name: 'Facility Routing & Referral', status: 'UPCOMING' },
        { id: 'step-4', stepOrder: 4, name: 'Hospital Acceptance & Bed Lock', status: 'UPCOMING' },
        { id: 'step-5', stepOrder: 5, name: 'Appointment & Priority OPD Token', status: 'UPCOMING' },
        { id: 'step-6', stepOrder: 6, name: 'Diagnostic Test Verification', status: 'UPCOMING' },
        { id: 'step-7', stepOrder: 7, name: 'Specialist Consultation', status: 'UPCOMING' },
        { id: 'step-8', stepOrder: 8, name: 'Medical Treatment & Optimization', status: 'UPCOMING' },
        { id: 'step-9', stepOrder: 9, name: 'Community Post-Discharge Follow-up', status: 'UPCOMING' }
      ],
      createdAt: isoNow,
      updatedAt: isoNow
    };
    db.careJourneys.unshift(journey);
  }

  // Find active step (IN_PROGRESS or first UPCOMING)
  let activeStep = journey.steps.find(s => s.status === 'IN_PROGRESS');
  if (!activeStep) {
    activeStep = journey.steps.find(s => s.status === 'UPCOMING');
  }

  if (!activeStep) {
    // If all steps are already completed, return as is
    res.json(journey);
    return;
  }

  // Complete current active step
  activeStep.status = 'COMPLETED';
  activeStep.completedAt = isoNow;

  const nextStepOrder = activeStep.stepOrder + 1;
  const nextStep = journey.steps.find(s => s.stepOrder === nextStepOrder);

  if (activeStep.stepOrder === 1) {
    activeStep.notes = `Doorstep consultation by Village Health Nurse. Baseline vitals and medical history recorded.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = 'Evaluate acute symptoms in AI-Assisted Digital Triage.';
      journey.currentStage = 'AI-Assisted Digital Triage';
      journey.nextBestAction = 'Perform digital triage assessment to determine clinical urgency and facility tier.';
    }
  } else if (activeStep.stepOrder === 2) {
    activeStep.notes = `Classified as URGENT priority. Vitals recorded: BP 148/92, SpO2 96%, HR 88 bpm.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.notes = `Facility matched: ${facName} (24x7 Emergency Ready, Specialist on duty).`;
      nextStep.actionRequired = `Transmit outbound referral dossier to ${facName}.`;
      journey.currentStage = 'Facility Routing & Referral';
      journey.nextBestAction = `Routing approved for ${facName}. Transmit referral and reserve emergency bed.`;
    }
  } else if (activeStep.stepOrder === 3) {
    const refCode = `REF-TN-${Math.floor(1000 + Math.random() * 9000)}`;
    journey.referralId = refCode;
    activeStep.notes = `Referral ${refCode} transmitted securely to ${facName} Emergency Intake.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = `Receiving medical officer at ${facName} reviewing clinical dossier.`;
      journey.currentStage = 'Hospital Acceptance & Bed Lock';
      journey.nextBestAction = `Referral transmitted. Duty specialist at ${facName} is accepting case and reserving bed.`;
    }
  } else if (activeStep.stepOrder === 4) {
    const token = journey.tokenNumber || `TK-TN-${Math.floor(1000 + Math.random() * 9000)}`;
    journey.tokenNumber = token;
    journey.facilityName = facName;
    activeStep.notes = `Referral accepted by Duty Specialist at ${facName}. Acute care observation bed locked.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = `Proceed to ${facName} with Token ${token}. Estimated wait: ~12 mins.`;
      nextStep.notes = `Priority OPD token ${token} active. Fast-track emergency gate opened.`;
      journey.currentStage = 'Appointment & Priority OPD Token';
      journey.nextBestAction = `Present Token ${token} at ${facName} Triage Reception. Hospital intake staff alerted.`;
    }
  } else if (activeStep.stepOrder === 5) {
    activeStep.notes = `Patient checked in at ${facName}. Token ${journey.tokenNumber || 'TK-TN-01'} verified at admission desk.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = 'Complete bedside 12-lead ECG, blood cardiac biomarkers, and statutory CBC.';
      journey.currentStage = 'Diagnostic Test Verification';
      journey.nextBestAction = `Bedside diagnostic draws ordered at ${facName}. Rapid analysis underway.`;
    }
  } else if (activeStep.stepOrder === 6) {
    activeStep.notes = `Diagnostics verified: 12-Lead ECG reviewed by physician, Troponin rapid test clear, Hemoglobin 13.2 g/dL.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = 'Comprehensive specialist clinical consultation and therapy plan.';
      journey.currentStage = 'Specialist Consultation';
      journey.nextBestAction = `Consulting with specialist doctor at ${facName}. Reviewing diagnostic results.`;
    }
  } else if (activeStep.stepOrder === 7) {
    activeStep.notes = `Consultation completed with Dr. Specialist. Confirmed acute symptom stabilization and maintenance protocol.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = 'Dispense prescribed medication regimen from hospital pharmacy.';
      journey.currentStage = 'Medical Treatment & Optimization';
      journey.nextBestAction = 'Collect prescribed medications and receive lifestyle and dietary adherence guidance.';
    }
  } else if (activeStep.stepOrder === 8) {
    activeStep.notes = `Medications dispensed & administered. Vitals normalized (BP 124/80, SpO2 99%, HR 74 bpm). Patient educated on adherence.`;
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = 'Village Health Nurse 7-day doorstep surveillance and recovery check.';
      journey.currentStage = 'Community Post-Discharge Follow-up';
      journey.nextBestAction = 'Discharged home in stable condition. Assigned Village Health Nurse will conduct 7-day recovery follow-up.';
    }
  } else if (activeStep.stepOrder === 9) {
    activeStep.notes = `7-day doorstep visit completed by Village Health Nurse. Patient symptom-free and therapy compliant. Care gap successfully closed.`;
    journey.overallStatus = 'COMPLETED';
    journey.currentStage = 'Pathway Completed & Fully Treated';
    journey.nextBestAction = 'All care steps concluded successfully. Longitudinal health summary synced to ABDM health locker.';
  }

  journey.updatedAt = isoNow;
  db.save();

  db.logAudit({
    userName: req.user?.name || patient.name,
    userRole: req.user?.role || 'PATIENT',
    action: 'CARE_JOURNEY_ADVANCED',
    resource: `CareJourney/${journey.id}`,
    details: `Advanced step ${activeStep.stepOrder} (${activeStep.name}) to COMPLETED for patient ${patient.name}`
  });

  res.json(journey);
}

export async function treatPatientFull(req: AuthRequest, res: Response) {
  const patientId = req.params.patientId || req.user?.patientId || 'pat-1';
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  let journey = db.careJourneys.find(cj => cj.patientId === patientId);
  const now = new Date();
  const isoNow = now.toISOString();
  const defaultFacility = db.facilities.find(f => f.district === patient.district) || db.facilities[0];
  const facName = defaultFacility ? defaultFacility.name : 'Coimbatore Medical College Hospital';
  const token = `TK-TN-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!journey) {
    journey = {
      id: 'cj-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      facilityName: facName,
      tokenNumber: token,
      title: `${patient.name}'s Comprehensive Care Pathway`,
      currentStage: 'Medical Treatment & Optimization',
      nextBestAction: `Treatment protocol executed successfully at ${facName}. 7-day community follow-up active.`,
      overallStatus: 'ACTIVE',
      steps: [],
      createdAt: isoNow,
      updatedAt: isoNow
    };
    db.careJourneys.unshift(journey);
  }

  journey.facilityName = facName;
  journey.tokenNumber = token;
  journey.currentStage = 'Treated - Discharge & Community Follow-up';
  journey.nextBestAction = `Clinical treatment completed at ${facName}. Prescribed medications dispensed. Village Health Nurse 7-day recovery follow-up scheduled in ${patient.addressVillage || patient.district}.`;
  journey.overallStatus = 'ACTIVE';

  journey.steps = [
    {
      id: 'step-1',
      stepOrder: 1,
      name: 'Initial Field Consultation',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      notes: `Doorstep consultation by Village Health Nurse. Baseline recorded (ABHA: ${patient.abhaId}).`
    },
    {
      id: 'step-2',
      stepOrder: 2,
      name: 'AI-Assisted Digital Triage',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 3.5 * 3600000).toISOString(),
      notes: 'Triage classified as URGENT priority based on symptoms and clinical red-flag check (BP 150/92, HR 92, SpO2 96%).'
    },
    {
      id: 'step-3',
      stepOrder: 3,
      name: 'Facility Routing & Referral',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 3.0 * 3600000).toISOString(),
      notes: `Routed to ${facName} based on 24x7 emergency capability and specialist availability in ${patient.district || 'Tamil Nadu'}.`
    },
    {
      id: 'step-4',
      stepOrder: 4,
      name: 'Hospital Acceptance & Bed Lock',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 2.5 * 3600000).toISOString(),
      notes: `Referral accepted by Duty Medical Officer. Bed locked in Emergency Observation Bay.`
    },
    {
      id: 'step-5',
      stepOrder: 5,
      name: 'Appointment & Priority OPD Token',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 2.0 * 3600000).toISOString(),
      notes: `Token ${token} verified at hospital intake. Fast-track admission completed.`
    },
    {
      id: 'step-6',
      stepOrder: 6,
      name: 'Diagnostic Test Verification',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
      notes: 'Diagnostic panel verified: 12-Lead ECG sinus rhythm, Complete Blood Count normal, bedside biomarkers confirmed.'
    },
    {
      id: 'step-7',
      stepOrder: 7,
      name: 'Specialist Consultation',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 1.0 * 3600000).toISOString(),
      notes: `Specialist physician consultation conducted at ${facName}. Clinical diagnosis formulated and therapeutic regimen initiated.`
    },
    {
      id: 'step-8',
      stepOrder: 8,
      name: 'Medical Treatment & Optimization',
      status: 'COMPLETED',
      completedAt: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      notes: 'Medications dispensed: Atorvastatin 20mg, Metoprolol 25mg, Aspirin 75mg. Vitals stabilized (BP 122/78, SpO2 99%).'
    },
    {
      id: 'step-9',
      stepOrder: 9,
      name: 'Community Post-Discharge Follow-up',
      status: 'IN_PROGRESS',
      actionRequired: `Village Health Nurse 7-day home follow-up scheduled in ${patient.addressVillage || patient.district}.`,
      notes: '7-day recovery surveillance active. Care-Gap Radar monitoring adherence.'
    }
  ];

  journey.updatedAt = isoNow;
  db.save();

  db.logAudit({
    userName: req.user?.name || patient.name,
    userRole: req.user?.role || 'PATIENT',
    action: 'PATIENT_TREATED_FULL',
    resource: `CareJourney/${journey.id}`,
    details: `Completed full clinical treatment pathway for ${patient.name} at ${facName} (Token ${token})`
  });

  res.json(journey);
}

export async function resetCareJourney(req: AuthRequest, res: Response) {
  const patientId = req.params.patientId || req.user?.patientId || 'pat-1';
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  let journey = db.careJourneys.find(cj => cj.patientId === patientId);
  const now = new Date();
  const isoNow = now.toISOString();
  const defaultFacility = db.facilities.find(f => f.district === patient.district) || db.facilities[0];
  const facName = defaultFacility ? defaultFacility.name : 'Coimbatore Medical College Hospital';

  const resetSteps = [
    {
      id: 'step-1',
      stepOrder: 1,
      name: 'Initial Field Consultation',
      status: 'COMPLETED' as const,
      completedAt: isoNow,
      notes: `Patient registered under CareGrid Tamil Nadu (ABHA: ${patient.abhaId}). Doorstep intake recorded.`
    },
    {
      id: 'step-2',
      stepOrder: 2,
      name: 'AI-Assisted Digital Triage',
      status: 'IN_PROGRESS' as const,
      actionRequired: 'Assess vital signs and symptoms in Digital Triage to assign clinical priority.'
    },
    {
      id: 'step-3',
      stepOrder: 3,
      name: 'Facility Routing & Referral',
      status: 'UPCOMING' as const,
      notes: `Target hospital routing scoped to ${facName}.`
    },
    {
      id: 'step-4',
      stepOrder: 4,
      name: 'Hospital Acceptance & Bed Lock',
      status: 'UPCOMING' as const
    },
    {
      id: 'step-5',
      stepOrder: 5,
      name: 'Appointment & Priority OPD Token',
      status: 'UPCOMING' as const
    },
    {
      id: 'step-6',
      stepOrder: 6,
      name: 'Diagnostic Test Verification',
      status: 'UPCOMING' as const
    },
    {
      id: 'step-7',
      stepOrder: 7,
      name: 'Specialist Consultation',
      status: 'UPCOMING' as const
    },
    {
      id: 'step-8',
      stepOrder: 8,
      name: 'Medical Treatment & Optimization',
      status: 'UPCOMING' as const
    },
    {
      id: 'step-9',
      stepOrder: 9,
      name: 'Community Post-Discharge Follow-up',
      status: 'UPCOMING' as const
    }
  ];

  if (!journey) {
    journey = {
      id: 'cj-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      facilityName: facName,
      title: `${patient.name}'s Comprehensive Care Pathway`,
      currentStage: 'Initial Consultation & Doorstep Triage',
      nextBestAction: `Doorstep assessment complete. Perform digital triage to determine clinical urgency and facility referral in ${patient.district || 'Tamil Nadu'}.`,
      overallStatus: 'ACTIVE',
      steps: resetSteps,
      createdAt: isoNow,
      updatedAt: isoNow
    };
    db.careJourneys.unshift(journey);
  } else {
    journey.currentStage = 'Initial Consultation & Doorstep Triage';
    journey.nextBestAction = `Doorstep assessment complete. Perform digital triage to determine clinical urgency and facility referral in ${patient.district || 'Tamil Nadu'}.`;
    journey.overallStatus = 'ACTIVE';
    journey.steps = resetSteps;
    journey.updatedAt = isoNow;
  }

  db.save();
  res.json(journey);
}

// ================= CARE GAP CONTROLLER =================

export async function getCareGaps(req: AuthRequest, res: Response) {
  // Always trigger scan so newly overdue records are caught
  scanAndDetectCareGaps();
  let gaps = db.careGaps;

  if (req.user?.role === 'ASHA_WORKER' && req.user.workerId) {
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
  let patients = [...db.patients];

  // If user is a patient, prioritize their patient record at the beginning of the list
  if (req.user?.role === 'PATIENT' && req.user.patientId) {
    const userPatientIndex = patients.findIndex(p => p.id === req.user?.patientId);
    if (userPatientIndex > 0) {
      const userPatient = patients.splice(userPatientIndex, 1)[0];
      patients.unshift(userPatient);
    }
  }

  // Allow dropdown selection across all patients
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

// ================= ADMIN RBAC & USER MANAGEMENT =================

export async function getAdminUsers(req: AuthRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied: Administrator role required.' });
    return;
  }
  const users = db.users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    active: u.active !== false,
    patientId: u.patientId,
    workerId: u.workerId,
    doctorId: u.doctorId,
    facilityId: u.facilityId,
    createdAt: u.createdAt
  }));
  res.json(users);
}

export async function updateAdminUserRole(req: AuthRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied: Administrator role required.' });
    return;
  }
  const { id } = req.params;
  const { role } = req.body;
  if (!['PATIENT', 'ASHA_WORKER', 'HOSPITAL_DOCTOR', 'ADMIN'].includes(role)) {
    res.status(400).json({ error: 'Invalid role. Must be PATIENT, ASHA_WORKER, HOSPITAL_DOCTOR, or ADMIN.' });
    return;
  }
  const user = db.updateUserRole(id, role as UserRole);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'ADMIN_USER_ROLE_UPDATED',
    resource: `User/${user.id}`,
    details: `Admin changed role of ${user.name} (${user.email}) to ${role}`
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active !== false
  });
}

export async function updateAdminUserStatus(req: AuthRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied: Administrator role required.' });
    return;
  }
  const { id } = req.params;
  const { active } = req.body;
  const user = db.updateUserStatus(id, Boolean(active));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'ADMIN_USER_STATUS_UPDATED',
    resource: `User/${user.id}`,
    details: `Admin set status of ${user.name} (${user.email}) to ${active ? 'ACTIVE' : 'DEACTIVATED'}`
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active !== false
  });
}

export async function getAdminDoctors(req: AuthRequest, res: Response) {
  const doctorsWithFacilities = db.doctors.map(d => {
    const facility = db.facilities.find(f => f.id === d.facilityId);
    return {
      ...d,
      facilityName: facility?.name || 'Assigned Hospital',
      district: facility?.district || 'Tamil Nadu'
    };
  });
  res.json(doctorsWithFacilities);
}
