// ABDM (Ayushman Bharat Digital Mission) Integration Interface & Development Adapter

export interface AbhaVerificationResult {
  valid: boolean;
  abhaId: string;
  abhaAddress: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  isMockAdapter: boolean;
  adapterDisclaimer: string;
}

export interface AbhaConsentArtifact {
  consentId: string;
  patientAbhaId: string;
  requesterId: string;
  purposeCode: string;
  dateRange: { from: string; to: string };
  status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED';
}

export interface ABDMService {
  verifyAbha(abhaId: string): Promise<AbhaVerificationResult>;
  requestConsent(artifact: Omit<AbhaConsentArtifact, 'consentId' | 'status'>): Promise<AbhaConsentArtifact>;
}

export class ABDMMockAdapter implements ABDMService {
  async verifyAbha(abhaId: string): Promise<AbhaVerificationResult> {
    const cleanId = abhaId.replace(/\s+/g, '');
    return {
      valid: true,
      abhaId: abhaId,
      abhaAddress: `${cleanId.slice(0, 8)}@abdm`,
      name: 'Ramesh Patil',
      gender: 'MALE',
      dateOfBirth: '1976-04-12',
      status: 'ACTIVE',
      isMockAdapter: true,
      adapterDisclaimer:
        'ABDM Sandbox Interface: Prepared for National Health Authority (NHA) Gateway integration. Simulates ABHA verification without live ABDM credentials.'
    };
  }

  async requestConsent(artifact: Omit<AbhaConsentArtifact, 'consentId' | 'status'>): Promise<AbhaConsentArtifact> {
    return {
      consentId: `cst-abdm-${Date.now()}`,
      status: 'GRANTED',
      ...artifact
    };
  }
}

export const abdmService: ABDMService = new ABDMMockAdapter();
