import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserRole,
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
        this.normalizeRolesAndSeedUsers();
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

  private normalizeRolesAndSeedUsers() {
    if (!this.data.users) this.data.users = [];
    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync('CareGrid@123', salt);
    const isoNow = new Date().toISOString();

    // Map any legacy role to one of the 4 valid roles
    for (const u of this.data.users) {
      if ((u.role as any) === 'HEALTH_WORKER') u.role = 'ASHA_WORKER';
      else if ((u.role as any) === 'DOCTOR') u.role = 'HOSPITAL_DOCTOR';
      else if ((u.role as any) === 'FACILITY_ADMIN' || (u.role as any) === 'SYSTEM_ADMIN') u.role = 'ADMIN';
      if (u.active === undefined) u.active = true;
    }

    const demoAccounts: User[] = [
      {
        id: 'usr-demo-patient',
        email: 'patient@example.com',
        passwordHash,
        name: 'Murugan Shanmugam',
        phone: '+91 94430 11234',
        role: 'PATIENT',
        patientId: 'pat-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-asha',
        email: 'asha@example.com',
        passwordHash,
        name: 'Meenakshi Sundaram (ASHA)',
        phone: '+91 94430 55678',
        role: 'ASHA_WORKER',
        workerId: 'hw-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-doctor',
        email: 'doctor@example.com',
        passwordHash,
        name: 'Dr. K. Senthil Nathan',
        phone: '+91 94430 88990',
        role: 'HOSPITAL_DOCTOR',
        doctorId: 'doc-1',
        facilityId: 'fac-cbe-mch',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-admin',
        email: 'admin@example.com',
        passwordHash,
        name: 'CareGrid Administrator',
        phone: '+91 94430 66778',
        role: 'ADMIN',
        active: true,
        createdAt: isoNow
      }
    ];

    for (const demo of demoAccounts) {
      const existing = this.data.users.find(u => u.email.toLowerCase() === demo.email.toLowerCase());
      if (!existing) {
        this.data.users.unshift(demo);
      } else {
        existing.role = demo.role;
        if (demo.patientId) existing.patientId = demo.patientId;
        if (demo.workerId) existing.workerId = demo.workerId;
        if (demo.doctorId) existing.doctorId = demo.doctorId;
        if (demo.facilityId) existing.facilityId = demo.facilityId;
        if (existing.active === undefined) existing.active = true;
      }
    }

    // Normalize appointments status to uppercase or standard
    if (this.data.appointments) {
      for (const apt of this.data.appointments) {
        if (!apt.status) apt.status = 'PENDING';
      }
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

  public seedInitialData() {
    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync('CareGrid@123', salt);

    const now = new Date();
    const isoNow = now.toISOString();

    // 1. USERS (Exactly the 4 Required Roles: PATIENT, ASHA_WORKER, HOSPITAL_DOCTOR, ADMIN)
    const users: User[] = [
      {
        id: 'usr-demo-patient',
        email: 'patient@example.com',
        passwordHash,
        name: 'Murugan Shanmugam',
        phone: '+91 94430 11234',
        role: 'PATIENT',
        patientId: 'pat-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-asha',
        email: 'asha@example.com',
        passwordHash,
        name: 'Meenakshi Sundaram (ASHA)',
        phone: '+91 94430 55678',
        role: 'ASHA_WORKER',
        workerId: 'hw-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-doctor',
        email: 'doctor@example.com',
        passwordHash,
        name: 'Dr. K. Senthil Nathan',
        phone: '+91 94430 88990',
        role: 'HOSPITAL_DOCTOR',
        doctorId: 'doc-1',
        facilityId: 'fac-cbe-mch',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-demo-admin',
        email: 'admin@example.com',
        passwordHash,
        name: 'CareGrid Administrator',
        phone: '+91 94430 66778',
        role: 'ADMIN',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-pat-1',
        email: 'murugan.patient@caregrid.tn.gov.in',
        passwordHash,
        name: 'Murugan Shanmugam',
        phone: '+91 94430 11234',
        role: 'PATIENT',
        patientId: 'pat-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-pat-2',
        email: 'selvi.patient@caregrid.tn.gov.in',
        passwordHash,
        name: 'Selvi Ramanathan',
        phone: '+91 94430 44556',
        role: 'PATIENT',
        patientId: 'pat-2',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-pat-3',
        email: 'ramasamy.patient@caregrid.tn.gov.in',
        passwordHash,
        name: 'Ramasamy Thevar',
        phone: '+91 94430 77889',
        role: 'PATIENT',
        patientId: 'pat-3',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-hw-1',
        email: 'meenakshi.vhn@caregrid.tn.gov.in',
        passwordHash,
        name: 'Meenakshi Sundaram (ASHA)',
        phone: '+91 94430 55678',
        role: 'ASHA_WORKER',
        workerId: 'hw-1',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-doc-1',
        email: 'dr.senthil@cmch.tn.gov.in',
        passwordHash,
        name: 'Dr. K. Senthil Nathan',
        phone: '+91 94430 88990',
        role: 'HOSPITAL_DOCTOR',
        doctorId: 'doc-1',
        facilityId: 'fac-cbe-mch',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-doc-2',
        email: 'dr.radhika@cmch.tn.gov.in',
        passwordHash,
        name: 'Dr. Radhika Balasubramanian',
        phone: '+91 94430 99001',
        role: 'HOSPITAL_DOCTOR',
        doctorId: 'doc-2',
        facilityId: 'fac-cbe-mch',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-admin-fac-1',
        email: 'admin.cmch@caregrid.tn.gov.in',
        passwordHash,
        name: 'Dr. S. Anbarasan (CMCH Admin)',
        phone: '+91 94430 33445',
        role: 'ADMIN',
        active: true,
        createdAt: isoNow
      },
      {
        id: 'usr-admin-sys-1',
        email: 'ddhs.coimbatore@caregrid.tn.gov.in',
        passwordHash,
        name: 'Dr. P. Arumugam (DDHS Coimbatore)',
        phone: '+91 94430 66778',
        role: 'ADMIN',
        active: true,
        createdAt: isoNow
      }
    ];

    // 2. FACILITIES IN TAMIL NADU (Coimbatore, Chennai, Madurai, Salem, Trichy, Thanjavur)
    const facilities: Facility[] = [
      {
        id: 'fac-cbe-phc',
        name: 'Kinathukadavu Upgraded Primary Health Centre (PHC)',
        type: 'PHC',
        category: 'Public',
        latitude: 10.821,
        longitude: 77.019,
        address: 'Pollachi Main Road, Kinathukadavu, Coimbatore District',
        district: 'Coimbatore',
        phone: '04259-224101',
        emergencyCapability: false,
        totalBeds: 30,
        occupiedBeds: 21,
        icuBeds: 0,
        occupiedIcuBeds: 0,
        currentQueueLength: 16,
        averageWaitTimeMin: 35,
        specialists: [
          { specialty: 'General Medicine', available: true, doctorName: 'Dr. M. Jayakumar' }
        ],
        services: ['General Outpatient (OPD)', 'Basic Immunization', 'Antenatal Care (MCH)', 'Telemedicine Unit'],
        availableDiagnostics: ['Blood Glucose', 'Urine Albumin/Sugar', 'Rapid Dengue/Malaria Kit', 'ECG Basic'],
        medicineStockRatio: 0.88
      },
      {
        id: 'fac-cbe-chc',
        name: 'Pollachi Sub-District Government Hospital (SDH)',
        type: 'CHC',
        category: 'Public',
        latitude: 10.658,
        longitude: 77.009,
        address: 'Palakkad Road, Pollachi, Coimbatore District',
        district: 'Coimbatore',
        phone: '04259-223344',
        emergencyCapability: true,
        totalBeds: 180,
        occupiedBeds: 125,
        icuBeds: 8,
        occupiedIcuBeds: 5,
        currentQueueLength: 12,
        averageWaitTimeMin: 25,
        specialists: [
          { specialty: 'General Medicine', available: true, doctorName: 'Dr. S. Karthikeyan' },
          { specialty: 'Pediatrics', available: true, doctorName: 'Dr. R. Kavitha' },
          { specialty: 'Obstetrics/Gynecology', available: true, doctorName: 'Dr. V. Deepa' }
        ],
        services: ['24x7 Emergency Care', 'CEmONC Maternity Unit', 'Digital X-Ray', 'Blood Storage Centre', 'Pathology'],
        availableDiagnostics: ['ECG', 'Digital X-Ray', 'Complete Blood Count (CBC)', 'Biochemistry Profile'],
        medicineStockRatio: 0.91
      },
      {
        id: 'fac-cbe-mch',
        name: 'Coimbatore Medical College Hospital (CMCH)',
        type: 'District Hospital',
        category: 'Public',
        latitude: 11.002,
        longitude: 76.967,
        address: 'Trichy Road, Gopalapuram, Coimbatore',
        district: 'Coimbatore',
        phone: '0422-2301393',
        emergencyCapability: true,
        totalBeds: 1250,
        occupiedBeds: 960,
        icuBeds: 90,
        occupiedIcuBeds: 68,
        currentQueueLength: 8,
        averageWaitTimeMin: 18,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. K. Senthil Nathan' },
          { specialty: 'Obstetrics/Gynecology', available: true, doctorName: 'Dr. Radhika Balasubramanian' },
          { specialty: 'Orthopedics', available: true, doctorName: 'Dr. S. Ramanathan' },
          { specialty: 'Pulmonology', available: true, doctorName: 'Dr. G. Vignesh' },
          { specialty: 'General Surgery', available: true, doctorName: 'Dr. A. Murugesan' }
        ],
        services: [
          '24x7 Comprehensive Emergency Trauma Care',
          'Intensive Coronary Care Unit (ICCU)',
          'Cardiac Cath Lab & Primary Angioplasty',
          'Automated Pathology & Molecular Lab',
          '128-Slice CT Scan & 1.5T MRI',
          '24x7 Component Blood Bank',
          'National Telemedicine Hub'
        ],
        availableDiagnostics: [
          'ECG 12-Lead',
          'Troponin-I Biomarker',
          'Chest X-Ray Digital',
          'Echocardiography (2D Echo)',
          'CT Scan',
          'MRI Scan',
          'Comprehensive Cardiac Profile'
        ],
        medicineStockRatio: 0.96
      },
      {
        id: 'fac-chn-gh',
        name: 'Rajiv Gandhi Government General Hospital (RGGGH Chennai)',
        type: 'Specialist Medical College',
        category: 'Public',
        latitude: 13.081,
        longitude: 80.279,
        address: 'EVR Periyar Salai, Park Town, Chennai',
        district: 'Chennai',
        phone: '044-25305000',
        emergencyCapability: true,
        totalBeds: 2700,
        occupiedBeds: 2280,
        icuBeds: 240,
        occupiedIcuBeds: 195,
        currentQueueLength: 22,
        averageWaitTimeMin: 30,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. P. Thirunavukkarasu' },
          { specialty: 'Cardiac Surgery', available: true, doctorName: 'Dr. K. Manoharan' },
          { specialty: 'Neurology', available: true, doctorName: 'Dr. S. Sundar' },
          { specialty: 'Nephrology', available: true, doctorName: 'Dr. R. Vijayakumar' }
        ],
        services: [
          'State Apex Trauma & Resuscitation Center',
          'Emergency Cardiac Interventions & ICCU',
          'Organ Transplant Centre',
          'Comprehensive Stroke Care',
          'Advanced Tele-ICU Command Unit'
        ],
        availableDiagnostics: [
          'Coronary Angiography',
          'Cardiac Troponin-T/I Quantitative',
          'MRI 3T',
          'CT Angiography',
          'Electrophysiology Lab'
        ],
        medicineStockRatio: 0.98
      },
      {
        id: 'fac-mdu-rajaji',
        name: 'Government Rajaji Hospital & Medical College (GRH Madurai)',
        type: 'Specialist Medical College',
        category: 'Public',
        latitude: 9.928,
        longitude: 78.134,
        address: 'Panagal Road, Alwarpuram, Madurai',
        district: 'Madurai',
        phone: '0452-2532535',
        emergencyCapability: true,
        totalBeds: 2500,
        occupiedBeds: 2080,
        icuBeds: 180,
        occupiedIcuBeds: 142,
        currentQueueLength: 18,
        averageWaitTimeMin: 25,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. M. Chidambaram' },
          { specialty: 'Pediatrics', available: true, doctorName: 'Dr. S. Rajeswari' },
          { specialty: 'Obstetrics/Gynecology', available: true, doctorName: 'Dr. N. Meena' },
          { specialty: 'Neurology', available: true, doctorName: 'Dr. T. Muthukumar' }
        ],
        services: [
          'Southern Regional Apex Trauma Care',
          '24x7 Cath Lab & Emergency Cardiac Unit',
          'Regional Blood Transfusion Center',
          'NICU / PICU Super-Specialty'
        ],
        availableDiagnostics: [
          'ECG 12-Lead',
          'Troponin-I Biomarker',
          '2D Echocardiography',
          'Spiral CT Scan',
          'Advanced Biochemistry'
        ],
        medicineStockRatio: 0.95
      },
      {
        id: 'fac-slm-mch',
        name: 'Government Mohan Kumaramangalam Medical College Hospital',
        type: 'District Hospital',
        category: 'Public',
        latitude: 11.664,
        longitude: 78.146,
        address: 'Steel Plant Road, Salem',
        district: 'Salem',
        phone: '0427-2383313',
        emergencyCapability: true,
        totalBeds: 1300,
        occupiedBeds: 1020,
        icuBeds: 75,
        occupiedIcuBeds: 54,
        currentQueueLength: 14,
        averageWaitTimeMin: 22,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. C. Saravanan' },
          { specialty: 'General Medicine', available: true, doctorName: 'Dr. T. Geetha' },
          { specialty: 'Orthopedics', available: true, doctorName: 'Dr. V. Mohan' }
        ],
        services: ['24x7 Emergency Care', 'ICCU', 'Regional Trauma Unit', 'Hemodialysis Unit'],
        availableDiagnostics: ['ECG 12-Lead', 'Troponin-I Biomarker', 'Digital X-Ray', 'CT Scan'],
        medicineStockRatio: 0.93
      },
      {
        id: 'fac-try-gh',
        name: 'Mahatma Gandhi Memorial Government Hospital (Trichy MGMGH)',
        type: 'District Hospital',
        category: 'Public',
        latitude: 10.812,
        longitude: 78.686,
        address: 'Collector Office Road, Puthur, Tiruchirappalli',
        district: 'Tiruchirappalli',
        phone: '0431-2770281',
        emergencyCapability: true,
        totalBeds: 1200,
        occupiedBeds: 940,
        icuBeds: 70,
        occupiedIcuBeds: 49,
        currentQueueLength: 15,
        averageWaitTimeMin: 20,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. B. Kannan' },
          { specialty: 'General Surgery', available: true, doctorName: 'Dr. E. Baskaran' }
        ],
        services: ['Emergency Resuscitation & Trauma', 'Coronary Care Unit', 'Blood Bank', 'Dialysis'],
        availableDiagnostics: ['ECG 12-Lead', 'Troponin-I Biomarker', 'Ultrasound', 'CT Scan'],
        medicineStockRatio: 0.94
      },
      {
        id: 'fac-tj-mch',
        name: 'Thanjavur Medical College Hospital',
        type: 'District Hospital',
        category: 'Public',
        latitude: 10.758,
        longitude: 79.106,
        address: 'Medical College Road, Thanjavur',
        district: 'Thanjavur',
        phone: '04362-240024',
        emergencyCapability: true,
        totalBeds: 1100,
        occupiedBeds: 860,
        icuBeds: 60,
        occupiedIcuBeds: 44,
        currentQueueLength: 13,
        averageWaitTimeMin: 22,
        specialists: [
          { specialty: 'Cardiology', available: true, doctorName: 'Dr. S. Subramanian' },
          { specialty: 'Nephrology', available: true, doctorName: 'Dr. K. Jayanthi' }
        ],
        services: ['Cauvery Delta Regional Emergency Care', 'ICCU', 'Maternity CEmONC', 'Trauma Unit'],
        availableDiagnostics: ['ECG 12-Lead', 'Troponin-I Biomarker', '2D Echo', 'CT Scan'],
        medicineStockRatio: 0.92
      }
    ];

    // 3. HEALTH WORKERS
    const healthWorkers: HealthWorker[] = [
      {
        id: 'hw-1',
        userId: 'usr-hw-1',
        name: 'Meenakshi Sundaram',
        workerType: 'VHN',
        assignedVillage: 'Kinathukadavu Village',
        assignedDistrict: 'Coimbatore',
        facilityId: 'fac-cbe-phc',
        phone: '+91 94430 55678'
      }
    ];

    // 4. DOCTORS
    const doctors: Doctor[] = [
      {
        id: 'doc-1',
        userId: 'usr-doc-1',
        name: 'Dr. K. Senthil Nathan',
        specialization: 'Cardiology',
        licenseNumber: 'TNMC-2010-38412',
        facilityId: 'fac-cbe-mch',
        phone: '+91 94430 88990'
      },
      {
        id: 'doc-2',
        userId: 'usr-doc-2',
        name: 'Dr. Radhika Balasubramanian',
        specialization: 'Obstetrics/Gynecology',
        licenseNumber: 'TNMC-2014-66291',
        facilityId: 'fac-cbe-mch',
        phone: '+91 94430 99001'
      }
    ];

    // 5. FACILITY ADMINS
    const facilityAdmins: FacilityAdmin[] = [
      {
        id: 'fa-1',
        userId: 'usr-admin-fac-1',
        name: 'Dr. S. Anbarasan',
        facilityId: 'fac-cbe-mch'
      }
    ];

    // 6. PATIENTS
    const patients: Patient[] = [
      {
        id: 'pat-1',
        userId: 'usr-pat-1',
        abhaId: '91-4421-8812-7654',
        name: 'Murugan Shanmugam',
        dateOfBirth: '1976-04-12',
        gender: 'MALE',
        bloodGroup: 'B+',
        addressVillage: 'Kinathukadavu Village',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        latitude: 10.825,
        longitude: 77.021,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Lakshmi Shanmugam (Spouse)',
        emergencyContactPhone: '+91 94430 11999',
        conditions: ['Hypertension (Stage 2)', 'Mild Dyslipidemia'],
        allergies: ['Penicillin'],
        medications: ['Amlodipine 5mg OD', 'Atorvastatin 10mg HS']
      },
      {
        id: 'pat-2',
        userId: 'usr-pat-2',
        abhaId: '91-7732-1109-3321',
        name: 'Selvi Ramanathan',
        dateOfBirth: '1996-09-22',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        addressVillage: 'Melur Village',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625106',
        latitude: 10.048,
        longitude: 78.336,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Ramanathan (Spouse)',
        emergencyContactPhone: '+91 94430 44999',
        conditions: ['Gestational Hypertension', 'Second Trimester Pregnancy'],
        allergies: ['Sulfa drugs'],
        medications: ['Labetalol 100mg BD', 'Iron & Folic Acid']
      },
      {
        id: 'pat-3',
        userId: 'usr-pat-3',
        abhaId: '91-2210-9941-8890',
        name: 'Ramasamy Thevar',
        dateOfBirth: '1960-11-05',
        gender: 'MALE',
        bloodGroup: 'A+',
        addressVillage: 'Kinathukadavu Village',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        latitude: 10.823,
        longitude: 77.018,
        assignedWorkerId: 'hw-1',
        emergencyContactName: 'Murugesan (Son)',
        emergencyContactPhone: '+91 94430 77000',
        conditions: ['Type 2 Diabetes', 'Diabetic Neuropathy'],
        allergies: [],
        medications: ['Metformin 500mg BD', 'Glimepiride 1mg OD']
      }
    ];

    // 7. MEDICINES (CMCH Coimbatore & Kinathukadavu PHC)
    const medicines: Medicine[] = [
      {
        id: 'med-1',
        facilityId: 'fac-cbe-mch',
        name: 'Aspirin 75mg Gastro-resistant (TNMSC)',
        category: 'Antiplatelet',
        stockCount: 5400,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-2',
        facilityId: 'fac-cbe-mch',
        name: 'Clopidogrel 75mg',
        category: 'Antiplatelet',
        stockCount: 3200,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-3',
        facilityId: 'fac-cbe-mch',
        name: 'Atorvastatin 40mg',
        category: 'Statin',
        stockCount: 2600,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-4',
        facilityId: 'fac-cbe-mch',
        name: 'Inj. Streptokinase 1.5 MU / Tenecteplase',
        category: 'Thrombolytic',
        stockCount: 35,
        unit: 'vials',
        isAvailable: true,
        lastUpdated: isoNow
      },
      {
        id: 'med-5',
        facilityId: 'fac-cbe-phc',
        name: 'Amlodipine 5mg (TNMSC)',
        category: 'Antihypertensive',
        stockCount: 8200,
        unit: 'tablets',
        isAvailable: true,
        lastUpdated: isoNow
      }
    ];

    // 8. TRIAGE ASSESSMENTS
    const triages: TriageAssessment[] = [
      {
        id: 'trg-1',
        patientId: 'pat-1',
        symptoms: 'Substernal chest pressure radiating to left arm and jaw, accompanied by diaphoresis and shortness of breath for 1 hour.',
        symptomsList: ['Chest Pain', 'Breathlessness', 'Diaphoresis', 'Left arm radiation'],
        duration: '1 hour',
        vitals: {
          bpSystolic: 168,
          bpDiastolic: 98,
          heartRate: 104,
          spo2: 94,
          temperatureF: 98.4
        },
        urgency: 'RED',
        reasons: [
          'Acute onset retrosternal crushing chest pain radiating to left arm',
          'Exertional dyspnea accompanied by diaphoresis (cold sweats)',
          'Tachycardia (HR 104 bpm) with severe hypertension (168/98 mmHg) in a known hypertensive patient'
        ],
        warningSigns: [
          'High risk of Acute Coronary Syndrome (STEMI / NSTEMI)',
          'SpO2 94% indicates borderline respiratory compromise',
          'Immediate 12-lead ECG, Troponin-I and resuscitation bay required'
        ],
        recommendedAction: 'Immediate emergency transfer to Coimbatore Medical College Hospital (CMCH) with 24x7 ICCU, Cath Lab, and Cardiologist on duty.',
        confidenceScore: 0.98,
        humanConfirmed: true,
        confirmedByWorkerId: 'hw-1',
        confirmedByWorkerName: 'Meenakshi Sundaram (VHN)',
        aiClinicalSummary: 'Critical suspicion of Acute Coronary Syndrome. Ruled out routine outpatient handling. Direct referral to CMCH ICCU initiated without administrative delay.',
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString()
      }
    ];

    // 9. REFERRAL
    const referrals: Referral[] = [
      {
        id: 'ref-1',
        referralCode: 'REF-TN-2026-0914',
        patientId: 'pat-1',
        triageId: 'trg-1',
        referringWorkerId: 'hw-1',
        referringWorkerName: 'Meenakshi Sundaram (VHN)',
        targetFacilityId: 'fac-cbe-mch',
        targetFacilityName: 'Coimbatore Medical College Hospital (CMCH)',
        assignedDoctorId: 'doc-1',
        assignedDoctorName: 'Dr. K. Senthil Nathan',
        reasonForReferral: 'Suspected Acute Coronary Syndrome with crushing chest pain and elevated BP',
        clinicalSummary: '50yo Male from Kinathukadavu with Stage 2 HTN presenting with 1hr crushing chest pain radiating to left arm, SpO2 94%, BP 168/98 mmHg, HR 104 bpm. Triage RED. Dispatched with sublingual aspirin and nitrate pre-alert.',
        status: 'ACCEPTED',
        priorityLevel: 'EMERGENCY',
        statusHistory: [
          {
            status: 'CREATED',
            notes: 'Generated by VHN Meenakshi Sundaram following home visit and digital triage at Kinathukadavu',
            updatedBy: 'Meenakshi Sundaram (VHN)',
            timestamp: new Date(now.getTime() - 3.8 * 3600000).toISOString()
          },
          {
            status: 'SENT',
            notes: 'Transmitted securely via Tamil Nadu CareGrid Referral Network',
            updatedBy: 'CareGrid Intelligent Routing Engine',
            timestamp: new Date(now.getTime() - 3.7 * 3600000).toISOString()
          },
          {
            status: 'RECEIVED',
            notes: 'Received in CMCH Emergency Cardiology intake pool',
            updatedBy: 'CMCH Intake Desk',
            timestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString()
          },
          {
            status: 'UNDER_REVIEW',
            notes: 'Dr. K. Senthil Nathan reviewed vitals and telemetry notes',
            updatedBy: 'Dr. K. Senthil Nathan',
            timestamp: new Date(now.getTime() - 3.2 * 3600000).toISOString()
          },
          {
            status: 'ACCEPTED',
            notes: 'Accepted into Priority ICCU Resuscitation Bay. 12-lead ECG and Troponin pre-alerted.',
            updatedBy: 'Dr. K. Senthil Nathan',
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
        appointmentNo: 'APT-TN-2026-8812',
        tokenNumber: 'TK-CARDIO-04',
        patientId: 'pat-1',
        patientName: 'Murugan Shanmugam',
        facilityId: 'fac-cbe-mch',
        facilityName: 'Coimbatore Medical College Hospital (CMCH)',
        department: 'Cardiology (Emergency Bay)',
        doctorId: 'doc-1',
        doctorName: 'Dr. K. Senthil Nathan',
        scheduledDate: isoNow,
        timeSlot: '11:00 AM - 11:30 AM',
        status: 'CONFIRMED',
        priority: 'EMERGENCY',
        queuePosition: 2,
        estimatedWaitTimeMin: 15,
        referralId: 'ref-1',
        createdAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      }
    ];

    // 11. CARE JOURNEY
    const careJourneys: CareJourney[] = [
      {
        id: 'cj-1',
        patientId: 'pat-1',
        patientName: 'Murugan Shanmugam',
        title: 'Acute Coronary Evaluation & Secondary Prevention Pathway',
        currentStage: 'Appointment',
        nextBestAction: 'Proceed to CMCH Emergency Resuscitation Bay 2 with Token TK-CARDIO-04. 12-lead ECG and Troponin bedside draw ready.',
        overallStatus: 'ACTIVE',
        steps: [
          {
            id: 'cjs-1',
            stepOrder: 1,
            name: 'Initial Field Consultation',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
            notes: 'VHN Meenakshi conducted acute doorstep evaluation for severe retrosternal chest pain.'
          },
          {
            id: 'cjs-2',
            stepOrder: 2,
            name: 'AI-Assisted Digital Triage',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 4.0 * 3600000).toISOString(),
            notes: 'Classified RED Urgency based on vital signs (BP 168/98, HR 104, SpO2 94%) and clinical red flags.'
          },
          {
            id: 'cjs-3',
            stepOrder: 3,
            name: 'Facility Routing & Referral',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 3.7 * 3600000).toISOString(),
            notes: 'CareGrid prioritized CMCH (Cardiologist on-duty, Cath Lab, 24x7 ICCU) over local PHC.'
          },
          {
            id: 'cjs-4',
            stepOrder: 4,
            name: 'Hospital Acceptance & Bed Lock',
            status: 'COMPLETED',
            completedAt: new Date(now.getTime() - 3.0 * 3600000).toISOString(),
            notes: 'Dr. K. Senthil Nathan formally accepted referral REF-TN-2026-0914.'
          },
          {
            id: 'cjs-5',
            stepOrder: 5,
            name: 'Appointment & Priority OPD Token',
            status: 'IN_PROGRESS',
            actionRequired: 'Arrive at CMCH Triage Desk with Token TK-CARDIO-04. Estimated wait: ~15 mins.',
            notes: 'Token issued. Emergency priority lane active.'
          },
          {
            id: 'cjs-6',
            stepOrder: 6,
            name: 'Diagnostic Test Verification',
            status: 'UPCOMING',
            notes: '12-lead ECG, Troponin-I Quantitative, and 2D Echocardiography scheduled.'
          },
          {
            id: 'cjs-7',
            stepOrder: 7,
            name: 'Specialist Cardiology Consultation',
            status: 'UPCOMING',
            notes: 'Clinical evaluation with Dr. K. Senthil Nathan.'
          },
          {
            id: 'cjs-8',
            stepOrder: 8,
            name: 'Medical Treatment & Optimization',
            status: 'UPCOMING',
            notes: 'Titration of dual antiplatelet and antihypertensive regimens.'
          },
          {
            id: 'cjs-9',
            stepOrder: 9,
            name: 'Community Post-Discharge Follow-up',
            status: 'UPCOMING',
            notes: '7-day home follow-up by VHN Meenakshi Sundaram.'
          }
        ],
        createdAt: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
        updatedAt: isoNow
      }
    ];

    // 12. CARE GAPS
    const careGaps: CareGap[] = [
      {
        id: 'gap-1',
        patientId: 'pat-3',
        patientName: 'Ramasamy Thevar',
        gapType: 'FOLLOWUP_OVERDUE',
        severity: 'HIGH',
        dueDate: new Date(now.getTime() - 4 * 86400000).toISOString(),
        status: 'OPEN',
        responsibleWorkerId: 'hw-1',
        responsibleWorkerName: 'Meenakshi Sundaram (VHN)',
        resolutionNotes: 'Patient 4 days overdue for monthly Diabetes foot check and HbA1c review at Kinathukadavu PHC.',
        createdAt: new Date(now.getTime() - 4 * 86400000).toISOString()
      },
      {
        id: 'gap-2',
        patientId: 'pat-2',
        patientName: 'Selvi Ramanathan',
        gapType: 'DIAGNOSTIC_OVERDUE',
        severity: 'CRITICAL',
        dueDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
        status: 'ACKNOWLEDGED',
        responsibleWorkerId: 'hw-1',
        responsibleWorkerName: 'Meenakshi Sundaram (VHN)',
        resolutionNotes: 'Second-trimester anomaly ultrasound and urine protein test pending in Melur sector.',
        actionTaken: 'Contacted patient via tele-call; scheduled appointment at Madurai Rajaji Hospital.',
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString()
      }
    ];

    // 13. FOLLOW-UPS
    const followUps: FollowUp[] = [
      {
        id: 'fup-1',
        patientId: 'pat-3',
        patientName: 'Ramasamy Thevar',
        responsibleWorkerId: 'hw-1',
        dueDate: new Date(now.getTime() - 4 * 86400000).toISOString(),
        reason: 'Monthly Diabetes fasting glucose and blood pressure compliance visit',
        isCompleted: false,
        notes: 'Overdue by 4 days. Patient reported feeling fatigued.',
        missedAlertRaised: true
      },
      {
        id: 'fup-2',
        patientId: 'pat-1',
        patientName: 'Murugan Shanmugam',
        responsibleWorkerId: 'hw-1',
        dueDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
        reason: 'Post-cardiac consultation medication adherence check and symptom diary review',
        isCompleted: false,
        notes: 'Planned following CMCH hospital evaluation.',
        missedAlertRaised: false
      }
    ];

    // 14. DIAGNOSTICS
    const diagnostics: DiagnosticRequest[] = [
      {
        id: 'diag-1',
        testName: '12-Lead ECG & Troponin-I Quantitative',
        patientId: 'pat-1',
        patientName: 'Murugan Shanmugam',
        requestingDoctorId: 'doc-1',
        requestingDoctorName: 'Dr. K. Senthil Nathan',
        facilityId: 'fac-cbe-mch',
        facilityName: 'Coimbatore Medical College Hospital (CMCH)',
        status: 'SCHEDULED',
        requiredDate: isoNow,
        scheduledDate: new Date(now.getTime() + 1.2 * 3600000).toISOString(),
        createdAt: new Date(now.getTime() - 2.8 * 3600000).toISOString()
      },
      {
        id: 'diag-2',
        testName: 'HbA1c Glycated Hemoglobin & Renal Function',
        patientId: 'pat-3',
        patientName: 'Ramasamy Thevar',
        facilityId: 'fac-cbe-phc',
        facilityName: 'Kinathukadavu Upgraded Primary Health Centre',
        status: 'OVERDUE',
        requiredDate: new Date(now.getTime() - 4 * 86400000).toISOString(),
        createdAt: new Date(now.getTime() - 10 * 86400000).toISOString()
      }
    ];

    // 15. CONSENTS (ABDM Compliance)
    const consents: Consent[] = [
      {
        id: 'cst-1',
        patientId: 'pat-1',
        requestedBy: 'Coimbatore Medical College Hospital (CMCH Emergency & Cardiology)',
        purpose: 'Care Coordination, Emergency Triage Review & Diagnostic Access',
        dataScope: 'ALL',
        status: 'GRANT',
        createdAt: new Date(now.getTime() - 3.9 * 3600000).toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString()
      },
      {
        id: 'cst-2',
        patientId: 'pat-2',
        requestedBy: 'Tamil Nadu High-Risk Maternal Health Registry (PICME)',
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
        patientName: 'Selvi Ramanathan',
        provider: 'eSanjeevani Tele-Hub Madurai (Tamil Nadu Health System Adapter)',
        roomUrl: 'https://mock.esanjeevani.gov.in/room/madurai-obgyn-991',
        sessionToken: 'esanj-tok-9921-madurai',
        status: 'SCHEDULED',
        scheduledAt: new Date(now.getTime() + 2 * 3600000).toISOString(),
        doctorName: 'Dr. Radhika Balasubramanian',
        notes: 'Pre-visit tele-triage for gestational hypertension review',
        createdAt: new Date(now.getTime() - 1 * 3600000).toISOString()
      }
    ];

    // 17. AUDIT LOGS
    const auditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        userId: 'usr-hw-1',
        userName: 'Meenakshi Sundaram (VHN)',
        userRole: 'HEALTH_WORKER',
        action: 'TRIAGE_ASSESSMENT_RECORDED',
        resource: 'TriageAssessment/trg-1',
        details: 'Patient Murugan Shanmugam triaged as RED (Emergency). Clinical red flags noted.',
        ipAddress: '10.42.1.8',
        timestamp: new Date(now.getTime() - 4.0 * 3600000).toISOString()
      },
      {
        id: 'aud-2',
        userId: 'usr-hw-1',
        userName: 'Meenakshi Sundaram (VHN)',
        userRole: 'HEALTH_WORKER',
        action: 'REFERRAL_INITIATED',
        resource: 'Referral/ref-1',
        details: 'Created emergency referral to Coimbatore Medical College Hospital (Dr. K. Senthil Nathan).',
        ipAddress: '10.42.1.8',
        timestamp: new Date(now.getTime() - 3.8 * 3600000).toISOString()
      },
      {
        id: 'aud-3',
        userId: 'usr-doc-1',
        userName: 'Dr. K. Senthil Nathan',
        userRole: 'DOCTOR',
        action: 'REFERRAL_ACCEPTED',
        resource: 'Referral/ref-1',
        details: 'Accepted referral REF-TN-2026-0914 into CMCH emergency cardiology intake pool.',
        ipAddress: '192.168.10.44',
        timestamp: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'aud-4',
        userId: 'usr-pat-1',
        userName: 'Murugan Shanmugam',
        userRole: 'PATIENT',
        action: 'CONSENT_GRANTED',
        resource: 'Consent/cst-1',
        details: 'Authorized data sharing with Coimbatore Medical College Hospital.',
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
        message: 'Dr. K. Senthil Nathan accepted referral for Murugan Shanmugam. Token TK-CARDIO-04 generated.',
        type: 'REFERRAL',
        isRead: false,
        linkUrl: '/referrals',
        createdAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'usr-pat-1',
        title: 'Referral Accepted & Emergency Bay Ready',
        message: 'Your referral to Coimbatore Medical College Hospital was accepted. Token TK-CARDIO-04 assigned. Please proceed to Resuscitation Bay 2.',
        type: 'REFERRAL',
        isRead: false,
        linkUrl: '/care-journey',
        createdAt: new Date(now.getTime() - 3.0 * 3600000).toISOString()
      },
      {
        id: 'notif-3',
        userId: 'usr-hw-1',
        title: 'Care-Gap Radar: Overdue Follow-up Alert',
        message: 'Patient Ramasamy Thevar is 4 days overdue for diabetes and HbA1c review at Kinathukadavu PHC.',
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

  // Add a facility to the database
  public addFacility(facility: Facility) {
    this.data.facilities.push(facility);
    this.save();
    return facility;
  }

  // Add a user to the database
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Update user role
  public updateUserRole(userId: string, role: UserRole) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    user.role = role;
    this.save();
    return user;
  }

  // Update user active status
  public updateUserStatus(userId: string, active: boolean) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    user.active = active;
    this.save();
    return user;
  }
}

export const db = new Database();
