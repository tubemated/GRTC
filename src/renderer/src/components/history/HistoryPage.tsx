import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import type { HistoryEntry } from '../../types';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const list = await window.grtcAPI.history.list();
      setEntries(list);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit History Log</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete, local-only record of all regional, culture, timezone, and clock modification operations.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No history recorded yet. All system operations will be chronologically tracked here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {item.success ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{item.summary}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(item.timestamp).toLocaleString()} • Category: {item.category}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.success
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  }`}
                >
                  {item.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
