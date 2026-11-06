// ──────────────────────────────────────────────────────────
// Main Process Entry Point
// ──────────────────────────────────────────────────────────

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './services/database';
import { registerSystemHandlers } from './ipc/system.ipc';
import { registerCountriesHandlers } from './ipc/countries.ipc';
import { registerProfilesHandlers } from './ipc/profiles.ipc';
import { registerApplyHandlers } from './ipc/apply.ipc';
import { registerBackupHandlers } from './ipc/backup.ipc';
import { registerHistoryHandlers } from './ipc/history.ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'GRTC - Global Region & Time Controller',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load dev server or local production build
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // 1. Initialize SQLite database and seed reference data
  try {
    initDatabase();
  } catch (err) {
    console.error('Failed to initialize local database:', err);
  }

  // 2. Register all IPC handlers
  registerSystemHandlers();
  registerCountriesHandlers();
  registerProfilesHandlers();
  registerApplyHandlers();
  registerBackupHandlers();
  registerHistoryHandlers();

  // 3. Launch window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
