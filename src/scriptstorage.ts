
import { ScriptConfig, UserState } from './types';
import { createDefaultHomeStarsScript, DEFAULT_SCRIPT_ID } from './defaultScript';

const SCRIPTS_KEY = 'hs_scripts_v1';
const USER_STATE_KEY = 'hs_user_v13';
const OLD_USER_STATE_KEY = 'hs_user_v12';

// --- ID generation ---

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Scripts ---

export function loadScripts(): ScriptConfig[] {
  const raw = localStorage.getItem(SCRIPTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // corrupted data — fall through to default
    }
  }
  const defaults = [createDefaultHomeStarsScript()];
  saveScripts(defaults);
  return defaults;
}

export function saveScripts(scripts: ScriptConfig[]): void {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

// --- User State ---

export function getFreshUserState(scriptId: string, firstSectionId?: string): UserState {
  return {
    activeScriptId: scriptId,
    completedSections: [],
    completedBlocks: {},
    notes: { 'master': '' },
    discoveryAnswers: {},
    xp: 0,
    streak: 0,
    lastCallDate: null
  };
}

export function loadUserState(fallbackScriptId: string): UserState {
  const raw = localStorage.getItem(USER_STATE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // corrupted
    }
  }

  // Check for old v12 data and migrate
  const oldRaw = localStorage.getItem(OLD_USER_STATE_KEY);
  if (oldRaw) {
    try {
      return migrateFromV12(JSON.parse(oldRaw));
    } catch {
      // corrupted old data
    }
  }

  return getFreshUserState(fallbackScriptId);
}

export function saveUserState(state: UserState): void {
  localStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
}

// --- Migration ---

const SECTION_ID_MAP: Record<number, string> = {
  0: 'intro',
  1: 'upfront-contract',
  2: 'discovery',
  3: 'value',
  4: 'triple-down',
  5: 'close',
  6: 'terms',
  7: 'follow-through',
  8: 'update-notes'
};

function migrateFromV12(oldState: any): UserState {
  const newState: UserState = {
    activeScriptId: DEFAULT_SCRIPT_ID,
    completedSections: (oldState.completedSections || []).map((id: number) => SECTION_ID_MAP[id] || String(id)),
    completedBlocks: {},
    notes: { 'master': '' },
    discoveryAnswers: oldState.discoveryAnswers || {},
    xp: oldState.xp || 0,
    streak: oldState.streak || 0,
    lastCallDate: oldState.lastCallDate || null
  };

  // Migrate completedBlocks (numeric keys to string keys)
  if (oldState.completedBlocks) {
    for (const [k, v] of Object.entries(oldState.completedBlocks)) {
      const newKey = SECTION_ID_MAP[Number(k)] || k;
      newState.completedBlocks[newKey] = v as string[];
    }
  }

  // Migrate notes (key -1 becomes 'master', numeric keys become string section IDs)
  if (oldState.notes) {
    for (const [k, v] of Object.entries(oldState.notes)) {
      if (k === '-1') {
        newState.notes['master'] = v as string;
      } else {
        const newKey = SECTION_ID_MAP[Number(k)] || k;
        newState.notes[newKey] = v as string;
      }
    }
  }

  // Save migrated state
  saveUserState(newState);
  return newState;
}

// --- Script CRUD helpers ---

export function createBlankScript(name: string): ScriptConfig {
  return {
    id: generateId(),
    name,
    description: '',
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quickTags: ["Pain Point", "Decision Maker", "Budget Confirmed", "Timeline"],
    sections: [
      {
        id: generateId(),
        title: "Section 1",
        subtitle: "Description",
        moveOn: "Goal for this section",
        blocks: [
          {
            label: "Block 1",
            lines: [{ text: "Your script line here..." }]
          }
        ],
        objections: [],
        followUps: []
      }
    ]
  };
}

export function duplicateScript(source: ScriptConfig, newName: string): ScriptConfig {
  const newId = generateId();
  const clone: ScriptConfig = JSON.parse(JSON.stringify(source));
  clone.id = newId;
  clone.name = newName;
  clone.isBuiltIn = false;
  clone.createdAt = new Date().toISOString();
  clone.updatedAt = new Date().toISOString();
  // Give each section a new ID
  clone.sections = clone.sections.map(s => ({
    ...s,
    id: generateId()
  }));
  return clone;
}

export function generateSectionId(): string {
  return generateId();
}
