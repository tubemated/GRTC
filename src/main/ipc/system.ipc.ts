// ──────────────────────────────────────────────────────────
// IPC Handlers: system:*
// ──────────────────────────────────────────────────────────

import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/constants';
import { getCurrentRegion } from '../services/region';
import { getCurrentTimeZone } from '../services/timezone';
import { getCurrentDateTime } from '../services/datetime';
import { getLanguageList, getKeyboardLayouts } from '../services/language';
import { isElevated } from '../services/powershell';

export function registerSystemHandlers(): void {
  ipcMain.handle(CHANNELS.SYSTEM_GET_CURRENT_REGION, async () => {
    return await getCurrentRegion();
  });

  ipcMain.handle(CHANNELS.SYSTEM_GET_CURRENT_TIMEZONE, async () => {
    return await getCurrentTimeZone();
  });

  ipcMain.handle(CHANNELS.SYSTEM_GET_CURRENT_DATETIME, async () => {
    return await getCurrentDateTime();
  });

  ipcMain.handle(CHANNELS.SYSTEM_GET_LANGUAGE_LIST, async () => {
    return await getLanguageList();
  });

  ipcMain.handle(CHANNELS.SYSTEM_GET_KEYBOARD_LAYOUTS, async () => {
    return await getKeyboardLayouts();
  });

  ipcMain.handle(CHANNELS.SYSTEM_IS_ADMIN, async () => {
    return await isElevated();
  });
}
