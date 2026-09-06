import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Patient,
  HealthWorker,
  Doctor,
  FacilityAdmin,
  Facility,
  Medicine,
  TriageAssessment,
  Referral,
  Appointment,
  CareJourney,
  CareGap,
  FollowUp,
  DiagnosticRequest,
  Consent,
  Teleconsultation,
  AuditLog,
  Notification
} from '../models/types';

interface DatabaseSchema {
  users: User[];
  patients: Patient[];
  healthWorkers: HealthWorker[];
  doctors: Doctor[];
  facilityAdmins: FacilityAdmin[];
  facilities: Facility[];
  medicines: Medicine[];
  triages: TriageAssessment[];
  referrals: Referral[];
  appointments: Appointment[];
  careJourneys: CareJourney[];
  careGaps: CareGap[];
  followUps: FollowUp[];
  diagnostics: DiagnosticRequest[];
  consents: Consent[];
  teleconsultations: Teleconsultation[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

const DB_FILE = path.join(process.cwd(), 'caregrid-db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    patients: [],
    healthWorkers: [],
    doctors: [],
    facilityAdmins: [],
    facilities: [],
    medicines: [],
    triages: [],
    referrals: [],
    appointments: [],
    careJourneys: [],
    careGaps: [],
    followUps: [],
    diagnostics: [],
    consents: [],
    teleconsultations: [],
    auditLogs: [],
    notifications: []
  };

  private initialized = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.initialized = true;
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Could not read DB file, seeding fresh in-memory database:', err);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public resetToDemo() {
    this.seedInitialData();
    this.save();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync('CareGrid@123', salt);

    const now = new Date();
    const isoNow = now.toISOString();

    // 1. USERS
    const users: User[] = [
      {
        id: 'usr-pat-1',
        email: 'ramesh.patil@patient.caregrid.in',
        passwordHash,
        name: 'Ramesh Patil',
        phone: '+91 98220 11234',
        role: 'PATIENT',
        createdAt: isoNow
      },
      {
        id: 'usr-pat-2',
        email: 'priya.kulkarni@patient.caregrid.in',
        passwordHash,
        name: 'Priya Kulkarni',
        phone: '+91 98220 44556',
        role: 'PATIENT',
        createdAt: isoNow
      },
      {
        id: 'usr-pat-3',
        email: 'anandi.bai@patient.caregrid.in',
        passwordHash,
        name: 'Anandi Bai',
        phone: '+91 98220 77889',
        role: 'PATIENT',
        createdAt: isoNow
      },
      {
        id: 'usr-hw-1',
        email: 'sunita.gaikwad@worker.caregrid.in',
        passwordHash,
        name: 'Sunita Gaikwad (ASHA)',
        phone: '+91 98220 55678',
        role: 'HEALTH_WORKER',
        createdAt: isoNow
      },
      {
        id: 'usr-doc-1',
        email: 'dr.sharma@doctor.caregrid.in',
        passwordHash,
        name: 'Dr. Vivek Sharma',
        phone: '+91 98220 88990',
        role: 'DOCTOR',
        createdAt: isoNow
      },
      {
        id: 'usr-doc-2',
        email: 'dr.anjali.desai@doctor.caregrid.in',
        passwordHash,
        name: 'Dr. Anjali Desai',
        phone: '+91 98220 99001',
        role: 'DOCTOR',
        createdAt: isoNow
      },
      {
        id: 'usr-admin-fac-1',
        email: 'rajesh.admin@facility.caregrid.in',
        passwordHash,
        name: 'Rajesh Deshmukh (Admin)',
        phone: '+91 98220 33445',
        role: 'FACILITY_ADMIN',
        createdAt: isoNow
      },
      {
        id: 'usr-admin-sys-1',
        email: 'dho.solapur@system.caregrid.in',
        passwordHash,
        name: 'Dr. Anita Roy (District Health Officer)',
        phone: '+91 98220 00112',
        role: 'SYSTEM_ADMIN',
        createdAt: isoNow
      }
    ];

    // 2. FACILITIES
    const facilities: Facility[] = [
      {
        id: 'fac-1',
        name: 'Shirur Rural Primary Health Centre',
        type: 'PHC',
        category: 'Public',
        latitude: 18.824,
        longitude: 74.375,
        address: 'Main Road, Shirur Village, Solapur District',
        district: 'Solapur',
        phone: '0217-234101',
        emergencyCapability: false,
        totalBeds: 6,
        occupiedBeds: 5,
        icuBeds: 0,
        occupiedIcuBeds: 0,
        currentQueueLength: 19,
        averageWaitTimeMin: 45,
        specialists: [
          { specialty: 'General Medicine', available: true, doctorName: 'Dr. Jadhav' }
        ],
        services: ['Triage', 'Outpatient OPD', 'Basic Immunization', 'Antenatal Check'],
        availableDiagnostics: ['Blood Glucose', 'Urine Routine', 'Rapid Malaria Kit'],
        medicineStockRatio: 0.65
      },
      {
        id: 'fac-2',
        name: 'Barshi Community Health Centre (CHC)',
        type: 'CHC',
        category: 'Public',
        latitude: 18.232,
        longitude: 75.696,
        address: 'Kurduwadi Road, Barshi, Solapur',
        district: 'Solapur',
        phone: '02184-222333',
        emergencyCapability: true,
        totalBeds: 30,
        occupiedBeds: 21,
        icuBeds: 2,
        occupiedIcuBeds: 2,
        currentQueueLength: 14,
        averageWaitTimeMin: 30,
        specialists: [
          { specialty: 'General Medicine', available: true, doctorName: 'Dr. P. Patil' },
          { specialty: 'Pediatrics', available: true, doctorName: 'Dr. S. Kadam' },
          { specialty: 'Obstetrics/Gynecology', available: false, doctorName: 'Dr. M. More' }
        ],
        services: ['24x7 Emergency', 'X-Ray', 'ECG', 'Labor Room', 'Pathology Lab'],
        availableDiagnostics: ['ECG', 'X-Ray Chest', 'Complete Blood Count (CBC)', 'Liver Function Test'],
        medicineStockRatio: 0.82
      },
      {
        id: 'fac-3',
        name: 'Solapur District Civil Hospital',
        type: 'District Hospital',
        category: 'Public',
        latitude: 17.659,
        longitude: 75.906,
        address: 'Civil Lines, Near Railway Station, Solapur',
        district: 'Solapur',
        phone: '0217-2722100',
        emergencyCapability: true,
        totalBeds: 250,
        occupiedBeds: 165,
        icuBeds: 24,
        occupiedIcuBeds: 14,
        currentQueueLength: 8,
        averageWaitTimeMin: 20,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. Vivek Sharma' },
          { specialty: 'Obstetrics/Gynecology', available: true, doctorName: 'Dr. Anjali Desai' },
          { specialty: 'Orthopedics', available: true, doctorName: 'Dr. R. Shinde' },
          { specialty: 'Pulmonology', available: true, doctorName: 'Dr. K. Joshi' },
          { specialty: 'General Surgery', available: true, doctorName: 'Dr. A. Verma' }
        ],
        services: [
          '24x7 Emergency Trauma Care',
          'Intensive Coronary Care Unit (ICCU)',
          'Pathology & Biochemistry Lab',
          'Digital X-Ray & CT Scan',
          'Blood Bank',
          'Telemedicine Hub'
        ],
        availableDiagnostics: [
          'ECG 12-Lead',
          'Troponin-I Biomarker',
          'Chest X-Ray Digital',
          'Echocardiography (2D Echo)',
          'CT Scan',
          'Comprehensive Blood Panel'
        ],
        medicineStockRatio: 0.94
      },
      {
        id: 'fac-4',
        name: 'Dr. VM Government Medical College & Super-Specialty Hospital',
        type: 'Specialist Medical College',
        category: 'Public',
        latitude: 17.671,
        longitude: 75.912,
        address: 'Opp. District Court, Solapur',
        district: 'Solapur',
        phone: '0217-2749401',
        emergencyCapability: true,
        totalBeds: 600,
        occupiedBeds: 490,
        icuBeds: 50,
        occupiedIcuBeds: 42,
        currentQueueLength: 25,
        averageWaitTimeMin: 40,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. H. Mehta' },
          { specialty: 'Neurology', available: true, doctorName: 'Dr. N. Rao' },
          { specialty: 'Nephrology', available: true, doctorName: 'Dr. S. Bansal' },
          { specialty: 'Cardiac Surgery', available: true, doctorName: 'Dr. V. Godbole' }
        ],
        services: ['Cath Lab & Angioplasty', 'Trauma Centre', 'Hemodialysis', 'NICU / PICU'],
        availableDiagnostics: [
          'Coronary Angiography',
          'MRI',
          'CT Angiography',
          'Troponin-T/I Quantitative',
          'Advanced Biomarkers'
        ],
        medicineStockRatio: 0.98
      }
    ];

    // 3. HEALTH WORKERS
    const healthWorkers: HealthWorker[] = [
      {
        id: 'hw-1',
        userId: 'usr-hw-1',
        name: 'Sunita Gaikwad',
        workerType: 'ASHA',
        assignedVillage: 'Shirur Village',
        assignedDistrict: 'Solapur',
        facilityId: 'fac-1',
        phone: '+91 98220 55678'
      }
    ];

    // 4. DOCTORS
    const doctors: Doctor[] = [
      {
        id: 'doc-1',
        userId: 'usr-doc-1',
        name: 'Dr. Vivek Sharma',
        specialization: 'Cardiology',
        licenseNumber: 'MCI-MH-2012-44189',
        facilityId: 'fac-3',
        phone: '+91 98220 88990'
      },
      {
        id: 'doc-2',
        userId: 'usr-doc-2',
        name: 'Dr. Anjali Desai',
        specialization: 'Obstetrics/Gynecology',
        licenseNumber: 'MCI-MH-2015-88214',
        facilityId: 'fac-3',
        phone: '+91 98220 99001'
      }
    ];

    // 5. FACILITY ADMINS
    const facilityAdmins: FacilityAdmin[] = [
      {
        id: 'fa-1',
        userId: 'usr-admin-fac-1',
        name: 'Rajesh Deshmukh',
        facilityId: 'fac-3'
      }
    ];

    // 6. PATIENTS
    const patients: Patient[] = [
      {
        id: 'pat-1',
        userId: 'usr-pat-1',
        abhaId: '91-8842-1092-4412',
        name: 'Ramesh Patil',
        dateOfBirth: '1976-04-12',
        gender: 'MALE',
        bloodGroup: 'B+',
        addressVillage: 'Shirur Village',
        district: 'Solapur',
        state: 'Maharashtra',
        pincode: '413204',
        latitude: 18.825,
        longitude: 74.378,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Lata Patil (Spouse)',
        emergencyContactPhone: '+91 98220 11999',
        conditions: ['Hypertension (Stage 2)', 'Mild Dyslipidemia'],
        allergies: ['Penicillin'],
        medications: ['Amlodipine 5mg OD', 'Atorvastatin 10mg HS']
      },
      {
        id: 'pat-2',
        userId: 'usr-pat-2',
        abhaId: '91-3319-4401-8831',
        name: 'Priya Kulkarni',
        dateOfBirth: '1990-09-22',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        addressVillage: 'Vairag Village',
        district: 'Solapur',
        state: 'Maharashtra',
        pincode: '413402',
        latitude: 18.06,
        longitude: 75.81,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Mahesh Kulkarni',
        emergencyContactPhone: '+91 98220 44999',
        conditions: ['Gestational Hypertension', 'Second Trimester Pregnancy'],
        allergies: ['Sulfa drugs'],
        medications: ['Labetalol 100mg BD', 'Iron & Folic Acid']
      },
      {
        id: 'pat-3',
        userId: 'usr-pat-3',
        abhaId: '91-1123-5590-7712',
        name: 'Anandi Bai',
        dateOfBirth: '1962-11-05',
        gender: 'FEMALE',
        bloodGroup: 'A+',
        addressVillage: 'Shirur Village',
        district: 'Solapur',
        state: 'Maharashtra',
        pincode: '413204',
        latitude: 18.823,
        longitude: 74.372,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Ganesh (Son)',
        emergencyContactPhone: '+91 98220 77000',
        conditions: ['Type 2 Diabetes', 'Osteoarthritis'],
        allergies: [],
        medications: ['Metformin 500mg BD', 'Glimepiride 1mg OD']
      }
    ];

    // 7. MEDICINES
    const medicines: Medicine[] = [
      {
        id: 'med-1',
        facilityId: 'fac-3',
        name: 'Aspirin 75mg Gastro-resistant',
        category: 'Antiplatelet',
        stockCount: 4200,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-2',
        facilityId: 'fac-3',
        name: 'Clopidogrel 75mg',
        category: 'Antiplatelet',
        stockCount: 2800,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-3',
        facilityId: 'fac-3',
        name: 'Atorvastatin 40mg',
        category: 'Lipid-lowering',
        stockCount: 1950,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-4',
        facilityId: 'fac-3',
        name: 'Streptokinase 1.5 MU Injection',
        category: 'Thrombolytic',
        stockCount: 45,
        unit: 'vials',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-5',
        facilityId: 'fac-3',
        name: 'Nitroglycerin Sublingual 0.5mg',
        category: 'Nitrate vasodilator',
        stockCount: 850,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-6',
        facilityId: 'fac-1',
        name: 'Paracetamol 500mg',
        category: 'Analgesic/Antipyretic',
        stockCount: 300,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-7',
        facilityId: 'fac-1',
        name: 'ORS Packets',
        category: 'Oral Rehydration',
        stockCount: 120,
        unit: 'sachets',
        isAvailable: true,
        lastUpdated: isoNow
      }
    ];

    // 8. TRIAGE FOR PATIENT 1
    const triages: TriageAssessment[] = [
      {
        id: 'trg-1',
        patientId: 'pat-1',
        symptoms: 'Chest heaviness radiating to left shoulder, breathlessness on exertion, sweating for 3 hours',
        symptomsList: ['Chest pain / heaviness', 'Radiation to left arm', 'Difficulty breathing', 'Cold sweating'],
        duration: '3 hours',
        vitals: {
          bpSystolic: 156,
          bpDiastolic: 98,
          heartRate: 104,
          spo2: 94,
          temperatureF: 98.6
        },
        urgency: 'RED',
        reasons: [
          'Acute onset oppressive retrosternal chest pain radiating to left shoulder',
          'Exertional dyspnea accompanied by diaphoresis (cold sweats)',
          'Tachycardia (HR 104 bpm) with elevated BP (156/98 mmHg) in a patient with Stage 2 Hypertension'
        ],
        warningSigns: [
          'Risk of Acute Coronary Syndrome / Myocardial Ischemia',
          'SpO2 94% indicates borderline respiratory compromise',
          'Immediate cardiac biomarker and 12-lead ECG required'
        ],
        recommendedAction: 'Immediate emergency evaluation at District Hospital with 24x7 ICCU and Cardiologist.',
        confidenceScore: 0.98,
        humanConfirmed: true,
        confirmedByWorkerId: 'hw-1',
        confirmedByWorkerName: 'Sunita Gaikwad (ASHA)',
        aiClinicalSummary: 'Critical suspicion of Acute Coronary Syndrome. Ruled out routine outpatient handling. Recommend immediate non-delay referral to District Hospital with Troponin-I and 12-lead ECG availability.',
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString()
      }
    ];

    // 9. REFERRAL
    const referrals: Referral[] = [
      {
        id: 'ref-1',
        referralCode: 'REF-2026-0914',
        patientId: 'pat-1',
        triageId: 'trg-1',
        referringWorkerId: 'hw-1',
        referringWorkerName: 'Sunita Gaikwad (ASHA)',
        targetFacilityId: 'fac-3',
        targetFacilityName: 'Solapur District Civil Hospital',
        assignedDoctorId: 'doc-1',
        assignedDoctorName: 'Dr. Vivek Sharma',
        reasonForReferral: 'Suspected Acute Coronary Syndrome with severe retrosternal oppression and diaphoresis',
        clinicalSummary: '48yo Male with HTN presenting with 3hr chest pressure radiating to arm, SpO2 94%, BP 156/98. Triage level RED. Referred for urgent ECG, Troponin-I and specialist cardiology management.',
        status: 'ACCEPTED',
        priorityLevel: 'EMERGENCY',
        statusHistory: [
          {
            status: 'CREATED',
            notes: 'Generated by ASHA Sunita Gaikwad after rural home visit and digital triage',
            updatedBy: 'Sunita Gaikwad (ASHA)',
            timestamp: new Date(now.getTime() - 3.8 * 3600000).toISOString()
          },
          {
            status: 'SENT',
            notes: 'Transmitted securely via CareGrid referral network',
            updatedBy: 'CareGrid Routing Engine',
            timestamp: new Date(now.getTime() - 3.7 * 3600000).toISOString()
          },
          {
            status: 'RECEIVED',
            notes: 'Received in District Hospital Cardiology triage intake pool',
            updatedBy: 'District Hospital Intake System',
            timestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString()
          },
          {
            status: 'UNDER_REVIEW',
            notes: 'Dr. Vivek Sharma reviewing triage vitals and clinical warning signs',
            updatedBy: 'Dr. Vivek Sharma',
            timestamp: new Date(now.getTime() - 3.2 * 3600000).toISOString()
          },
          {
            status: 'ACCEPTED',
            notes: 'Accepted into Priority Emergency Cardiology Bay. Bed and ECG pre-alerted.',
            updatedBy: 'Dr. Vivek Sharma',
            timestamp: new Date(now.getTime() - 3.0 * 3600000).toISOString()
          }
        ],
        createdAt: new Date(now.getTime() - 3.8 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      }
    ];

    // 10. APPOINTMENTS
    const appointments: Appointment[] = [
      {
        id: 'apt-1',
        appointmentNo: 'APT-2026-8812',
        tokenNumber: 'TK-CARDIO-04',
        patientId: 'pat-1',
        facilityId: 'fac-3',
        facilityName: 'Solapur District Civil Hospital',
        referralId: 'ref-1',
        scheduledFor: new Date(now.getTime() + 1 * 3600000).toISOString(),
        status: 'CONFIRMED',
        department: 'Cardiology Emergency OPD',
        estimatedWaitMinutes: 10,
        notes: 'Priority referral handshake confirmed. Present directly at Emergency Room Bay 2.',
        createdAt: new Date(now.getTime() - 2.9 * 3600000).toISOString()
      },
      {
        id: 'apt-2',
        appointmentNo: 'APT-2026-7731',
        tokenNumber: 'TK-ANC-12',
        patientId: 'pat-2',
        facilityId: 'fac-3',
        facilityName: 'Solapur District Civil Hospital',
        scheduledFor: new Date(now.getTime() + 24 * 3600000).toISOString(),
        status: 'CONFIRMED',
        department: 'High-Risk Obstetrics OPD',
        estimatedWaitMinutes: 20,
        notes: 'Routine second-trimester anomaly ultrasound and maternal BP profile review.',
        createdAt: new Date(now.getTime() - 12 * 3600000).toISOString()
      }
    ];

    // 11. CARE JOURNEY FOR RAMESH PATIL
    const careJourneys: CareJourney[] = [
      {
        id: 'cj-1',
        patientId: 'pat-1',
        referralId: 'ref-1',
        title: 'Cardiac Evaluation & Ischemia Care Pathway',
        overallStatus: 'ACTIVE',
        currentStage: 'Appointment & Clinical Admission',
        nextBestAction: 'Proceed to District Civil Hospital Emergency Room Bay 2 with Token TK-CARDIO-04. Health Worker Sunita will accompany or track your arrival.',
        steps: [
          {
            id: 'cjs-1',
            stepOrder: 1,
            name: 'Initial consultation',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
            notes: 'Symptom reporting via ASHA worker visit in Shirur Village'
          },
          {
            id: 'cjs-2',
            stepOrder: 2,
            name: 'Triage',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 4.0 * 3600000).toISOString(),
            notes: 'Classified as RED (Emergency). Human confirmed by ASHA Sunita Gaikwad.'
          },
          {
            id: 'cjs-3',
            stepOrder: 3,
            name: 'Referral',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 3.8 * 3600000).toISOString(),
            notes: 'Intelligent capacity routing matched Solapur District Hospital (Score 96/100)'
          },
          {
            id: 'cjs-4',
            stepOrder: 4,
            name: 'Hospital acceptance',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 3.0 * 3600000).toISOString(),
            notes: 'Dr. Vivek Sharma reviewed referral and confirmed admission bay'
          },
          {
            id: 'cjs-5',
            stepOrder: 5,
            name: 'Appointment',
            status: 'IN_PROGRESS',
            scheduledAt: new Date(now.getTime() + 1 * 3600000).toISOString(),
            notes: 'Token TK-CARDIO-04 generated with expedited priority wait time (10 mins)',
            actionRequired: 'Arrive at Emergency Bay 2. Show digital referral code REF-2026-0914.'
          },
          {
            id: 'cjs-6',
            stepOrder: 6,
            name: 'Diagnostic test',
            status: 'UPCOMING',
            notes: '12-lead ECG, Troponin-I, and Serum Creatinine scheduled upon arrival'
          },
          {
            id: 'cjs-7',
            stepOrder: 7,
            name: 'Specialist consultation',
            status: 'UPCOMING',
            notes: 'Consultation with Cardiologist Dr. Vivek Sharma'
          },
          {
            id: 'cjs-8',
            stepOrder: 8,
            name: 'Treatment',
            status: 'UPCOMING',
            notes: 'Cardioprotective medical management and risk stratification'
          },
          {
            id: 'cjs-9',
            stepOrder: 9,
            name: 'Follow-up',
            status: 'UPCOMING',
            notes: 'Community health worker home visit 7 days post-discharge'
          }
        ],
        createdAt: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
        updatedAt: isoNow
      }
    ];

    // 12. CARE GAPS (Care-Gap Radar)
    const careGaps: CareGap[] = [
      {
        id: 'gap-1',
        patientId: 'pat-3',
        patientName: 'Anandi Bai',
        gapType: 'FOLLOWUP_OVERDUE',
        severity: 'HIGH',
        dueDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
        detectedDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
        responsibleWorkerId: 'hw-1',
        responsibleWorkerName: 'Sunita Gaikwad (ASHA)',
        status: 'OPEN',
        actionTaken: 'Automated SMS and CareGrid alert sent to ASHA worker',
        resolutionNotes: 'Patient missed 30-day HbA1c lab test and diabetic foot check at Shirur PHC.',
        updatedAt: isoNow
      },
      {
        id: 'gap-2',
        patientId: 'pat-2',
        patientName: 'Priya Kulkarni',
        gapType: 'DIAGNOSTIC_OVERDUE',
        severity: 'MODERATE',
        dueDate: new Date(now.getTime() - 1 * 86400000).toISOString(),
        detectedDate: new Date(now.getTime() - 12 * 3600000).toISOString(),
        responsibleWorkerId: 'hw-1',
        responsibleWorkerName: 'Sunita Gaikwad (ASHA)',
        status: 'ACKNOWLEDGED',
        actionTaken: 'ASHA notified patient; appointment scheduled for tomorrow at District Hospital',
        resolutionNotes: 'Routine 20-week pregnancy anomaly scan was delayed by 24 hours.',
        updatedAt: isoNow
      }
    ];

    // 13. FOLLOW-UPS
    const followUps: FollowUp[] = [
      {
        id: 'fup-1',
        patientId: 'pat-3',
        patientName: 'Anandi Bai',
        responsibleWorkerId: 'hw-1',
        dueDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
        reason: 'Monthly Diabetes fasting glucose and blood pressure compliance visit',
        isCompleted: false,
        notes: 'Overdue by 3 days. Patient reported feeling fatigued.',
        missedAlertRaised: true
      },
      {
        id: 'fup-2',
        patientId: 'pat-1',
        patientName: 'Ramesh Patil',
        responsibleWorkerId: 'hw-1',
        dueDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
        reason: 'Post-cardiac consultation medication adherence check and symptom diary review',
        isCompleted: false,
        notes: 'Planned following hospital evaluation.',
        missedAlertRaised: false
      }
    ];

    // 14. DIAGNOSTICS
    const diagnostics: DiagnosticRequest[] = [
      {
        id: 'diag-1',
        testName: '12-Lead ECG & Troponin-I Quantitative',
        patientId: 'pat-1',
        patientName: 'Ramesh Patil',
        requestingDoctorId: 'doc-1',
        requestingDoctorName: 'Dr. Vivek Sharma',
        facilityId: 'fac-3',
        facilityName: 'Solapur District Civil Hospital',
        status: 'SCHEDULED',
        requiredDate: isoNow,
        scheduledDate: new Date(now.getTime() + 1.2 * 3600000).toISOString(),
        createdAt: new Date(now.getTime() - 2.8 * 3600000).toISOString()
      },
      {
        id: 'diag-2',
        testName: 'HbA1c Glycated Hemoglobin',
        patientId: 'pat-3',
        patientName: 'Anandi Bai',
        facilityId: 'fac-1',
        facilityName: 'Shirur Rural Primary Health Centre',
        status: 'OVERDUE',
        requiredDate: new Date(now.getTime() - 4 * 86400000).toISOString(),
        createdAt: new Date(now.getTime() - 10 * 86400000).toISOString()
      }
    ];

    // 15. CONSENTS
    const consents: Consent[] = [
      {
        id: 'cst-1',
        patientId: 'pat-1',
        requestedBy: 'Solapur District Civil Hospital (Emergency & Cardiology)',
        purpose: 'Care Coordination, Emergency Triage Review & Diagnostic Access',
        dataScope: 'ALL',
        status: 'GRANT',
        createdAt: new Date(now.getTime() - 3.9 * 3600000).toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString()
      },
      {
        id: 'cst-2',
        patientId: 'pat-2',
        requestedBy: 'High-Risk Maternal Health Registry',
        purpose: 'Maternal-Fetal Care-Pathway Tracking & Antenatal Records',
        dataScope: 'CONSULTATIONS',
        status: 'GRANT',
        createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
        expiresAt: new Date(now.getTime() + 90 * 86400000).toISOString()
      }
    ];

    // 16. TELECONSULTATION (eSanjeevani Integration Layer)
    const teleconsultations: Teleconsultation[] = [
      {
        id: 'tc-1',
        patientId: 'pat-2',
        patientName: 'Priya Kulkarni',
        provider: 'eSanjeevani Tele-Hub Solapur (Mock Adapter)',
        roomUrl: 'https://mock.esanjeevani.gov.in/room/solapur-obgyn-991',
        sessionToken: 'esanj-tok-9921-solapur',
        status: 'SCHEDULED',
        scheduledAt: new Date(now.getTime() + 2 * 3600000).toISOString(),
        doctorName: 'Dr. Anjali Desai',
        notes: 'Pre-visit tele-triage for gestational hypertension review',
        createdAt: new Date(now.getTime() - 1 * 3600000).toISOString()
      }
    ];

    // 17. AUDIT LOGS
    const auditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        userId: 'usr-hw-1',
        userName: 'Sunita Gaikwad (ASHA)',
        userRole: 'HEALTH_WORKER',
        action: 'TRIAGE_ASSESSMENT_RECORDED',
        resource: 'TriageAssessment/trg-1',
        details: 'Patient Ramesh Patil triaged as RED (Emergency). Clinical red flags noted.',
        ipAddress: '10.42.1.8',
        timestamp: new Date(now.getTime() - 4.0 * 3600000).toISOString()
      },
      {
        id: 'aud-2',
        userId: 'usr-hw-1',
        userName: 'Sunita Gaikwad (ASHA)',
        userRole: 'HEALTH_WORKER',
        action: 'REFERRAL_INITIATED',
        resource: 'Referral/ref-1',
        details: 'Created emergency referral to Solapur District Civil Hospital (Dr. Vivek Sharma).',
        ipAddress: '10.42.1.8',
        timestamp: new Date(now.getTime() - 3.8 * 3600000).toISOString()
      },
      {
        id: 'aud-3',
        userId: 'usr-doc-1',
        userName: 'Dr. Vivek Sharma',
        userRole: 'DOCTOR',
        action: 'REFERRAL_ACCEPTED',
        resource: 'Referral/ref-1',
        details: 'Accepted referral REF-2026-0914 into emergency cardiology intake pool.',
        ipAddress: '192.168.10.44',
        timestamp: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'aud-4',
        userId: 'usr-pat-1',
        userName: 'Ramesh Patil',
        userRole: 'PATIENT',
        action: 'CONSENT_GRANTED',
        resource: 'Consent/cst-1',
        details: 'Authorized data sharing with Solapur District Civil Hospital.',
        ipAddress: '49.36.112.50',
        timestamp: new Date(now.getTime() - 3.9 * 3600000).toISOString()
      }
    ];

    // 18. NOTIFICATIONS
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'usr-hw-1',
        title: 'Emergency Referral Handshake Complete',
        message: 'Dr. Vivek Sharma accepted referral for Ramesh Patil. Token TK-CARDIO-04 generated.',
        type: 'REFERRAL',
        isRead: false,
        linkUrl: '/referrals',
        createdAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'usr-pat-1',
        title: 'Referral Accepted & Emergency Bay Ready',
        message: 'Your referral to District Civil Hospital was accepted. Token TK-CARDIO-04 assigned. Please proceed to Bay 2.',
        type: 'REFERRAL',
        isRead: false,
        linkUrl: '/care-journey',
        createdAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'notif-3',
        userId: 'usr-hw-1',
        title: 'Care-Gap Radar: Overdue Follow-up Alert',
        message: 'Patient Anandi Bai is 3 days overdue for diabetes and HbA1c review at Shirur PHC.',
        type: 'CARE_GAP',
        isRead: false,
        linkUrl: '/care-gaps',
        createdAt: new Date(now.getTime() - 24 * 3600000).toISOString()
      }
    ];

    this.data = {
      users,
      patients,
      healthWorkers,
      doctors,
      facilityAdmins,
      facilities,
      medicines,
      triages,
      referrals,
      appointments,
      careJourneys,
      careGaps,
      followUps,
      diagnostics,
      consents,
      teleconsultations,
      auditLogs,
      notifications
    };
  }

  // Generic collection accessors
  public get users() { return this.data.users; }
  public get patients() { return this.data.patients; }
  public get healthWorkers() { return this.data.healthWorkers; }
  public get doctors() { return this.data.doctors; }
  public get facilityAdmins() { return this.data.facilityAdmins; }
  public get facilities() { return this.data.facilities; }
  public get medicines() { return this.data.medicines; }
  public get triages() { return this.data.triages; }
  public get referrals() { return this.data.referrals; }
  public get appointments() { return this.data.appointments; }
  public get careJourneys() { return this.data.careJourneys; }
  public get careGaps() { return this.data.careGaps; }
  public get followUps() { return this.data.followUps; }
  public get diagnostics() { return this.data.diagnostics; }
  public get consents() { return this.data.consents; }
  public get teleconsultations() { return this.data.teleconsultations; }
  public get auditLogs() { return this.data.auditLogs; }
  public get notifications() { return this.data.notifications; }

  // Helper audit logger
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    return entry;
  }

  // Helper notification creator
  public createNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
    const entry: Notification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notif
    };
    this.data.notifications.unshift(entry);
    this.save();
    return entry;
  }
}

export const db = new Database();
