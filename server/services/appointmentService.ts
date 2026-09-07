import { Appointment, AppointmentStatus } from '../models/types';
import { db } from '../repositories/db';

export interface CreateAppointmentInput {
  patientId: string;
  facilityId: string;
  referralId?: string;
  scheduledFor: string;
  department: string;
  disease?: string;
  healthIssue?: string;
  notes?: string;
  initialStatus?: AppointmentStatus;
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  const patient = db.patients.find(p => p.id === input.patientId);
  if (!patient) throw new Error('Patient not found');

  const facility = db.facilities.find(f => f.id === input.facilityId);
  if (!facility) throw new Error('Facility not found');

  const now = new Date().toISOString();
  const tokenNumber = `TK-${departmentPrefix(input.department)}-${Math.floor(10 + Math.random() * 90)}`;
  const appointmentNo = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Default status is PENDING unless explicitly specified
  const status: AppointmentStatus = input.initialStatus || 'PENDING';

  // Increment facility queue length
  facility.currentQueueLength = (facility.currentQueueLength || 0) + 1;

  const apt: Appointment = {
    id: 'apt-' + Date.now(),
    appointmentNo,
    tokenNumber,
    patientId: input.patientId,
    patientName: patient.name,
    facilityId: input.facilityId,
    facilityName: facility.name,
    referralId: input.referralId,
    scheduledFor: input.scheduledFor,
    status,
    department: input.department,
    disease: input.disease || input.healthIssue,
    healthIssue: input.healthIssue || input.disease,
    estimatedWaitMinutes: facility.averageWaitTimeMin || 20,
    notes: input.notes,
    createdAt: now
  };

  db.appointments.unshift(apt);

  // Update Care Journey step for Appointment
  const journey = db.careJourneys.find(cj => cj.patientId === input.patientId);
  if (journey) {
    const aptStep = journey.steps.find(s => s.name.includes('Appointment') || s.stepOrder === 5);
    if (aptStep) {
      aptStep.status = status === 'ACCEPTED' ? 'COMPLETED' : 'IN_PROGRESS';
      aptStep.scheduledAt = input.scheduledFor;
      aptStep.notes = `Appointment requested at ${facility.name} (${input.department}) for ${input.disease || 'General Consultation'}. Token: ${tokenNumber} (Status: ${status}).`;
      aptStep.actionRequired = status === 'PENDING' 
        ? `Pending hospital doctor review and acceptance at ${facility.name}.`
        : `Arrive 15 mins early at ${input.department}. Present Token ${tokenNumber}.`;
    }
    journey.currentStage = status === 'PENDING' ? 'Hospital Review Pending' : 'Appointment Scheduled';
    journey.nextBestAction = status === 'PENDING'
      ? `Appointment request submitted. Awaiting hospital doctor confirmation for Token ${tokenNumber}.`
      : `Token ${tokenNumber} confirmed. Present at ${facility.name}.`;
    journey.updatedAt = now;
  }

  db.createNotification({
    userId: patient.userId,
    title: status === 'PENDING' ? `Appointment Request Submitted (${tokenNumber})` : `Appointment Confirmed (${tokenNumber})`,
    message: status === 'PENDING'
      ? `Your appointment request for ${facility.name} (${input.department}) is pending doctor acceptance. Token: ${tokenNumber}.`
      : `Appointment scheduled at ${facility.name}. Token: ${tokenNumber}. Est wait: ${apt.estimatedWaitMinutes} mins.`,
    type: 'APPOINTMENT',
    linkUrl: '/care-journey'
  });

  db.logAudit({
    action: 'APPOINTMENT_CREATED',
    resource: `Appointment/${apt.id}`,
    details: `Issued request ${tokenNumber} for ${patient.name} at ${facility.name} [Status: ${status}]`
  });

  db.save();
  return apt;
}

