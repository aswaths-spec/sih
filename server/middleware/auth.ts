import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserRole, User } from '../models/types';
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
      role: UserRole;
      name: string;
    };

    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User session invalid or user deleted' });
      return;
    }

    // Attach role-specific entity IDs
    let patientId: string | undefined;
    let workerId: string | undefined;
    let doctorId: string | undefined;
    let facilityId: string | undefined;

    if (user.role === 'PATIENT') {
      const p = db.patients.find(pt => pt.userId === user.id);
      patientId = p?.id;
    } else if (user.role === 'HEALTH_WORKER') {
      const hw = db.healthWorkers.find(w => w.userId === user.id);
      workerId = hw?.id;
      facilityId = hw?.facilityId;
    } else if (user.role === 'DOCTOR') {
      const doc = db.doctors.find(d => d.userId === user.id);
      doctorId = doc?.id;
      facilityId = doc?.facilityId;
    } else if (user.role === 'FACILITY_ADMIN') {
      const fa = db.facilityAdmins.find(f => f.userId === user.id);
      facilityId = fa?.facilityId;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
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

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
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

  const requestedPatientId = req.params.patientId || req.query.patientId || req.body.patientId;

  // System Admin and Healthcare professionals can access patient data per workflow
  if (['SYSTEM_ADMIN', 'DOCTOR', 'HEALTH_WORKER', 'FACILITY_ADMIN'].includes(req.user.role)) {
    next();
    return;
  }

  // If user is a patient, they can only access their own patient record
  if (req.user.role === 'PATIENT') {
    if (requestedPatientId && req.user.patientId !== requestedPatientId) {
      res.status(403).json({ error: 'Access forbidden: Patients can only access their own health records.' });
      return;
    }
  }

  next();
}
