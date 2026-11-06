// ──────────────────────────────────────────────────────────
// GRTC Shared Types — used by both main and renderer
// ──────────────────────────────────────────────────────────

// ─── Region / Culture ────────────────────────────────────

export interface RegionInfo {
  /** e.g. "en-US" */
  cultureId: string;
  /** e.g. "English (United States)" */
  cultureName: string;
  /** Win32 GeoID for the home location */
  geoId: number;
  /** Friendly name of the home location country */
  geoName: string;
}

// ─── Time Zone ───────────────────────────────────────────

export interface TimeZoneInfo {
  /** Windows time zone id, e.g. "Pacific Standard Time" */
  windowsId: string;
  /** Display name, e.g. "(UTC-08:00) Pacific Time (US & Canada)" */
  displayName: string;
  /** Current UTC offset in minutes */
  utcOffsetMinutes: number;
  /** Whether daylight saving is currently in effect */
  isDaylightSaving: boolean;
  /** Corresponding IANA id, e.g. "America/Los_Angeles" */
  ianaId: string;
}

// ─── Date & Time ─────────────────────────────────────────

export interface DateTimeInfo {
  /** ISO 8601 string */
  iso8601: string;
  /** Unix timestamp in milliseconds */
  unixMs: number;
  /** Formatted local string */
  localFormatted: string;
  /** Whether NTP time sync is enabled */
  timeSyncEnabled: boolean;
}

export interface DateTimeInput {
  /** ISO 8601 date-time string to set */
  iso8601: string;
}

// ─── Language / Keyboard ─────────────────────────────────

export interface LanguageInfo {
  /** BCP 47 language tag, e.g. "en-US" */
  languageTag: string;
  /** Localised display name */
  displayName: string;
  /** Whether this is an admin language */
  isAdmin: boolean;
  /** Input method tips / keyboard layout ids */
  inputMethodTips: string[];
}

export interface KeyboardLayout {
  /** Layout id, e.g. "0409:00000409" */
  layoutId: string;
  /** Friendly name, e.g. "US" */
  layoutName: string;
  /** Associated language tag */
  languageTag: string;
}

// ─── Reference Data (seeded from JSON) ──────────────────

export interface Country {
  /** ISO 3166-1 alpha-2 code */
  iso2: string;
  /** Country name */
  name: string;
  /** Windows GeoID */
  geoId: number;
}

export interface CountryDetail extends Country {
  /** ISO 3166-1 alpha-3 code */
  iso3: string;
  /** Default culture id, e.g. "en-US" */
  defaultCultureId: string;
  /** Available time zones for the country */
  timeZones: TimeZone[];
  /** Available locales */
  locales: LocaleInfo[];
}

export interface TimeZone {
  /** Windows time zone id */
  windowsId: string;
  /** IANA time zone id */
  ianaId: string;
  /** Display name */
  displayName: string;
  /** Standard UTC offset in minutes */
  utcOffsetMinutes: number;
}

export interface LocaleInfo {
  /** Culture id, e.g. "en-US" */
  cultureId: string;
  /** Display name */
  displayName: string;
  /** BCP 47 language tag */
  languageTag: string;
}

// ─── Profiles ────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  description: string;
  /** ISO 8601 creation date */
  createdAt: string;
  /** ISO 8601 last-modified date */
  updatedAt: string;
  /** Settings captured in this profile */
  settings: ProfileSettings;
}

export interface ProfileSettings {
  cultureId: string | null;
  geoId: number | null;
  timeZoneId: string | null;
  languageTags: string[] | null;
  /** ISO 8601 date-time (only used in restore scenarios) */
  dateTime: string | null;
  timeSyncEnabled: boolean | null;
}

export interface ProfileInput {
  name: string;
  description: string;
  settings: ProfileSettings;
}

// ─── Apply / Preview ────────────────────────────────────

export interface ChangePreview {
  field: string;
  currentValue: string;
  newValue: string;
  requiresElevation: boolean;
  requiresReboot: boolean;
}

export interface ApplyResult {
  success: boolean;
  changes: AppliedChange[];
  errors: ApplyError[];
  backupId: string | null;
}

export interface AppliedChange {
  field: string;
  previousValue: string;
  newValue: string;
  verified: boolean;
}

export interface ApplyError {
  field: string;
  error: string;
}

// ─── Generic Operation Result ───────────────────────────

export interface OpResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Backup / Snapshot ──────────────────────────────────

export interface BackupRecord {
  id: string;
  /** What triggered this backup: "manual" | "pre-apply" | "scheduled" */
  trigger: BackupTrigger;
  /** ISO 8601 creation date */
  createdAt: string;
  /** Human-readable label */
  label: string;
  /** Serialised settings snapshot */
  snapshot: ProfileSettings;
}

export type BackupTrigger = 'manual' | 'pre-apply' | 'scheduled';

// ─── History / Audit Log ────────────────────────────────

export interface HistoryEntry {
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** What was changed, e.g. "timezone", "culture" */
  category: HistoryCategory;
  /** Short summary */
  summary: string;
  /** Whether the change succeeded */
  success: boolean;
}

export type HistoryCategory =
  | 'timezone'
  | 'culture'
  | 'home-location'
  | 'language'
  | 'datetime'
  | 'time-sync'
  | 'system-locale'
  | 'profile-apply'
  | 'backup-restore';

export interface HistoryDetail extends HistoryEntry {
  /** Value before the change */
  previousValue: string;
  /** Value after the change */
  newValue: string;
  /** Related backup id, if any */
  backupId: string | null;
  /** Error message if unsuccessful */
  errorMessage: string | null;
}

export interface HistoryFilter {
  category?: HistoryCategory;
  success?: boolean;
  /** ISO 8601 – inclusive start */
  from?: string;
  /** ISO 8601 – inclusive end */
  to?: string;
  limit?: number;
  offset?: number;
}