export function acceptAppointment(appointmentId: string, doctorName?: string, notes?: string): Appointment {
  const apt = db.appointments.find(a => a.id === appointmentId);
  if (!apt) throw new Error('Appointment not found');

  apt.status = 'ACCEPTED';
  if (doctorName) apt.doctorName = doctorName;
  if (notes) apt.notes = apt.notes ? `${apt.notes} | Accepted: ${notes}` : `Accepted: ${notes}`;

  const now = new Date().toISOString();

  // Update Care Journey
  const journey = db.careJourneys.find(cj => cj.patientId === apt.patientId);
  if (journey) {
    const acceptanceStep = journey.steps.find(s => s.stepOrder === 4 || s.name.includes('Acceptance'));
    if (acceptanceStep) {
      acceptanceStep.status = 'COMPLETED';
      acceptanceStep.completedAt = now;
      acceptanceStep.notes = `Appointment and bed accepted by ${doctorName || 'Duty Medical Officer'} at ${apt.facilityName}.`;
    }

    const aptStep = journey.steps.find(s => s.stepOrder === 5 || s.name.includes('Appointment'));
    if (aptStep) {
      aptStep.status = 'COMPLETED';
      aptStep.completedAt = now;
      aptStep.notes = `Token ${apt.tokenNumber} verified & priority OPD admission authorized.`;
    }

    // Advance to next step (e.g. Diagnostic / Specialist Consultation)
    const nextStep = journey.steps.find(s => s.stepOrder === 6);
    if (nextStep) {
      nextStep.status = 'IN_PROGRESS';
      nextStep.actionRequired = `Proceed to diagnostic screening and clinical evaluation at ${apt.facilityName}.`;
    }

    journey.currentStage = 'Appointment Accepted & Admitted';
    journey.nextBestAction = `Appointment accepted. Please proceed to ${apt.facilityName} with Token ${apt.tokenNumber}.`;
    journey.tokenNumber = apt.tokenNumber;
    journey.facilityName = apt.facilityName;
    journey.updatedAt = now;
  }

  const patient = db.patients.find(p => p.id === apt.patientId);
  if (patient) {
    db.createNotification({
      userId: patient.userId,
      title: `Appointment Accepted: ${apt.tokenNumber}`,
      message: `Dr. ${doctorName || 'Duty Medical Specialist'} at ${apt.facilityName} accepted your appointment. Token ${apt.tokenNumber} is active.`,
      type: 'APPOINTMENT',
      linkUrl: '/care-journey'
    });
  }

  db.logAudit({
    action: 'APPOINTMENT_ACCEPTED',
    resource: `Appointment/${apt.id}`,
    details: `Doctor ${doctorName || 'Specialist'} accepted appointment for patient ${apt.patientName || apt.patientId}`
  });

  db.save();
  return apt;
}

export function declineAppointment(appointmentId: string, doctorName?: string, reason?: string): Appointment {
  const apt = db.appointments.find(a => a.id === appointmentId);
  if (!apt) throw new Error('Appointment not found');

  apt.status = 'DECLINED';
  apt.declineReason = reason || 'Department over capacity or specialist unavailable at requested time.';
  if (doctorName) apt.doctorName = doctorName;

  const now = new Date().toISOString();

  // Update Care Journey
  const journey = db.careJourneys.find(cj => cj.patientId === apt.patientId);
  if (journey) {
    const aptStep = journey.steps.find(s => s.stepOrder === 5 || s.name.includes('Appointment'));
    if (aptStep) {
      aptStep.status = 'DELAYED';
      aptStep.notes = `Appointment declined by ${apt.facilityName}. Reason: ${apt.declineReason}. Alternative facility re-routing required.`;
      aptStep.actionRequired = 'Select an alternative hospital or re-schedule with your ASHA worker.';
    }
    journey.currentStage = 'Appointment Re-scheduling Required';
    journey.nextBestAction = `Appointment at ${apt.facilityName} was declined (${apt.declineReason}). Select another available facility.`;
    journey.updatedAt = now;
  }

  const patient = db.patients.find(p => p.id === apt.patientId);
  if (patient) {
    db.createNotification({
      userId: patient.userId,
      title: `Appointment Declined: ${apt.tokenNumber}`,
      message: `Your appointment at ${apt.facilityName} could not be confirmed. Reason: ${apt.declineReason}`,
      type: 'APPOINTMENT',
      linkUrl: '/book-appointment'
    });
  }

  db.logAudit({
    action: 'APPOINTMENT_DECLINED',
    resource: `Appointment/${apt.id}`,
    details: `Doctor ${doctorName || 'Specialist'} declined appointment for patient ${apt.patientName || apt.patientId}. Reason: ${apt.declineReason}`
  });

  db.save();
  return apt;
}

