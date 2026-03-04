
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserState, ROIData, SectionData, ScriptBlock, ScriptConfig } from './types';
import { loadScripts, saveScripts, loadUserState, saveUserState, getFreshUserState, createBlankScript, duplicateScript } from './scriptStorage';
import { analyzeLeadImage, getObjectionOvercome } from './services/geminiService';
import { ScriptPicker } from './ScriptPicker';
import { ScriptEditor } from './ScriptEditor';

// --- Sub-Components ---

const SegmentedProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const segments = 25;

  return (
    <div className="flex flex-col gap-2 mb-6 px-1">
      <div className="flex items-center justify-between text-[10px] font-black tracking-tighter uppercase opacity-60 dark:text-slate-400">
        <span>0</span>
        <span className="font-black transition-colors duration-1000" style={{ color: progress > 50 ? '#fecdfa' : '#74cef0' }}>
          {Math.round(progress)}% maturity
        </span>
        <span>100</span>
      </div>
      <div className="flex gap-1 h-10 relative bg-black/5 dark:bg-white/5 rounded-sm overflow-hidden border border-black/5 dark:border-white/5">
        <div
          className="absolute inset-0 bg-maturity-gradient opacity-100 transition-all duration-1000 ease-out"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        />
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border-r border-white/20 dark:border-white/10 last:border-none z-10 pointer-events-none"
          />
        ))}
      </div>
    </div>
  );
};

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !isInstalled, install, isInstalled };
}

