// ──────────────────────────────────────────────────────────
// Preload Script — contextBridge IPC bridge
// ──────────────────────────────────────────────────────────

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type {
  RegionInfo,
  TimeZoneInfo,
  DateTimeInfo,
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
  // ── System ────────────────────────────────────────────
  getCurrentRegion: (): Promise<OpResult<RegionInfo>> =>
    ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_REGION),

  getCurrentTimeZone: (): Promise<OpResult<TimeZoneInfo>> =>
    ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_TIMEZONE),

  getCurrentDateTime: (): Promise<OpResult<DateTimeInfo>> =>
    ipcRenderer.invoke(IPC.SYSTEM_GET_CURRENT_DATETIME),

  getLanguageList: (): Promise<OpResult<LanguageInfo[]>> =>
    ipcRenderer.invoke(IPC.SYSTEM_GET_LANGUAGE_LIST),

  getKeyboardLayouts: (): Promise<OpResult<KeyboardLayout[]>> =>
    ipcRenderer.invoke(IPC.SYSTEM_GET_KEYBOARD_LAYOUTS),

  isAdmin: (): Promise<OpResult<boolean>> =>
    ipcRenderer.invoke(IPC.SYSTEM_IS_ADMIN),

  // ── Countries ─────────────────────────────────────────
  searchCountries: (query: string): Promise<OpResult<Country[]>> =>
    ipcRenderer.invoke(IPC.COUNTRIES_SEARCH, query),

  getCountryById: (iso2: string): Promise<OpResult<CountryDetail>> =>
    ipcRenderer.invoke(IPC.COUNTRIES_GET_BY_ID, iso2),

  getCountryTimeZones: (iso2: string): Promise<OpResult<TimeZone[]>> =>
    ipcRenderer.invoke(IPC.COUNTRIES_GET_TIMEZONES, iso2),

  // ── Profiles ──────────────────────────────────────────
  listProfiles: (): Promise<OpResult<Profile[]>> =>
    ipcRenderer.invoke(IPC.PROFILES_LIST),

  getProfile: (id: string): Promise<OpResult<Profile>> =>
    ipcRenderer.invoke(IPC.PROFILES_GET, id),

  saveProfile: (input: ProfileInput & { id?: string }): Promise<OpResult<Profile>> =>
    ipcRenderer.invoke(IPC.PROFILES_SAVE, input),

  deleteProfile: (id: string): Promise<OpResult> =>
    ipcRenderer.invoke(IPC.PROFILES_DELETE, id),

  duplicateProfile: (id: string): Promise<OpResult<Profile>> =>
    ipcRenderer.invoke(IPC.PROFILES_DUPLICATE, id),

  exportProfile: (id: string): Promise<OpResult<string>> =>
    ipcRenderer.invoke(IPC.PROFILES_EXPORT, id),

  importProfile: (): Promise<OpResult<Profile>> =>
    ipcRenderer.invoke(IPC.PROFILES_IMPORT),

  // ── Apply ─────────────────────────────────────────────
  previewChanges: (profileId: string): Promise<OpResult<ChangePreview[]>> =>
    ipcRenderer.invoke(IPC.APPLY_PREVIEW, profileId),

  applyProfile: (profileId: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_PROFILE, profileId),

  setTimeZone: (windowsId: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_TIMEZONE, windowsId),

  setDateTime: (iso8601: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_DATETIME, iso8601),

  setCulture: (cultureId: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_CULTURE, cultureId),

  setLanguageList: (tags: string[]): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_LANGUAGE_LIST, tags),

  setHomeLocation: (geoId: number): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_HOME_LOCATION, geoId),

  setSystemLocale: (cultureId: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_SET_SYSTEM_LOCALE, cultureId),

  toggleTimeSync: (enable: boolean): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.APPLY_TOGGLE_TIME_SYNC, enable),

  // ── Backup ────────────────────────────────────────────
  listBackups: (): Promise<OpResult<BackupRecord[]>> =>
    ipcRenderer.invoke(IPC.BACKUP_LIST),

  restoreBackup: (id: string): Promise<OpResult<ApplyResult>> =>
    ipcRenderer.invoke(IPC.BACKUP_RESTORE, id),

  deleteBackup: (id: string): Promise<OpResult> =>
    ipcRenderer.invoke(IPC.BACKUP_DELETE, id),

  // ── History ───────────────────────────────────────────
  listHistory: (filter?: HistoryFilter): Promise<OpResult<HistoryEntry[]>> =>
    ipcRenderer.invoke(IPC.HISTORY_LIST, filter),

  getHistoryDetail: (id: string): Promise<OpResult<HistoryDetail>> =>
    ipcRenderer.invoke(IPC.HISTORY_GET_DETAIL, id),
};

contextBridge.exposeInMainWorld('grtcAPI', api);

export type GrtcAPI = typeof api;
