import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cultureExists, geoIdExists, timeZoneExists } from './database';
import {
  ValidationError,
  validateCultureId,
  validateGeoId,
  validateIso8601,
  validateLanguageTag,
  validateTimeZoneId,
} from './validation';

vi.mock('./database', () => ({
  cultureExists: vi.fn(),
  geoIdExists: vi.fn(),
  timeZoneExists: vi.fn(),
}));

describe('input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts known Windows time zone IDs and rejects unknown IDs', () => {
    vi.mocked(timeZoneExists).mockReturnValue(true);
    expect(() => validateTimeZoneId('UTC')).not.toThrow();

    vi.mocked(timeZoneExists).mockReturnValue(false);
    expect(() => validateTimeZoneId('Not a time zone')).toThrow(ValidationError);
  });

  it('validates culture IDs and integer GeoIDs against reference data', () => {
    vi.mocked(cultureExists).mockReturnValue(true);
    vi.mocked(geoIdExists).mockReturnValue(true);
    expect(() => validateCultureId('en-US')).not.toThrow();
    expect(() => validateGeoId(244)).not.toThrow();

    vi.mocked(cultureExists).mockReturnValue(false);
    vi.mocked(geoIdExists).mockReturnValue(false);
    expect(() => validateCultureId('unknown')).toThrow(ValidationError);
    expect(() => validateGeoId(1.5)).toThrow(ValidationError);
    expect(() => validateGeoId(999999)).toThrow(ValidationError);
  });

  it('checks language tag format and parseable date-time values', () => {
    expect(() => validateLanguageTag('zh-Hans-CN')).not.toThrow();
    expect(() => validateLanguageTag('en_US')).toThrow(ValidationError);
    expect(() => validateIso8601('2026-11-06T12:00:00.000Z')).not.toThrow();
    expect(() => validateIso8601('not-a-date')).toThrow(ValidationError);
  });
});