export default function App() {
  // --- Script management state ---
  const [scripts, setScripts] = useState<ScriptConfig[]>(() => loadScripts());
  const [userState, setUserState] = useState<UserState>(() => loadUserState(scripts[0].id));

  const activeScript = useMemo(() => {
    return scripts.find(s => s.id === userState.activeScriptId) ?? scripts[0];
  }, [scripts, userState.activeScriptId]);

  const [activeSection, setActiveSection] = useState<string>(() => activeScript.sections[0]?.id ?? '');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const { canInstall, install } = useInstallPrompt();

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [toolsWidth, setToolsWidth] = useState(360);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  // UI state for picker/editor
  const [showPicker, setShowPicker] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);

  const [roiData, setRoiData] = useState<ROIData>({
    avgJobValue: 1500,
    jobsPerMonth: 3,
    subscriptionCost: 300,
    maintenanceCost: 0,
    closeRate: 100
  });

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Persistence
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    saveUserState(userState);
  }, [userState]);

  useEffect(() => {
    saveScripts(scripts);
  }, [scripts]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const currentSection = useMemo(() => activeScript.sections.find(s => s.id === activeSection)!, [activeScript, activeSection]);
  const progressPercent = (userState.completedSections.length / activeScript.sections.length) * 100;

  // Handlers
  const handleMarkDone = (id: string) => {
    const alreadyDone = userState.completedSections.includes(id);
    const section = activeScript.sections.find(s => s.id === id);

    setUserState(prev => {
      let updatedNotes = prev.notes['master'] || "";
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      // When completing a section with input capture, dump answers into continuous log
      if (section?.hasInputCapture && !alreadyDone) {
        const entries = Object.entries(prev.discoveryAnswers).filter(([_, a]) => a.trim() !== '');
        if (entries.length > 0) {
          const prefix = updatedNotes === "" || updatedNotes.endsWith('\n') ? "" : "\n";
          updatedNotes += `${prefix}\n[${timestamp}] --- ${section.title.toUpperCase()} INTEL ---\n`;
          entries.forEach(([question, answer]) => {
            updatedNotes += `Q: ${question}\nA: ${answer}\n\n`;
          });
          updatedNotes += `[${timestamp}] --- END ${section.title.toUpperCase()} ---\n`;
        }
      }

      return {
        ...prev,
        completedSections: alreadyDone
          ? prev.completedSections.filter(x => x !== id)
          : [...prev.completedSections, id],
        notes: {
          ...prev.notes,
          'master': updatedNotes
        }
      };
    });

    // Auto-advance to next section
    if (!alreadyDone) {
      const currentIdx = activeScript.sections.findIndex(s => s.id === id);
      if (currentIdx >= 0 && currentIdx < activeScript.sections.length - 1) {
        setActiveSection(activeScript.sections[currentIdx + 1].id);
      }
    }

    // Check celebration
    if (!alreadyDone && userState.completedSections.length + 1 === activeScript.sections.length) {
      setShowCelebration(true);
    }
  };

  const handleBlockDone = (block: ScriptBlock) => {
    const isCompleted = userState.completedBlocks[activeSection]?.includes(block.label);
    setUserState(prev => {
      const newBlocks = isCompleted
        ? (prev.completedBlocks[activeSection] || []).filter(l => l !== block.label)
        : [...(prev.completedBlocks[activeSection] || []), block.label];

      let updatedMasterNotes = prev.notes['master'] || "";
      if (!isCompleted) {
        updatedMasterNotes += `\n[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] Completed Segment: ${block.label}\n`;
      }

      return {
        ...prev,
        completedBlocks: {
          ...prev.completedBlocks,
          [activeSection]: newBlocks
        },
        notes: {
          ...prev.notes,
          'master': updatedMasterNotes
        }
      };
    });
  };

  const handleNoteChange = (val: string) => {
    setUserState(prev => ({
      ...prev,
      notes: { ...prev.notes, 'master': val }
    }));
  };

  const addQuickTag = (tag: string) => {
    const current = userState.notes['master'] || "";
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const prefix = current === "" || current.endsWith('\n') ? "" : "\n";
    handleNoteChange(`${current}${prefix}[${timestamp}] ${tag.toUpperCase()}: `);
  };

  const handleInputCapture = (key: string, val: string) => {
    setUserState(prev => ({
      ...prev,
      discoveryAnswers: { ...prev.discoveryAnswers, [key]: val }
    }));
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && currentSection?.inputParseRules) {
      for (const rule of currentSection.inputParseRules) {
        if (key.includes(rule.lineTextContains)) {
          setRoiData(p => ({ ...p, [rule.targetField]: num }));
        }
      }
    }
  };

  const handleResetApp = () => {
    if (confirm("Reset everything for a new call? All notes, checkboxes, progress, and ROI data will be purged.")) {
      setUserState(getFreshUserState(activeScript.id));
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setActiveSection(activeScript.sections[0]?.id ?? '');
      setRoiData({ avgJobValue: 0, jobsPerMonth: 0, subscriptionCost: 0, maintenanceCost: 0, closeRate: 0 });
    }
  };

  const handleCopyCRM = () => {
    const notes = userState.notes['master'] || "No notes recorded.";
    const discovery = Object.entries(userState.discoveryAnswers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');
    const fullLog = `--- ${activeScript.name.toUpperCase()} CALL LOG ---\n\n${notes}\n\n--- DISCOVERY INTEL ---\n\n${discovery}\n\n--- END LOG ---`;

    navigator.clipboard.writeText(fullLog).then(() => {
      alert("Full call intelligence copied to clipboard!");
    });
  };

  // Script management handlers
  const handleSwitchScript = (scriptId: string) => {
    if (scriptId === userState.activeScriptId) return;
    const hasProgress = userState.completedSections.length > 0 || Object.keys(userState.discoveryAnswers).length > 0;
    if (hasProgress && !confirm("Switching scripts will reset your current call progress. Continue?")) return;

    const targetScript = scripts.find(s => s.id === scriptId);
    if (!targetScript) return;

    setUserState(getFreshUserState(scriptId));
    setActiveSection(targetScript.sections[0]?.id ?? '');
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setRoiData({ avgJobValue: 1500, jobsPerMonth: 3, subscriptionCost: 300, maintenanceCost: 0, closeRate: 100 });
  };

  const handleNewScript = () => {
    const name = prompt("Script name:");
    if (!name?.trim()) return;
    const newScript = createBlankScript(name.trim());
    setScripts(prev => [...prev, newScript]);
    setShowPicker(false);
    setEditingScriptId(newScript.id);
  };

  const handleDuplicateScript = (scriptId: string) => {
    const source = scripts.find(s => s.id === scriptId);
    if (!source) return;
    const name = prompt("Name for the copy:", `${source.name} (Copy)`);
    if (!name?.trim()) return;
    const copy = duplicateScript(source, name.trim());
    setScripts(prev => [...prev, copy]);
  };

  const handleDeleteScript = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script || script.isBuiltIn) return;
    if (!confirm(`Delete "${script.name}"? This cannot be undone.`)) return;
    setScripts(prev => prev.filter(s => s.id !== scriptId));
    if (userState.activeScriptId === scriptId) {
      const remaining = scripts.filter(s => s.id !== scriptId);
      handleSwitchScript(remaining[0].id);
    }
  };

  const handleSaveEditedScript = (updated: ScriptConfig) => {
    setScripts(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingScriptId(null);

    // If we're editing the active script, make sure activeSection is still valid
    if (updated.id === userState.activeScriptId) {
      const sectionStillExists = updated.sections.some(s => s.id === activeSection);
      if (!sectionStillExists && updated.sections.length > 0) {
        setActiveSection(updated.sections[0].id);
      }
    }
  };

  // Resize Logic
  const isResizingSidebar = useRef(false);
  const isResizingTools = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current) {
        setSidebarWidth(Math.max(250, Math.min(e.clientX, 600)));
      }
      if (isResizingTools.current) {
        setToolsWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, 600)));
      }
    };
    const onMouseUp = () => {
      isResizingSidebar.current = false;
      isResizingTools.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const editingScript = editingScriptId ? scripts.find(s => s.id === editingScriptId) : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
      {/* Top Brand Bar */}
      <div className="h-1.5 w-full bg-maturity-gradient relative z-50 shadow-lg shadow-blue-500/20" />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation & Continuous Intelligence Sidebar */}
        <aside
          style={{ width: isSidebarCollapsed ? 64 : sidebarWidth }}
          className="flex flex-col border-r border-black/5 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-3xl relative z-40 transition-[width] duration-300 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 h-16 shrink-0">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hs-blue rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">H</div>
                <h1 className="font-bold text-xs tracking-tight dark:text-white uppercase opacity-80">Sales Pro</h1>
              </div>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-slate-400">
              {isSidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Script selector */}
              <div className="px-4 pb-2 shrink-0">
                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Script</p>
                    <p className="text-[11px] font-bold dark:text-white truncate">{activeScript.name}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 group-hover:text-hs-blue shrink-0 ml-2">Switch</span>
                </button>
              </div>

              <div className="px-4 py-2 shrink-0">
                <SegmentedProgress progress={progressPercent} />
              </div>

              {/* Step Navigation */}
              <nav className="px-3 space-y-0.5 max-h-[35%] overflow-y-auto custom-scrollbar shrink-0 border-b border-black/5 dark:border-white/5 pb-4 mb-2">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Phase Control</h3>
                {activeScript.sections.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex justify-between items-center group ${
                      activeSection === s.id
                        ? 'bg-hs-blue/10 dark:bg-white/10 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate">{String(idx + 1).padStart(2, '0')}. {s.title}</span>
                    {userState.completedSections.includes(s.id) && <span className="text-green-500 text-[10px] font-black">✓</span>}
                  </button>
                ))}
              </nav>

              {/* Master Intel Log */}
              <div className="flex-1 flex flex-col px-4 py-3 min-h-0 bg-black/[0.02] dark:bg-white/[0.01]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Continuous Log</h3>
                  <div className="flex gap-1.5">
                    {activeScript.quickTags.slice(0, 2).map(tag => (
                      <button
                        key={tag}
                        onClick={() => addQuickTag(tag)}
                        className="text-[8px] font-black px-2 py-1 bg-hs-blue/5 text-hs-blue dark:text-blue-400 border border-hs-blue/10 rounded-md hover:bg-hs-blue/20 transition-colors"
                      >
                        +{tag.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                   {activeScript.quickTags.slice(2, 6).map(tag => (
                      <button
                        key={tag}
                        onClick={() => addQuickTag(tag)}
                        className="text-[8px] font-black px-2 py-1 bg-black/5 dark:bg-white/5 text-slate-500 border border-black/5 dark:border-white/10 rounded-md hover:bg-hs-blue/10 transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                </div>

                <textarea
                  className="flex-1 w-full bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-[12px] dark:text-slate-200 outline-none focus:border-hs-blue transition-colors placeholder:text-slate-500 leading-relaxed resize-none shadow-inner custom-scrollbar"
                  placeholder="Intelligence capture for all phases..."
                  value={userState.notes['master'] || ""}
                  onChange={(e) => handleNoteChange(e.target.value)}
                />

                <button
                  onClick={handleCopyCRM}
                  className="mt-4 w-full py-3 bg-hs-blue hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>📋</span> Copy Intel for CRM
                </button>
              </div>
            </div>
          )}

          {/* Sidebar Resizer */}
          {!isSidebarCollapsed && (
            <div
              onMouseDown={() => { isResizingSidebar.current = true; document.body.style.cursor = 'col-resize'; }}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-hs-blue/50 transition-colors"
            />
          )}

          {/* Bottom Utility Area */}
          <div className="mt-auto p-4 border-t border-black/5 dark:border-white/5 space-y-3 shrink-0">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between text-xs font-mono font-black mb-1">
                <span className="opacity-40 uppercase text-[9px] tracking-widest">Call Status</span>
                <span className={isTimerRunning ? "text-rose-500 animate-pulse" : "text-slate-400"}>
                  {Math.floor(timerSeconds/60)}:{String(timerSeconds%60).padStart(2, '0')}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isTimerRunning ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-hs-blue/10 text-hs-blue border border-hs-blue/20'
                }`}
              >
                {isSidebarCollapsed ? (isTimerRunning ? '⏸' : '▶') : (isTimerRunning ? 'Pause Session' : 'Start Session')}
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-slate-400 hover:text-hs-blue border border-transparent hover:border-hs-blue/30"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={handleResetApp}
                className="w-full py-2.5 bg-red-500/10 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all mt-2 border border-red-500/10 font-bold"
              >
                Clear & Restart App
              </button>
            )}
          </div>
        </aside>

        {/* Script Execution Panel */}
        <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#080808] relative overflow-hidden transition-colors duration-300">
          <header className="h-16 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-8 bg-black/5 dark:bg-black/10 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-5">
              <h2 className="text-xl font-black tracking-tight dark:text-white">{currentSection?.title}</h2>
              <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10" />
              <div className="text-[10px] font-black text-hs-blue uppercase tracking-[0.2em] opacity-80">{currentSection?.subtitle}</div>
            </div>
            <div className="flex items-center gap-4">
               {canInstall && (
                 <button onClick={install} className="px-4 py-2 bg-hs-blue text-white border border-hs-blue/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 animate-pulse">
                   Install App
                 </button>
               )}
               <button onClick={() => setIsToolsCollapsed(!isToolsCollapsed)} className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-hs-blue transition-all">
                 {isToolsCollapsed ? 'Show Analysis' : 'Focus Mode'}
               </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 pb-32">
            {currentSection?.blocks.map((block, idx) => {
              const done = userState.completedBlocks[activeSection]?.includes(block.label);
              return (
                <div key={idx} className={`glass-card rounded-[28px] overflow-hidden transition-all duration-700 ${done ? 'opacity-30 ring-1 ring-green-500/20' : 'shadow-2xl shadow-black/[0.03]'}`}>
                  <div className="p-7 pb-2 flex justify-between items-start">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{block.label}</h4>
                    <button
                      onClick={() => handleBlockDone(block)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        done ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-hs-blue hover:bg-hs-blue/5'
                      }`}
                    >
                      {done ? 'Segment Verified ✓' : 'Verify Block'}
                    </button>
                  </div>
                  <div className="p-7 pt-2 space-y-7">
                    {block.lines.map((line, lIdx) => (
                      <div key={lIdx} className="relative pl-7 group">
                        <div className={`absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full transition-all duration-500 ${line.isAction ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]' : 'bg-[#74cef0] shadow-[0_0_8px_rgba(116,206,240,0.4)]'}`} />
                        <p className={`text-xl font-medium tracking-tight leading-relaxed transition-all duration-500 ${line.isAction ? 'text-slate-400 italic text-lg' : 'text-slate-800 dark:text-slate-200'} ${done ? 'line-through opacity-50' : ''}`}>
                          {line.text}
                        </p>

                        {currentSection?.hasInputCapture && !line.isAction && (
                          <div className="mt-4 max-w-xl">
                            <input
                              type="text"
                              placeholder="Capture specific intel here..."
                              className="w-full bg-slate-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-5 py-3 text-sm text-hs-blue dark:text-blue-400 font-bold focus:ring-1 focus:ring-hs-blue outline-none transition-all placeholder:text-slate-400/50 shadow-inner"
                              value={userState.discoveryAnswers[line.text] || ""}
                              onChange={(e) => handleInputCapture(line.text, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fixed Objective Tracker */}
          <div className="absolute bottom-8 left-8 right-8 z-20">
             <div className="glass-card rounded-[28px] p-6 flex items-center justify-between bg-electric-gradient bg-opacity-5 border-blue-500/20 shadow-2xl backdrop-blur-xl">
                <div className="max-w-xl">
                  <p className="text-[9px] font-black dark:text-white/40 uppercase tracking-[0.2em] mb-1">Maturity Goal</p>
                  <p className="font-bold text-sm dark:text-white/90 truncate">{currentSection?.moveOn}</p>
                </div>
                <button
                  onClick={() => handleMarkDone(activeSection)}
                  className="px-8 py-3.5 bg-hs-blue text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Confirm Phase Complete
                </button>
              </div>
          </div>
        </main>

        {/* Right Intel Panel */}
        <aside
          style={{ width: isToolsCollapsed ? 0 : toolsWidth }}
          className="flex flex-col border-l border-black/5 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-3xl h-full relative z-40 transition-[width] duration-300 overflow-hidden"
        >
          {!isToolsCollapsed && (
            <div
              onMouseDown={() => { isResizingTools.current = true; document.body.style.cursor = 'col-resize'; }}
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-hs-blue/50 transition-colors"
            />
          )}

          {!isToolsCollapsed && (
            <div className="flex-1 p-6 space-y-7 overflow-y-auto custom-scrollbar">
               <AIObjectionAssistant stageTitle={currentSection?.title ?? ''} />

               {currentSection?.followUps && currentSection.followUps.length > 0 && (
                  <div className="glass-card rounded-[28px] p-6 space-y-3">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Follow-Up Questions</h3>
                    {currentSection.followUps.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const current = userState.notes['master'] || "";
                          const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                          const prefix = current === "" || current.endsWith('\n') ? "" : "\n";
                          handleNoteChange(`${current}${prefix}[${timestamp}] FOLLOW-UP: ${q}\n`);
                        }}
                        className="w-full text-left p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-hs-blue/5 hover:border-hs-blue/20 transition-all group"
                      >
                        <p className="text-[11px] font-bold dark:text-slate-200 group-hover:text-hs-blue transition-colors leading-relaxed">{q}</p>
                      </button>
                    ))}
                  </div>
               )}

               {currentSection?.objections && currentSection.objections.length > 0 && (
                  <div className="glass-card rounded-[28px] p-6 space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Stage Battle Cards</h3>
                    {currentSection.objections.map((obj, i) => (
                      <details key={i} className="group overflow-hidden rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.03] dark:bg-white/[0.03] transition-all">
                        <summary className="p-4 cursor-pointer text-[11px] font-bold dark:text-white flex justify-between items-center group-open:bg-hs-blue/5">
                          {obj.objection}
                          <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 text-[11px] text-slate-500 italic leading-relaxed border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20">
                          "{obj.response}"
                        </div>
                      </details>
                    ))}
                  </div>
               )}

               <ROICalculator data={roiData} onChange={setRoiData} />

               <div className="glass-card rounded-[28px] p-6 text-center border-dashed border-black/10 dark:border-white/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Profile Intel Analysis</p>
                  <div className="h-32 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border-2 border-dashed border-black/5 dark:border-white/5 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase cursor-pointer hover:border-hs-blue/30 hover:bg-hs-blue/5 transition-all">
                    Drop Asset Link
                  </div>
               </div>
            </div>
          )}
        </aside>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={`c-${i}`}
              className={`absolute rounded-full ${i % 2 === 0 ? 'animate-confetti' : 'animate-confetti-sway'}`}
              style={{
                width: `${4 + Math.random() * 14}px`,
                height: `${4 + Math.random() * 14}px`,
                background: ['#74cef0', '#fecdfa', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ff2d95', '#00c2ff', '#39ff14'][i % 9],
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2.5 + Math.random() * 4}s`,
                boxShadow: `0 0 ${6 + Math.random() * 10}px ${['#74cef0', '#fecdfa', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'][i % 6]}40`,
              }}
            />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sq-${i}`}
              className="absolute animate-confetti-sway"
              style={{
                width: `${6 + Math.random() * 12}px`,
                height: `${3 + Math.random() * 6}px`,
                borderRadius: '2px',
                background: ['#ff2d95', '#f59e0b', '#22c55e', '#8b5cf6', '#74cef0', '#ec4899'][i % 6],
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDelay: `${0.5 + Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            />
          ))}

          <div className="absolute animate-glow-ring" style={{ width: 400, height: 400, borderRadius: '50%', border: '2px solid #74cef0', animationDelay: '0s' }} />
          <div className="absolute animate-glow-ring" style={{ width: 400, height: 400, borderRadius: '50%', border: '2px solid #fecdfa', animationDelay: '0.7s' }} />
          <div className="absolute animate-glow-ring" style={{ width: 400, height: 400, borderRadius: '50%', border: '2px solid #8b5cf6', animationDelay: '1.4s' }} />

          {['⭐', '✨', '🌟', '💫', '⭐', '✨'].map((emoji, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-3xl animate-star-float"
              style={{
                left: `${10 + i * 15}%`,
                top: `${15 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {emoji}
            </div>
          ))}

          <div className="relative text-center space-y-6 max-w-2xl mx-auto px-8 animate-celebration-enter">
            <div className="flex justify-center gap-4 mb-2">
              {['🔥', '🏆', '💰', '🏆', '🔥'].map((emoji, i) => (
                <span
                  key={i}
                  className="animate-emoji-burst inline-block"
                  style={{ fontSize: i === 2 ? '6rem' : i === 1 || i === 3 ? '4rem' : '3rem', animationDelay: `${0.2 + i * 0.15}s`, opacity: 0 }}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <h2 className="text-7xl font-black tracking-tighter leading-none animate-shimmer">
              DEAL CLOSED!
            </h2>
            <p className="text-2xl font-bold text-white/80 tracking-tight">
              Every phase verified. Every box checked.
            </p>
            <p className="text-lg text-white/40 font-medium">
              You just ran a textbook call — now go stack another one.
            </p>

            <div className="flex gap-4 justify-center pt-6">
              <button
                onClick={() => {
                  setShowCelebration(false);
                  handleResetApp();
                }}
                className="px-10 py-5 bg-gradient-to-r from-[#74cef0] to-[#fecdfa] text-black font-black text-[12px] uppercase tracking-widest rounded-2xl hover:shadow-[0_0_40px_rgba(116,206,240,0.4)] transition-all shadow-xl active:scale-95"
              >
                Run It Back
              </button>
              <button
                onClick={() => setShowCelebration(false)}
                className="px-10 py-5 bg-white/10 text-white/70 font-black text-[12px] uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all active:scale-95 border border-white/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Picker Modal */}
      {showPicker && (
        <ScriptPicker
          scripts={scripts}
          activeScriptId={userState.activeScriptId}
          onSwitch={handleSwitchScript}
          onEdit={(id) => { setShowPicker(false); setEditingScriptId(id); }}
          onDuplicate={handleDuplicateScript}
          onDelete={handleDeleteScript}
          onNew={handleNewScript}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Script Editor Modal */}
      {editingScript && (
        <ScriptEditor
          script={editingScript}
          onSave={handleSaveEditedScript}
          onCancel={() => setEditingScriptId(null)}
        />
      )}
    </div>
  );
}

// --- Sub-Components ---

const ROICalculator: React.FC<{ data: ROIData; onChange: (d: ROIData) => void }> = ({ data, onChange }) => {
  const monthlyRevenue = (data.avgJobValue * data.jobsPerMonth) + data.maintenanceCost;
  const annualRevenue = monthlyRevenue * 12;

  return (
    <div className="glass-card rounded-[28px] overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ROI Engine</h3>
        <div className="px-2.5 py-1 bg-hs-blue/10 rounded-lg text-[8px] font-black text-hs-blue border border-hs-blue/10">LIVE MATH</div>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Avg Job Value', val: data.avgJobValue, key: 'avgJobValue' },
          { label: 'Expect. Volume', val: data.jobsPerMonth, key: 'jobsPerMonth' },
          { label: 'Sub Investment', val: data.subscriptionCost, key: 'subscriptionCost' }
        ].map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 shadow-inner">
              <span className="text-slate-400 mr-2 text-xs">$</span>
              <input
                type="number"
                className="bg-transparent border-none outline-none dark:text-white font-bold w-full text-base"
                value={field.val || ''}
                onChange={e => onChange({...data, [field.key as keyof ROIData]: Number(e.target.value)})}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3">
        <div className="bg-hs-blue/5 p-4 rounded-2xl border border-hs-blue/10 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Monthly Yield</p>
          <p className="text-base font-black dark:text-white tracking-tight">${monthlyRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-maturity-gradient p-[1px] rounded-2xl shadow-lg">
          <div className="bg-white dark:bg-[#111] h-full w-full rounded-[15px] p-4">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Annual Net</p>
            <p className="text-base font-black dark:text-white tracking-tight">${annualRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIObjectionAssistant: React.FC<{ stageTitle: string }> = ({ stageTitle }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse('');
    const res = await getObjectionOvercome(input, stageTitle);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="glass-card rounded-[28px] overflow-hidden p-6 border-indigo-500/10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-500/30">🧠</div>
        <div>
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">AI Coach</h3>
          <p className="text-[8px] font-bold text-indigo-400 uppercase mt-1.5 tracking-widest">Consultative Overcomes</p>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl px-5 py-4 pr-12 text-[12px] font-bold dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400/50 shadow-inner"
          placeholder="Enter prospect objection..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading} className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 rounded-xl text-white font-black hover:bg-indigo-700 transition-all shadow-md active:scale-90 disabled:opacity-50">
          {loading ? '...' : '→'}
        </button>
      </div>

      {response && (
        <div className="mt-5 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed italic font-medium">"{response}"</p>
          <button onClick={() => setResponse('')} className="mt-4 text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:underline">Clear Coaching</button>
        </div>
      )}
    </div>
  );
};
