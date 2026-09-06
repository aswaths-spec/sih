import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Building2,
  Radar,
  RotateCcw
} from 'lucide-react';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioNumber: 1 | 2) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  const { t } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-lg font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>CareGrid Evaluator Guide</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Choose a Demo Walkthrough
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Explore the public healthcare care-coordination platform with pre-configured clinical situations.
          </p>
        </div>

        {/* Scenario 1 Card */}
        <div
          id="scenario-card-1"
          className="p-5 rounded-2xl border-2 border-teal-500 bg-teal-50/40 space-y-3 relative hover:shadow-xs transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-teal-600 text-white">
                Primary End-to-End Pathway
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                {t.scenarios.scenario1Title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {t.scenarios.scenario1Desc}
          </p>

          <div className="flex flex-wrap gap-2 text-2xs text-slate-600 pt-1">
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
              <Stethoscope className="w-3 h-3 text-teal-600" /> Digital Triage
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
              <ShieldCheck className="w-3 h-3 text-teal-600" /> Intelligent Routing
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
              <Building2 className="w-3 h-3 text-teal-600" /> Referral Handshake
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
              <Radar className="w-3 h-3 text-rose-600" /> Care-Gap Radar
            </span>
          </div>

          <button
            type="button"
            id="btn-launch-scenario-1"
            onClick={() => onSelectScenario(1)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition shadow-xs flex items-center justify-center gap-2"
          >
            <span>Launch Scenario 1: Primary Care Pathway</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario 2 Card */}
        <div
          id="scenario-card-2"
          className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 space-y-3 relative hover:shadow-xs transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-indigo-600 text-white">
                Specialist Routing & Capacity Logic
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                {t.scenarios.scenario2Title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {t.scenarios.scenario2Desc}
          </p>

          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-2xs space-y-1">
            <div className="flex justify-between text-rose-800">
              <span>Facility A (PHC, 4.8 km): No Cardiologist, High Queue, 83% Bed Occupancy</span>
              <span className="font-bold">Score: 48</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Facility B (District Hospital, 18.2 km): Cardiologist On-Duty, ECG, 60% Capacity</span>
              <span className="font-bold">Score: 92 ★</span>
            </div>
          </div>

          <button
            type="button"
            id="btn-launch-scenario-2"
            onClick={() => onSelectScenario(2)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition shadow-xs flex items-center justify-center gap-2"
          >
            <span>Launch Scenario 2: Specialist Routing Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