export function referAppointment(
  appointmentId: string,
  doctorName?: string,
  referralInput?: {
    targetFacilityId: string;
    reason: string;
    priority?: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
    specialty?: string;
  }
): { appointment: Appointment; referral: any } {
  const apt = db.appointments.find(a => a.id === appointmentId);
  if (!apt) throw new Error('Appointment not found');

  const targetFacility = db.facilities.find(f => f.id === referralInput?.targetFacilityId);
  if (!targetFacility) throw new Error('Target facility for referral not found');

  apt.status = 'REFERRED';
  apt.referredFacilityId = targetFacility.id;
  apt.referredFacilityName = targetFacility.name;
  apt.referredSpecialty = referralInput?.specialty || apt.department;
  if (doctorName) apt.doctorName = doctorName;

  const now = new Date().toISOString();
  const refCode = `REF-TN-${Math.floor(1000 + Math.random() * 9000)}`;

  const referral = {
    id: 'ref-' + Date.now(),
    referralCode: refCode,
    patientId: apt.patientId,
    targetFacilityId: targetFacility.id,
    targetFacilityName: targetFacility.name,
    reasonForReferral: referralInput?.reason || `Referred from ${apt.facilityName} to ${targetFacility.name} for tertiary specialty care.`,
    clinicalSummary: `Patient presented with ${apt.disease || apt.healthIssue || 'clinical condition'}. Initial assessment at ${apt.facilityName}. Requires escalation to ${targetFacility.name}.`,
    priorityLevel: referralInput?.priority || 'URGENT',
    status: 'ACCEPTED' as const,
    statusHistory: [
      {
        status: 'CREATED' as const,
        notes: `Referral initiated by ${doctorName || 'Hospital Doctor'} from appointment ${apt.tokenNumber}`,
        updatedBy: doctorName || 'Hospital Doctor',
        timestamp: now
      },
      {
        status: 'ACCEPTED' as const,
        notes: `Automated fast-track acceptance at ${targetFacility.name}`,
        updatedBy: 'CareGrid Routing Engine',
        timestamp: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  db.referrals.unshift(referral as any);
  apt.referralId = referral.id;

  // Update Care Journey
  const journey = db.careJourneys.find(cj => cj.patientId === apt.patientId);
  if (journey) {
    journey.referralId = refCode;
    journey.facilityName = targetFacility.name;

    const refStep = journey.steps.find(s => s.stepOrder === 3 || s.name.includes('Referral'));
    if (refStep) {
      refStep.status = 'COMPLETED';
      refStep.completedAt = now;
      refStep.notes = `Referred to ${targetFacility.name} (${refCode}) by ${doctorName || 'Hospital Specialist'}.`;
    }

    const lockStep = journey.steps.find(s => s.stepOrder === 4 || s.name.includes('Acceptance'));
    if (lockStep) {
      lockStep.status = 'IN_PROGRESS';
      lockStep.actionRequired = `Fast-track intake awaiting arrival at ${targetFacility.name}.`;
    }

    journey.currentStage = 'Transferred to Higher Facility';
    journey.nextBestAction = `Referral ${refCode} generated. Proceed to ${targetFacility.name} for higher-tier care.`;
    journey.updatedAt = now;
  }

  const patient = db.patients.find(p => p.id === apt.patientId);
  if (patient) {
    db.createNotification({
      userId: patient.userId,
      title: `Specialty Referral Created (${refCode})`,
      message: `Your case was escalated to ${targetFacility.name} for advanced care by Dr. ${doctorName || 'Specialist'}.`,
      type: 'REFERRAL',
      linkUrl: '/care-journey'
    });
  }

  db.logAudit({
    action: 'APPOINTMENT_REFERRED',
    resource: `Appointment/${apt.id}`,
    details: `Doctor ${doctorName || 'Specialist'} referred patient ${apt.patientName || apt.patientId} to ${targetFacility.name} (${refCode})`
  });

  db.save();
  return { appointment: apt, referral };
}

export function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Appointment {
  const apt = db.appointments.find(a => a.id === appointmentId);
  if (!apt) throw new Error('Appointment not found');

  apt.status = status;

  if (status === 'COMPLETED') {
    const journey = db.careJourneys.find(cj => cj.patientId === apt.patientId);
    if (journey) {
      const step = journey.steps.find(s => s.name.includes('Appointment') || s.stepOrder === 5);
      if (step) {
        step.status = 'COMPLETED';
        step.completedAt = new Date().toISOString();
      }
    }
  }

  db.save();
  return apt;
}

function departmentPrefix(dept: string): string {
  if (!dept) return 'OPD';
  if (dept.toLowerCase().includes('cardio')) return 'CARD';
  if (dept.toLowerCase().includes('emerg')) return 'EMRG';
  if (dept.toLowerCase().includes('ob') || dept.toLowerCase().includes('gyn')) return 'OBGYN';
  if (dept.toLowerCase().includes('ped')) return 'PEDS';
  if (dept.toLowerCase().includes('ortho')) return 'ORTH';
  return 'OPD';
}
