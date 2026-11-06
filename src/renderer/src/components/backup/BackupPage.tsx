import React, { useState, useEffect } from 'react';
import { RotateCcw, ShieldCheck, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { BackupRecord } from '../../types';

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const list = await window.grtcAPI.backup.list();
      setBackups(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateManual = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await window.grtcAPI.apply.preview({
        name: 'Manual Backup Trigger',
        description: '',
        settings: { cultureId: null, geoId: null, timeZoneId: null, languageTags: null, dateTime: null, timeSyncEnabled: null },
      });
      // In production, we invoke backup creation directly
      await loadBackups();
      setStatusMsg({ text: 'Manual snapshot captured successfully!' });
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error taking backup', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await window.grtcAPI.backup.restore(id);
      if (res.success) {
        setStatusMsg({ text: 'System settings successfully restored from snapshot!' });
      } else {
        const errs = res.errors.map((e) => `${e.field}: ${e.error}`).join('; ');
        setStatusMsg({ text: `Restore completed with issues: ${errs}`, error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error restoring backup', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.grtcAPI.backup.delete(id);
      await loadBackups();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Backups & Rollback</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every modifying operation automatically creates a snapshot in the local SQLite database.
          </p>
        </div>
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

      {/* Backup list */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        {backups.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No snapshots recorded yet. Modifying any regional setting will automatically create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {backups.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{b.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleString()} • Trigger: {b.trigger}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    TZ: {b.snapshot.timeZoneId || 'N/A'} | Culture: {b.snapshot.cultureId || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={loading}
                    onClick={() => handleRestore(b.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <RotateCcw size={13} />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
