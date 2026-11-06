import React from 'react';
import {
  Globe2,
  Clock,
  Compass,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../../stores/app.store';

export default function DashboardPage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { currentRegion, currentTimeZone, currentDateTime, isAdmin } = useAppStore();

  const formattedTime = currentDateTime
    ? new Date(currentDateTime.iso8601).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const formattedDate = currentDateTime
    ? new Date(currentDateTime.iso8601).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Loading date...';

  const offsetHours = currentTimeZone
    ? (currentTimeZone.utcOffsetMinutes / 60).toFixed(1).replace('.0', '')
    : '0';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Status Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time local Windows regional settings and clock telemetry.
        </p>
      </div>

      {/* Hero Live Clock Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Active Windows Clock</span>
          <div className="text-5xl font-extrabold tracking-tight mt-1 font-mono">{formattedTime}</div>
          <div className="text-blue-100 mt-2 text-sm font-medium">{formattedDate}</div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${currentDateTime?.timeSyncEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>NTP Time Sync: {currentDateTime?.timeSyncEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <button
            onClick={() => onNavigate('datetime')}
            className="text-xs bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1"
          >
            <span>Adjust Clock</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Country / Region */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Home Location</span>
            <Globe2 size={18} className="text-blue-500" />
          </div>
          <div className="my-3">
            <div className="text-lg font-bold truncate">
              {currentRegion?.geoName || 'Detecting...'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              GeoID: {currentRegion?.geoId ?? '--'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('countries')}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
          >
            <span>Change Country</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Time Zone */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Time Zone</span>
            <Compass size={18} className="text-indigo-500" />
          </div>
          <div className="my-3">
            <div className="text-lg font-bold truncate" title={currentTimeZone?.windowsId}>
              {currentTimeZone?.windowsId || 'Detecting...'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              UTC {Number(offsetHours) >= 0 ? `+${offsetHours}` : offsetHours}:00 {currentTimeZone?.isDaylightSaving ? '(DST Active)' : ''}
            </div>
          </div>
          <button
            onClick={() => onNavigate('timezone')}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
          >
            <span>Change Time Zone</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Regional Format */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Regional Culture</span>
            <SlidersHorizontal size={18} className="text-violet-500" />
          </div>
          <div className="my-3">
            <div className="text-lg font-bold truncate">
              {currentRegion?.cultureId || 'Detecting...'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {currentRegion?.cultureName || '--'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('region')}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
          >
            <span>Modify Formats</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Administrator Elevation */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Process Privilege</span>
            {isAdmin ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-amber-500" />}
          </div>
          <div className="my-3">
            <div className="text-lg font-bold">
              {isAdmin ? 'Elevated (Admin)' : 'Standard User'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? 'Full system control' : 'UAC prompt per elevation'}
            </div>
          </div>
          <span className="text-xs text-slate-400">Zero background elevation</span>
        </div>
      </div>
    </div>
  );
}
