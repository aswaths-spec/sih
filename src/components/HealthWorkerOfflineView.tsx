import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  WifiOff,
  DownloadCloud,
  RefreshCw,
  Database,
  CheckCircle2,
  Trash2,
  Layers,
  Users,
  Building2,
  Pill,
  Send
} from 'lucide-react';

export const HealthWorkerOfflineView: React.FC = () => {
  const {
    user,
    t,
    isOffline,
    setIsOffline,
    pendingOfflineActionsCount,
    setPendingOfflineActionsCount
  } = useAuth();

  const [carePack, setCarePack] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('caregrid_last_sync') || null
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Load existing care pack from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('caregrid_smart_carepack');
    if (cached) {
      try {
        setCarePack(JSON.parse(cached));
      } catch {}
    }
  }, []);

  const handleDownloadCarePack = async () => {
    setDownloading(true);
    setSyncMessage(null);
    try {
      const data = await api.getSmartCarePack();
      localStorage.setItem('caregrid_smart_carepack', JSON.stringify(data));
      const now = new Date().toLocaleString();
      localStorage.setItem('caregrid_last_sync', now);
      setCarePack(data);
      setLastSyncTime(now);
      setSyncMessage('Smart Care Pack successfully downloaded and cached locally.');
    } catch (err: any) {
      alert('Failed to download Care Pack: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const queuedActions = JSON.parse(
        localStorage.getItem('caregrid_offline_queue') || '[]'
      );

      if (queuedActions.length === 0) {
        setSyncMessage('No pending offline changes to synchronize.');
        setSyncing(false);
        return;
      }

      const res = await api.syncOfflineData(queuedActions);
      localStorage.removeItem('caregrid_offline_queue');
      setPendingOfflineActionsCount(0);
      const now = new Date().toLocaleString();
      localStorage.setItem('caregrid_last_sync', now);
      setLastSyncTime(now);
      setSyncMessage(
        `Synchronization complete: ${res.syncedCount} of ${res.totalCount} offline actions merged successfully.`
      );
    } catch (err: any) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('Clear offline care pack cache from this browser?')) {
      localStorage.removeItem('caregrid_smart_carepack');
      localStorage.removeItem('caregrid_offline_queue');
      setCarePack(null);
      setPendingOfflineActionsCount(0);
      setSyncMessage('Offline cache cleared.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.offline.title}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">{t.offline.subtitle}</p>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <h3 className="text-sm font-bold text-slate-900">
                Network Status: {isOffline ? 'Offline Field Mode' : 'Connected to CareGrid Central'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Last Sync: {lastSyncTime || 'Never synchronized on this device'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-download-care-pack"
              onClick={handleDownloadCarePack}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-xs"
            >
              <DownloadCloud className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Downloading...' : t.offline.downloadPack}</span>
            </button>

            <button
              type="button"
              id="btn-sync-offline-now"
              onClick={handleSyncNow}
              disabled={syncing || isOffline}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : t.offline.syncNow}</span>
            </button>

            <button
              type="button"
              onClick={handleClearCache}
              title="Clear offline storage cache"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Pending Queue Tracker */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-800 block">
              Pending Offline Changes Queue:
            </span>
            <span className="text-slate-500 text-2xs">
              Actions recorded without network that will sync on reconnect
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            {pendingOfflineActionsCount} Pending
          </span>
        </div>
      </div>

      {/* Cached Smart Care Pack Content Breakdown */}
      {carePack ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Active Smart Care Pack (Cached on Device)
            </h3>
            <span className="text-2xs font-semibold text-slate-500">
              Generated: {new Date(carePack.generatedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
              <Users className="w-5 h-5 text-teal-600 mx-auto" />
              <div className="text-lg font-extrabold text-slate-900">
                {carePack.assignedPatients?.length || 0}
              </div>
              <div className="text-2xs font-semibold text-slate-500">Assigned Patients</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
              <Send className="w-5 h-5 text-blue-600 mx-auto" />
              <div className="text-lg font-extrabold text-slate-900">
                {carePack.pendingReferrals?.length || 0}
              </div>
              <div className="text-2xs font-semibold text-slate-500">Pending Referrals</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
              <Building2 className="w-5 h-5 text-indigo-600 mx-auto" />
              <div className="text-lg font-extrabold text-slate-900">
                {carePack.facilitiesDirectory?.length || 0}
              </div>
              <div className="text-2xs font-semibold text-slate-500">Facility Directory</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
              <Pill className="w-5 h-5 text-emerald-600 mx-auto" />
              <div className="text-lg font-extrabold text-slate-900">
                {carePack.essentialMedicines?.length || 0}
              </div>
              <div className="text-2xs font-semibold text-slate-500">Essential Medicines</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <DownloadCloud className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Care Pack Downloaded</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>Download Smart Care Pack</strong> above to cache patient records, referral tracking, and offline clinical protocols for seamless field operations in low-connectivity areas.
          </p>
        </div>
      )}
    </div>
  );
};
