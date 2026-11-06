// ──────────────────────────────────────────────────────────
// IPC Handlers: history:*
// ──────────────────────────────────────────────────────────

import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/constants';
import { listHistory, getHistoryDetail } from '../services/database';
import type { HistoryFilter } from '../../shared/types';

export function registerHistoryHandlers(): void {
  ipcMain.handle(CHANNELS.HISTORY_LIST, async (_event, filter?: HistoryFilter) => {
    return listHistory(filter);
  });

  ipcMain.handle(CHANNELS.HISTORY_GET_DETAIL, async (_event, id: string) => {
    return getHistoryDetail(id);
  });
}
