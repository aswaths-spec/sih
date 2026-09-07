import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CareJourney, CareJourneyStep, Patient } from '../types';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ticket,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Building2,
  User,
  Sparkles,
  RefreshCw,
  CheckCheck,
  Activity,
  Pill,
  HeartPulse,
  MapPin,
  BadgeCheck,
  ExternalLink
} from 'lucide-react';

interface CareJourneyViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const CareJourneyView: React.FC<CareJourneyViewProps> = ({ onNavigateTab }) => {
  const { user, profile, t, isTamil } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [journey, setJourney] = useState<CareJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Load all patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const list = await api.getPatients();
        setPatients(list);

        // Determine default selected patient:
        // 1. If user is a PATIENT and has a linked patientId or profile.id, select that
        // 2. Otherwise default to the first patient
        const currentPatientId =
          (user?.role === 'PATIENT' ? user.patientId : undefined) ||
          (profile && 'abhaId' in profile ? profile.id : undefined) ||
          (list.length > 0 ? list[0].id : '');

        setSelectedPatientId(currentPatientId);
      } catch (err) {
        console.error('Failed to load patients for Care Journey:', err);
      }
    };

    loadPatients();
  }, [user, profile]);

  // Fetch care journey whenever selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchJourney = async () => {
      setLoading(true);
      setSuccessBanner(null);
      try {
        const data = await api.getCareJourney(selectedPatientId);
        setJourney(data);
      } catch (err) {
        console.error('Failed to load care journey for patient:', selectedPatientId, err);
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const isViewingSelf =
    user?.role === 'PATIENT' &&
    (selectedPatientId === user.patientId || selectedPatient?.userId === user.id);

  // Fast-track full treatment
  const handleTreatPatientFull = async () => {
    if (!selectedPatientId) return;
    setActionLoading(true);
    setSuccessBanner(null);
    try {
      const updated = await api.treatPatientFull(selectedPatientId);
      setJourney(updated);
      setSuccessBanner(
        isTamil
          ? `✓ ${updated.patientName} மருத்துவ சிகிச்சை முழுமையாக நிறைவடைந்தது! ${updated.facilityName} மருத்துவமனையில் உள்நோயாளி சேர்க்கை, சிறப்பு மருத்துவர் ஆலோசனை, பரிசோதனை முடிவுகள் மற்றும் 7 நாள் சமூக பின்தொடர்தல் உறுதிசெய்யப்பட்டது.`
          : `✓ Treatment protocol successfully completed for ${updated.patientName}! Admitted to ${updated.facilityName}, token verified, diagnostics verified, specialist review completed, medications dispensed, and 7-day post-discharge follow-up activated.`
      );
    } catch (err) {
      console.error('Failed to complete full treatment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Step-by-step advance
  const handleAdvanceStep = async () => {
    if (!selectedPatientId) return;
    setActionLoading(true);
    setSuccessBanner(null);
    try {
      const updated = await api.advanceCareJourney(selectedPatientId);
      setJourney(updated);
      setSuccessBanner(
        isTamil
          ? `அடுத்த கட்டம் செயல்படுத்தப்பட்டது: ${updated.currentStage}`
          : `Care pathway advanced to: ${updated.currentStage}`
      );
    } catch (err) {
      console.error('Failed to advance journey:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset pathway
  const handleResetJourney = async () => {
    if (!selectedPatientId) return;
    setActionLoading(true);
    setSuccessBanner(null);
    try {
      const updated = await api.resetCareJourney(selectedPatientId);
      setJourney(updated);
      setSuccessBanner(
        isTamil
          ? `சிகிச்சை பாதை ஆரம்ப நிலைக்கு மீட்டமைக்கப்பட்டது.`
          : `Care pathway reset to initial doorstep intake state.`
      );
    } catch (err) {
      console.error('Failed to reset journey:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const stepStatusStyles: Record<
    CareJourneyStep['status'],
    { badge: string; icon: any; border: string }
  > = {
    COMPLETED: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      border: 'border-emerald-500 bg-emerald-50/40'
    },
    IN_PROGRESS: {
      badge: 'bg-teal-600 text-white border-teal-600 animate-pulse',
      icon: Clock,
      border: 'border-teal-600 bg-teal-50/50 shadow-xs ring-2 ring-teal-100'
    },
    UPCOMING: {
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: Clock,
      border: 'border-slate-200 bg-white'
    },
    DELAYED: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: AlertCircle,
      border: 'border-rose-400 bg-rose-50/40'
    }
  };

  // Calculate completed percentage
  const completedStepsCount = journey?.steps.filter(s => s.status === 'COMPLETED').length || 0;
  const totalStepsCount = journey?.steps.length || 9;
  const completionPercentage = Math.round((completedStepsCount / totalStepsCount) * 100);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Context Description */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>{t.journey.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    Tamil Nadu Health Grid
                  </span>
                </h1>
                <p className="text-xs text-slate-500">{t.journey.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Interactive Patient Selection Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative min-w-[280px]">
              <label htmlFor="patient-selector" className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                {isTamil ? 'நோயாளி தேர்வு (Select Patient):' : 'Active Patient Pathway:'}
              </label>
              <div className="relative">
                <select
                  id="patient-selector"
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition shadow-2xs"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.district || 'Coimbatore'} (ABHA: {p.abhaId ? p.abhaId.slice(-9) : 'TN'})
                      {user?.patientId === p.id ? ' ★ [My Record]' : ''}
                    </option>
                  ))}
                </select>
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Switch to Own Record if logged in as patient */}
            {user?.role === 'PATIENT' && user.patientId && !isViewingSelf && (
              <button
                type="button"
                id="btn-select-myself"
                onClick={() => setSelectedPatientId(user.patientId!)}
                className="self-end sm:self-auto px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition"
              >
                ★ {isTamil ? 'என் சுய விவரம்' : 'My Care Record'}
              </button>
            )}
          </div>
        </div>

        {/* Selected Patient Details Strip */}
        {selectedPatient && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-2xs text-slate-400 block font-medium">
                {isTamil ? 'நோயாளி பெயர் & வயது' : 'Patient Name & Age'}
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span>{selectedPatient.name}</span>
                {isViewingSelf && (
                  <span className="text-3xs px-1.5 py-0.2 rounded bg-teal-600 text-white font-semibold">
                    {isTamil ? 'நான்' : 'You'}
                  </span>
                )}
              </div>
              <span className="text-2xs text-slate-500">
                {selectedPatient.gender}, {selectedPatient.age} yrs
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-2xs text-slate-400 block font-medium">
                {isTamil ? 'ஆபா அடையாள எண்' : 'ABHA Health ID'}
              </span>
              <div className="font-mono text-xs font-semibold text-teal-900 flex items-center gap-1 mt-0.5">
                <BadgeCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{selectedPatient.abhaId || '91-4401-2026-9021'}</span>
              </div>
              <span className="text-3xs text-emerald-700 font-semibold">
                {isTamil ? '✓ அங்கீகரிக்கப்பட்டது' : '✓ Verified Ayushman TN'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-2xs text-slate-400 block font-medium">
                {isTamil ? 'இருப்பிடம் / மாவட்டம்' : 'Location & District'}
              </span>
              <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span>{selectedPatient.district || 'Coimbatore'}, TN</span>
              </div>
              <span className="text-3xs text-slate-500 truncate block">
                {selectedPatient.village || 'Kinathukadavu Village'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-2xs text-slate-400 block font-medium">
                {isTamil ? 'ஒதுக்கப்பட்ட செவிலியர்' : 'Assigned Health Worker'}
              </span>
              <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>Meenakshi Sundaram</span>
              </div>
              <span className="text-3xs text-slate-500">VHN / Field Nurse</span>
            </div>
          </div>
        )}
      </div>

      {/* Clinical "Get Me Treated" Control Center */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-teal-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{isTamil ? 'சிகிச்சை மேலாண்மை மையம்' : 'Clinical Treatment Action Suite'}</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {isTamil
                ? `${selectedPatient?.name || 'நோயாளி'} - சிகிச்சை பெறுதல் & முன்னேற்றம்`
                : `Treatment Pathway for ${selectedPatient?.name || 'Patient'}`}
            </h2>
            <p className="text-xs text-teal-200 max-w-xl">
              {isTamil
                ? 'ஒரே கிளிக்கில் மருத்துவமனை படுக்கை உறுதிசெய்து, ஆய்வக சோதனைகள் மற்றும் மருத்துவர் ஆலோசனையுடன் முழுமையான சிகிச்சையை நிறைவு செய்யுங்கள்.'
                : 'Instantly advance through hospital referral, bed assignment, lab diagnostics, specialist consultation, and prescribed medication regimen.'}
            </p>
          </div>

          {/* Action Buttons: Get Treated, Step Advance, Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action: Get Me Treated / Complete Full Treatment */}
            <button
              type="button"
              id="btn-get-me-treated"
              onClick={handleTreatPatientFull}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-98 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <CheckCheck className="w-4 h-4 text-slate-950" />
              )}
              <span>
                {isTamil
                  ? 'என்னை முழுமையாக குணப்படுத்துக'
                  : 'Get Me Treated (Complete Treatment)'}
              </span>
            </button>

            {/* Step Advance */}
            <button
              type="button"
              id="btn-advance-step"
              onClick={handleAdvanceStep}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-white bg-teal-700/80 hover:bg-teal-600 border border-teal-500/40 transition disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-teal-300" />
              <span>{isTamil ? 'அடுத்த படி' : 'Advance 1 Step'}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              id="btn-reset-journey"
              onClick={handleResetJourney}
              disabled={actionLoading}
              title={isTamil ? 'சிகிச்சை வழியை மீட்டமைக்க' : 'Reset journey to initial registration'}
              className="p-2.5 rounded-xl font-semibold text-xs text-teal-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 transition disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar inside card */}
        <div className="mt-4 pt-4 border-t border-teal-700/60">
          <div className="flex items-center justify-between text-2xs text-teal-200 mb-1.5">
            <span className="font-semibold">
              {isTamil
                ? `சிகிச்சை முன்னேற்றம்: 9 இல் ${completedStepsCount} படிகள் முடிந்தது`
                : `Care Pathway Progress: Step ${completedStepsCount} of ${totalStepsCount} Completed`}
            </span>
            <span className="font-mono font-bold text-emerald-300">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{isTamil ? 'சிகிச்சை நிலை புதுப்பிக்கப்பட்டது' : 'Care Pathway Status Updated'}</p>
            <p className="mt-0.5 leading-relaxed">{successBanner}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
          <span>{isTamil ? 'சிகிச்சை தரவுகள் ஏற்றப்படுகின்றன...' : 'Loading patient care pathway and clinical milestones...'}</span>
        </div>
      ) : journey ? (
        <div className="space-y-6">
          {/* Prominent "What should I do next?" Guidance Card */}
          <div
            id="care-journey-next-action-card"
            className="p-6 rounded-2xl bg-teal-800 text-white shadow-md relative overflow-hidden"
          >
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-widest text-teal-300 bg-teal-900/80 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-teal-700">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  <span>{t.journey.nextStepHeader}</span>
                </span>

                <span className="px-2.5 py-0.5 text-2xs font-bold rounded-full bg-teal-700/80 text-teal-100 border border-teal-600">
                  Stage: {journey.currentStage}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold leading-relaxed">{journey.nextBestAction}</h2>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-teal-100 border-t border-teal-700/60">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-300" />
                  <strong className="text-white">
                    {journey.facilityName || `${selectedPatient?.district || 'Coimbatore'} District Hospital`}
                  </strong>
                </span>

                <span className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-teal-300" />
                  <span>OPD Token:</span>
                  <strong className="text-emerald-300 font-mono">
                    {journey.tokenNumber || `TK-TN-${selectedPatient?.id.slice(-4).toUpperCase() || '7102'}`}
                  </strong>
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-300" />
                  <span>
                    {completionPercentage === 100
                      ? (isTamil ? 'சிகிச்சை நிறைவு (0 நிமிடம்)' : 'Treated & Discharged (0 mins)')
                      : (isTamil ? 'மதிப்பிடப்பட்ட நேரம்: ~12 நிமிடம்' : 'Est. Wait: ~12 mins')}
                  </span>
                </span>
              </div>
            </div>

            {/* Subtle background graphic */}
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
              <Stethoscope className="w-56 h-56" />
            </div>
          </div>

          {/* Quick Context Tab Shortcuts */}
          {onNavigateTab && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('triage')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-left transition flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <span className="text-2xs font-bold text-teal-700 uppercase tracking-wider block">
                    {isTamil ? 'படி 2 பரிசோதனை' : 'Step 2 Protocol'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                    {isTamil ? 'கள அவசர பரிசோதனை' : 'AI Digital Triage'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('routing')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-left transition flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <span className="text-2xs font-bold text-indigo-700 uppercase tracking-wider block">
                    {isTamil ? 'படி 3 ரூட்டிங்' : 'Step 3 Matching'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                    {isTamil ? 'மருத்துவமனை தேர்வு & படுக்கை' : 'Hospital Routing & Beds'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('records')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-left transition flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">
                    {isTamil ? 'ஆவணங்கள்' : 'Health Records'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    {isTamil ? 'ஆபா மருத்துவ ஆவணங்கள்' : 'ABHA Health Locker'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          )}

          {/* 9-Step Continuous Pathway Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{journey.title}</h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  {isTamil ? 'தற்போதைய நிலை:' : 'Current Clinical Stage:'}{' '}
                  <span className="font-semibold text-teal-700">{journey.currentStage}</span>
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>Overall: {journey.overallStatus}</span>
              </span>
            </div>

            <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {journey.steps.map(step => {
                const style = stepStatusStyles[step.status];
                const Icon = style.icon;

                return (
                  <div
                    key={step.id}
                    id={`journey-step-${step.stepOrder}`}
                    className={`relative p-4 rounded-xl border transition ${style.border}`}
                  >
                    {/* Circle Node on Timeline */}
                    <div
                      className={`absolute -left-7 top-4 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-xs ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-600 border-white text-white'
                          : step.status === 'IN_PROGRESS'
                          ? 'bg-teal-600 border-white text-white ring-4 ring-teal-100 animate-pulse'
                          : 'bg-white border-slate-300 text-slate-500'
                      }`}
                    >
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.stepOrder
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{step.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-2xs font-semibold border ${style.badge}`}
                          >
                            {step.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {step.notes && (
                          <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
                            {step.notes}
                          </p>
                        )}

                        {step.actionRequired && (
                          <div className="flex items-start gap-1.5 text-xs text-teal-950 font-semibold bg-teal-100/70 p-2 rounded-lg border border-teal-300/80 mt-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>Action: {step.actionRequired}</span>
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right shrink-0">
                        {step.completedAt && (
                          <span className="inline-block text-2xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {new Date(step.completedAt).toLocaleDateString()} {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
