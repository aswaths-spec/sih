import { Appointment, AppointmentStatus } from '../models/types';
import { db } from '../repositories/db';

export interface CreateAppointmentInput {
  patientId: string;
  facilityId: string;
  referralId?: string;
  scheduledFor: string;
  department: string;
  notes?: string;
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  const patient = db.patients.find(p => p.id === input.patientId);
  if (!patient) throw new Error('Patient not found');

  const facility = db.facilities.find(f => f.id === input.facilityId);
  if (!facility) throw new Error('Facility not found');

  const now = new Date().toISOString();
  const tokenNumber = `TK-${departmentPrefix(input.department)}-${Math.floor(10 + Math.random() * 90)}`;
  const appointmentNo = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Increment facility queue length
  facility.currentQueueLength = (facility.currentQueueLength || 0) + 1;

  const apt: Appointment = {
    id: 'apt-' + Date.now(),
    appointmentNo,
    tokenNumber,
    patientId: input.patientId,
    facilityId: input.facilityId,
    facilityName: facility.name,
    referralId: input.referralId,
    scheduledFor: input.scheduledFor,
    status: 'CONFIRMED',
    department: input.department,
    estimatedWaitMinutes: facility.averageWaitTimeMin || 20,
    notes: input.notes,
    createdAt: now
  };

  db.appointments.unshift(apt);

  // Update Care Journey step for Appointment
  const journey = db.careJourneys.find(cj => cj.patientId === input.patientId);
  if (journey) {
    const aptStep = journey.steps.find(s => s.name === 'Appointment');
    if (aptStep) {
      aptStep.status = 'IN_PROGRESS';
      aptStep.scheduledAt = input.scheduledFor;
      aptStep.notes = `Token ${tokenNumber} issued for ${facility.name} (${input.department})`;
      aptStep.actionRequired = `Arrive 15 mins early at ${input.department}. Present Token ${tokenNumber}.`;
    }
    journey.currentStage = 'Appointment Scheduled';
    journey.nextBestAction = `Token ${tokenNumber} confirmed. Present at ${facility.name} at ${new Date(input.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    journey.updatedAt = now;
  }

  db.createNotification({
    userId: patient.userId,
    title: `Appointment Confirmed (${tokenNumber})`,
    message: `Appointment scheduled at ${facility.name}. Token: ${tokenNumber}. Est wait: ${apt.estimatedWaitMinutes} mins.`,
    type: 'APPOINTMENT',
    linkUrl: '/care-journey'
  });

  db.logAudit({
    action: 'APPOINTMENT_CREATED',
    resource: `Appointment/${apt.id}`,
    details: `Issued token ${tokenNumber} for ${patient.name} at ${facility.name}`
  });

  db.save();
  return apt;
}

export function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Appointment {
  const apt = db.appointments.find(a => a.id === appointmentId);
  if (!apt) throw new Error('Appointment not found');

  apt.status = status;

  if (status === 'COMPLETED') {
    const journey = db.careJourneys.find(cj => cj.patientId === apt.patientId);
    if (journey) {
      const step = journey.steps.find(s => s.name === 'Appointment');
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
  if (dept.toLowerCase().includes('cardio')) return 'CARD';
  if (dept.toLowerCase().includes('emerg')) return 'EMRG';
  if (dept.toLowerCase().includes('ob') || dept.toLowerCase().includes('gyn')) return 'OBGYN';
  if (dept.toLowerCase().includes('ped')) return 'PEDS';
  return 'OPD';
}
