// ──────────────────────────────────────────────────────────
// Preload Script — contextBridge IPC bridge
// ──────────────────────────────────────────────────────────

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type {
  RegionInfo,
  TimeZoneInfo,
  DateTimeInfo,
  DateTimeInput,
  LanguageInfo,
  KeyboardLayout,
  Country,
  CountryDetail,
  TimeZone,
  Profile,
  ProfileInput,
  ChangePreview,
  ApplyResult,
  OpResult,
  BackupRecord,
  HistoryEntry,
  HistoryDetail,
  HistoryFilter,
} from '../shared/types';

const api = {
  system: {
    getCurrentRegion: (): Promise<RegionInfo> => ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_REGION),
    getCurrentTimeZone: (): Promise<TimeZoneInfo> => ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_TIMEZONE),
    getCurrentDateTime: (): Promise<DateTimeInfo> => ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_DATETIME),
    getLanguageList: (): Promise<LanguageInfo[]> => ipcRenderer.invoke(IPC.SYSTEM_GET_LANGUAGE_LIST),
    getKeyboardLayouts: (): Promise<KeyboardLayout[]> => ipcRenderer.invoke(IPC.SYSTEM_GET_KEYBOARD_LAYOUTS),
    isAdmin: (): Promise<boolean> => ipcRenderer.invoke(IPC.SYSTEM_IS_ADMIN),
  },
  countries: {
    search: (query: string): Promise<Country[]> => ipcRenderer.invoke(IPC.COUNTRIES_SEARCH, query),
    getById: (iso2: string): Promise<CountryDetail | null> => ipcRenderer.invoke(IPC.COUNTRIES_GET_BY_ID, iso2),
    getTimeZones: (iso2: string): Promise<TimeZone[]> => ipcRenderer.invoke(IPC.COUNTRIES_GET_TIMEZONES, iso2),
  },
  timezones: {
    listAll: (): Promise<TimeZone[]> => ipcRenderer.invoke(IPC.TIMEZONES_LIST_ALL),
  },
  profiles: {
    list: (): Promise<Profile[]> => ipcRenderer.invoke(IPC.PROFILES_LIST),
    save: (input: ProfileInput): Promise<Profile> => ipcRenderer.invoke(IPC.PROFILES_SAVE, input),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.PROFILES_DELETE, id),
    exportToFile: (id: string): Promise<void> => ipcRenderer.invoke(IPC.PROFILES_EXPORT, id),
    importFromFile: (): Promise<Profile | null> => ipcRenderer.invoke(IPC.PROFILES_IMPORT),
  },
  apply: {
    preview: (input: ProfileInput): Promise<ChangePreview[]> => ipcRenderer.invoke(IPC.APPLY_PREVIEW, input),
    applyProfile: (id: string): Promise<ApplyResult> => ipcRenderer.invoke(IPC.APPLY_PROFILE, id),
    setTimeZone: (windowsId: string): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_TIMEZONE, windowsId),
    setDateTime: (input: DateTimeInput): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_DATETIME, input),
    setCulture: (cultureId: string): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_CULTURE, cultureId),
    setLanguageList: (tags: string[]): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_LANGUAGE_LIST, tags),
    setHomeLocation: (geoId: number): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_HOME_LOCATION, geoId),
    setSystemLocale: (cultureId: string): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_SET_SYSTEM_LOCALE, cultureId),
    toggleTimeSync: (enable: boolean): Promise<OpResult> => ipcRenderer.invoke(IPC.APPLY_TOGGLE_TIME_SYNC, enable),
  },
  backup: {
    list: (): Promise<BackupRecord[]> => ipcRenderer.invoke(IPC.BACKUP_LIST),
    create: (): Promise<BackupRecord> => ipcRenderer.invoke(IPC.BACKUP_CREATE),
    restore: (id: string): Promise<ApplyResult> => ipcRenderer.invoke(IPC.BACKUP_RESTORE, id),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.BACKUP_DELETE, id),
  },
  history: {
    list: (filter?: HistoryFilter): Promise<HistoryEntry[]> => ipcRenderer.invoke(IPC.HISTORY_LIST, filter),
    getDetail: (id: string): Promise<HistoryDetail | null> => ipcRenderer.invoke(IPC.HISTORY_GET_DETAIL, id),
  },
};

contextBridge.exposeInMainWorld('grtcAPI', api);

export type GrtcAPI = typeof api;
