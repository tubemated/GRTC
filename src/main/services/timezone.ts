// ──────────────────────────────────────────────────────────
// TimeZone Service — Windows TimeZone management
// ──────────────────────────────────────────────────────────

import { executeCommand, executeElevated } from './powershell';
import { validateTimeZoneId } from './validation';
import type { TimeZoneInfo, OpResult } from '../../shared/types';

export async function getCurrentTimeZone(): Promise<TimeZoneInfo> {
  const script = `
    $tz = Get-TimeZone
    [PSCustomObject]@{
      windowsId = $tz.Id
      displayName = $tz.DisplayName
      utcOffsetMinutes = [int]$tz.BaseUtcOffset.TotalMinutes
      isDaylightSaving = [bool]$tz.IsDaylightSavingTime((Get-Date))
      ianaId = ''
    } | ConvertTo-Json -Compress
  `;

  const result = await executeCommand<TimeZoneInfo>(script);
  return result;
}

export async function setTimeZone(windowsId: string): Promise<OpResult> {
  try {
    validateTimeZoneId(windowsId);
    // Setting timezone requires administrative privileges on Windows
    const script = `Set-TimeZone -Id '${windowsId.replace(/'/g, "''")}'`;
    await executeElevated(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
