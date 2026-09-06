import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../i18n/translations';
import { UserRole } from '../types';
import {
  Activity,
  UserCheck,
  Globe,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  PlayCircle,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';

interface NavbarProps {
  onOpenScenarios: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScenarios, activeTab, setActiveTab }) => {
  const {
    user,
    language,
    setLanguage,
    t,
    switchPersona,
    isOffline,
    setIsOffline,
    resetDemo,
    loading,
    pendingOfflineActionsCount
  } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const personas: { role: UserRole; name: string; title: string }[] = [
    { role: 'HEALTH_WORKER', name: 'Sunita Gaikwad', title: 'ASHA / Health Worker (Primary Care)' },
    { role: 'PATIENT', name: 'Ramesh Patil', title: 'Rural Patient (Shirur Village)' },
    { role: 'DOCTOR', name: 'Dr. Vivek Sharma', title: 'Medical Specialist (Cardiologist)' },
    { role: 'FACILITY_ADMIN', name: 'Rajesh Deshmukh', title: 'Facility Admin (Civil Hospital)' },
    { role: 'SYSTEM_ADMIN', name: 'Dr. Anita Roy', title: 'District Health Officer (DHO)' }
  ];

  const handleRoleSelect = async (role: UserRole) => {
    setRoleDropdownOpen(false);
    await switchPersona(role);
  };

  const handleReset = async () => {
    if (confirm('Reset CareGrid demo database back to the initial scenario state?')) {
      setResetting(true);
      try {
        await resetDemo();
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">CareGrid</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  NHM Coordinated
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block leading-tight">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center/Right Controls: Scenarios, Role Switcher, Language, Offline, Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Walkthrough Button */}
            <button
              id="btn-demo-scenarios"
              type="button"
              onClick={onOpenScenarios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-2xs"
            >
              <PlayCircle className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Guided Demo Walkthrough</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                id="btn-persona-switcher"
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-900">{user?.name?.split(' ')[0]}</span>
                <span className="text-slate-500 hidden lg:inline">({t.roles[user?.role || 'PATIENT']})</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">Switch Evaluator Persona</p>
                    <p className="text-2xs text-slate-500">Test different user perspectives in 1-click</p>
                  </div>
                  {personas.map(p => (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleRoleSelect(p.role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        user?.role === p.role ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-2xs text-slate-500">{p.title}</div>
                      </div>
                      {user?.role === p.role && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                id="btn-lang-en"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition ${
                  language === 'en'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                id="btn-lang-hi"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-md transition ${
                  language === 'hi'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                id="btn-lang-mr"
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 rounded-md transition ${
                  language === 'mr'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Offline Simulation Toggle */}
            <button
              id="btn-toggle-offline"
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              title={isOffline ? 'Operating in Offline Mode. Click to go online.' : 'Online. Click to simulate rural offline field mode.'}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                isOffline
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-700" />
                  <span className="hidden xl:inline font-semibold">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span className="hidden xl:inline">Online</span>
                </>
              )}
            </button>

            {/* Reset Database Button */}
            <button
              id="btn-reset-demo"
              type="button"
              onClick={handleReset}
              disabled={resetting || loading}
              title="Reset database to initial pristine state"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {[
            { id: 'triage', label: t.nav.triage, icon: Activity },
            { id: 'routing', label: t.nav.routing, icon: ShieldCheck },
            { id: 'referrals', label: t.nav.referrals, icon: UserCheck },
            { id: 'journey', label: t.nav.journey, icon: PlayCircle },
            { id: 'careGaps', label: t.nav.careGaps, icon: Bell },
            { id: 'records', label: t.nav.records, icon: Globe },
            { id: 'offline', label: t.nav.offline, icon: WifiOff }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.id === 'offline' && pendingOfflineActionsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-2xs bg-amber-500 text-white font-bold">
                    {pendingOfflineActionsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Offline Mode Banner when offline is active */}
      {isOffline && (
        <div className="bg-amber-50 border-t border-b border-amber-200 px-4 py-1.5 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-700" />
          <span>
            <strong>Offline Field Mode Active:</strong> Community health workers can record triages, follow-ups, and view the Smart Care Pack offline. Changes are stored locally and will synchronize once reconnected.
          </span>
          <button
            type="button"
            onClick={() => setIsOffline(false)}
            className="underline font-semibold ml-2 hover:text-amber-950"
          >
            Reconnect Now
          </button>
        </div>
      )}
    </header>
  );
};
