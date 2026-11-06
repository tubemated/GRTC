// ──────────────────────────────────────────────────────────
// Window interface augmentation for the renderer process
// ──────────────────────────────────────────────────────────

import type { GrtcAPI } from '../../../preload/index';

declare global {
  interface Window {
    grtcAPI: GrtcAPI;
  }
}

export {};
