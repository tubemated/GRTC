// ──────────────────────────────────────────────────────────
// DateTime Service — Windows Date/Time and NTP sync
// ──────────────────────────────────────────────────────────

import { executeCommand, executeElevated } from './powershell';
import type { DateTimeInfo, DateTimeInput, OpResult } from '../../shared/types';

export async function getCurrentDateTime(): Promise<DateTimeInfo> {
  const script = `
    $d = Get-Date
    $syncStatus = $false
    try {
      $svc = Get-Service w32time -ErrorAction SilentlyContinue
      if ($svc -and $svc.Status -eq 'Running') {
        $syncStatus = $true
      }
    } catch {}

    [PSCustomObject]@{
      iso8601 = $d.ToString("o")
      unixMs = [int64]([double](Get-Date -UFormat %s) * 1000)
      localFormatted = $d.ToString("F")
      timeSyncEnabled = $syncStatus
    } | ConvertTo-Json -Compress
  `;

  return await executeCommand<DateTimeInfo>(script);
}

export async function setDateTime(input: DateTimeInput): Promise<OpResult> {
  try {
    const targetDate = new Date(input.iso8601);
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid ISO 8601 date string provided');
    }

    // Set-Date requires elevation
    const script = `Set-Date -Date (Get-Date '${input.iso8601}')`;
    await executeElevated(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function toggleTimeSync(enable: boolean): Promise<OpResult> {
  try {
    let script: string;
    if (enable) {
      script = `
        Set-Service -Name w32time -StartupType Automatic
        Start-Service -Name w32time
        w32tm /resync /nowait
      `;
    } else {
      script = `
        Stop-Service -Name w32time -Force
        Set-Service -Name w32time -StartupType Disabled
      `;
    }
    await executeElevated(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
