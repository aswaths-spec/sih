import { CareGap, CareGapStatus } from '../models/types';
import { db } from '../repositories/db';

export function scanAndDetectCareGaps(): CareGap[] {
  const now = new Date();
  const existingGaps = db.careGaps;

  // 1. Scan for Overdue Follow-ups
  for (const fup of db.followUps) {
    if (!fup.isCompleted && new Date(fup.dueDate).getTime() < now.getTime()) {
      const alreadyLogged = existingGaps.some(
        g => g.patientId === fup.patientId && g.gapType === 'FOLLOWUP_OVERDUE' && g.status !== 'RESOLVED'
      );
      if (!alreadyLogged) {
        const patient = db.patients.find(p => p.id === fup.patientId);
        const hw = fup.responsibleWorkerId ? db.healthWorkers.find(w => w.id === fup.responsibleWorkerId) : null;
        const newGap: CareGap = {
          id: 'gap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          patientId: fup.patientId,
          patientName: patient?.name || 'Unknown Patient',
          gapType: 'FOLLOWUP_OVERDUE',
          severity: 'HIGH',
          dueDate: fup.dueDate,
          detectedDate: now.toISOString(),
          responsibleWorkerId: fup.responsibleWorkerId,
          responsibleWorkerName: hw?.name || 'Assigned ASHA/ANM',
          status: 'OPEN',
          actionTaken: 'Care-Gap Radar automated alert generated',
          resolutionNotes: `Scheduled follow-up for "${fup.reason}" is overdue since ${new Date(fup.dueDate).toLocaleDateString()}.`,
          updatedAt: now.toISOString()
        };
        db.careGaps.unshift(newGap);
        fup.missedAlertRaised = true;
      }
    }
  }

  // 2. Scan for Overdue Diagnostics
  for (const diag of db.diagnostics) {
    if (diag.status === 'REQUESTED' && new Date(diag.requiredDate).getTime() < now.getTime()) {
      diag.status = 'OVERDUE';
      const alreadyLogged = existingGaps.some(
        g => g.patientId === diag.patientId && g.gapType === 'DIAGNOSTIC_OVERDUE' && g.status !== 'RESOLVED'
      );
      if (!alreadyLogged) {
        const patient = db.patients.find(p => p.id === diag.patientId);
        const newGap: CareGap = {
          id: 'gap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          patientId: diag.patientId,
          patientName: patient?.name || diag.patientName,
          gapType: 'DIAGNOSTIC_OVERDUE',
          severity: 'MODERATE',
          dueDate: diag.requiredDate,
          detectedDate: now.toISOString(),
          responsibleWorkerId: patient?.assignedWorkerId,
          status: 'OPEN',
          actionTaken: 'Care-Gap Radar flagged overdue diagnostic test',
          resolutionNotes: `Diagnostic test "${diag.testName}" required by ${new Date(diag.requiredDate).toLocaleDateString()} has not been conducted.`,
          updatedAt: now.toISOString()
        };
        db.careGaps.unshift(newGap);
      }
    }
  }

  // 3. Scan for Pending Referrals (> 24-48h without acceptance)
  for (const ref of db.referrals) {
    if (['CREATED', 'SENT', 'RECEIVED'].includes(ref.status)) {
      const hoursSince = (now.getTime() - new Date(ref.createdAt).getTime()) / 3600000;
      if (hoursSince >= 24) {
        const alreadyLogged = existingGaps.some(
          g => g.patientId === ref.patientId && g.gapType === 'PENDING_REFERRAL' && g.status !== 'RESOLVED'
        );
        if (!alreadyLogged) {
          const patient = db.patients.find(p => p.id === ref.patientId);
          const newGap: CareGap = {
            id: 'gap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            patientId: ref.patientId,
            patientName: patient?.name || 'Referred Patient',
            gapType: 'PENDING_REFERRAL',
            severity: ref.priorityLevel === 'EMERGENCY' ? 'CRITICAL' : 'HIGH',
            dueDate: ref.createdAt,
            detectedDate: now.toISOString(),
            responsibleWorkerId: ref.referringWorkerId,
            responsibleWorkerName: ref.referringWorkerName,
            status: 'OPEN',
            actionTaken: 'Automated notification dispatched to receiving facility admin',
            resolutionNotes: `Referral ${ref.referralCode} to ${ref.targetFacilityName} is pending review for ${Math.round(hoursSince)} hours.`,
            updatedAt: now.toISOString()
          };
          db.careGaps.unshift(newGap);
        }
      }
    }
  }

  db.save();
  return db.careGaps;
}

export function updateCareGapStatus(
  gapId: string,
  newStatus: CareGapStatus,
  actionTaken: string,
  resolutionNotes?: string
): CareGap {
  const gap = db.careGaps.find(g => g.id === gapId);
  if (!gap) throw new Error('Care gap record not found');

  gap.status = newStatus;
  gap.actionTaken = actionTaken;
  if (resolutionNotes) gap.resolutionNotes = resolutionNotes;
  gap.updatedAt = new Date().toISOString();

  // If resolved and related to follow-up, mark the follow-up completed
  if (newStatus === 'RESOLVED' && gap.gapType === 'FOLLOWUP_OVERDUE') {
    const fup = db.followUps.find(f => f.patientId === gap.patientId && !f.isCompleted);
    if (fup) {
      fup.isCompleted = true;
      fup.completedAt = new Date().toISOString();
      fup.notes = `Resolved via Care-Gap Radar: ${actionTaken}. ${resolutionNotes || ''}`;
    }
  }

  db.logAudit({
    action: `CARE_GAP_${newStatus}`,
    resource: `CareGap/${gap.id}`,
    details: `Care gap for ${gap.patientName} transitioned to ${newStatus}. Action: ${actionTaken}`
  });

  db.save();
  return gap;
}
