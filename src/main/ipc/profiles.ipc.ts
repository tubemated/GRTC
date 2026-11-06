// ──────────────────────────────────────────────────────────
// IPC Handlers: profiles:*
// ──────────────────────────────────────────────────────────

import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CHANNELS } from '../../shared/constants';
import {
  listProfiles,
  getProfile,
  saveProfile,
  deleteProfile,
  duplicateProfile,
} from '../services/database';
import type { ProfileInput, Profile } from '../../shared/types';

export function registerProfilesHandlers(): void {
  ipcMain.handle(CHANNELS.PROFILES_LIST, async () => {
    return listProfiles();
  });

  ipcMain.handle(CHANNELS.PROFILES_GET, async (_event, id: string) => {
    return getProfile(id);
  });

  ipcMain.handle(CHANNELS.PROFILES_SAVE, async (_event, input: ProfileInput) => {
    const id = uuidv4();
    return saveProfile(id, input);
  });

  ipcMain.handle(CHANNELS.PROFILES_DELETE, async (_event, id: string) => {
    deleteProfile(id);
    return;
  });

  ipcMain.handle(CHANNELS.PROFILES_DUPLICATE, async (_event, id: string) => {
    const newId = uuidv4();
    return duplicateProfile(id, newId);
  });

  ipcMain.handle(CHANNELS.PROFILES_EXPORT, async (_event, id: string, targetPath?: string) => {
    const profile = getProfile(id);
    if (!profile) throw new Error(`Profile not found: ${id}`);

    let savePath = targetPath;
    if (!savePath) {
      const res = await dialog.showSaveDialog({
        title: 'Export Country Profile',
        defaultPath: `${profile.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.grtc.json`,
        filters: [{ name: 'GRTC Profile (*.grtc.json)', extensions: ['json'] }],
      });
      if (res.canceled || !res.filePath) return;
      savePath = res.filePath;
    }

    fs.writeFileSync(savePath, JSON.stringify(profile, null, 2), 'utf-8');
  });

  ipcMain.handle(CHANNELS.PROFILES_IMPORT, async (_event, sourcePath?: string): Promise<Profile | null> => {
    let loadPath = sourcePath;
    if (!loadPath) {
      const res = await dialog.showOpenDialog({
        title: 'Import Country Profile',
        filters: [{ name: 'GRTC Profile (*.grtc.json)', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      loadPath = res.filePaths[0];
    }

    const raw = fs.readFileSync(loadPath, 'utf-8');
    const imported = JSON.parse(raw) as Partial<Profile>;
    if (!imported.name || !imported.settings) {
      throw new Error('Invalid GRTC profile file');
    }

    const newId = uuidv4();
    const input: ProfileInput = {
      name: `${imported.name} (Imported)`,
      description: imported.description || '',
      settings: imported.settings,
    };
    return saveProfile(newId, input);
  });
}
