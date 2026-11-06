import React, { useState, useEffect } from 'react';
import { Compass, Search, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';
import type { TimeZone } from '../../types';

export default function TimeZonePage() {
  const { currentTimeZone } = useAppStore();
  const [search, setSearch] = useState('');
  const [timezones, setTimezones] = useState<TimeZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    // Load timezone list via countries/all or default seed
    loadTimezones();
  }, []);

  const loadTimezones = async () => {
    try {
      // In production, we query from database or default list
      const usTzs = await window.grtcAPI.countries.getTimeZones('US');
      setTimezones(usTzs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetTz = async (windowsId: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.apply.setTimeZone(windowsId);
      if (res.success) {
        setStatusMsg({ text: `Windows time zone changed to ${windowsId}` });
      } else {
        setStatusMsg({ text: res.error || 'Failed to update time zone', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error setting timezone', error: true });
    } finally {
      setLoading(false);
    }
  };

  const commonTimezones = [
    { id: 'Pacific Standard Time', label: 'Pacific Time (US & Canada)' },
    { id: 'Mountain Standard Time', label: 'Mountain Time (US & Canada)' },
    { id: 'Central Standard Time', label: 'Central Time (US & Canada)' },
    { id: 'Eastern Standard Time', label: 'Eastern Time (US & Canada)' },
    { id: 'GMT Standard Time', label: 'Greenwich Mean Time (London, Dublin)' },
    { id: 'W. Europe Standard Time', label: 'Amsterdam, Berlin, Bern, Rome, Stockholm' },
    { id: 'Romance Standard Time', label: 'Brussels, Copenhagen, Madrid, Paris' },
    { id: 'Tokyo Standard Time', label: 'Tokyo, Osaka, Sapporo' },
    { id: 'China Standard Time', label: 'Beijing, Chongqing, Hong Kong' },
    { id: 'India Standard Time', label: 'Chennai, Kolkata, Mumbai, New Delhi' },
    { id: 'AUS Eastern Standard Time', label: 'Canberra, Melbourne, Sydney' },
    { id: 'UTC', label: 'Coordinated Universal Time' },
  ];

  const filtered = commonTimezones.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Windows Time Zone Controller</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Switch active system timezone. Fully calculates daylight saving time (DST) offsets natively.
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

      {/* Current Active */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400">Current Active Timezone</span>
          <div className="text-lg font-bold mt-1">{currentTimeZone?.windowsId || 'Detecting...'}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {currentTimeZone?.displayName || ''} • {currentTimeZone?.isDaylightSaving ? 'DST Active' : 'Standard Time'}
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-amber-500">
          <ShieldAlert size={15} />
          <span>Requires Admin</span>
        </div>
      </div>

      {/* Timezone Selection List */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search timezone by name or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {filtered.map((tz) => (
            <div
              key={tz.id}
              className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition"
            >
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{tz.id}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{tz.label}</div>
              </div>
              <button
                disabled={loading || currentTimeZone?.windowsId === tz.id}
                onClick={() => handleSetTz(tz.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentTimeZone?.windowsId === tz.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {currentTimeZone?.windowsId === tz.id ? 'Active' : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
