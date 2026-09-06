import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CareJourney, CareJourneyStep } from '../types';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Ticket,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Building2,
  FileText
} from 'lucide-react';

export const CareJourneyView: React.FC = () => {
  const { user, t } = useAuth();
  const [journey, setJourney] = useState<CareJourney | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJourney = async () => {
    setLoading(true);
    try {
      const data = await api.getCareJourney('pat-1');
      setJourney(data);
    } catch (err) {
      console.error('Failed to load care journey:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.journey.title}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">{t.journey.subtitle}</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading longitudinal care pathway...
        </div>
      ) : journey ? (
        <div className="space-y-6">
          {/* Prominent "What should I do next?" Guidance Card */}
          <div
            id="care-journey-next-action-card"
            className="p-5 rounded-2xl bg-teal-800 text-white shadow-md relative overflow-hidden"
          >
            <div className="relative z-10 space-y-2">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-full inline-block">
                ★ {t.journey.nextStepHeader}
              </span>
              <h2 className="text-lg font-bold leading-snug">{journey.nextBestAction}</h2>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-teal-100">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Solapur District Civil Hospital
                </span>
                <span className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-teal-300" />
                  Token: <strong>TK-CARD-12</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Est. Wait: ~18 mins
                </span>
              </div>
            </div>
            {/* Subtle background graphic */}
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <Stethoscope className="w-48 h-48" />
            </div>
          </div>

          {/* 9-Step Continuous Pathway Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{journey.title}</h3>
                <p className="text-2xs text-slate-500">
                  Current Stage: <span className="font-semibold text-teal-700">{journey.currentStage}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Overall: {journey.overallStatus}
              </span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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
                      className={`absolute -left-7 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-600 border-white text-white'
                          : step.status === 'IN_PROGRESS'
                          ? 'bg-teal-600 border-white text-white ring-4 ring-teal-100 animate-pulse'
                          : 'bg-white border-slate-300 text-slate-500'
                      }`}
                    >
                      {step.stepOrder}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{step.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-2xs font-semibold border ${style.badge}`}
                          >
                            {step.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {step.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">{step.notes}</p>
                        )}
                        {step.actionRequired && (
                          <p className="text-xs text-teal-900 font-semibold mt-1">
                            Action: {step.actionRequired}
                          </p>
                        )}
                      </div>

                      {step.completedAt && (
                        <span className="text-3xs text-slate-400 shrink-0">
                          {new Date(step.completedAt).toLocaleDateString()}
                        </span>
                      )}
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
