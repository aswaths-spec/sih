import { Facility, TriageUrgency } from '../models/types';
import { db } from '../repositories/db';

export interface RoutingRequest {
  patientLatitude: number;
  patientLongitude: number;
  urgency: TriageUrgency;
  requiredSpecialty?: string;
  requiredDiagnostics?: string[];
  maxDistanceKm?: number;
}

export interface ScoredFacility {
  facility: Facility;
  totalScore: number; // 0 to 100
  distanceKm: number;
  estimatedTravelTimeMin: number;
  reasons: string[];
  scoreBreakdown: {
    capabilityMatch: number;      // max 20
    specialistMatch: number;      // max 25
    capacityScore: number;        // max 20
    diagnosticAvailability: number; // max 15
    medicineAvailability: number; // max 10
    distanceScore: number;        // max 10
  };
}

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function recommendFacilities(request: RoutingRequest): ScoredFacility[] {
  const facilities = db.facilities;
  const results: ScoredFacility[] = [];

  for (const fac of facilities) {
    const distanceKm = calculateDistanceKm(
      request.patientLatitude,
      request.patientLongitude,
      fac.latitude,
      fac.longitude
    );

    // Calculate estimated travel time: 40 km/h average speed in rural/semi-urban corridors + 5 min dispatch
    const travelTimeMin = Math.round((distanceKm / 40) * 60) + 5;

    let capabilityMatch = 0;
    let specialistMatch = 0;
    let capacityScore = 0;
    let diagnosticAvailability = 0;
    let medicineAvailability = 0;
    let distanceScore = 0;
    const reasons: string[] = [];

    // 1. Urgency & Capability Match (Max 20)
    if (request.urgency === 'RED') {
      if (fac.emergencyCapability && fac.icuBeds > 0) {
        capabilityMatch = 20;
        reasons.push('✓ 24x7 Emergency Trauma & ICU resuscitation capability');
      } else if (fac.emergencyCapability) {
        capabilityMatch = 14;
        reasons.push('✓ Basic 24x7 Emergency Room available');
      } else {
        // PHC with no emergency resuscitation penalized heavily for RED urgency
        capabilityMatch = 2;
        reasons.push('⚠ Lacks 24x7 emergency & ICU stabilization facilities');
      }
    } else if (request.urgency === 'ORANGE') {
      if (fac.emergencyCapability || fac.type === 'CHC' || fac.type === 'District Hospital') {
        capabilityMatch = 18;
        reasons.push('✓ Full secondary care inpatient capabilities');
      } else {
        capabilityMatch = 10;
      }
    } else {
      // GREEN (Routine)
      capabilityMatch = 18;
      if (fac.type === 'PHC' || fac.type === 'CHC') {
        capabilityMatch = 20;
        reasons.push('✓ Ideal primary outpatient setting without secondary hospital crowding');
      }
    }

    // 2. Specialist Match (Max 25)
    if (request.requiredSpecialty && request.requiredSpecialty !== 'General Medicine') {
      const match = fac.specialists.find(
        s => s.specialty.toLowerCase() === request.requiredSpecialty?.toLowerCase()
      );
      if (match && match.available) {
        specialistMatch = 25;
        reasons.push(`✓ Required specialist available: ${match.specialty} (${match.doctorName})`);
      } else if (match && !match.available) {
        specialistMatch = 8;
        reasons.push(`⚠ Specialist (${match.specialty}) on staff but currently off-duty`);
      } else {
        specialistMatch = 0;
        reasons.push(`⚠ No ${request.requiredSpecialty} specialist at this facility`);
      }
    } else {
      // General medicine or any doctor
      const anyDoctor = fac.specialists.find(s => s.available);
      if (anyDoctor) {
        specialistMatch = 22;
        reasons.push(`✓ Duty Medical Officer available: ${anyDoctor.doctorName}`);
      } else {
        specialistMatch = 10;
      }
    }

    // 3. Capacity & Queue Score (Max 20)
    const bedOccupancy = fac.totalBeds > 0 ? fac.occupiedBeds / fac.totalBeds : 1.0;
    const availableBeds = fac.totalBeds - fac.occupiedBeds;

    if (bedOccupancy < 0.70 && fac.currentQueueLength <= 10) {
      capacityScore = 20;
      reasons.push(`✓ High capacity available (${availableBeds} beds free, queue: ${fac.currentQueueLength})`);
    } else if (bedOccupancy < 0.85 && fac.currentQueueLength <= 20) {
      capacityScore = 15;
      reasons.push(`✓ Moderate capacity (${availableBeds} beds free, wait time ~${fac.averageWaitTimeMin}m)`);
    } else {
      capacityScore = 6;
      reasons.push(`⚠ High queue/wait time (~${fac.averageWaitTimeMin} mins, only ${availableBeds} beds free)`);
    }

    // 4. Diagnostic Availability (Max 15)
    if (request.requiredDiagnostics && request.requiredDiagnostics.length > 0) {
      let matchedCount = 0;
      for (const diag of request.requiredDiagnostics) {
        const hasDiag = fac.availableDiagnostics.some(d =>
          d.toLowerCase().includes(diag.toLowerCase()) || diag.toLowerCase().includes(d.toLowerCase())
        );
        if (hasDiag) matchedCount++;
      }

      const ratio = matchedCount / request.requiredDiagnostics.length;
      diagnosticAvailability = Math.round(ratio * 15);
      if (ratio === 1) {
        reasons.push(`✓ All required diagnostics available on-site (${request.requiredDiagnostics.join(', ')})`);
      } else if (ratio > 0) {
        reasons.push(`✓ Partial diagnostics available (${matchedCount}/${request.requiredDiagnostics.length})`);
      } else {
        reasons.push(`⚠ Missing required diagnostic equipment`);
      }
    } else {
      diagnosticAvailability = 12;
    }

    // 5. Medicine Stock Availability (Max 10)
    medicineAvailability = Math.round((fac.medicineStockRatio || 0.7) * 10);
    if (fac.medicineStockRatio >= 0.85) {
      reasons.push(`✓ High essential medicine availability (${Math.round(fac.medicineStockRatio * 100)}% in stock)`);
    }

    // 6. Distance & Travel Time Score (Max 10)
    if (distanceKm <= 5) {
      distanceScore = 10;
      reasons.push(`✓ Very close: ${distanceKm} km (Est. travel time: ${travelTimeMin} mins)`);
    } else if (distanceKm <= 15) {
      distanceScore = 8;
      reasons.push(`✓ Accessible distance: ${distanceKm} km (~${travelTimeMin} mins)`);
    } else if (distanceKm <= 30) {
      distanceScore = 6;
      reasons.push(`✓ Reasonable transit: ${distanceKm} km (~${travelTimeMin} mins)`);
    } else if (distanceKm <= 50) {
      distanceScore = 3;
      reasons.push(`⚠ Farther transit: ${distanceKm} km (~${travelTimeMin} mins)`);
    } else {
      distanceScore = 1;
      reasons.push(`⚠ Long transit distance: ${distanceKm} km`);
    }

    const totalScore = Math.min(
      100,
      capabilityMatch +
        specialistMatch +
        capacityScore +
        diagnosticAvailability +
        medicineAvailability +
        distanceScore
    );

    results.push({
      facility: fac,
      totalScore,
      distanceKm,
      estimatedTravelTimeMin: travelTimeMin,
      reasons,
      scoreBreakdown: {
        capabilityMatch,
        specialistMatch,
        capacityScore,
        diagnosticAvailability,
        medicineAvailability,
        distanceScore
      }
    });
  }

  // Sort descending by total composite score
  return results.sort((a, b) => b.totalScore - a.totalScore);
}
