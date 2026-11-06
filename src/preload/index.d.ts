// ──────────────────────────────────────────────────────────
// Window interface augmentation for the GRTC preload API
// ──────────────────────────────────────────────────────────

import type { GrtcAPI } from './index';

declare global {
  interface Window {
    grtcAPI: GrtcAPI;
  }
}
