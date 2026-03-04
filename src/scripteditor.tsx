
import React, { useState } from 'react';
import { ScriptConfig, SectionData, ScriptBlock, Objection } from './types';
import { generateSectionId } from './scriptStorage';

interface ScriptEditorProps {
  script: ScriptConfig;
  onSave: (script: ScriptConfig) => void;
  onCancel: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script: initial, onSave, onCancel }) => {
  const [script, setScript] = useState<ScriptConfig>(JSON.parse(JSON.stringify(initial)));
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);

  const update = (partial: Partial<ScriptConfig>) => setScript(prev => ({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
  const updateSection = (idx: number, partial: Partial<SectionData>) => {
    const sections = [...script.sections];
    sections[idx] = { ...sections[idx], ...partial };
    update({ sections });
  };

  const addSection = () => {
    update({
      sections: [...script.sections, {
        id: generateSectionId(),
        title: `Section ${script.sections.length + 1}`,
        subtitle: '',
        moveOn: '',
        blocks: [{ label: 'Block 1', lines: [{ text: '' }] }],
        objections: [],
        followUps: []
      }]
    });
    setEditingSectionIdx(script.sections.length);
  };

  const removeSection = (idx: number) => {
    if (!confirm(`Delete section "${script.sections[idx].title}"?`)) return;
    const sections = script.sections.filter((_, i) => i !== idx);
    update({ sections });
    if (editingSectionIdx === idx) setEditingSectionIdx(null);
    else if (editingSectionIdx !== null && editingSectionIdx > idx) setEditingSectionIdx(editingSectionIdx - 1);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= script.sections.length) return;
    const sections = [...script.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    update({ sections });
    if (editingSectionIdx === idx) setEditingSectionIdx(newIdx);
    else if (editingSectionIdx === newIdx) setEditingSectionIdx(idx);
  };

  const handleSave = () => {
    if (script.sections.length === 0) {
      alert('Script must have at least one section.');
      return;
    }
    for (const s of script.sections) {
      if (!s.title.trim()) {
        alert('All sections must have a title.');
        return;
      }
    }
    onSave(script);
  };

  // Quick Tags editor
  const [newTag, setNewTag] = useState('');
  const addTag = () => {
    if (!newTag.trim()) return;
    update({ quickTags: [...script.quickTags, newTag.trim()] });
    setNewTag('');
  };
  const removeTag = (idx: number) => {
    update({ quickTags: script.quickTags.filter((_, i) => i !== idx) });
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-slate-50 dark:bg-[#050505] overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 bg-white dark:bg-black/40 backdrop-blur-xl shrink-0">
        <button onClick={onCancel} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors">
          Cancel
        </button>
        <h2 className="text-xs font-black dark:text-white uppercase tracking-wider">Script Editor</h2>
        <button onClick={handleSave} className="px-6 py-2 bg-hs-blue text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          Save & Close
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script overview & section list */}
        <div className="w-[380px] border-r border-black/5 dark:border-white/5 flex flex-col overflow-hidden bg-white dark:bg-black/20">
          <div className="p-5 space-y-4 border-b border-black/5 dark:border-white/5 shrink-0">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Script Name</label>
              <input
                type="text"
                value={script.name}
                onChange={e => update({ name: e.target.value })}
                className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm font-bold dark:text-white outline-none focus:border-hs-blue transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description (optional)</label>
              <input
                type="text"
                value={script.description || ''}
                onChange={e => update({ description: e.target.value })}
                className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs dark:text-slate-300 outline-none focus:border-hs-blue transition-colors"
                placeholder="e.g. For renovation contractors"
              />
            </div>
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Sections ({script.sections.length})</h3>
            {script.sections.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  editingSectionIdx === idx
                    ? 'bg-hs-blue/10 border-hs-blue/20'
                    : 'border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
                onClick={() => setEditingSectionIdx(idx)}
              >
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }} className="text-[8px] text-slate-400 hover:text-hs-blue px-1 leading-none" disabled={idx === 0}>▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }} className="text-[8px] text-slate-400 hover:text-hs-blue px-1 leading-none" disabled={idx === script.sections.length - 1}>▼</button>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold dark:text-white truncate block">
                    {String(idx + 1).padStart(2, '0')}. {s.title || '(untitled)'}
                  </span>
                  <span className="text-[9px] text-slate-400">{s.blocks.length} block{s.blocks.length !== 1 ? 's' : ''} · {s.objections.length} objection{s.objections.length !== 1 ? 's' : ''}</span>
                </div>

                {s.hasInputCapture && <span className="text-[7px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">Input</span>}

                <button
                  onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[9px] text-slate-400 hover:text-red-500 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addSection} className="w-full py-3 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-hs-blue hover:border-hs-blue/30 transition-all mt-2">
              + Add Section
            </button>
          </div>

          {/* Quick Tags */}
          <div className="p-4 border-t border-black/5 dark:border-white/5 shrink-0">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Quick Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {script.quickTags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-1 bg-black/5 dark:bg-white/5 text-slate-500 border border-black/5 dark:border-white/10 rounded-md">
                  {tag}
                  <button onClick={() => removeTag(idx)} className="text-slate-400 hover:text-red-500 ml-0.5">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="New tag..."
                className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-lg px-3 py-1.5 text-[10px] dark:text-white outline-none focus:border-hs-blue"
              />
              <button onClick={addTag} className="px-3 py-1.5 bg-hs-blue/10 text-hs-blue text-[8px] font-black uppercase rounded-lg hover:bg-hs-blue/20 transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Right: Section detail editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {editingSectionIdx !== null && editingSectionIdx < script.sections.length ? (
            <SectionEditor
              section={script.sections[editingSectionIdx]}
              sectionIndex={editingSectionIdx}
              onChange={(partial) => updateSection(editingSectionIdx, partial)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center space-y-2">
                <p className="text-[11px] font-bold">Select a section to edit</p>
                <p className="text-[9px]">Or add a new section from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Section Detail Editor ---

const SectionEditor: React.FC<{
  section: SectionData;
  sectionIndex: number;
  onChange: (partial: Partial<SectionData>) => void;
}> = ({ section, sectionIndex, onChange }) => {

  // Block helpers
  const updateBlock = (bIdx: number, partial: Partial<ScriptBlock>) => {
    const blocks = [...section.blocks];
    blocks[bIdx] = { ...blocks[bIdx], ...partial };
    onChange({ blocks });
  };
  const addBlock = () => {
    onChange({ blocks: [...section.blocks, { label: `Block ${section.blocks.length + 1}`, lines: [{ text: '' }] }] });
  };
  const removeBlock = (bIdx: number) => {
    if (!confirm(`Delete block "${section.blocks[bIdx].label}"?`)) return;
    onChange({ blocks: section.blocks.filter((_, i) => i !== bIdx) });
  };
  const moveBlock = (bIdx: number, dir: -1 | 1) => {
    const newIdx = bIdx + dir;
    if (newIdx < 0 || newIdx >= section.blocks.length) return;
    const blocks = [...section.blocks];
    [blocks[bIdx], blocks[newIdx]] = [blocks[newIdx], blocks[bIdx]];
    onChange({ blocks });
  };

  // Line helpers
  const updateLine = (bIdx: number, lIdx: number, text: string) => {
    const blocks = [...section.blocks];
    const lines = [...blocks[bIdx].lines];
    lines[lIdx] = { ...lines[lIdx], text };
    blocks[bIdx] = { ...blocks[bIdx], lines };
    onChange({ blocks });
  };
  const toggleLineAction = (bIdx: number, lIdx: number) => {
    const blocks = [...section.blocks];
    const lines = [...blocks[bIdx].lines];
    lines[lIdx] = { ...lines[lIdx], isAction: !lines[lIdx].isAction };
    blocks[bIdx] = { ...blocks[bIdx], lines };
    onChange({ blocks });
  };
  const addLine = (bIdx: number) => {
    const blocks = [...section.blocks];
    blocks[bIdx] = { ...blocks[bIdx], lines: [...blocks[bIdx].lines, { text: '' }] };
    onChange({ blocks });
  };
  const removeLine = (bIdx: number, lIdx: number) => {
    const blocks = [...section.blocks];
    blocks[bIdx] = { ...blocks[bIdx], lines: blocks[bIdx].lines.filter((_, i) => i !== lIdx) };
    onChange({ blocks });
  };

  // Objection helpers
  const updateObjection = (oIdx: number, partial: Partial<Objection>) => {
    const objections = [...section.objections];
    objections[oIdx] = { ...objections[oIdx], ...partial };
    onChange({ objections });
  };
  const addObjection = () => {
    onChange({ objections: [...section.objections, { objection: '', response: '' }] });
  };
  const removeObjection = (oIdx: number) => {
    onChange({ objections: section.objections.filter((_, i) => i !== oIdx) });
  };

  // Follow-up helpers
  const followUps = section.followUps || [];
  const updateFollowUp = (fIdx: number, text: string) => {
    const fu = [...followUps];
    fu[fIdx] = text;
    onChange({ followUps: fu });
  };
  const addFollowUp = () => {
    onChange({ followUps: [...followUps, ''] });
  };
  const removeFollowUp = (fIdx: number) => {
    onChange({ followUps: followUps.filter((_, i) => i !== fIdx) });
  };

  const inputCls = "w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:border-hs-blue transition-colors";
  const labelCls = "text-[9px] font-black text-slate-400 uppercase tracking-widest";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Section metadata */}
      <div className="glass-card rounded-[28px] p-6 space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Section {sectionIndex + 1} Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Title</label>
            <input type="text" value={section.title} onChange={e => onChange({ title: e.target.value })} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={section.subtitle} onChange={e => onChange({ subtitle: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Maturity Goal (Move On When...)</label>
          <input type="text" value={section.moveOn} onChange={e => onChange({ moveOn: e.target.value })} className={inputCls} />
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 cursor-pointer">
          <input
            type="checkbox"
            checked={!!section.hasInputCapture}
            onChange={e => onChange({ hasInputCapture: e.target.checked })}
            className="w-4 h-4 accent-indigo-500"
          />
          <div>
            <span className="text-[11px] font-bold dark:text-white">Enable Input Capture</span>
            <p className="text-[9px] text-slate-400 mt-0.5">Adds text fields under each script line to capture prospect responses (like Discovery)</p>
          </div>
        </label>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Blocks ({section.blocks.length})</h3>
        {section.blocks.map((block, bIdx) => (
          <div key={bIdx} className="glass-card rounded-[28px] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => moveBlock(bIdx, -1)} className="text-[9px] text-slate-400 hover:text-hs-blue px-1" disabled={bIdx === 0}>▲</button>
                <button onClick={() => moveBlock(bIdx, 1)} className="text-[9px] text-slate-400 hover:text-hs-blue px-1" disabled={bIdx === section.blocks.length - 1}>▼</button>
              </div>
              <input
                type="text"
                value={block.label}
                onChange={e => updateBlock(bIdx, { label: e.target.value })}
                className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 px-1 py-1 text-xs font-black dark:text-white uppercase tracking-wider outline-none focus:border-hs-blue"
                placeholder="Block label"
              />
              <button onClick={() => removeBlock(bIdx)} className="p-1 text-[9px] text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>

            {/* Lines */}
            <div className="space-y-2 pl-2">
              {block.lines.map((line, lIdx) => (
                <div key={lIdx} className="flex items-start gap-2 group">
                  <div className={`mt-3 h-1.5 w-1.5 rounded-full shrink-0 ${line.isAction ? 'bg-rose-400' : 'bg-[#74cef0]'}`} />
                  <textarea
                    value={line.text}
                    onChange={e => updateLine(bIdx, lIdx, e.target.value)}
                    className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] dark:text-slate-200 outline-none focus:border-hs-blue transition-colors resize-none leading-relaxed"
                    rows={2}
                    placeholder="Script line..."
                  />
                  <label className="flex items-center gap-1 mt-2 shrink-0 cursor-pointer" title="Mark as action/instruction">
                    <input
                      type="checkbox"
                      checked={!!line.isAction}
                      onChange={() => toggleLineAction(bIdx, lIdx)}
                      className="w-3 h-3 accent-rose-400"
                    />
                    <span className="text-[7px] font-black text-slate-400 uppercase">Act</span>
                  </label>
                  <button onClick={() => removeLine(bIdx, lIdx)} className="mt-2 opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 hover:text-red-500 transition-all shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => addLine(bIdx)} className="text-[9px] font-bold text-hs-blue hover:underline ml-4">+ Add Line</button>
            </div>
          </div>
        ))}
        <button onClick={addBlock} className="w-full py-3 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-hs-blue hover:border-hs-blue/30 transition-all">
          + Add Block
        </button>
      </div>

      {/* Objections */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Objections ({section.objections.length})</h3>
        {section.objections.map((obj, oIdx) => (
          <div key={oIdx} className="glass-card rounded-xl p-4 space-y-2 group">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={obj.objection}
                  onChange={e => updateObjection(oIdx, { objection: e.target.value })}
                  className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] font-bold dark:text-white outline-none focus:border-hs-blue"
                  placeholder="Prospect says..."
                />
                <textarea
                  value={obj.response}
                  onChange={e => updateObjection(oIdx, { response: e.target.value })}
                  className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] dark:text-slate-300 outline-none focus:border-hs-blue resize-none italic"
                  rows={2}
                  placeholder="Your response..."
                />
              </div>
              <button onClick={() => removeObjection(oIdx)} className="opacity-0 group-hover:opacity-100 p-1 text-[9px] text-slate-400 hover:text-red-500 transition-all shrink-0 mt-2">✕</button>
            </div>
          </div>
        ))}
        <button onClick={addObjection} className="w-full py-2.5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-hs-blue hover:border-hs-blue/30 transition-all">
          + Add Objection
        </button>
      </div>

      {/* Follow-ups */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Follow-Up Questions ({followUps.length})</h3>
        {followUps.map((q, fIdx) => (
          <div key={fIdx} className="flex items-center gap-2 group">
            <input
              type="text"
              value={q}
              onChange={e => updateFollowUp(fIdx, e.target.value)}
              className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-[11px] dark:text-slate-200 outline-none focus:border-hs-blue"
              placeholder="Follow-up question..."
            />
            <button onClick={() => removeFollowUp(fIdx)} className="opacity-0 group-hover:opacity-100 p-1 text-[9px] text-slate-400 hover:text-red-500 transition-all shrink-0">✕</button>
          </div>
        ))}
        <button onClick={addFollowUp} className="w-full py-2.5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-hs-blue hover:border-hs-blue/30 transition-all">
          + Add Follow-Up Question
        </button>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
};
