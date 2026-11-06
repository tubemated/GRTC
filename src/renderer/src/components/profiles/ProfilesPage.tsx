import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Plus, Trash2, Copy, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Profile } from '../../types';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const list = await window.grtcAPI.profiles.list();
      setProfiles(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFromCurrent = async () => {
    if (!newProfileName.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const [region, tz, dt, langs] = await Promise.all([
        window.grtcAPI.system.getCurrentRegion().catch(() => null),
        window.grtcAPI.system.getCurrentTimeZone().catch(() => null),
        window.grtcAPI.system.getCurrentDateTime().catch(() => null),
        window.grtcAPI.system.getLanguageList().catch(() => []),
      ]);

      await window.grtcAPI.profiles.save({
        name: newProfileName.trim(),
        description: `Captured from active settings on ${new Date().toLocaleDateString()}`,
        settings: {
          cultureId: region?.cultureId ?? null,
          geoId: region?.geoId ?? null,
          timeZoneId: tz?.windowsId ?? null,
          languageTags: langs.map((l) => l.languageTag),
          dateTime: null,
          timeSyncEnabled: dt?.timeSyncEnabled ?? null,
        },
      });

      setNewProfileName('');
      await loadProfiles();
      setStatusMsg({ text: 'New country profile created successfully!' });
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error creating profile', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string, name: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.apply.applyProfile(id);
      if (res.success) {
        setStatusMsg({ text: `Applied profile "${name}" successfully!` });
      } else {
        const errs = res.errors.map((e) => `${e.field}: ${e.error}`).join('; ');
        setStatusMsg({ text: `Failed to apply all settings: ${errs}`, error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error applying profile', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.grtcAPI.profiles.delete(id);
      await loadProfiles();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async (id: string) => {
    try {
      await window.grtcAPI.profiles.exportToFile(id);
      setStatusMsg({ text: 'Profile exported to local JSON file' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = async () => {
    try {
      const p = await window.grtcAPI.profiles.importFromFile();
      if (p) {
        await loadProfiles();
        setStatusMsg({ text: `Imported profile "${p.name}"` });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Saved Country Profiles</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture, duplicate, export, and switch complete Windows regional configurations.
          </p>
        </div>
        <button
          onClick={handleImport}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition"
        >
          <Upload size={14} />
          <span>Import Profile</span>
        </button>
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

      {/* Quick capture form */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          placeholder="New Profile Name (e.g. 'United States Developer Workstation')"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          disabled={loading || !newProfileName.trim()}
          onClick={handleCreateFromCurrent}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
        >
          <Plus size={14} />
          <span>Capture Current As Profile</span>
        </button>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm">{p.name}</h3>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleExport(p.id)}
                    title="Export profile JSON"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    title="Delete profile"
                    className="p-1 rounded text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{p.description || 'No description'}</p>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-400">
                <div>Culture: {p.settings.cultureId || '--'}</div>
                <div>TZ: {p.settings.timeZoneId || '--'}</div>
                <div>GeoID: {p.settings.geoId || '--'}</div>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={() => handleApply(p.id, p.name)}
              className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
            >
              Apply Profile to Windows
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
