import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'system' | 'light' | 'dark';
export type Mode = 'topo' | 'theory';
export type LevelFilter = 'all' | 'emelt';

export interface Settings {
  theme: ThemePref;
  /** Show only emelt-only items. Default: everything (the student takes the advanced exam). */
  levelFilter: LevelFilter;
  dailyGoal: number;
  /** ISO date of the next written exam. */
  examDate: string;
  sound: boolean;
  animations: boolean;
  quizDefaults: { count: number; timer: 'off' | '10s' | 'exam' };
  /** Last visited path per mode, so switching modes returns you where you were. */
  lastPath: Record<Mode, string>;
  lastMode: Mode;
}

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void;
  reset: () => void;
}

/** Next May written-exam start: the Hungarian May session opens on the first workdays of May. */
export function defaultExamDate(now = new Date()): string {
  const y = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  return `${y}-05-04`;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  levelFilter: 'all',
  dailyGoal: 40,
  examDate: defaultExamDate(),
  sound: false,
  animations: true,
  quizDefaults: { count: 20, timer: 'off' },
  lastPath: { topo: '/topografia', theory: '/elmelet' },
  lastMode: 'topo',
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    { name: 'fe-settings', version: 1 },
  ),
);
