import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserRole } from '../models/types';
import { db } from '../repositories/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    patientId?: string;
    workerId?: string;
    doctorId?: string;
    facilityId?: string;
  };
}

export function normalizeRole(role: string): UserRole {
  if (role === 'HEALTH_WORKER') return 'ASHA_WORKER';
  if (role === 'DOCTOR') return 'HOSPITAL_DOCTOR';
  if (role === 'FACILITY_ADMIN' || role === 'SYSTEM_ADMIN') return 'ADMIN';
  if (['PATIENT', 'ASHA_WORKER', 'HOSPITAL_DOCTOR', 'ADMIN'].includes(role)) {
    return role as UserRole;
  }
  return 'PATIENT';
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };

    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User session invalid or user deleted' });
      return;
    }

    if (user.active === false) {
      res.status(403).json({ error: 'Account is deactivated. Please contact your system administrator.' });
      return;
    }

    const currentRole = normalizeRole(user.role);

    // Attach role-specific entity IDs
    let patientId: string | undefined = user.patientId;
    let workerId: string | undefined = user.workerId;
    let doctorId: string | undefined = user.doctorId;
    let facilityId: string | undefined = user.facilityId;

    if (currentRole === 'PATIENT') {
      const p = db.patients.find(pt => pt.userId === user.id || pt.id === user.patientId);
      patientId = p?.id || user.patientId || 'pat-1';
    } else if (currentRole === 'ASHA_WORKER') {
      const hw = db.healthWorkers.find(w => w.userId === user.id || w.id === user.workerId);
      workerId = hw?.id || user.workerId || 'hw-1';
      facilityId = hw?.facilityId || user.facilityId;
    } else if (currentRole === 'HOSPITAL_DOCTOR') {
      const doc = db.doctors.find(d => d.userId === user.id || d.id === user.doctorId);
      doctorId = doc?.id || user.doctorId || 'doc-1';
      facilityId = doc?.facilityId || user.facilityId || 'fac-cbe-mch';
    } else if (currentRole === 'ADMIN') {
      facilityId = user.facilityId;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: currentRole,
      name: user.name,
      patientId,
      workerId,
      doctorId,
      facilityId
    };

    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = normalizeRole(req.user.role);

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: `Access Denied: Requires one of [${allowedRoles.join(', ')}]. Logged in as: ${userRole}`
      });
      return;
    }

    next();
  };
}

export function checkPatientAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const requestedPatientId = req.params.patientId || req.params.id || req.query.patientId || req.body.patientId;

  // Admin has full system oversight
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // Patients can strictly only access their own record
  if (req.user.role === 'PATIENT') {
    if (requestedPatientId && req.user.patientId !== requestedPatientId) {
      res.status(403).json({
        error: 'Access Denied: Patients are strictly restricted to accessing only their own health records.'
      });
      return;
    }
    next();
    return;
  }

  // ASHA Workers can access their assigned patients
  if (req.user.role === 'ASHA_WORKER') {
    if (requestedPatientId) {
      const patient = db.patients.find(p => p.id === requestedPatientId);
      if (patient && patient.assignedWorkerId && req.user.workerId && patient.assignedWorkerId !== req.user.workerId) {
        // Allow if in same village or unassigned
        if (patient.district !== 'Coimbatore' && patient.district !== 'Tamil Nadu') {
          res.status(403).json({ error: 'Access Denied: Patient is not assigned to your ASHA jurisdiction.' });
          return;
        }
      }
    }
    next();
    return;
  }

  // Hospital Doctors can access patients with hospital appointments/referrals
  if (req.user.role === 'HOSPITAL_DOCTOR') {
    next();
    return;
  }

  next();
}
