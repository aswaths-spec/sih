import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Consent } from '../types';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Pill,
  Heart,
  Video,
  CheckCircle2,
  Lock,
  User,
  Phone
} from 'lucide-react';

export const PatientRecordsView: React.FC = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [teleconsultLoading, setTeleconsultLoading] = useState(false);
  const [teleconsultResult, setTeleconsultResult] = useState<any>(null);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const p = await api.getPatientById('pat-1');
      const c = await api.getConsents('pat-1');
      setPatient(p);
      setConsents(c);
    } catch (err) {
      console.error('Failed to load patient record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, []);

  const handleToggleConsent = async (consentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'GRANT' ? 'REVOKE' : 'GRANT';
    try {
      await api.updateConsent(consentId, nextStatus);
      setConsents(prev =>
        prev.map(c => (c.id === consentId ? { ...c, status: nextStatus } : c))
      );
    } catch (err: any) {
      alert('Failed to update consent: ' + err.message);
    }
  };

  const handleRequestTeleconsult = async () => {
    setTeleconsultLoading(true);
    try {
      const res = await api.requestTeleconsultation({
        patientId: 'pat-1',
        chiefComplaint: 'Follow-up cardiology consultation for blood pressure titration',
        preferredLanguage: 'mr'
      });
      setTeleconsultResult(res);
    } catch (err: any) {
      alert('Teleconsultation error: ' + err.message);
    } finally {
      setTeleconsultLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Longitudinal Health Record & Consents
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Standardized digital health profile interoperable with ABDM and National Health Authority specifications.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading longitudinal patient records...
        </div>
      ) : patient ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Patient Profile Card & Vitals */}
          <div className="lg:col-span-7 space-y-4">
            {/* Identity Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span>50 Yrs / {patient.gender}</span>
                    <span>•</span>
                    <span className="font-semibold text-rose-600">Blood: {patient.bloodGroup}</span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    {patient.addressVillage}, {patient.district}, {patient.state}
                  </p>
                </div>

                {/* ABHA Badge */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-2xs font-bold font-mono">ABHA: {patient.abhaId}</span>
                  </div>
                  <span className="text-3xs text-slate-400 block mt-0.5">ABDM Verified</span>
                </div>
              </div>

              {/* Drug Allergy Critical Banner */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-xs text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <strong>Severe Drug Allergy Alert:</strong>{' '}
                    <span className="font-bold underline">{patient.allergies.join(', ')}</span> (Risk of anaphylaxis)
                  </div>
                </div>
              )}

              {/* Chronic Conditions */}
              <div>
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Chronic Diagnoses & Conditions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.conditions.map(c => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Medications */}
              <div>
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Prescribed Medications:
                </span>
                <div className="space-y-1">
                  {patient.medications.map(m => (
                    <div
                      key={m}
                      className="flex items-center gap-2 text-xs text-slate-800 p-2 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-medium">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-3 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Emergency Contact: <strong>{patient.emergencyContactName}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {patient.emergencyContactPhone}
                </span>
              </div>
            </div>

            {/* eSanjeevani National Teleconsultation Layer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-teal-600" />
                    eSanjeevani Teleconsultation Integration
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Government telemedicine adapter for remote rural doctor consultations
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-request-teleconsult"
                  onClick={handleRequestTeleconsult}
                  disabled={teleconsultLoading}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs"
                >
                  {teleconsultLoading ? 'Connecting...' : 'Request Teleconsult'}
                </button>
              </div>

              {teleconsultResult && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950">
                      Session Token: {teleconsultResult.sessionId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-teal-600 text-white">
                      {teleconsultResult.status}
                    </span>
                  </div>
                  <p className="text-2xs text-teal-900 italic">
                    {teleconsultResult.regulatoryNote}
                  </p>
                  <a
                    href={teleconsultResult.roomUrl}
                    onClick={e => {
                      e.preventDefault();
                      alert('Connecting to mock eSanjeevani 2.0 room: ' + teleconsultResult.roomUrl);
                    }}
                    className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-teal-700 text-white"
                  >
                    Enter Tele-Consultation Bay →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Dynamic Consent Manager (ABDM Specifications) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">ABDM Consent Manager</h3>
                </div>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Patient controls which hospitals and specialists can view their diagnostic reports.
                </p>
              </div>

              <div className="space-y-3">
                {consents.map(consent => {
                  const isGranted = consent.status === 'GRANT';
                  return (
                    <div
                      key={consent.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {consent.requestedBy}
                          </h4>
                          <p className="text-2xs text-slate-500 mt-0.5">{consent.purpose}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                            isGranted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {consent.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-2xs">
                        <span className="text-slate-500">Scope: {consent.dataScope}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleConsent(consent.id, consent.status)}
                          className={`px-2.5 py-1 rounded-md font-bold transition ${
                            isGranted
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          {isGranted ? 'Revoke Consent' : 'Grant Consent'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
