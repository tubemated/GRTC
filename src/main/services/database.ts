// ──────────────────────────────────────────────────────────
// Database Service — SQLite via better-sqlite3
// ──────────────────────────────────────────────────────────

import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';
import type {
  Country,
  CountryDetail,
  TimeZone,
  LocaleInfo,
  Profile,
  ProfileSettings,
  ProfileInput,
  BackupRecord,
  BackupTrigger,
  HistoryEntry,
  HistoryDetail,
  HistoryFilter,
  HistoryCategory,
} from '../../shared/types';

// ─── Singleton ───────────────────────────────────────────

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialised — call initDatabase() first');
  return db;
}

// ─── Initialisation ─────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'grtc.db');
  db = new Database(dbPath);

  // Performance settings
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations();
  seedReferenceData();
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ─── Migrations ─────────────────────────────────────────

function runMigrations(): void {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      iso2           TEXT PRIMARY KEY,
      iso3           TEXT NOT NULL,
      name           TEXT NOT NULL,
      geo_id         INTEGER NOT NULL UNIQUE,
      default_culture_id TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS timezones (
      windows_id       TEXT PRIMARY KEY,
      iana_id          TEXT NOT NULL DEFAULT '',
      display_name     TEXT NOT NULL,
      utc_offset_min   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS country_timezones (
      country_iso2   TEXT NOT NULL REFERENCES countries(iso2) ON DELETE CASCADE,
      timezone_id    TEXT NOT NULL REFERENCES timezones(windows_id) ON DELETE CASCADE,
      PRIMARY KEY (country_iso2, timezone_id)
    );

    CREATE TABLE IF NOT EXISTS locales (
      culture_id     TEXT PRIMARY KEY,
      display_name   TEXT NOT NULL,
      language_tag   TEXT NOT NULL DEFAULT '',
      country_iso2   TEXT NOT NULL DEFAULT '' REFERENCES countries(iso2) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      description    TEXT NOT NULL DEFAULT '',
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      settings_json  TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS backups (
      id             TEXT PRIMARY KEY,
      trigger_type   TEXT NOT NULL DEFAULT 'manual',
      created_at     TEXT NOT NULL,
      label          TEXT NOT NULL DEFAULT '',
      snapshot_json  TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS history (
      id             TEXT PRIMARY KEY,
      timestamp      TEXT NOT NULL,
      category       TEXT NOT NULL,
      summary        TEXT NOT NULL DEFAULT '',
      success        INTEGER NOT NULL DEFAULT 1,
      previous_value TEXT NOT NULL DEFAULT '',
      new_value      TEXT NOT NULL DEFAULT '',
      backup_id      TEXT,
      error_message  TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_history_category  ON history(category);
    CREATE INDEX IF NOT EXISTS idx_backups_created   ON backups(created_at DESC);
  `);
}

// ─── Seed Reference Data ────────────────────────────────

function seedReferenceData(): void {
  const d = getDb();

  // Only seed if the countries table is empty
  const row = d.prepare('SELECT COUNT(*) as cnt FROM countries').get() as { cnt: number };
  if (row.cnt > 0) return;

  // Resolve data directory — works in dev (project root) and packaged (resources)
  const possiblePaths = [
    path.join(app.getAppPath(), 'data'),
    path.join(app.getAppPath(), '..', 'data'),
    path.join(process.cwd(), 'data'),
  ];

  let dataDir = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'countries.json'))) {
      dataDir = p;
      break;
    }
  }

  if (!dataDir) {
    console.warn('[DB] No seed data directory found — skipping seed');
    return;
  }

  interface SeedCountry {
    iso2: string;
    iso3: string;
    name: string;
    geoId: number;
    defaultCultureId: string;
  }

  interface SeedTimeZone {
    windowsId: string;
    ianaId: string;
    displayName: string;
    utcOffsetMinutes: number;
  }

  interface SeedCountryTimezone {
    countryIso2: string;
    timezoneId: string;
  }

  interface SeedLocale {
    cultureId: string;
    displayName: string;
    languageTag: string;
    countryIso2: string;
  }

  const readJson = <T>(filename: string): T[] => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
  };

  const insertCountry = d.prepare(
    'INSERT OR IGNORE INTO countries (iso2, iso3, name, geo_id, default_culture_id) VALUES (?, ?, ?, ?, ?)',
  );
  const insertTimezone = d.prepare(
    'INSERT OR IGNORE INTO timezones (windows_id, iana_id, display_name, utc_offset_min) VALUES (?, ?, ?, ?)',
  );
  const insertCountryTz = d.prepare(
    'INSERT OR IGNORE INTO country_timezones (country_iso2, timezone_id) VALUES (?, ?)',
  );
  const insertLocale = d.prepare(
    'INSERT OR IGNORE INTO locales (culture_id, display_name, language_tag, country_iso2) VALUES (?, ?, ?, ?)',
  );

  const seedAll = d.transaction(() => {
    for (const c of readJson<SeedCountry>('countries.json')) {
      insertCountry.run(c.iso2, c.iso3, c.name, c.geoId, c.defaultCultureId);
    }
    for (const tz of readJson<SeedTimeZone>('timezones.json')) {
      insertTimezone.run(tz.windowsId, tz.ianaId, tz.displayName, tz.utcOffsetMinutes);
    }
    for (const ct of readJson<SeedCountryTimezone>('country_timezones.json')) {
      insertCountryTz.run(ct.countryIso2, ct.timezoneId);
    }
    for (const loc of readJson<SeedLocale>('locales.json')) {
      insertLocale.run(loc.cultureId, loc.displayName, loc.languageTag, loc.countryIso2);
    }
  });

  seedAll();
  console.log('[DB] Seeded reference data');
}

// ─── Country Queries ────────────────────────────────────

export function searchCountries(query: string): Country[] {
  const d = getDb();
  if (!query.trim()) {
    return d
      .prepare('SELECT iso2, name, geo_id as geoId FROM countries ORDER BY name')
      .all() as Country[];
  }
  return d
    .prepare(
      'SELECT iso2, name, geo_id as geoId FROM countries WHERE name LIKE ? OR iso2 LIKE ? ORDER BY name',
    )
    .all(`%${query}%`, `%${query}%`) as Country[];
}

export function getCountryById(iso2: string): CountryDetail | null {
  const d = getDb();
  const country = d
    .prepare('SELECT iso2, iso3, name, geo_id as geoId, default_culture_id as defaultCultureId FROM countries WHERE iso2 = ?')
    .get(iso2) as (Omit<CountryDetail, 'timeZones' | 'locales'>) | undefined;

  if (!country) return null;

  const timeZones = d
    .prepare(
      `SELECT t.windows_id as windowsId, t.iana_id as ianaId, t.display_name as displayName, t.utc_offset_min as utcOffsetMinutes
       FROM timezones t
       JOIN country_timezones ct ON ct.timezone_id = t.windows_id
       WHERE ct.country_iso2 = ?
       ORDER BY t.utc_offset_min`,
    )
    .all(iso2) as TimeZone[];

  const locales = d
    .prepare(
      'SELECT culture_id as cultureId, display_name as displayName, language_tag as languageTag FROM locales WHERE country_iso2 = ? ORDER BY display_name',
    )
    .all(iso2) as LocaleInfo[];

  return { ...country, timeZones, locales };
}

export function getCountryTimeZones(iso2: string): TimeZone[] {
  const d = getDb();
  return d
    .prepare(
      `SELECT t.windows_id as windowsId, t.iana_id as ianaId, t.display_name as displayName, t.utc_offset_min as utcOffsetMinutes
       FROM timezones t
       JOIN country_timezones ct ON ct.timezone_id = t.windows_id
       WHERE ct.country_iso2 = ?
       ORDER BY t.utc_offset_min`,
    )
    .all(iso2) as TimeZone[];
}

export function getAllTimeZones(): TimeZone[] {
  const d = getDb();
  return d
    .prepare(
      `SELECT windows_id as windowsId, iana_id as ianaId, display_name as displayName, utc_offset_min as utcOffsetMinutes
       FROM timezones
       ORDER BY utc_offset_min, windows_id`,
    )
    .all() as TimeZone[];
}

// ─── Profile Queries ────────────────────────────────────

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: row['description'] as string,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
    settings: JSON.parse(row['settings_json'] as string) as ProfileSettings,
  };
}

export function listProfiles(): Profile[] {
  const d = getDb();
  const rows = d
    .prepare('SELECT * FROM profiles ORDER BY updated_at DESC')
    .all() as Record<string, unknown>[];
  return rows.map(rowToProfile);
}

export function getProfile(id: string): Profile | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToProfile(row) : null;
}

export function saveProfile(id: string, input: ProfileInput): Profile {
  const d = getDb();
  const now = new Date().toISOString();
  const settingsJson = JSON.stringify(input.settings);

  const existing = d.prepare('SELECT id FROM profiles WHERE id = ?').get(id);

  if (existing) {
    d.prepare(
      'UPDATE profiles SET name = ?, description = ?, updated_at = ?, settings_json = ? WHERE id = ?',
    ).run(input.name, input.description, now, settingsJson, id);
  } else {
    d.prepare(
      'INSERT INTO profiles (id, name, description, created_at, updated_at, settings_json) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, input.name, input.description, now, now, settingsJson);
  }

  return getProfile(id)!;
}

export function deleteProfile(id: string): boolean {
  const d = getDb();
  const result = d.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  return result.changes > 0;
}

export function duplicateProfile(id: string, newId: string): Profile | null {
  const existing = getProfile(id);
  if (!existing) return null;
  return saveProfile(newId, {
    name: `${existing.name} (Copy)`,
    description: existing.description,
    settings: existing.settings,
  });
}


// ─── Backup Queries ─────────────────────────────────────

function rowToBackup(row: Record<string, unknown>): BackupRecord {
  return {
    id: row['id'] as string,
    trigger: row['trigger_type'] as BackupTrigger,
    createdAt: row['created_at'] as string,
    label: row['label'] as string,
    snapshot: JSON.parse(row['snapshot_json'] as string) as ProfileSettings,
  };
}

export function insertBackup(
  id: string,
  trigger: BackupTrigger,
  label: string,
  snapshot: ProfileSettings,
): BackupRecord {
  const d = getDb();
  const now = new Date().toISOString();
  const snapshotJson = JSON.stringify(snapshot);

  d.prepare(
    'INSERT INTO backups (id, trigger_type, created_at, label, snapshot_json) VALUES (?, ?, ?, ?, ?)',
  ).run(id, trigger, now, label, snapshotJson);

  return getBackup(id)!;
}

export function listBackups(): BackupRecord[] {
  const d = getDb();
  const rows = d
    .prepare('SELECT * FROM backups ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];
  return rows.map(rowToBackup);
}

export function getBackup(id: string): BackupRecord | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM backups WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToBackup(row) : null;
}

export function deleteBackup(id: string): boolean {
  const d = getDb();
  const result = d.prepare('DELETE FROM backups WHERE id = ?').run(id);
  return result.changes > 0;
}

// Aliases for backup and history
export const createBackup = insertBackup;
export function addHistory(
  id: string,
  category: HistoryCategory,
  summary: string,
  success: boolean,
  previousValue: string,
  newValue: string,
  backupId?: string | null,
  errorMessage?: string | null,
): void {
  insertHistory({
    id,
    category,
    summary,
    success,
    previousValue,
    newValue,
    backupId: backupId || null,
    errorMessage: errorMessage || null,
  });
}


// ─── History Queries ────────────────────────────────────

function rowToHistoryEntry(row: Record<string, unknown>): HistoryEntry {
  return {
    id: row['id'] as string,
    timestamp: row['timestamp'] as string,
    category: row['category'] as HistoryCategory,
    summary: row['summary'] as string,
    success: (row['success'] as number) === 1,
  };
}

function rowToHistoryDetail(row: Record<string, unknown>): HistoryDetail {
  return {
    ...rowToHistoryEntry(row),
    previousValue: row['previous_value'] as string,
    newValue: row['new_value'] as string,
    backupId: (row['backup_id'] as string) || null,
    errorMessage: (row['error_message'] as string) || null,
  };
}

export function insertHistory(entry: {
  id: string;
  category: HistoryCategory;
  summary: string;
  success: boolean;
  previousValue: string;
  newValue: string;
  backupId: string | null;
  errorMessage: string | null;
}): void {
  const d = getDb();
  const now = new Date().toISOString();

  d.prepare(
    `INSERT INTO history (id, timestamp, category, summary, success, previous_value, new_value, backup_id, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    entry.id,
    now,
    entry.category,
    entry.summary,
    entry.success ? 1 : 0,
    entry.previousValue,
    entry.newValue,
    entry.backupId,
    entry.errorMessage,
  );
}

export function listHistory(filter?: HistoryFilter): HistoryEntry[] {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter?.category) {
    conditions.push('category = ?');
    params.push(filter.category);
  }
  if (filter?.success !== undefined) {
    conditions.push('success = ?');
    params.push(filter.success ? 1 : 0);
  }
  if (filter?.from) {
    conditions.push('timestamp >= ?');
    params.push(filter.from);
  }
  if (filter?.to) {
    conditions.push('timestamp <= ?');
    params.push(filter.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;

  const rows = d
    .prepare(`SELECT * FROM history ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[];

  return rows.map(rowToHistoryEntry);
}

export function getHistoryDetail(id: string): HistoryDetail | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM history WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToHistoryDetail(row) : null;
}

// ─── Validation helpers (used by validation service) ────

export function timeZoneExists(windowsId: string): boolean {
  const d = getDb();
  const row = d.prepare('SELECT 1 FROM timezones WHERE windows_id = ?').get(windowsId);
  return row !== undefined;
}

export function cultureExists(cultureId: string): boolean {
  const d = getDb();
  const row = d.prepare('SELECT 1 FROM locales WHERE culture_id = ?').get(cultureId);
  return row !== undefined;
}

export function geoIdExists(geoId: number): boolean {
  const d = getDb();
  const row = d.prepare('SELECT 1 FROM countries WHERE geo_id = ?').get(geoId);
  return row !== undefined;
}
