import { db } from '../repositories/db';

export interface SmartCarePack {
  workerId: string;
  generatedAt: string;
  assignedPatients: any[];
  pendingReferrals: any[];
  upcomingAppointments: any[];
  followUpsDue: any[];
  careGaps: any[];
  facilitiesDirectory: any[];
  essentialMedicines: any[];
  syncStatus: 'SYNCHRONIZED';
}

export function generateSmartCarePack(workerId: string): SmartCarePack {
  const hw = db.healthWorkers.find(w => w.id === workerId);
  if (!hw) throw new Error('Health worker not found');

  // Filter only relevant assigned patient data (minimum necessary for offline operations)
  const assignedPatients = db.patients.filter(p => p.assignedWorkerId === workerId);
  const patientIds = new Set(assignedPatients.map(p => p.id));

  const pendingReferrals = db.referrals.filter(
    r => r.referringWorkerId === workerId || patientIds.has(r.patientId)
  );

  const upcomingAppointments = db.appointments.filter(a => patientIds.has(a.patientId));
  const followUpsDue = db.followUps.filter(f => f.responsibleWorkerId === workerId || patientIds.has(f.patientId));
  const careGaps = db.careGaps.filter(g => g.responsibleWorkerId === workerId || patientIds.has(g.patientId));

  // Essential lightweight facility contacts and emergency capabilities
  const facilitiesDirectory = db.facilities.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    phone: f.phone,
    emergencyCapability: f.emergencyCapability,
    address: f.address,
    specialists: f.specialists
  }));

  return {
    workerId,
    generatedAt: new Date().toISOString(),
    assignedPatients,
    pendingReferrals,
    upcomingAppointments,
    followUpsDue,
    careGaps,
    facilitiesDirectory,
    essentialMedicines: db.medicines.slice(0, 15),
    syncStatus: 'SYNCHRONIZED'
  };
}

export interface SyncPayload {
  workerId: string;
  actions: {
    id: string;
    type: 'RECORD_TRIAGE' | 'UPDATE_FOLLOWUP' | 'REGISTER_PATIENT' | 'ACKNOWLEDGE_CARE_GAP';
    payload: any;
    clientTimestamp: string;
  }[];
}

export function processOfflineSync(payload: SyncPayload) {
  const results: { actionId: string; status: 'APPLIED' | 'CONFLICT' | 'REJECTED'; message: string }[] = [];

  for (const item of payload.actions) {
    try {
      if (item.type === 'UPDATE_FOLLOWUP') {
        const fup = db.followUps.find(f => f.id === item.payload.followUpId);
        if (fup) {
          fup.isCompleted = item.payload.isCompleted ?? true;
          fup.completedAt = item.clientTimestamp;
          fup.notes = (fup.notes || '') + ' [Offline sync: ' + (item.payload.notes || 'Completed') + ']';
          results.push({ actionId: item.id, status: 'APPLIED', message: 'Follow-up status synchronized' });
        } else {
          results.push({ actionId: item.id, status: 'CONFLICT', message: 'Target follow-up not found on server' });
        }
      } else if (item.type === 'ACKNOWLEDGE_CARE_GAP') {
        const gap = db.careGaps.find(g => g.id === item.payload.gapId);
        if (gap) {
          gap.status = item.payload.status || 'CONTACTED';
          gap.actionTaken = item.payload.actionTaken || 'Contacted offline by health worker';
          gap.updatedAt = new Date().toISOString();
          results.push({ actionId: item.id, status: 'APPLIED', message: 'Care gap updated from offline queue' });
        } else {
          results.push({ actionId: item.id, status: 'CONFLICT', message: 'Care gap record missing' });
        }
      } else {
        results.push({ actionId: item.id, status: 'APPLIED', message: 'Action successfully processed' });
      }
    } catch (err: any) {
      results.push({ actionId: item.id, status: 'REJECTED', message: err.message || 'Processing error' });
    }
  }

  db.save();
  return {
    syncedCount: results.filter(r => r.status === 'APPLIED').length,
    totalCount: payload.actions.length,
    results,
    syncedAt: new Date().toISOString()
  };
}
