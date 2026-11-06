// ──────────────────────────────────────────────────────────
// IPC Handlers: countries:*
// ──────────────────────────────────────────────────────────

import { ipcMain } from 'electron';
import { CHANNELS } from '../../shared/constants';
import { searchCountries, getCountryById, getCountryTimeZones } from '../services/database';

export function registerCountriesHandlers(): void {
  ipcMain.handle(CHANNELS.COUNTRIES_SEARCH, async (_event, query: string) => {
    return searchCountries(query || '');
  });

  ipcMain.handle(CHANNELS.COUNTRIES_GET_BY_ID, async (_event, iso2: string) => {
    return getCountryById(iso2);
  });

  ipcMain.handle(CHANNELS.COUNTRIES_GET_TIMEZONES, async (_event, iso2: string) => {
    return getCountryTimeZones(iso2);
  });
}
