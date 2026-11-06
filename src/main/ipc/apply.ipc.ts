// ──────────────────────────────────────────────────────────
// IPC Handlers: apply:* (Mutating operations with snapshots)
// ──────────────────────────────────────────────────────────

import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { CHANNELS } from '../../shared/constants';
import { getCurrentRegion, setCulture, setHomeLocation, setSystemLocale } from '../services/region';
import { getCurrentTimeZone, setTimeZone } from '../services/timezone';
import { getCurrentDateTime, setDateTime, toggleTimeSync } from '../services/datetime';
import { getLanguageList, setLanguageList } from '../services/language';
import { createSnapshot, captureCurrentSettings } from '../services/backup';
import { addHistory, getProfile } from '../services/database';
import type {
  ProfileInput,
  ChangePreview,
  ApplyResult,
  AppliedChange,
  ApplyError,
  OpResult,
  DateTimeInput,
} from '../../shared/types';

export function registerApplyHandlers(): void {
  // ─── Preview ──────────────────────────────────────────
  ipcMain.handle(CHANNELS.APPLY_PREVIEW, async (_event, input: ProfileInput): Promise<ChangePreview[]> => {
    const current = await captureCurrentSettings();
    const previews: ChangePreview[] = [];
    const s = input.settings;

    if (s.timeZoneId && s.timeZoneId !== current.timeZoneId) {
      previews.push({
        field: 'Time Zone',
        currentValue: current.timeZoneId || 'Default',
        newValue: s.timeZoneId,
        requiresElevation: true,
        requiresReboot: false,
      });
    }

    if (s.cultureId && s.cultureId !== current.cultureId) {
      previews.push({
        field: 'Regional Format / Culture',
        currentValue: current.cultureId || 'Default',
        newValue: s.cultureId,
        requiresElevation: false,
        requiresReboot: false,
      });
    }

    if (s.geoId && s.geoId !== current.geoId) {
      previews.push({
        field: 'Home Location (GeoID)',
        currentValue: String(current.geoId || 0),
        newValue: String(s.geoId),
        requiresElevation: false,
        requiresReboot: false,
      });
    }

    if (s.languageTags && s.languageTags.length > 0) {
      const curLangs = (current.languageTags || []).join(', ');
      const newLangs = s.languageTags.join(', ');
      if (curLangs !== newLangs) {
        previews.push({
          field: 'Languages & Keyboards',
          currentValue: curLangs || 'None',
          newValue: newLangs,
          requiresElevation: false,
          requiresReboot: false,
        });
      }
    }

    return previews;
  });

  // ─── Apply Profile ────────────────────────────────────
  ipcMain.handle(CHANNELS.APPLY_PROFILE, async (_event, profileId: string): Promise<ApplyResult> => {
    const profile = getProfile(profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);

    // Pre-apply snapshot
    const backup = await createSnapshot('pre-apply', `Pre-apply "${profile.name}"`);
    const s = profile.settings;
    const changes: AppliedChange[] = [];
    const errors: ApplyError[] = [];

    // Timezone
    if (s.timeZoneId) {
      const curTz = await getCurrentTimeZone().catch(() => null);
      const prev = curTz?.windowsId ?? 'unknown';
      const res = await setTimeZone(s.timeZoneId);
      if (res.success) {
        const after = await getCurrentTimeZone().catch(() => null);
        changes.push({
          field: 'timeZone',
          previousValue: prev,
          newValue: after?.windowsId || s.timeZoneId,
          verified: after?.windowsId === s.timeZoneId,
        });
      } else {
        errors.push({ field: 'timeZone', error: res.error || 'Failed to apply timezone' });
      }
    }

    // Culture
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
        errors.push({ field: 'culture', error: res.error || 'Failed to apply culture' });
      }
    }

    // Home Location
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
        errors.push({ field: 'homeLocation', error: res.error || 'Failed to apply home location' });
      }
    }

    // Languages
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
        errors.push({ field: 'languages', error: res.error || 'Failed to apply languages' });
      }
    }

    const overallSuccess = errors.length === 0;

    addHistory(
      uuidv4(),
      'profile-apply',
      `Applied profile "${profile.name}"`,
      overallSuccess,
      'Multiple',
      'Applied',
      backup.id,
      errors.length > 0 ? errors.map((e) => `${e.field}: ${e.error}`).join('; ') : undefined,
    );

    return {
      success: overallSuccess,
      changes,
      errors,
      backupId: backup.id,
    };
  });

  // ─── Individual Setters ────────────────────────────────
  ipcMain.handle(CHANNELS.APPLY_SET_TIMEZONE, async (_event, tzId: string): Promise<OpResult> => {
    const cur = await getCurrentTimeZone().catch(() => null);
    const backup = await createSnapshot('pre-apply', `Before changing time zone to ${tzId}`);
    const res = await setTimeZone(tzId);
    addHistory(
      uuidv4(),
      'timezone',
      `Changed time zone to ${tzId}`,
      res.success,
      cur?.windowsId || '',
      tzId,
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_SET_DATETIME, async (_event, dt: DateTimeInput): Promise<OpResult> => {
    const cur = await getCurrentDateTime().catch(() => null);
    const backup = await createSnapshot('pre-apply', 'Before manual date/time modification');
    const res = await setDateTime(dt);
    addHistory(
      uuidv4(),
      'datetime',
      `Set system clock to ${dt.iso8601}`,
      res.success,
      cur?.iso8601 || '',
      dt.iso8601,
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_SET_CULTURE, async (_event, cultureId: string): Promise<OpResult> => {
    const cur = await getCurrentRegion().catch(() => null);
    const backup = await createSnapshot('pre-apply', `Before changing culture to ${cultureId}`);
    const res = await setCulture(cultureId);
    addHistory(
      uuidv4(),
      'culture',
      `Changed regional format to ${cultureId}`,
      res.success,
      cur?.cultureId || '',
      cultureId,
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_SET_LANGUAGE_LIST, async (_event, langs: string[]): Promise<OpResult> => {
    const cur = await getLanguageList().catch(() => []);
    const backup = await createSnapshot('pre-apply', 'Before changing language list');
    const res = await setLanguageList(langs);
    addHistory(
      uuidv4(),
      'language',
      `Updated language list to ${langs.join(', ')}`,
      res.success,
      cur.map((l) => l.languageTag).join(', '),
      langs.join(', '),
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_SET_HOME_LOCATION, async (_event, geoId: number): Promise<OpResult> => {
    const cur = await getCurrentRegion().catch(() => null);
    const backup = await createSnapshot('pre-apply', `Before setting home location to GeoID ${geoId}`);
    const res = await setHomeLocation(geoId);
    addHistory(
      uuidv4(),
      'home-location',
      `Changed GeoID to ${geoId}`,
      res.success,
      String(cur?.geoId || 0),
      String(geoId),
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_SET_SYSTEM_LOCALE, async (_event, locale: string): Promise<OpResult> => {
    const cur = await getCurrentRegion().catch(() => null);
    const backup = await createSnapshot('pre-apply', `Before setting system locale to ${locale}`);
    const res = await setSystemLocale(locale);
    addHistory(
      uuidv4(),
      'system-locale',
      `Changed system locale to ${locale} (Requires reboot)`,
      res.success,
      cur?.cultureId || '',
      locale,
      backup.id,
      res.error,
    );
    return res;
  });

  ipcMain.handle(CHANNELS.APPLY_TOGGLE_TIME_SYNC, async (_event, enable: boolean): Promise<OpResult> => {
    const backup = await createSnapshot('pre-apply', `Before ${enable ? 'enabling' : 'disabling'} NTP time sync`);
    const res = await toggleTimeSync(enable);
    addHistory(
      uuidv4(),
      'time-sync',
      `${enable ? 'Enabled' : 'Disabled'} automatic time sync`,
      res.success,
      enable ? 'Disabled' : 'Enabled',
      enable ? 'Enabled' : 'Disabled',
      backup.id,
      res.error,
    );
    return res;
  });
}
