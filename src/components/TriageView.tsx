import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TriageRecord, TriageUrgency } from '../types';
import { VoiceInputButton } from './VoiceInputButton';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  Activity,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

interface TriageViewProps {
  onNavigateToRouting: (urgency: TriageUrgency, specialty?: string) => void;
}

export const TriageView: React.FC<TriageViewProps> = ({ onNavigateToRouting }) => {
  const { user, t, language, isOffline, setPendingOfflineActionsCount } = useAuth();

  const [symptoms, setSymptoms] = useState('Crushing chest pain radiating to left shoulder and mild breathlessness for 45 minutes');
  const [duration, setDuration] = useState('45 minutes');
  const [bpSystolic, setBpSystolic] = useState<number | ''>(168);
  const [bpDiastolic, setBpDiastolic] = useState<number | ''>(98);
  const [heartRate, setHeartRate] = useState<number | ''>(102);
  const [spo2, setSpo2] = useState<number | ''>(94);
  const [temperatureF, setTemperatureF] = useState<number | ''>(98.6);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ triage: TriageRecord; evaluation: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const quickSymptoms = [
    'Crushing chest pain',
    'Severe breathlessness',
    'High fever (>102°F)',
    'Profuse sweating & nausea',
    'Sudden weakness or slurred speech',
    'Severe abdominal pain',
    'Mild persistent cough',
    'Joint pain & stiffness'
  ];

  const handleAddSymptom = (chip: string) => {
    if (symptoms.trim()) {
      setSymptoms(prev => `${prev}, ${chip}`);
    } else {
      setSymptoms(chip);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setSymptoms(prev => (prev ? `${prev} ${text}` : text));
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please provide patient symptoms to perform triage.');
      return;
    }

    setLoading(true);
    setError(null);
    setConfirmed(false);

    // If simulated offline, provide offline rule-based triage
    if (isOffline) {
      setTimeout(() => {
        const lower = symptoms.toLowerCase();
        const isRed =
          lower.includes('chest pain') ||
          lower.includes('breath') ||
          (bpSystolic && bpSystolic >= 160) ||
          (spo2 && spo2 < 95);

        const offlineRecord: TriageRecord = {
          id: 'trg-offline-' + Date.now(),
          patientId: user?.role === 'PATIENT' ? user.id : 'pat-1',
          symptoms,
          symptomsList: [symptoms],
          duration,
          vitals: {
            bpSystolic: Number(bpSystolic) || undefined,
            bpDiastolic: Number(bpDiastolic) || undefined,
            heartRate: Number(heartRate) || undefined,
            spo2: Number(spo2) || undefined,
            temperatureF: Number(temperatureF) || undefined
          },
          urgency: isRed ? 'RED' : 'ORANGE',
          reasons: [
            isRed ? 'Acute chest symptoms with elevated systolic BP (>160 mmHg)' : 'Symptom duration requires secondary clinical evaluation',
            'Evaluated via Offline Clinical Protocol Rule-Engine'
          ],
          warningSigns: isRed ? ['Risk of Acute Coronary Syndrome (ACS)', 'Hypoxia SpO2 < 95%'] : [],
          recommendedAction: isRed
            ? 'Immediate referral to District Hospital with 24x7 Emergency Room & ECG'
            : 'Refer to Community Health Centre for outpatient clinical assessment',
          confidenceScore: 92,
          humanConfirmed: false,
          aiClinicalSummary: 'Assessment conducted using embedded offline clinical protocols. Queued for server synchronization once connectivity resumes.',
          createdAt: new Date().toISOString()
        };

        setResult({
          triage: offlineRecord,
          evaluation: offlineRecord
        });

        // Store in localStorage offline actions queue
        const queue = JSON.parse(localStorage.getItem('caregrid_offline_queue') || '[]');
        queue.push({
          id: 'action-' + Date.now(),
          type: 'RECORD_TRIAGE',
          payload: offlineRecord,
          clientTimestamp: new Date().toISOString()
        });
        localStorage.setItem('caregrid_offline_queue', JSON.stringify(queue));
        setPendingOfflineActionsCount(queue.length);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const res = await api.assessTriage({
        patientId: user?.role === 'PATIENT' ? user.id : 'pat-1',
        symptoms,
        duration,
        vitals: {
          bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
          bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
          heartRate: heartRate ? Number(heartRate) : undefined,
          spo2: spo2 ? Number(spo2) : undefined,
          temperatureF: temperatureF ? Number(temperatureF) : undefined
        },
        language
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to complete triage assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.triage) return;
    try {
      await api.confirmTriage(result.triage.id, undefined, confirmNotes);
      setConfirmed(true);
      result.triage.humanConfirmed = true;
      result.triage.confirmedByWorkerName = user?.name || 'Sunita Gaikwad (ASHA)';
    } catch (err: any) {
      alert('Error confirming triage: ' + err.message);
    }
  };

  const urgencyColors = {
    RED: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      badge: 'bg-rose-600 text-white',
      border: 'border-rose-500',
      icon: AlertTriangle
    },
    ORANGE: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      badge: 'bg-amber-600 text-white',
      border: 'border-amber-500',
      icon: Clock
    },
    GREEN: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      border: 'border-emerald-500',
      icon: CheckCircle2
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Title & Regulatory Disclaimer */}
      <div>
        <div className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.triage.title}</h1>
        </div>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Clinical Safety Protocol:</strong> {t.triage.disclaimer}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Input Form */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <form onSubmit={handleEvaluate} className="space-y-4">
            {/* Symptoms Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="symptoms-input" className="text-xs font-semibold text-slate-700">
                  {t.triage.symptomsLabel} <span className="text-rose-500">*</span>
                </label>
                <VoiceInputButton onTranscript={handleVoiceTranscript} language={language} />
              </div>
              <textarea
                id="symptoms-input"
                rows={3}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder={t.triage.symptomsPlaceholder}
                className="w-full text-sm rounded-xl border-slate-300 shadow-2xs focus:border-teal-500 focus:ring-teal-500 p-3"
              />
            </div>

            {/* Quick symptom pills */}
            <div>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Select Symptoms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSymptoms.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddSymptom(chip)}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration-input" className="text-xs font-semibold text-slate-700 block mb-1">
                {t.triage.durationLabel}
              </label>
              <input
                id="duration-input"
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 45 minutes, 2 days"
                className="w-full text-sm rounded-lg border-slate-300 shadow-2xs focus:border-teal-500 focus:ring-teal-500 p-2"
              />
            </div>

            {/* Vitals Section */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-700">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.triage.vitalsSection}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label htmlFor="bp-sys" className="text-2xs text-slate-500 block mb-0.5">
                    BP Sys (mmHg)
                  </label>
                  <input
                    id="bp-sys"
                    type="number"
                    value={bpSystolic}
                    onChange={e => setBpSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="120"
                    className="w-full text-xs rounded-lg border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label htmlFor="bp-dia" className="text-2xs text-slate-500 block mb-0.5">
                    BP Dia (mmHg)
                  </label>
                  <input
                    id="bp-dia"
                    type="number"
                    value={bpDiastolic}
                    onChange={e => setBpDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="80"
                    className="w-full text-xs rounded-lg border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label htmlFor="heart-rate" className="text-2xs text-slate-500 block mb-0.5">
                    Heart Rate (bpm)
                  </label>
                  <input
                    id="heart-rate"
                    type="number"
                    value={heartRate}
                    onChange={e => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="72"
                    className="w-full text-xs rounded-lg border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label htmlFor="spo2-level" className="text-2xs text-slate-500 block mb-0.5">
                    SpO2 (%)
                  </label>
                  <input
                    id="spo2-level"
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="98"
                    className="w-full text-xs rounded-lg border-slate-300 p-2"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              id="btn-evaluate-triage"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Analyzing Clinical Protocols & Gemini Synthesis...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>{t.triage.evaluateButton}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Triage Evaluation Results */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div
              id="triage-result-card"
              className={`p-5 rounded-2xl border-2 shadow-sm space-y-4 ${
                urgencyColors[result.triage.urgency].bg
              } ${urgencyColors[result.triage.urgency].border}`}
            >
              {/* Urgency Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      urgencyColors[result.triage.urgency].badge
                    }`}
                  >
                    {result.triage.urgency === 'RED' && t.triage.redEmergency}
                    {result.triage.urgency === 'ORANGE' && t.triage.orangePriority}
                    {result.triage.urgency === 'GREEN' && t.triage.greenRoutine}
                  </span>
                </div>
                <span className="text-2xs font-semibold text-slate-500">
                  Confidence: {result.triage.confidenceScore}%
                </span>
              </div>

              {/* Clinical Reasons */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1.5">
                  {t.triage.reasonsTitle}:
                </h4>
                <ul className="space-y-1">
                  {result.triage.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning Signs */}
              {result.triage.warningSigns && result.triage.warningSigns.length > 0 && (
                <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t.triage.warningSignsTitle}:</span>
                  </div>
                  <ul className="space-y-0.5">
                    {result.triage.warningSigns.map((w, i) => (
                      <li key={i} className="text-2xs text-rose-800">
                        ⚠ {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Next Action */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {t.triage.nextActionTitle}:
                </span>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {result.triage.recommendedAction}
                </p>
              </div>

              {/* AI Clinical Summary */}
              {result.triage.aiClinicalSummary && (
                <div className="text-2xs text-slate-600 italic bg-white/60 p-2.5 rounded-lg border border-slate-200">
                  <strong>Clinical Synthesis:</strong> {result.triage.aiClinicalSummary}
                </div>
              )}

              {/* Human Clinical Confirmation Section */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Health Worker Decision Confirmation:
                  </span>
                  {result.triage.humanConfirmed || confirmed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Confirmed by Clinician
                    </span>
                  ) : (
                    <span className="text-2xs text-amber-700 font-medium">Pending Review</span>
                  )}
                </div>

                {!result.triage.humanConfirmed && !confirmed && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add health worker clinical notes (e.g. pulse is regular, skin cool)..."
                      value={confirmNotes}
                      onChange={e => setConfirmNotes(e.target.value)}
                      className="w-full text-xs rounded-lg border-slate-300 p-2"
                    />
                    <button
                      type="button"
                      id="btn-confirm-triage"
                      onClick={handleConfirm}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.triage.confirmButton}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 1-Click CTA to Intelligent Facility Routing */}
              <button
                type="button"
                id="btn-route-facility"
                onClick={() =>
                  onNavigateToRouting(
                    result.triage.urgency,
                    result.triage.urgency === 'RED' ? 'Cardiology' : 'General Medicine'
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>{t.triage.routeButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <Activity className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Awaiting Triage Assessment</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Enter symptoms and optional vitals on the left, then click <strong>Evaluate Triage Urgency</strong>. CareGrid will apply clinical safety rules and clinical AI synthesis to classify urgency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
