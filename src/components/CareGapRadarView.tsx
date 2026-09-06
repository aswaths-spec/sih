import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CareGap, CareGapStatus } from '../types';
import {
  Radar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  UserCheck,
  Calendar,
  PhoneCall,
  Home,
  Check
} from 'lucide-react';

export const CareGapRadarView: React.FC = () => {
  const { user, t } = useAuth();
  const [gaps, setGaps] = useState<CareGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Resolve modal state
  const [activeGap, setActiveGap] = useState<CareGap | null>(null);
  const [resolveAction, setResolveAction] = useState('Conducted home visit & verified medication adherence');
  const [resolveNotes, setResolveNotes] = useState('Patient BP checked (132/84 mmHg). Follow-up consultation rescheduled at PHC.');

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await api.getCareGaps();
      setGaps(data);
    } catch (err) {
      console.error('Failed to load care gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleResolveGap = async (status: CareGapStatus) => {
    if (!activeGap) return;
    try {
      await api.resolveCareGap(activeGap.id, status, resolveAction, resolveNotes);
      setActiveGap(null);
      await fetchGaps();
    } catch (err: any) {
      alert('Error updating care gap: ' + err.message);
    }
  };

  const filtered = gaps.filter(g => {
    if (filterSeverity !== 'ALL' && g.severity !== filterSeverity) return false;
    if (filterStatus === 'OPEN' && g.status === 'RESOLVED') return false;
    if (filterStatus === 'RESOLVED' && g.status !== 'RESOLVED') return false;
    return true;
  });

  const severityColors: Record<CareGap['severity'], { bg: string; text: string; badge: string }> = {
    CRITICAL: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', badge: 'bg-rose-600 text-white' },
    HIGH: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', badge: 'bg-amber-600 text-white' },
    MODERATE: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900', badge: 'bg-blue-600 text-white' }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-6 h-6 text-rose-600 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t.careGaps.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.careGaps.subtitle}</p>
        </div>

        {/* Quick summary metric pill */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>
            {gaps.filter(g => g.status !== 'RESOLVED').length} Active Unresolved Gaps
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Severity:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-md transition ${
                filterSeverity === sev
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Status:</span>
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md transition ${
                filterStatus === st
                  ? 'bg-teal-700 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Gaps List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            Scanning for overdue follow-ups, delayed referrals, and missing diagnostic tests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No care gaps found matching the active filters.
          </div>
        ) : (
          filtered.map(gap => {
            const isResolved = gap.status === 'RESOLVED';
            const colors = severityColors[gap.severity];

            return (
              <div
                key={gap.id}
                id={`care-gap-${gap.id}`}
                className={`p-4 rounded-xl border transition bg-white shadow-2xs space-y-3 ${
                  isResolved ? 'opacity-60 border-slate-200' : colors.bg
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${colors.badge}`}
                      >
                        {gap.severity}
                      </span>
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                        {gap.gapType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {gap.patientName} — {gap.resolutionNotes}
                    </h3>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-2xs font-bold ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {gap.status}
                    </span>
                    <span className="block text-2xs text-slate-500">
                      Due: {new Date(gap.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-2xs text-slate-600">
                    Assigned Health Worker:{' '}
                    <strong>{gap.responsibleWorkerName || 'Sunita Gaikwad (ASHA)'}</strong>
                  </div>

                  {!isResolved ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGap(gap);
                          setResolveAction('Contacted patient via tele-call; scheduled home visit');
                        }}
                        className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700"
                      >
                        <PhoneCall className="w-3 h-3 inline mr-1" />
                        Acknowledge & Contact
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGap(gap)}
                        className="px-3 py-1 text-2xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
                      >
                        <Check className="w-3 h-3 inline mr-1" />
                        Resolve Gap
                      </button>
                    </div>
                  ) : (
                    <span className="text-2xs text-emerald-800 font-medium">
                      ✓ Resolved: {gap.actionTaken}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {activeGap && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Resolve Care Gap: {activeGap.patientName}
            </h3>
            <p className="text-xs text-slate-500">
              Record the clinical or community outreach intervention performed to close this care gap.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Intervention / Action Taken
              </label>
              <input
                type="text"
                value={resolveAction}
                onChange={e => setResolveAction(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinical Resolution Details & Follow-up Plan
              </label>
              <textarea
                rows={3}
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 p-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveGap(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveGap('RESOLVED')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Confirm & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
