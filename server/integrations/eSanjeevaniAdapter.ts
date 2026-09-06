// TeleconsultationService interface and Government eSanjeevani Adapter

export interface TeleconsultationRequest {
  patientId: string;
  patientName: string;
  chiefComplaint: string;
  preferredLanguage: string;
  scheduledTime?: string;
  preferredSpecialty?: string;
}

export interface TeleconsultationResponse {
  sessionId: string;
  providerName: string;
  status: 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  roomUrl: string;
  token: string;
  estimatedWaitMinutes: number;
  isMockAdapter: boolean;
  regulatoryNote: string;
}

export interface TeleconsultationService {
  checkEligibility(patientId: string): Promise<{ eligible: boolean; reason?: string }>;
  createConsultation(request: TeleconsultationRequest): Promise<TeleconsultationResponse>;
  getConsultationStatus(sessionId: string): Promise<{ status: string; doctorName?: string }>;
}

export class ESanjeevaniMockAdapter implements TeleconsultationService {
  private isConfigured = false;

  constructor() {
    // Detect if live government credentials exist in production
    this.isConfigured = Boolean(process.env.ESANJEEVANI_API_KEY);
  }

  async checkEligibility(patientId: string): Promise<{ eligible: boolean; reason?: string }> {
    return {
      eligible: true,
      reason: 'Patient verified under National Health Mission rural tele-OPD program.'
    };
  }

  async createConsultation(request: TeleconsultationRequest): Promise<TeleconsultationResponse> {
    const sessionId = `esanj-mock-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      sessionId,
      providerName: 'eSanjeevani National Teleconsultation Service (Development Mock)',
      status: 'SCHEDULED',
      roomUrl: `/teleconsultation/room/${sessionId}`,
      token: `tok_esanj_${Math.random().toString(36).substring(2, 10)}`,
      estimatedWaitMinutes: 15,
      isMockAdapter: true,
      regulatoryNote:
        'Mock Teleconsultation Adapter: Connects to mock eSanjeevani room for Hackathon demonstration. Production deployment connects to MoHFW eSanjeevani 2.0 API gateway.'
    };
  }

  async getConsultationStatus(sessionId: string): Promise<{ status: string; doctorName?: string }> {
    return {
      status: 'READY',
      doctorName: 'Dr. Vivek Sharma (Duty Tele-Specialist)'
    };
  }
}

export const teleconsultationService: TeleconsultationService = new ESanjeevaniMockAdapter();
