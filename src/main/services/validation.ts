// ──────────────────────────────────────────────────────────
// Validation Service
// ──────────────────────────────────────────────────────────

import { timeZoneExists, cultureExists, geoIdExists } from './database';

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate a Windows time zone id against the database.
 */
export function validateTimeZoneId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Time zone ID is required', 'timeZoneId');
  }
  if (!timeZoneExists(id)) {
    throw new ValidationError(`Unknown time zone ID: "${id}"`, 'timeZoneId');
  }
}

/**
 * Validate a culture id (e.g. "en-US") against the database.
 */
export function validateCultureId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Culture ID is required', 'cultureId');
  }
  if (!cultureExists(id)) {
    throw new ValidationError(`Unknown culture ID: "${id}"`, 'cultureId');
  }
}

/**
 * Validate a Windows GeoID against the database.
 */
export function validateGeoId(geoId: number): void {
  if (typeof geoId !== 'number' || !Number.isInteger(geoId)) {
    throw new ValidationError('GeoID must be an integer', 'geoId');
  }
  if (!geoIdExists(geoId)) {
    throw new ValidationError(`Unknown GeoID: ${geoId}`, 'geoId');
  }
}

/**
 * Validate a BCP 47 language tag format.
 * Does NOT check against the database — only validates the format.
 */
export function validateLanguageTag(tag: string): void {
  if (!tag || typeof tag !== 'string') {
    throw new ValidationError('Language tag is required', 'languageTag');
  }
  // BCP 47: primary language subtag (2-3 chars), optional script (4 chars), optional region (2 chars or 3 digits)
  const bcp47 = /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-([a-zA-Z]{2}|\d{3}))?$/;
  if (!bcp47.test(tag)) {
    throw new ValidationError(
      `Invalid BCP 47 language tag format: "${tag}"`,
      'languageTag',
    );
  }
}

/**
 * Validate an ISO 8601 date-time string.
 */
export function validateIso8601(iso: string): void {
  if (!iso || typeof iso !== 'string') {
    throw new ValidationError('ISO 8601 date-time string is required', 'dateTime');
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw new ValidationError(
      `Invalid ISO 8601 date-time: "${iso}"`,
      'dateTime',
    );
  }
}
