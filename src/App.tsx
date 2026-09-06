import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TriageView } from './components/TriageView';
import { FacilityRoutingView } from './components/FacilityRoutingView';
import { ReferralHandshakeView } from './components/ReferralHandshakeView';
import { CareJourneyView } from './components/CareJourneyView';
import { CareGapRadarView } from './components/CareGapRadarView';
import { HealthWorkerOfflineView } from './components/HealthWorkerOfflineView';
import { PatientRecordsView } from './components/PatientRecordsView';
import { DemoScenariosModal } from './components/DemoScenariosModal';
import { TriageUrgency } from './types';
import {
  Activity,
  Heart,
  Shield,
  FileText,
  HelpCircle,
  PhoneCall,
  Lock
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, t } = useAuth();
  const [activeTab, setActiveTab] = useState('triage');
  const [scenariosOpen, setScenariosOpen] = useState(false);

  // Routing navigation pre-fill state
  const [routingUrgency, setRoutingUrgency] = useState<TriageUrgency>('RED');
  const [routingSpecialty, setRoutingSpecialty] = useState<string>('Cardiology');

  // Referral creation pre-fill state
  const [preselectedFacilityId, setPreselectedFacilityId] = useState<string | undefined>();
  const [preselectedFacilityName, setPreselectedFacilityName] = useState<string | undefined>();

  const handleNavigateToRouting = (urgency: TriageUrgency, specialty?: string) => {
    setRoutingUrgency(urgency);
    if (specialty) setRoutingSpecialty(specialty);
    setActiveTab('routing');
  };

  const handleInitiateReferral = (facilityId: string, facilityName: string) => {
    setPreselectedFacilityId(facilityId);
    setPreselectedFacilityName(facilityName);
    setActiveTab('referrals');
  };

  const handleSelectScenario = (num: 1 | 2) => {
    setScenariosOpen(false);
    if (num === 1) {
      // Scenario 1: Acute rural care journey starting at triage
      setActiveTab('triage');
    } else {
      // Scenario 2: Specialist Capacity Routing
      setRoutingUrgency('RED');
      setRoutingSpecialty('Cardiology');
      setActiveTab('routing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation */}
      <Navbar
        onOpenScenarios={() => setScenariosOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Feature View Canvas */}
      <main className="flex-1 pb-16">
        {activeTab === 'triage' && (
          <TriageView onNavigateToRouting={handleNavigateToRouting} />
        )}

        {activeTab === 'routing' && (
          <FacilityRoutingView
            initialUrgency={routingUrgency}
            initialSpecialty={routingSpecialty}
            onInitiateReferral={handleInitiateReferral}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralHandshakeView
            preselectedFacilityId={preselectedFacilityId}
            preselectedFacilityName={preselectedFacilityName}
          />
        )}

        {activeTab === 'journey' && <CareJourneyView />}

        {activeTab === 'careGaps' && <CareGapRadarView />}

        {activeTab === 'records' && <PatientRecordsView />}

        {activeTab === 'offline' && <HealthWorkerOfflineView />}
      </main>

      {/* Guided Demo Walkthrough Modal */}
      <DemoScenariosModal
        isOpen={scenariosOpen}
        onClose={() => setScenariosOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      {/* Public Healthcare Platform Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-teal-600 flex items-center justify-center text-white text-3xs font-bold">
              CG
            </div>
            <span>
              <strong>CareGrid</strong> — National Health Mission Rural Care-Coordination Architecture
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-2xs">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> ABDM Milestone 1 & 2 Compliant
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" /> Role-Based Access Control (RBAC)
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-600" /> Clinical Rule-Engine + Gemini Synthesis
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
