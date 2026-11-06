// ──────────────────────────────────────────────────────────
// IPC Handlers: backup:*
// ──────────────────────────────────────────────────────────

import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/constants';
import { createSnapshot, listBackups, deleteBackup, restoreSnapshot } from '../services/backup';

export function registerBackupHandlers(): void {
  ipcMain.handle(CHANNELS.BACKUP_LIST, async () => {
    return listBackups();
  });

  ipcMain.handle(CHANNELS.BACKUP_CREATE, async () => {
    return createSnapshot('manual');
  });

  ipcMain.handle(CHANNELS.BACKUP_RESTORE, async (_event, id: string) => {
    return restoreSnapshot(id);
  });

  ipcMain.handle(CHANNELS.BACKUP_DELETE, async (_event, id: string) => {
    deleteBackup(id);
    return;
  });
}
