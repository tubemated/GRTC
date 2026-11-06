import React, { useState } from 'react';
import { SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';

export default function RegionPage() {
  const { currentRegion } = useAppStore();
  const [cultureInput, setCultureInput] = useState(currentRegion?.cultureId || 'en-US');
  const [geoInput, setGeoInput] = useState(String(currentRegion?.geoId || 244));
  const [systemLocaleInput, setSystemLocaleInput] = useState(currentRegion?.cultureId || 'en-US');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApplyUserCulture = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.apply.setCulture(cultureInput.trim());
      if (res.success) {
        setStatusMsg({ text: 'Regional format updated! (Sign out or restart apps to see full effect)' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to update regional format', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error applying culture', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGeoId = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const geoNum = parseInt(geoInput, 10);
      const res = await window.grtcAPI.apply.setHomeLocation(geoNum);
      if (res.success) {
        setStatusMsg({ text: 'Home location GeoID updated!' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to update home location', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error applying GeoID', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySystemLocale = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.apply.setSystemLocale(systemLocaleInput.trim());
      if (res.success) {
        setStatusMsg({ text: 'System-wide locale applied. A computer restart is required to take effect.' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to set system locale', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Elevation or command error', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Regional Settings & System Locale</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage user culture formats, geographic home location, and system-wide non-Unicode locale.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
            statusMsg.error
              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {statusMsg.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* User Regional Format */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">User Regional Format (Culture)</h3>
            <p className="text-xs text-slate-400">Controls date, time, currency, and numerical formatting for current user.</p>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Standard User</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={cultureInput}
            onChange={(e) => setCultureInput(e.target.value)}
            placeholder="e.g. en-US, de-DE, ja-JP"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <button
            disabled={loading}
            onClick={handleApplyUserCulture}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            Apply Format
          </button>
        </div>
      </div>

      {/* Geographic Home Location */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Windows Home Location (GeoID)</h3>
            <p className="text-xs text-slate-400">Used by Windows weather, news, and location-aware offline tools.</p>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Standard User</span>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            value={geoInput}
            onChange={(e) => setGeoInput(e.target.value)}
            placeholder="e.g. 244 (USA), 242 (UK)"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <button
            disabled={loading}
            onClick={handleApplyGeoId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            Apply GeoID
          </button>
        </div>
      </div>

      {/* System-wide Locale (Admin) */}
      <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">System Locale for Non-Unicode Programs</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">System-wide setting for legacy non-Unicode applications. Requires elevation and reboot.</p>
          </div>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium">Requires Admin & Reboot</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={systemLocaleInput}
            onChange={(e) => setSystemLocaleInput(e.target.value)}
            placeholder="e.g. en-US"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
          />
          <button
            disabled={loading}
            onClick={handleApplySystemLocale}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            Apply System Locale
          </button>
        </div>
      </div>
    </div>
  );
}
