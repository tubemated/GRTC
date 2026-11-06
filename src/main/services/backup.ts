// ──────────────────────────────────────────────────────────
// Backup Service — Settings snapshots and rollback
// ──────────────────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';
import { getCurrentRegion, setCulture, setHomeLocation } from './region';
import { getCurrentTimeZone, setTimeZone } from './timezone';
import { getCurrentDateTime } from './datetime';
import { getLanguageList, setLanguageList } from './language';
import {
  createBackup,
  getBackup,
  listBackups,
  deleteBackup,
  addHistory,
} from './database';
import type {
  ProfileSettings,
  BackupRecord,
  BackupTrigger,
  ApplyResult,
  AppliedChange,
  ApplyError,
} from '../../shared/types';

export async function captureCurrentSettings(): Promise<ProfileSettings> {
  const [region, tz, dt, langs] = await Promise.all([
    getCurrentRegion().catch(() => null),
    getCurrentTimeZone().catch(() => null),
    getCurrentDateTime().catch(() => null),
    getLanguageList().catch(() => []),
  ]);

  return {
    cultureId: region?.cultureId ?? null,
    geoId: region?.geoId ?? null,
    timeZoneId: tz?.windowsId ?? null,
    languageTags: langs.map((l) => l.languageTag),
    dateTime: dt?.iso8601 ?? null,
    timeSyncEnabled: dt?.timeSyncEnabled ?? null,
  };
}

export async function createSnapshot(
  trigger: BackupTrigger = 'manual',
  label = '',
): Promise<BackupRecord> {
  const settings = await captureCurrentSettings();
  const id = uuidv4();
  const now = new Date().toISOString();
  const backupLabel = label || `${trigger.toUpperCase()} Backup - ${new Date().toLocaleString()}`;

  createBackup(id, trigger, backupLabel, settings);

  return {
    id,
    trigger,
    createdAt: now,
    label: backupLabel,
    snapshot: settings,
  };
}

export async function restoreSnapshot(backupId: string): Promise<ApplyResult> {
  const backup = getBackup(backupId);
  if (!backup) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const s = backup.snapshot;
  const changes: AppliedChange[] = [];
  const errors: ApplyError[] = [];

  // 1. Timezone
  if (s.timeZoneId) {
    const curTz = await getCurrentTimeZone().catch(() => null);
    const prev = curTz?.windowsId ?? 'unknown';
    const res = await setTimeZone(s.timeZoneId);
    if (res.success) {
      changes.push({
        field: 'timeZone',
        previousValue: prev,
        newValue: s.timeZoneId,
        verified: true,
      });
    } else {
      errors.push({ field: 'timeZone', error: res.error || 'Failed to restore timezone' });
    }
  }

  // 2. Culture
  if (s.cultureId) {
    const curReg = await getCurrentRegion().catch(() => null);
    const prev = curReg?.cultureId ?? 'unknown';
    const res = await setCulture(s.cultureId);
    if (res.success) {
      changes.push({
        field: 'culture',
        previousValue: prev,
        newValue: s.cultureId,
        verified: true,
      });
    } else {
      errors.push({ field: 'culture', error: res.error || 'Failed to restore culture' });
    }
  }

  // 3. GeoId
  if (s.geoId) {
    const curReg = await getCurrentRegion().catch(() => null);
    const prev = String(curReg?.geoId ?? 0);
    const res = await setHomeLocation(s.geoId);
    if (res.success) {
      changes.push({
        field: 'homeLocation',
        previousValue: prev,
        newValue: String(s.geoId),
        verified: true,
      });
    } else {
      errors.push({ field: 'homeLocation', error: res.error || 'Failed to restore home location' });
    }
  }

  // 4. Languages
  if (s.languageTags && s.languageTags.length > 0) {
    const curLangs = await getLanguageList().catch(() => []);
    const prev = curLangs.map((l) => l.languageTag).join(', ');
    const res = await setLanguageList(s.languageTags);
    if (res.success) {
      changes.push({
        field: 'languages',
        previousValue: prev,
        newValue: s.languageTags.join(', '),
        verified: true,
      });
    } else {
      errors.push({ field: 'languages', error: res.error || 'Failed to restore languages' });
    }
  }

  const overallSuccess = errors.length === 0;

  addHistory(
    uuidv4(),
    'backup-restore',
    `Restored backup "${backup.label}"`,
    overallSuccess,
    'Multiple',
    'Restored',
    backupId,
    errors.length > 0 ? errors.map((e) => `${e.field}: ${e.error}`).join('; ') : undefined,
  );

  return {
    success: overallSuccess,
    changes,
    errors,
    backupId,
  };
}

export { listBackups, deleteBackup };
