import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Shield,
  User,
  Stethoscope,
  Activity,
  Building2,
  MapPin,
  PlusCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface RoleWorkspaceBarProps {
  onOpenAddHospital: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const RoleWorkspaceBar: React.FC<RoleWorkspaceBarProps> = ({
  onOpenAddHospital,
  activeTab,
  setActiveTab
}) => {
  const { user, profile, logout, language } = useAuth();
  const isTamil = language === 'ta';

  if (!user) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'PATIENT':
        return {
          label: isTamil ? 'நோயாளி போர்டல்' : 'Patient Portal',
          icon: User,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          desc: isTamil
            ? 'தனிநபர் சுகாதாரப் பதிவுகள், ABHA ஒப்புதல் மற்றும் சிகிச்சை பயணம்'
            : 'Personal Health Records, ABDM Consent, and Care Journey tracking'
        };
      case 'HEALTH_WORKER':
        return {
          label: isTamil ? 'சுகாதார களப்பணியாளர் (VHN)' : 'Village Health Nurse (VHN)',
          icon: Activity,
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          desc: isTamil
            ? 'கள அவசர பரிசோதனை, திறன் வழி பரிந்துரை மற்றும் ஆஃப்லைன் பேக்'
            : 'Doorstep digital triage, capacity routing, and rural offline packs'
        };
      case 'DOCTOR':
        return {
          label: isTamil ? 'மருத்துவ நிபுணர்' : 'Medical Specialist',
          icon: Stethoscope,
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          desc: isTamil
            ? 'உள்வரும் அவசர பரிந்துரை ஏற்பு, டோக்கன் மேலாண்மை மற்றும் பரிசோதனைகள்'
            : 'Emergency referral intake review, priority queue, and diagnostic orders'
        };
      case 'FACILITY_ADMIN':
        return {
          label: isTamil ? 'மருத்துவமனை நிர்வாகி' : 'Hospital Facility Admin',
          icon: Building2,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          desc: isTamil
            ? 'படுக்கை & ICU திறன் மேலாண்மை மற்றும் புதிய மருத்துவமனை தரவு உள்ளீடு'
            : 'Bed/ICU capacity management and manual hospital data feeding'
        };
      case 'SYSTEM_ADMIN':
        return {
          label: isTamil ? 'மாவட்ட சுகாதார அதிகாரி (DDHS)' : 'District Health System Admin',
          icon: Shield,
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          desc: isTamil
            ? 'தமிழ்நாடு மாவட்ட சுகாதார பகுப்பாய்வு மற்றும் மருத்துவமனை கட்டமைப்பு'
            : 'District surveillance, referral handshakes, and hospital directory'
        };
      default:
        return {
          label: 'CareGrid User',
          icon: User,
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          desc: 'CareGrid Healthcare Network'
        };
    }
  };

  const badge = getRoleBadge(user.role);
  const Icon = badge.icon;

  const district =
    profile?.district ||
    profile?.assignedDistrict ||
    (user.role === 'DOCTOR' || user.role === 'FACILITY_ADMIN' ? 'Coimbatore' : 'Coimbatore');

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left Side: Active Persona & Role Privileges */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-teal-700">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${badge.bg}`}
              >
                {badge.label}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 text-2xs font-medium">
                <MapPin className="w-3 h-3 text-teal-600" />
                {district}, {isTamil ? 'தமிழ்நாடு' : 'Tamil Nadu'}
              </span>
            </div>
            <p className="text-slate-500 text-2xs mt-0.5">{badge.desc}</p>
          </div>
        </div>

        {/* Right Side: Quick Action Feed Hospital & Logout */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Feed Hospital Data Button */}
          <button
            type="button"
            id="btn-feed-hospital"
            onClick={onOpenAddHospital}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isTamil ? 'மருத்துவமனை தரவு உள்ளீடு' : 'Feed Hospital Data'}</span>
          </button>

          {/* Quick Tab Shortcut based on role */}
          {user.role === 'PATIENT' && (
            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                activeTab === 'journey'
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isTamil ? 'என் சிகிச்சை பயணம்' : 'My Care Journey'}
            </button>
          )}

          {(user.role === 'DOCTOR' || user.role === 'FACILITY_ADMIN') && (
            <button
              type="button"
              onClick={() => setActiveTab('referrals')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                activeTab === 'referrals'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isTamil ? 'அவசர பரிந்துரை ஏற்பு' : 'Inbound Referrals'}
            </button>
          )}

          {user.role === 'HEALTH_WORKER' && (
            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                activeTab === 'triage'
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isTamil ? 'கள அவசர பரிசோதனை' : 'Field Digital Triage'}
            </button>
          )}

          {/* Sign Out Button */}
          <button
            type="button"
            id="btn-logout"
            onClick={logout}
            title={isTamil ? 'கணக்கிலிருந்து வெளியேறு' : 'Log out of CareGrid'}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
