import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole, Facility, AuditLog } from '../types';
import {
  Shield,
  Users,
  Building2,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  PlusCircle,
  BarChart3,
  Lock,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Stethoscope,
  Heart
} from 'lucide-react';

interface AdminDashboardViewProps {
  onOpenAddHospital?: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  patientId?: string;
  workerId?: string;
  doctorId?: string;
  facilityId?: string;
  createdAt?: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onOpenAddHospital }) => {
  const { user, language } = useAuth();
  const isTamil = language === 'ta';

  const [activeTab, setActiveTab] = useState<'users' | 'facilities' | 'audit' | 'analytics'>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Facilities state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [editOccupiedBeds, setEditOccupiedBeds] = useState(0);
  const [editOccupiedIcu, setEditOccupiedIcu] = useState(0);
  const [editWaitTime, setEditWaitTime] = useState(0);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Analytics state
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, facilitiesData, auditData, statsData] = await Promise.all([
        api.getAdminUsers().catch(() => []),
        api.getFacilities().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getDashboardStats().catch(() => null)
      ]);
      setUsers(usersData);
      setFacilities(facilitiesData);
      setAuditLogs(auditData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateAdminUserRole(userId, newRole);
      setSuccessMsg(isTamil ? 'பயனர் பங்கு வெற்றிகரமாக மாற்றப்பட்டது' : `User role updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    try {
      await api.updateAdminUserStatus(userId, nextActive);
      setSuccessMsg(
        isTamil
          ? `பயனர் கணக்கு ${nextActive ? 'செயல்படுத்தப்பட்டது' : 'முடக்கப்பட்டது'}`
          : `Account ${nextActive ? 'activated' : 'deactivated'} successfully`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, active: nextActive } : u)));
    } catch (err: any) {
      setError(err.message || 'Failed to update account status');
    }
  };

  const handleSaveFacilityCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;
    try {
      await api.updateFacilityCapacity(editingFacility.id, {
        occupiedBeds: Number(editOccupiedBeds),
        occupiedIcuBeds: Number(editOccupiedIcu),
        averageWaitTimeMin: Number(editWaitTime)
      });
      setSuccessMsg(isTamil ? 'மருத்துவமனை திறன் புதுப்பிக்கப்பட்டது' : 'Hospital capacity updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
      setFacilities(prev =>
        prev.map(f =>
          f.id === editingFacility.id
            ? {
                ...f,
                occupiedBeds: Number(editOccupiedBeds),
                occupiedIcuBeds: Number(editOccupiedIcu),
                averageWaitTimeMin: Number(editWaitTime)
              }
            : f
        )
      );
      setEditingFacility(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update capacity');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch));
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>{isTamil ? 'கண்காணிப்பு கட்டுப்பாட்டு மையம்' : 'Health Operations Command & RBAC'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {isTamil ? 'தமிழ்நாடு சுகாதார அமைப்பு நிர்வாக டாஷ்போர்டு' : 'Tamil Nadu System Admin Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl">
              {isTamil
                ? 'முழு செயல்பாட்டு மேலாண்மை: பயனர் பங்கு கட்டுப்பாடு (RBAC), மருத்துவமனை படுக்கை திறன், அமைப்பு தணிக்கை பதிவுகள் மற்றும் பகுப்பாய்வு.'
                : 'Full operational oversight: Role-Based User Management (RBAC), hospital bed/ICU capacities, immutable audit logs, and state healthcare analytics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-admin-refresh"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isTamil ? 'புதுப்பி' : 'Refresh Data'}</span>
            </button>

            {onOpenAddHospital && (
              <button
                type="button"
                id="btn-admin-add-hospital"
                onClick={onOpenAddHospital}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-md cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isTamil ? 'புதிய மருத்துவமனை சேர்' : 'Add New Hospital'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold text-rose-600">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-600">
            ✕
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'users', label: isTamil ? 'பயனர் பங்கு மேலாண்மை (RBAC)' : 'User RBAC Management', icon: Users },
          { id: 'facilities', label: isTamil ? 'மருத்துவமனை படுக்கை திறன்' : 'Hospital & Bed Capacity', icon: Building2 },
          { id: 'analytics', label: isTamil ? 'மாநில சுகாதார பகுப்பாய்வு' : 'State Health Analytics', icon: BarChart3 },
          { id: 'audit', label: isTamil ? 'அமைப்பு தணிக்கை பதிவுகள்' : 'System Audit Logs', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`tab-admin-${t.id}`}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-purple-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-slate-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS RBAC MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>{isTamil ? 'பயனர் கணக்குகள் & பாத்திரங்கள் (RBAC)' : 'Role-Based User Accounts'}</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                {isTamil
                  ? 'பயனர் பாத்திரங்களை மாற்றி, கணக்குகளை செயல்படுத்தவும் அல்லது முடக்கவும்.'
                  : 'Assign roles (PATIENT, ASHA_WORKER, HOSPITAL_DOCTOR, ADMIN) and control account status.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isTamil ? 'பெயர் அல்லது மின்னஞ்சல் தேடுக...' : 'Search by name or email...'}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none w-52 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
              >
                <option value="ALL">{isTamil ? 'அனைத்து பாத்திரங்கள்' : 'All Roles'}</option>
                <option value="PATIENT">PATIENT</option>
                <option value="ASHA_WORKER">ASHA_WORKER</option>
                <option value="HOSPITAL_DOCTOR">HOSPITAL_DOCTOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">{isTamil ? 'பயனர் விவரம்' : 'User'}</th>
                  <th className="py-3 px-4">{isTamil ? 'தற்போதைய பங்கு' : 'Assigned Role'}</th>
                  <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                  <th className="py-3 px-4">{isTamil ? 'இணைப்பு ID' : 'Associated ID'}</th>
                  <th className="py-3 px-4 text-right">{isTamil ? 'செயல்கள்' : 'Admin Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-2xs text-slate-500">{u.email}</div>
                      {u.phone && <div className="text-3xs text-slate-400">{u.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-purple-500 transition cursor-pointer ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : u.role === 'HOSPITAL_DOCTOR'
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                            : u.role === 'ASHA_WORKER'
                            ? 'bg-teal-50 text-teal-900 border-teal-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <option value="PATIENT">PATIENT</option>
                        <option value="ASHA_WORKER">ASHA_WORKER</option>
                        <option value="HOSPITAL_DOCTOR">HOSPITAL_DOCTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isTamil ? 'செயலில் உள்ளது' : 'ACTIVE'}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{isTamil ? 'முடக்கப்பட்டது' : 'DEACTIVATED'}</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-2xs text-slate-600">
                      {u.patientId && <div>Patient: {u.patientId}</div>}
                      {u.workerId && <div>Worker: {u.workerId}</div>}
                      {u.doctorId && <div>Doctor: {u.doctorId}</div>}
                      {u.facilityId && <div>Facility: {u.facilityId}</div>}
                      {!u.patientId && !u.workerId && !u.doctorId && !u.facilityId && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(u.id, u.active)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                          u.active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {u.active
                          ? isTamil
                            ? 'முடக்கு'
                            : 'Deactivate'
                          : isTamil
                          ? 'செயல்படுத்து'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITAL & BED CAPACITY MANAGEMENT */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(f => {
              const bedOccupancy = Math.round((f.occupiedBeds / f.totalBeds) * 100);
              const icuOccupancy = f.icuBeds > 0 ? Math.round((f.occupiedIcuBeds / f.icuBeds) * 100) : 0;
              return (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {f.tier}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{f.name}</h3>
                      </div>
                      <span className="text-2xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {f.district}
                      </span>
                    </div>

                    {/* Bed Occupancy Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-2xs text-slate-600 font-medium">
                        <span>{isTamil ? 'பொது படுக்கைகள்' : 'General Beds'}</span>
                        <span className="font-bold text-slate-900">
                          {f.occupiedBeds} / {f.totalBeds} ({bedOccupancy}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            bedOccupancy >= 90 ? 'bg-rose-500' : bedOccupancy >= 70 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, bedOccupancy)}%` }}
                        />
                      </div>
                    </div>

                    {/* ICU Occupancy */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-2xs text-slate-600 font-medium">
                        <span>{isTamil ? 'ICU படுக்கைகள்' : 'ICU Beds'}</span>
                        <span className="font-bold text-slate-900">
                          {f.occupiedIcuBeds} / {f.icuBeds} ({icuOccupancy}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            icuOccupancy >= 90 ? 'bg-rose-500' : icuOccupancy >= 70 ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, icuOccupancy)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Wait: {f.averageWaitTimeMin || 15}m
                      </span>
                      <span>Queue: {f.currentQueueLength || 0} pts</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFacility(f);
                      setEditOccupiedBeds(f.occupiedBeds);
                      setEditOccupiedIcu(f.occupiedIcuBeds);
                      setEditWaitTime(f.averageWaitTimeMin || 15);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold transition"
                  >
                    {isTamil ? 'படுக்கை திறன் புதுப்பி' : 'Update Bed Capacity'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Edit Capacity Modal */}
          {editingFacility && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{editingFacility.name}</h3>
                    <p className="text-2xs text-slate-500">{isTamil ? 'நிகழ்நேர படுக்கை திறன் திருத்தம்' : 'Real-time Bed & ICU Capacity Editing'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingFacility(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveFacilityCapacity} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isTamil ? 'நிரப்பப்பட்ட பொது படுக்கைகள் (Occupied Beds)' : 'Occupied General Beds'} (Max: {editingFacility.totalBeds})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={editingFacility.totalBeds}
                      value={editOccupiedBeds}
                      onChange={e => setEditOccupiedBeds(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isTamil ? 'நிரப்பப்பட்ட ICU படுக்கைகள் (Occupied ICU Beds)' : 'Occupied ICU Beds'} (Max: {editingFacility.icuBeds})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={editingFacility.icuBeds}
                      value={editOccupiedIcu}
                      onChange={e => setEditOccupiedIcu(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isTamil ? 'சராசரி காத்திருப்பு நேரம் (Average Wait Minutes)' : 'Average Triage Wait Time (Minutes)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={editWaitTime}
                      onChange={e => setEditWaitTime(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingFacility(null)}
                      className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                    >
                      {isTamil ? 'ரத்து' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                    >
                      {isTamil ? 'சேமி' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STATE HEALTH ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-2xs text-slate-500 font-semibold uppercase">{isTamil ? 'பரிந்துரை ஏற்பு விகிதம்' : 'Handshake Rate'}</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.overview?.referralHandshakeRate || 92}%</div>
              <p className="text-3xs text-slate-400 mt-0.5">{isTamil ? 'டிஜிட்டல் உறுதிப்படுத்தல்' : 'Accepted by receiving hospital'}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-2xs text-slate-500 font-semibold uppercase">{isTamil ? 'சிகிச்சை நிறைவு விகிதம்' : 'Care Closure Rate'}</span>
              <div className="text-2xl font-black text-teal-600 mt-1">{stats.overview?.referralCompletionRate || 85}%</div>
              <p className="text-3xs text-slate-400 mt-0.5">{isTamil ? 'முழுமையான சிகிச்சை முடிவு' : 'Followed up post-discharge'}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-2xs text-slate-500 font-semibold uppercase">{isTamil ? 'அவசர பரிந்துரைகள்' : 'Emergency Triages'}</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{stats.overview?.emergencyTriages || 8}</div>
              <p className="text-3xs text-slate-400 mt-0.5">{isTamil ? 'சிவப்பு முன்னுரிமை' : 'Immediate life-support'}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-2xs text-slate-500 font-semibold uppercase">{isTamil ? 'திறந்த இடைவெளிகள்' : 'Open Care Gaps'}</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats.overview?.openCareGaps || 12}</div>
              <p className="text-3xs text-slate-400 mt-0.5">{isTamil ? 'தடுப்பூசி / ANC பின்தொடர்தல்' : 'Pending community follow-ups'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              {isTamil ? 'மருத்துவமனை படுக்கை பயன்பாட்டு விகிதம் (Bed Utilization Ratio)' : 'Hospital Bed & ICU Utilization Ratios'}
            </h3>
            <div className="space-y-4">
              {stats.facilityUtilization?.map((item: any) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{item.name}</span>
                    <span className="font-mono text-purple-900">{item.occupancyRatio}% occupied</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.occupancyRatio >= 90 ? 'bg-rose-500' : item.occupancyRatio >= 75 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${item.occupancyRatio}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>{isTamil ? 'அமைப்பு தணிக்கை சுவடு (Immutable Audit Trail)' : 'System Audit Trail'}</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                {isTamil
                  ? 'உள்நுழைவுகள், ட்ரையஜ் மதிப்பீடுகள், பரிந்துரைகள் மற்றும் அவசர படுக்கை பூட்டுகளின் முழுமையான பதிவு.'
                  : 'Immutable record of user logins, triage assessments, referral actions, and admin overrides.'}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {auditLogs.length} {isTamil ? 'பதிவுகள்' : 'Events'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">{isTamil ? 'நேரம்' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{isTamil ? 'செயல்' : 'Action'}</th>
                  <th className="py-3 px-4">{isTamil ? 'பயனர் & பங்கு' : 'User & Role'}</th>
                  <th className="py-3 px-4">{isTamil ? 'வளம்' : 'Resource'}</th>
                  <th className="py-3 px-4">{isTamil ? 'விவரம்' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-900">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <span className="font-semibold">{log.userName || log.userId}</span>
                      <span className="text-3xs text-slate-500 block font-normal">({log.userRole || 'USER'})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.resource}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
