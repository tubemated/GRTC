import React, { useState, useEffect } from 'react';
import { Languages, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LanguageInfo } from '../../types';

export default function LanguagePage() {
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const list = await window.grtcAPI.system.getLanguageList();
      setLanguages(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (languages.some((l) => l.languageTag.toLowerCase() === tag.toLowerCase())) {
      setStatusMsg({ text: 'Language tag already present in list', error: true });
      return;
    }
    setLanguages([...languages, { languageTag: tag, displayName: tag, isAdmin: false, inputMethodTips: [] }]);
    setNewTag('');
  };

  const handleRemove = (tag: string) => {
    if (languages.length <= 1) {
      setStatusMsg({ text: 'Windows requires at least one preferred language', error: true });
      return;
    }
    setLanguages(languages.filter((l) => l.languageTag !== tag));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= languages.length) return;
    const updated = [...languages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setLanguages(updated);
  };

  const handleApply = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const tags = languages.map((l) => l.languageTag);
      const res = await window.grtcAPI.apply.setLanguageList(tags);
      if (res.success) {
        setStatusMsg({ text: 'Windows user language list updated successfully!' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to update language list', error: true });
      }
    } catch (e: unknown) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Error applying languages', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preferred Language & Keyboards</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage Windows user preferred language hierarchy (`Set-WinUserLanguageList`) and input methods.
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

      {/* Language List Management */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add BCP 47 language tag (e.g. en-US, de-DE, ja-JP)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
          {languages.map((l, index) => (
            <div key={l.languageTag} className="p-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center space-x-3">
                <span className="w-5 text-center text-slate-400 font-mono text-[10px]">{index + 1}</span>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{l.displayName || l.languageTag}</div>
                  <div className="text-[11px] font-mono text-slate-400">{l.languageTag}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={index === languages.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => handleRemove(l.languageTag)}
                  className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            disabled={loading}
            onClick={handleApply}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Save Language Hierarchy
          </button>
        </div>
      </div>
    </div>
  );
}
