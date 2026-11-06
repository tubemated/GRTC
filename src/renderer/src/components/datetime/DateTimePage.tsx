import React, { useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';

export default function DateTimePage() {
  const { currentDateTime } = useAppStore();
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApplyDateTime = async () => {
    if (!manualDate || !manualTime) {
      setStatusMsg({ text: 'Please select both date and time', error: true });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const isoStr = new Date(`${manualDate}T${manualTime}`).toISOString();
      const res = await window.grtcAPI.apply.setDateTime({ iso8601: isoStr });
      if (res.success) {
        setStatusMsg({ text: 'System date and time updated successfully!' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to set system time', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error setting time', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (enable: boolean) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.apply.toggleTimeSync(enable);
      if (res.success) {
        setStatusMsg({ text: `Automatic time synchronization ${enable ? 'enabled' : 'disabled'}` });
      } else {
        setStatusMsg({ text: res.error || 'Failed to toggle time sync', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error changing time sync', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Windows Date & Time Controller</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust the physical Windows system clock or toggle automatic W32Time NTP synchronization.
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

      {/* Time Sync Toggle */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Automatic Network Time Synchronization</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Windows Time Service (w32time). Disable this before attempting to manually test custom dates.
          </p>
        </div>
        <button
          disabled={loading}
          onClick={() => handleToggleSync(!currentDateTime?.timeSyncEnabled)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            currentDateTime?.timeSyncEnabled
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {currentDateTime?.timeSyncEnabled ? 'Disable Auto-Sync' : 'Enable Auto-Sync'}
        </button>
      </div>

      {/* Manual Date & Time Adjustment */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Manual System Clock Override</h3>
            <p className="text-xs text-slate-400">Directly set the hardware and system clock.</p>
          </div>
          <div className="flex items-center space-x-1 text-xs text-amber-500">
            <ShieldAlert size={14} />
            <span>Requires Admin Elevation</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Target Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Target Time</label>
            <input
              type="time"
              step="1"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            disabled={loading}
            onClick={handleApplyDateTime}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Apply Manual Date & Time
          </button>
        </div>
      </div>
    </div>
  );
}
