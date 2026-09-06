import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Referral, ReferralStatus } from '../types';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  AlertTriangle,
  ArrowRight,
  Send,
  Ticket,
  Check,
  FileText,
  RotateCcw
} from 'lucide-react';

interface ReferralHandshakeViewProps {
  preselectedFacilityId?: string;
  preselectedFacilityName?: string;
}

export const ReferralHandshakeView: React.FC<ReferralHandshakeViewProps> = ({
  preselectedFacilityId,
  preselectedFacilityName
}) => {
  const { user, t } = useAuth();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // New referral form state
  const [showCreateModal, setShowCreateModal] = useState(Boolean(preselectedFacilityId));
  const [targetFacilityId, setTargetFacilityId] = useState(preselectedFacilityId || 'fac-2');
  const [priorityLevel, setPriorityLevel] = useState<'EMERGENCY' | 'URGENT' | 'ROUTINE'>('EMERGENCY');
  const [reasonForReferral, setReasonForReferral] = useState('Acute chest pain & elevated BP requiring emergency cardiac evaluation');
  const [clinicalSummary, setClinicalSummary] = useState('Patient Ramesh Patil, 50M. Onset of crushing substernal chest pain with left arm radiation 45 mins ago. BP 168/98 mmHg, SpO2 94%, HR 102 bpm. History of hypertension. Sublingual aspirin 325mg administered by ASHA.');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Over capacity in cardiac telemetry bay');

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await api.getReferrals();
      setReferrals(data);
      if (data.length > 0 && !selectedReferral) {
        setSelectedReferral(data[0]);
      }
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRef = await api.createReferral({
        patientId: 'pat-1',
        targetFacilityId,
        reasonForReferral,
        clinicalSummary,
        priorityLevel
      });
      setShowCreateModal(false);
      await fetchReferrals();
      setSelectedReferral(newRef);
    } catch (err: any) {
      alert('Failed to initiate referral: ' + err.message);
    }
  };

  const handleStatusChange = async (newStatus: ReferralStatus, notes?: string, rejReason?: string) => {
    if (!selectedReferral) return;
    try {
      const updated = await api.updateReferralStatus(
        selectedReferral.id,
        newStatus,
        notes,
        rejReason
      );
      setSelectedReferral(updated);
      await fetchReferrals();
      setShowRejectModal(false);
    } catch (err: any) {
      alert('Failed to update referral: ' + err.message);
    }
  };

  const statusColors: Record<ReferralStatus, { bg: string; text: string }> = {
    CREATED: { bg: 'bg-slate-100', text: 'text-slate-800' },
    SENT: { bg: 'bg-blue-100', text: 'text-blue-800' },
    RECEIVED: { bg: 'bg-purple-100', text: 'text-purple-800' },
    UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800' },
    ACCEPTED: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    REJECTED: { bg: 'bg-rose-100', text: 'text-rose-800' },
    APPOINTMENT_ASSIGNED: { bg: 'bg-teal-100', text: 'text-teal-800' },
    PATIENT_ARRIVED: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    CONSULTATION_COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    FOLLOWUP_REQUIRED: { bg: 'bg-amber-100', text: 'text-amber-800' },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800' }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t.referral.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.referral.subtitle}</p>
        </div>

        <button
          type="button"
          id="btn-open-create-referral"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>New Referral Handshake</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Referrals List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <span>Referrals In Handshake Pipeline</span>
            <span>{referrals.length} active</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              Loading referral pipeline...
            </div>
          ) : (
            referrals.map(r => {
              const isSelected = selectedReferral?.id === r.id;
              return (
                <div
                  key={r.id}
                  id={`referral-item-${r.id}`}
                  onClick={() => setSelectedReferral(r)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer bg-white shadow-2xs space-y-2 ${
                    isSelected
                      ? 'border-teal-600 ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {r.referralCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        To: {r.targetFacilityName}
                      </h4>
                      <p className="text-2xs text-slate-500">By: {r.referringWorkerName}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-2xs font-bold ${
                          statusColors[r.status]?.bg || 'bg-slate-100'
                        } ${statusColors[r.status]?.text || 'text-slate-800'}`}
                      >
                        {r.status}
                      </span>
                      <span
                        className={`block text-2xs font-extrabold uppercase ${
                          r.priorityLevel === 'EMERGENCY'
                            ? 'text-rose-600'
                            : r.priorityLevel === 'URGENT'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {r.priorityLevel}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 italic">
                    "{r.reasonForReferral}"
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Referral Handshake Inspector */}
        <div className="lg:col-span-7">
          {selectedReferral ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      {selectedReferral.referralCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                        statusColors[selectedReferral.status]?.bg
                      } ${statusColors[selectedReferral.status]?.text}`}
                    >
                      {selectedReferral.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedReferral.targetFacilityName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Initiated by {selectedReferral.referringWorkerName} on{' '}
                    {new Date(selectedReferral.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Handshake Progress Flow Stepper */}
              <div>
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Handshake Lifecycle Status:
                </span>
                <div className="flex items-center justify-between text-2xs font-medium text-slate-600 overflow-x-auto pb-1 no-scrollbar gap-2">
                  {['SENT', 'ACCEPTED', 'APPOINTMENT_ASSIGNED', 'PATIENT_ARRIVED', 'COMPLETED'].map(
                    (stepName, i) => {
                      const isDone =
                        selectedReferral.statusHistory.some(h => h.status === stepName) ||
                        selectedReferral.status === stepName;
                      return (
                        <div key={stepName} className="flex items-center gap-1 shrink-0">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-3xs font-bold ${
                              isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className={isDone ? 'text-teal-900 font-bold' : 'text-slate-400'}>
                            {stepName.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Rejection / Alternative Notice if applicable */}
              {selectedReferral.status === 'REJECTED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Referral Declined by Receiving Facility</span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Reason: {selectedReferral.rejectionReason}
                  </p>
                  {selectedReferral.alternativeFacilityName && (
                    <div className="p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between">
                      <div>
                        <span className="text-2xs font-bold text-slate-700 block">
                          CareGrid Alternative Routing Recommendation:
                        </span>
                        <span className="text-xs font-semibold text-teal-800">
                          {selectedReferral.alternativeFacilityName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            'SENT',
                            `Re-routed to alternative: ${selectedReferral.alternativeFacilityName}`
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                      >
                        Accept & Re-route
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Clinical Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
                  Clinical Summary & Vital Signs:
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedReferral.clinicalSummary}
                </p>
              </div>

              {/* Action Buttons for Healthcare Provider / Facility Staff */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-teal-900 block">
                  Receiving Facility & Clinician Handshake Actions:
                </span>

                <div className="flex flex-wrap gap-2">
                  {selectedReferral.status === 'SENT' || selectedReferral.status === 'UNDER_REVIEW' ? (
                    <>
                      <button
                        type="button"
                        id="btn-accept-referral"
                        onClick={() => handleStatusChange('ACCEPTED', 'Accepted by Triage Officer')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Patient & Bed</span>
                      </button>
                      <button
                        type="button"
                        id="btn-reject-referral"
                        onClick={() => setShowRejectModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline / Re-route</span>
                      </button>
                    </>
                  ) : null}

                  {selectedReferral.status === 'ACCEPTED' ? (
                    <button
                      type="button"
                      id="btn-assign-token"
                      onClick={() =>
                        handleStatusChange(
                          'APPOINTMENT_ASSIGNED',
                          'Emergency OPD Token TK-CARD-12 Issued'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-2xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Issue Priority Token</span>
                    </button>
                  ) : null}

                  {selectedReferral.status === 'APPOINTMENT_ASSIGNED' ? (
                    <button
                      type="button"
                      id="btn-mark-arrived"
                      onClick={() =>
                        handleStatusChange(
                          'PATIENT_ARRIVED',
                          'Patient verified at Emergency Intake Desk'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Patient Arrived</span>
                    </button>
                  ) : null}

                  {selectedReferral.status === 'PATIENT_ARRIVED' ? (
                    <button
                      type="button"
                      id="btn-complete-consult"
                      onClick={() =>
                        handleStatusChange(
                          'CONSULTATION_COMPLETED',
                          'Cardiac evaluation completed. Troponin negative, nitroglycerin response positive. Scheduled 7-day follow-up.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Consultation</span>
                    </button>
                  ) : null}

                  {selectedReferral.status === 'CONSULTATION_COMPLETED' ? (
                    <button
                      type="button"
                      id="btn-complete-journey"
                      onClick={() =>
                        handleStatusChange(
                          'COMPLETED',
                          'All care pathway milestones concluded successfully.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Close Handshake Pathway</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Status Audit Trail */}
              <div>
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Handshake Audit Trail:
                </span>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {selectedReferral.statusHistory.map((h, i) => (
                    <div key={i} className="text-2xs space-y-0.5">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-bold">{h.status}</span>
                        <span className="text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600">{h.notes}</p>
                      <span className="text-3xs text-slate-400 italic">By: {h.updatedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              Select a referral on the left to review handshake details and take actions.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Referral */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Initiate Referral Handshake
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Receiving Facility
                </label>
                <select
                  value={targetFacilityId}
                  onChange={e => setTargetFacilityId(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 p-2"
                >
                  <option value="fac-2">Solapur District Civil Hospital (Recommended - 18km)</option>
                  <option value="fac-1">Shirur Primary Health Centre (PHC) (4.8km)</option>
                  <option value="fac-3">Barshi Sub-District Hospital (24km)</option>
                  <option value="fac-4">Ashwini Sahakari Rugnalaya (Tertiary - 19km)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EMERGENCY', 'URGENT', 'ROUTINE'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriorityLevel(lvl)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        priorityLevel === lvl
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Referral
                </label>
                <input
                  type="text"
                  value={reasonForReferral}
                  onChange={e => setReasonForReferral(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Summary & Initial Measures Given
                </label>
                <textarea
                  rows={3}
                  value={clinicalSummary}
                  onChange={e => setClinicalSummary(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Transmit Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Decline / Re-route */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Decline Referral & Re-route
            </h3>
            <p className="text-xs text-slate-500">
              Specify the clinical reason for non-acceptance. CareGrid will automatically find and propose the closest alternative capable facility.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full text-xs rounded-lg border-slate-300 p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('REJECTED', undefined, rejectionReason)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Decline & Re-route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
