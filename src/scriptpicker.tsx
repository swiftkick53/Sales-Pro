
import React, { useState } from 'react';
import { ScriptConfig } from './types';

interface ScriptPickerProps {
  scripts: ScriptConfig[];
  activeScriptId: string;
  onSwitch: (scriptId: string) => void;
  onEdit: (scriptId: string) => void;
  onDuplicate: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export const ScriptPicker: React.FC<ScriptPickerProps> = ({
  scripts, activeScriptId, onSwitch, onEdit, onDuplicate, onDelete, onNew, onClose
}) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-[28px] w-full max-w-md p-6 space-y-4 mx-4 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Scripts</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-slate-400 text-xs font-bold">✕</button>
        </div>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {scripts.map(s => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
                s.id === activeScriptId
                  ? 'bg-hs-blue/10 border-hs-blue/20 dark:bg-hs-blue/5'
                  : 'border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
              }`}
            >
              <button
                onClick={() => { onSwitch(s.id); onClose(); }}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2">
                  {s.id === activeScriptId && <span className="text-hs-blue text-[10px] font-black">●</span>}
                  <span className="text-[12px] font-bold dark:text-white truncate">{s.name}</span>
                  {s.isBuiltIn && <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">Default</span>}
                </div>
                {s.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.description}</p>}
                <p className="text-[9px] text-slate-400 mt-0.5">{s.sections.length} section{s.sections.length !== 1 ? 's' : ''}</p>
              </button>

              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(s.id)}
                  className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/5 rounded-lg text-slate-500 hover:text-hs-blue hover:bg-hs-blue/10 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDuplicate(s.id)}
                  className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/5 rounded-lg text-slate-500 hover:text-hs-blue hover:bg-hs-blue/10 transition-all"
                >
                  Copy
                </button>
                {!s.isBuiltIn && (
                  <button
                    onClick={() => onDelete(s.id)}
                    className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    Del
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onNew}
            className="flex-1 py-3 bg-hs-blue/10 text-hs-blue border border-hs-blue/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-hs-blue/20 transition-all"
          >
            + New Script
          </button>
        </div>
      </div>
    </div>
  );
};
