// ──────────────────────────────────────────────────────────
// Region Service — Windows regional settings management
// ──────────────────────────────────────────────────────────

import { executeCommand, executeElevated } from './powershell';
import { validateCultureId, validateGeoId } from './validation';
import type { RegionInfo, OpResult } from '../../shared/types';

export async function getCurrentRegion(): Promise<RegionInfo> {
  const script = `
    $c = Get-Culture
    $geo = Get-WinHomeLocation
    [PSCustomObject]@{
      cultureId = $c.Name
      cultureName = $c.DisplayName
      geoId = [int]$geo.GeoId
      geoName = $geo.HomeLocation
    } | ConvertTo-Json -Compress
  `;

  const result = await executeCommand<RegionInfo>(script);
  return result;
}

export async function setCulture(cultureId: string): Promise<OpResult> {
  try {
    validateCultureId(cultureId);
    // Set-Culture runs in user context, no elevation required
    const script = `Set-Culture -CultureInfo '${cultureId.replace(/'/g, "''")}'`;
    await executeCommand(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setHomeLocation(geoId: number): Promise<OpResult> {
  try {
    validateGeoId(geoId);
    // Set-WinHomeLocation runs in user context, no elevation required
    const script = `Set-WinHomeLocation -GeoId ${geoId}`;
    await executeCommand(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setSystemLocale(locale: string): Promise<OpResult> {
  try {
    validateCultureId(locale);
    // Set-WinSystemLocale requires elevation
    const script = `Set-WinSystemLocale -SystemLocale '${locale.replace(/'/g, "''")}'`;
    await executeElevated(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
