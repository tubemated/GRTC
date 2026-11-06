// ──────────────────────────────────────────────────────────
// IPC Channel Name Constants
// ──────────────────────────────────────────────────────────

export const IPC = {
  // ── System ──────────────────────────────────────────────
  SYSTEM_GET_CURRENT_REGION: 'system:getCurrentRegion',
  SYSTEM_GET_CURRENT_TIMEZONE: 'system:getCurrentTimeZone',
  SYSTEM_GET_CURRENT_DATETIME: 'system:getCurrentDateTime',
  SYSTEM_GET_LANGUAGE_LIST: 'system:getLanguageList',
  SYSTEM_GET_KEYBOARD_LAYOUTS: 'system:getKeyboardLayouts',
  SYSTEM_IS_ADMIN: 'system:isAdmin',

  // ── Countries ───────────────────────────────────────────
  COUNTRIES_SEARCH: 'countries:search',
  COUNTRIES_GET_BY_ID: 'countries:getById',
  COUNTRIES_GET_TIMEZONES: 'countries:getTimeZones',

  // ── Profiles ────────────────────────────────────────────
  PROFILES_LIST: 'profiles:list',
  PROFILES_GET: 'profiles:get',
  PROFILES_SAVE: 'profiles:save',
  PROFILES_DELETE: 'profiles:delete',
  PROFILES_DUPLICATE: 'profiles:duplicate',
  PROFILES_EXPORT: 'profiles:exportToFile',
  PROFILES_IMPORT: 'profiles:importFromFile',

  // ── Apply ───────────────────────────────────────────────
  APPLY_PREVIEW: 'apply:preview',
  APPLY_PROFILE: 'apply:applyProfile',
  APPLY_SET_TIMEZONE: 'apply:setTimeZone',
  APPLY_SET_DATETIME: 'apply:setDateTime',
  APPLY_SET_CULTURE: 'apply:setCulture',
  APPLY_SET_LANGUAGE_LIST: 'apply:setLanguageList',
  APPLY_SET_HOME_LOCATION: 'apply:setHomeLocation',
  APPLY_SET_SYSTEM_LOCALE: 'apply:setSystemLocale',
  APPLY_TOGGLE_TIME_SYNC: 'apply:toggleTimeSync',

  // ── Backup ──────────────────────────────────────────────
  BACKUP_LIST: 'backup:list',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_DELETE: 'backup:delete',

  // ── History ─────────────────────────────────────────────
  HISTORY_LIST: 'history:list',
  HISTORY_GET_DETAIL: 'history:getDetail',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export const CHANNELS = IPC;

