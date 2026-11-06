// ──────────────────────────────────────────────────────────
// Language Service — Preferred languages & Keyboard layouts
// ──────────────────────────────────────────────────────────

import { executeCommand } from './powershell';
import type { LanguageInfo, KeyboardLayout, OpResult } from '../../shared/types';

export async function getLanguageList(): Promise<LanguageInfo[]> {
  const script = `
    $langs = Get-WinUserLanguageList
    $result = @()
    foreach ($l in $langs) {
      $tips = @()
      if ($l.InputMethodTips) {
        $tips = $l.InputMethodTips
      }
      $result += [PSCustomObject]@{
        languageTag = $l.LanguageTag
        displayName = $l.Autonym
        isAdmin = $false
        inputMethodTips = $tips
      }
    }
    $result | ConvertTo-Json -Compress
  `;

  const res = await executeCommand<LanguageInfo[] | LanguageInfo>(script);
  if (!res) return [];
  return Array.isArray(res) ? res : [res];
}

export async function setLanguageList(languageTags: string[]): Promise<OpResult> {
  try {
    if (!languageTags || languageTags.length === 0) {
      throw new Error('At least one language tag is required');
    }

    const tagsJson = JSON.stringify(languageTags);
    const script = `
      $tags = '${tagsJson.replace(/'/g, "''")}' | ConvertFrom-Json
      $list = New-WinUserLanguageList -Language $tags[0]
      for ($i = 1; $i -lt $tags.Count; $i++) {
        $list.Add($tags[$i])
      }
      Set-WinUserLanguageList -LanguageList $list -Force
    `;

    await executeCommand(script);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getKeyboardLayouts(): Promise<KeyboardLayout[]> {
  const script = `
    $langs = Get-WinUserLanguageList
    $layouts = @()
    foreach ($l in $langs) {
      foreach ($tip in $l.InputMethodTips) {
        $layouts += [PSCustomObject]@{
          layoutId = $tip
          layoutName = $l.EnglishName + " (" + $tip + ")"
          languageTag = $l.LanguageTag
        }
      }
    }
    $layouts | ConvertTo-Json -Compress
  `;

  const res = await executeCommand<KeyboardLayout[] | KeyboardLayout>(script);
  if (!res) return [];
  return Array.isArray(res) ? res : [res];
}
