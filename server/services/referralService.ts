import { Referral, ReferralStatus, CareJourney } from '../models/types';
import { db } from '../repositories/db';
import { recommendFacilities } from './facilityRoutingService';

export interface CreateReferralInput {
  patientId: string;
  triageId?: string;
  referringWorkerId?: string;
  targetFacilityId: string;
  reasonForReferral: string;
  clinicalSummary: string;
  priorityLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
}

export function createReferral(input: CreateReferralInput): Referral {
  const patient = db.patients.find(p => p.id === input.patientId);
  if (!patient) throw new Error('Patient not found');

  const targetFacility = db.facilities.find(f => f.id === input.targetFacilityId);
  if (!targetFacility) throw new Error('Target facility not found');

  let workerName = 'Self / Digital Triage';
  if (input.referringWorkerId) {
    const hw = db.healthWorkers.find(w => w.id === input.referringWorkerId);
    if (hw) workerName = hw.name;
  }

  const referralCode = `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newReferral: Referral = {
    id: 'ref-' + Date.now(),
    referralCode,
    patientId: input.patientId,
    triageId: input.triageId,
    referringWorkerId: input.referringWorkerId,
    referringWorkerName: workerName,
    targetFacilityId: input.targetFacilityId,
    targetFacilityName: targetFacility.name,
    reasonForReferral: input.reasonForReferral,
    clinicalSummary: input.clinicalSummary,
    status: 'SENT',
    priorityLevel: input.priorityLevel,
    statusHistory: [
      {
        status: 'CREATED',
        notes: `Referral initiated by ${workerName}`,
        updatedBy: workerName,
        timestamp: now
      },
      {
        status: 'SENT',
        notes: `Securely routed to ${targetFacility.name}`,
        updatedBy: 'CareGrid Handshake Engine',
        timestamp: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  db.referrals.unshift(newReferral);

  // Link or update patient's care journey
  let journey = db.careJourneys.find(cj => cj.patientId === input.patientId);
  if (!journey) {
    journey = {
      id: 'cj-' + Date.now(),
      patientId: input.patientId,
      referralId: newReferral.id,
      title: `${input.priorityLevel === 'EMERGENCY' ? 'Emergency' : 'Specialist'} Referral to ${targetFacility.name}`,
      overallStatus: 'ACTIVE',
      currentStage: 'Referral Sent & Awaiting Hospital Review',
      nextBestAction: `Referral sent to ${targetFacility.name}. Receiving facility triage desk will review shortly.`,
      steps: [
        { id: 'step-1', stepOrder: 1, name: 'Initial consultation', status: 'COMPLETED', completedAt: now },
        { id: 'step-2', stepOrder: 2, name: 'Triage', status: 'COMPLETED', completedAt: now },
        { id: 'step-3', stepOrder: 3, name: 'Referral', status: 'COMPLETED', completedAt: now, notes: `Routed to ${targetFacility.name}` },
        { id: 'step-4', stepOrder: 4, name: 'Hospital acceptance', status: 'IN_PROGRESS', actionRequired: 'Receiving doctor review pending' },
        { id: 'step-5', stepOrder: 5, name: 'Appointment', status: 'UPCOMING' },
        { id: 'step-6', stepOrder: 6, name: 'Diagnostic test', status: 'UPCOMING' },
        { id: 'step-7', stepOrder: 7, name: 'Specialist consultation', status: 'UPCOMING' },
        { id: 'step-8', stepOrder: 8, name: 'Treatment', status: 'UPCOMING' },
        { id: 'step-9', stepOrder: 9, name: 'Follow-up', status: 'UPCOMING' }
      ],
      createdAt: now,
      updatedAt: now
    };
    db.careJourneys.unshift(journey);
  } else {
    journey.referralId = newReferral.id;
    journey.currentStage = 'Referral Sent';
    journey.nextBestAction = `Referral transmitted to ${targetFacility.name}. Awaiting acceptance handshake.`;
    const step3 = journey.steps.find(s => s.name === 'Referral');
    if (step3) {
      step3.status = 'COMPLETED';
      step3.completedAt = now;
      step3.notes = `Routed to ${targetFacility.name} (${referralCode})`;
    }
    const step4 = journey.steps.find(s => s.name === 'Hospital acceptance');
    if (step4) {
      step4.status = 'IN_PROGRESS';
    }
    journey.updatedAt = now;
  }

  // Notify Facility
  db.createNotification({
    userId: 'usr-admin-fac-1',
    title: `Incoming ${input.priorityLevel} Referral`,
    message: `${patient.name} referred to your facility (${referralCode}). Please review in Referral Inbox.`,
    type: 'REFERRAL',
    linkUrl: '/referrals'
  });

  // Log Audit
  db.logAudit({
    userName: workerName,
    action: 'REFERRAL_CREATED',
    resource: `Referral/${newReferral.id}`,
    details: `Referral ${referralCode} created for ${patient.name} to ${targetFacility.name}`
  });

  db.save();
  return newReferral;
}

export function updateReferralStatus(
  referralId: string,
  newStatus: ReferralStatus,
  updatedBy: string,
  notes?: string,
  rejectionReason?: string
): Referral {
  const referral = db.referrals.find(r => r.id === referralId);
  if (!referral) throw new Error('Referral not found');

  const now = new Date().toISOString();
  referral.status = newStatus;
  referral.updatedAt = now;

  if (newStatus === 'REJECTED') {
    referral.rejectionReason = rejectionReason || notes || 'Facility over capacity or specialist unavailable';

    // Intelligently find alternative facility
    const patient = db.patients.find(p => p.id === referral.patientId);
    if (patient) {
      const routing = recommendFacilities({
        patientLatitude: patient.latitude,
        patientLongitude: patient.longitude,
        urgency: referral.priorityLevel === 'EMERGENCY' ? 'RED' : 'ORANGE'
      });
      // Pick top alternative that is NOT the rejecting facility
      const alt = routing.find(r => r.facility.id !== referral.targetFacilityId);
      if (alt) {
        referral.alternativeFacilityId = alt.facility.id;
        referral.alternativeFacilityName = alt.facility.name;
      }
    }
  }

  referral.statusHistory.push({
    status: newStatus,
    notes: notes || `Referral transitioned to ${newStatus}`,
    updatedBy,
    timestamp: now
  });

  // Update Care Journey
  const journey = db.careJourneys.find(cj => cj.referralId === referralId || cj.patientId === referral.patientId);
  if (journey) {
    if (newStatus === 'ACCEPTED') {
      const step4 = journey.steps.find(s => s.name === 'Hospital acceptance');
      if (step4) {
        step4.status = 'COMPLETED';
        step4.completedAt = now;
        step4.notes = `Accepted by ${updatedBy}`;
      }
      const step5 = journey.steps.find(s => s.name === 'Appointment');
      if (step5) {
        step5.status = 'IN_PROGRESS';
      }
      journey.currentStage = 'Accepted by Receiving Facility';
      journey.nextBestAction = 'Hospital accepted referral. Proceed to outpatient/emergency intake desk with your token.';
    } else if (newStatus === 'REJECTED') {
      const step4 = journey.steps.find(s => s.name === 'Hospital acceptance');
      if (step4) {
        step4.status = 'DELAYED';
        step4.notes = `Referral rejected: ${rejectionReason || 'Facility unavailable'}`;
      }
      journey.overallStatus = 'DELAYED';
      journey.currentStage = 'Referral Redirect Required';
      journey.nextBestAction = referral.alternativeFacilityName
        ? `Primary facility over capacity. Reroute to alternative recommendation: ${referral.alternativeFacilityName}.`
        : 'Health worker is selecting an alternative facility.';
    } else if (newStatus === 'PATIENT_ARRIVED') {
      const step5 = journey.steps.find(s => s.name === 'Appointment');
      if (step5) {
        step5.status = 'COMPLETED';
        step5.completedAt = now;
      }
      const step6 = journey.steps.find(s => s.name === 'Diagnostic test');
      if (step6) step6.status = 'IN_PROGRESS';
      journey.currentStage = 'Patient Arrived at Facility';
      journey.nextBestAction = 'Patient checked in. Diagnostics or triage bay assessment in progress.';
    } else if (newStatus === 'CONSULTATION_COMPLETED') {
      const step7 = journey.steps.find(s => s.name === 'Specialist consultation');
      if (step7) {
        step7.status = 'COMPLETED';
        step7.completedAt = now;
      }
      const step8 = journey.steps.find(s => s.name === 'Treatment');
      if (step8) step8.status = 'IN_PROGRESS';
      journey.currentStage = 'Consultation Completed';
      journey.nextBestAction = 'Consultation finished. Collect prescribed medicines and schedule 7-day follow-up.';
    } else if (newStatus === 'COMPLETED') {
      journey.overallStatus = 'COMPLETED';
      journey.currentStage = 'Pathway Completed';
      journey.nextBestAction = 'All care steps concluded successfully. Keep health records updated.';
      journey.steps.forEach(s => {
        if (s.status !== 'COMPLETED') {
          s.status = 'COMPLETED';
          s.completedAt = now;
        }
      });
    }
    journey.updatedAt = now;
  }

  // Notify referring health worker and patient
  if (referral.referringWorkerId) {
    const hw = db.healthWorkers.find(w => w.id === referral.referringWorkerId);
    if (hw) {
      db.createNotification({
        userId: hw.userId,
        title: `Referral ${referral.referralCode} Status: ${newStatus}`,
        message: `Referral for patient has been updated to ${newStatus} by ${updatedBy}.`,
        type: 'REFERRAL',
        linkUrl: '/referrals'
      });
    }
  }

  const patient = db.patients.find(p => p.id === referral.patientId);
  if (patient) {
    db.createNotification({
      userId: patient.userId,
      title: `Referral Update: ${newStatus}`,
      message: `Your referral at ${referral.targetFacilityName} is now ${newStatus}.`,
      type: 'REFERRAL',
      linkUrl: '/care-journey'
    });
  }

  db.logAudit({
    userName: updatedBy,
    action: `REFERRAL_${newStatus}`,
    resource: `Referral/${referral.id}`,
    details: `Status transitioned to ${newStatus}. Notes: ${notes || 'N/A'}`
  });

  db.save();
  return referral;
}
