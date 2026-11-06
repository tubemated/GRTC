import React, { useState, useEffect } from 'react';
import { Search, Globe2, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import type { Country, CountryDetail } from '../../types';

export default function CountriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadCountries('');
  }, []);

  const loadCountries = async (q: string) => {
    try {
      const results = await window.grtcAPI.countries.search(q);
      setCountries(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCountry = async (iso2: string) => {
    setLoading(true);
    try {
      const detail = await window.grtcAPI.countries.getById(iso2);
      setSelectedCountry(detail);
      setMessage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCountry = async () => {
    if (!selectedCountry) return;
    setApplying(true);
    setMessage(null);

    try {
      // 1. Set Home Location
      if (selectedCountry.geoId) {
        await window.grtcAPI.apply.setHomeLocation(selectedCountry.geoId);
      }

      // 2. Set Default Culture if available
      if (selectedCountry.defaultCultureId) {
        await window.grtcAPI.apply.setCulture(selectedCountry.defaultCultureId);
      }

      // 3. Set Primary Timezone if available
      if (selectedCountry.timeZones && selectedCountry.timeZones.length > 0) {
        await window.grtcAPI.apply.setTimeZone(selectedCountry.timeZones[0].windowsId);
      }

      setMessage({ text: `Successfully configured Windows for ${selectedCountry.name}!` });
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to apply settings',
        error: true,
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Countries & Regional Locales</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search local offline catalog of 240+ countries to auto-configure regional formats and timezones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & List */}
        <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[650px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadCountries(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {countries.map((c) => (
              <button
                key={c.iso2}
                onClick={() => handleSelectCountry(c.iso2)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between text-xs transition ${
                  selectedCountry?.iso2 === c.iso2
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {c.iso2}
                  </span>
                  <span className="truncate">{c.name}</span>
                </div>
                <ArrowRight size={14} className="opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Country Preview & Apply */}
        <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[650px]">
          {selectedCountry ? (
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedCountry.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-mono">
                    <span>ISO: {selectedCountry.iso2} / {selectedCountry.iso3}</span>
                    <span>•</span>
                    <span>Windows GeoID: {selectedCountry.geoId}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                  Offline Bundled
                </span>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    message.error
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Recommended Regional Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Default Regional Formats
                </h4>
                <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Culture Tag:</span>
                    <span className="font-mono font-semibold">{selectedCountry.defaultCultureId || 'Default'}</span>
                  </div>
                </div>
              </div>

              {/* Available Timezones */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Associated Time Zones ({selectedCountry.timeZones?.length ?? 0})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 max-h-48 overflow-y-auto">
                  {selectedCountry.timeZones?.map((tz) => (
                    <div key={tz.windowsId} className="p-3 text-xs flex justify-between items-center">
                      <span className="font-medium">{tz.windowsId}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{tz.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Globe2 size={40} className="stroke-1" />
              <p className="text-xs">Select a country from the left list to review its regional details</p>
            </div>
          )}

          {selectedCountry && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-amber-500">
                <ShieldAlert size={14} />
                <span>Modifying timezone triggers a standard Windows elevation prompt</span>
              </div>
              <button
                disabled={applying}
                onClick={handleApplyCountry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
              >
                {applying ? <span>Applying...</span> : <span>Apply All Recommended Settings</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
