// ──────────────────────────────────────────────────────────
// Renderer Types — re-exports from shared + renderer-local types
// ──────────────────────────────────────────────────────────

export type {
  RegionInfo,
  TimeZoneInfo,
  DateTimeInfo,
  DateTimeInput,
  LanguageInfo,
  KeyboardLayout,
  Country,
  CountryDetail,
  TimeZone,
  LocaleInfo,
  Profile,
  ProfileSettings,
  ProfileInput,
  ChangePreview,
  ApplyResult,
  AppliedChange,
  ApplyError,
  OpResult,
  BackupRecord,
  BackupTrigger,
  HistoryEntry,
  HistoryCategory,
  HistoryDetail,
  HistoryFilter,
} from '../../../shared/types';

/** Theme variants supported by the app */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Navigation route definition */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
}
