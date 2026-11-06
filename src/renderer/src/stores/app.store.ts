// ──────────────────────────────────────────────────────────
// Zustand App Store — global application state
// ──────────────────────────────────────────────────────────

import { create } from 'zustand';
import type {
  RegionInfo,
  TimeZoneInfo,
  DateTimeInfo,
  ThemeMode,
} from '../types';

interface AppState {
  // ── Theme ────────────────────────────────────────────────
  theme: ThemeMode;
  sidebarCollapsed: boolean;

  // ── System info ──────────────────────────────────────────
  isAdmin: boolean;
  currentRegion: RegionInfo | null;
  currentTimeZone: TimeZoneInfo | null;
  currentDateTime: DateTimeInfo | null;

  // ── Loading ──────────────────────────────────────────────
  systemInfoLoading: boolean;
  initialLoadDone: boolean;

  // ── Actions ──────────────────────────────────────────────
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setCurrentRegion: (region: RegionInfo | null) => void;
  setCurrentTimeZone: (tz: TimeZoneInfo | null) => void;
  setCurrentDateTime: (dt: DateTimeInfo | null) => void;
  setSystemInfoLoading: (loading: boolean) => void;
  setInitialLoadDone: () => void;
  refreshSystemInfo: () => Promise<void>;
  refreshDateTime: () => Promise<void>;
}

/** Resolve theme to 'dark' or 'light' based on system preference */
function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

/** Apply dark/light class to document root */
function applyThemeToDOM(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

/** Load persisted theme from localStorage */
function loadPersistedTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('grtc-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'dark'; // default to dark mode
}

/** Load persisted sidebar state from localStorage */
function loadPersistedSidebar(): boolean {
  try {
    const stored = localStorage.getItem('grtc-sidebar-collapsed');
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // localStorage not available
  }
  return false;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialTheme = loadPersistedTheme();
  // Apply theme immediately on store creation
  applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,
    sidebarCollapsed: loadPersistedSidebar(),
    isAdmin: false,
    currentRegion: null,
    currentTimeZone: null,
    currentDateTime: null,
    systemInfoLoading: false,
    initialLoadDone: false,

    setTheme: (theme) => {
      localStorage.setItem('grtc-theme', theme);
      applyThemeToDOM(theme);
      set({ theme });
    },

    toggleTheme: () => {
      get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
    },

    toggleSidebar: () => {
      const collapsed = !get().sidebarCollapsed;
      localStorage.setItem('grtc-sidebar-collapsed', String(collapsed));
      set({ sidebarCollapsed: collapsed });
    },

    setSidebarCollapsed: (collapsed) => {
      localStorage.setItem('grtc-sidebar-collapsed', String(collapsed));
      set({ sidebarCollapsed: collapsed });
    },

    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setCurrentRegion: (currentRegion) => set({ currentRegion }),
    setCurrentTimeZone: (currentTimeZone) => set({ currentTimeZone }),
    setCurrentDateTime: (currentDateTime) => set({ currentDateTime }),
    setSystemInfoLoading: (systemInfoLoading) => set({ systemInfoLoading }),
    setInitialLoadDone: () => set({ initialLoadDone: true }),

    refreshSystemInfo: async () => {
      set({ systemInfoLoading: true });
      try {
        const [currentRegion, currentTimeZone, currentDateTime, isAdmin] = await Promise.all([
          window.grtcAPI.system.getCurrentRegion(),
          window.grtcAPI.system.getCurrentTimeZone(),
          window.grtcAPI.system.getCurrentDateTime(),
          window.grtcAPI.system.isAdmin(),
        ]);

        set({
          currentRegion,
          currentTimeZone,
          currentDateTime,
          isAdmin,
        });
      } catch (err) {
        console.error('Failed to refresh system info:', err);
      } finally {
        set({ systemInfoLoading: false });
      }
    },

    refreshDateTime: async () => {
      try {
        const currentDateTime = await window.grtcAPI.system.getCurrentDateTime();
        set({ currentDateTime });
      } catch (err) {
        console.error('Failed to refresh date/time:', err);
      }
    },
  };
});
