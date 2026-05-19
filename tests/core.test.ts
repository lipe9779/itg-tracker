import { describe, it, expect } from 'vitest';
import {
  detectInput,
  isContainerNumberFormat,
  validateISO6346CheckDigit,
} from '../src/lib/services/inputDetector';
import { detectCarrier, getBestCarrierMatch } from '../src/lib/services/carrierDetector';
import { CARRIER_REGISTRY } from '../src/lib/services/carrierRegistry';

// ─── Input Detection Tests ───

describe('isContainerNumberFormat', () => {
  it('accepts valid container number format', () => {
    expect(isContainerNumberFormat('MSKU1234567')).toBe(true);
    expect(isContainerNumberFormat('MSCU1234567')).toBe(true);
    expect(isContainerNumberFormat('CMAU5678901')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isContainerNumberFormat('MSK1234567')).toBe(false); // only 3 letters
    expect(isContainerNumberFormat('MSKU123456')).toBe(false); // only 6 digits
    expect(isContainerNumberFormat('MSKU12345678')).toBe(false); // 8 digits
    expect(isContainerNumberFormat('1234MSKU567')).toBe(false); // digits first
    expect(isContainerNumberFormat('')).toBe(false);
    expect(isContainerNumberFormat('AB')).toBe(false);
  });

  it('handles spaces and hyphens', () => {
    expect(isContainerNumberFormat('MSKU 1234567')).toBe(true);
    expect(isContainerNumberFormat('MSKU-1234567')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isContainerNumberFormat('msku1234567')).toBe(true);
  });
});

describe('validateISO6346CheckDigit', () => {
  // CSQU3054383 is a known valid container
  it('validates known valid container numbers', () => {
    expect(validateISO6346CheckDigit('CSQU3054383')).toBe(true);
  });

  it('rejects container with wrong check digit', () => {
    expect(validateISO6346CheckDigit('CSQU3054380')).toBe(false);
  });

  it('rejects non-container-format strings', () => {
    expect(validateISO6346CheckDigit('ABCDE')).toBe(false);
    expect(validateISO6346CheckDigit('')).toBe(false);
  });
});

describe('detectInput', () => {
  it('detects container number input', () => {
    const result = detectInput('MSKU1234567');
    expect(result.inputType).toBe('container');
    expect(result.normalized).toBe('MSKU1234567');
  });

  it('detects Bill of Lading input', () => {
    const result = detectInput('MAEU123456789012');
    expect(result.inputType).toBe('bill_of_lading');
  });

  it('marks too short input as unknown', () => {
    const result = detectInput('AB');
    expect(result.inputType).toBe('unknown');
    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns about invalid check digit', () => {
    const result = detectInput('MSKU1234560'); // likely invalid check digit
    expect(result.inputType).toBe('container');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('extracts tracking number and infers carrier from full URLs', () => {
    const result = detectInput('https://www.coscoshipping.it/cargo-tracking/bill/COSU6451850080');
    expect(result.inputType).toBe('bill_of_lading');
    expect(result.normalized).toBe('COSU6451850080');
    expect(result.inferredCarrierId).toBe('cosco');
  });

  it('extracts tracking number from query parameters', () => {
    const result = detectInput('https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=CONTAINER&number=MSKU1234567');
    expect(result.inputType).toBe('container');
    expect(result.normalized).toBe('MSKU1234567');
    expect(result.inferredCarrierId).toBe('cosco');
  });
});

// ─── Carrier Detection Tests ───

describe('detectCarrier', () => {
  it('detects Maersk from container prefix MSKU', () => {
    const matches = detectCarrier('MSKU1234567', 'container');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].carrier.carrierName).toBe('Maersk');
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects MSC from container prefix MSCU', () => {
    const matches = detectCarrier('MSCU9876543', 'container');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].carrier.id).toBe('msc');
  });

  it('detects CMA CGM from container prefix CMAU', () => {
    const matches = detectCarrier('CMAU5555555', 'container');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].carrier.id).toBe('cmacgm');
  });

  it('detects Hapag-Lloyd from prefix HLCU', () => {
    const matches = detectCarrier('HLCU1111111', 'container');
    expect(matches[0].carrier.id).toBe('hapag-lloyd');
  });

  it('detects carrier from BL prefix', () => {
    const matches = detectCarrier('MAEU123456789', 'bill_of_lading');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].carrier.carrierName).toBe('Maersk');
  });

  it('returns empty matches for unknown prefix', () => {
    const matches = detectCarrier('ZZZZ1234567', 'container');
    expect(matches.length).toBe(0);
  });
});

describe('getBestCarrierMatch', () => {
  it('returns best match for known container', () => {
    const match = getBestCarrierMatch('MSKU1234567', 'container');
    expect(match).not.toBeNull();
    expect(match!.carrier.carrierName).toBe('Maersk');
  });

  it('returns null for unknown container', () => {
    const match = getBestCarrierMatch('ZZZZ1234567', 'container');
    expect(match).toBeNull();
  });
});

// ─── BL prefix coverage ───

describe('Bill of Lading carrier detection', () => {
  it('detects MSC from BL prefix MEDU', () => {
    const m = getBestCarrierMatch('MEDUXY12345678', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('msc');
  });

  it('detects ONE from BL prefix ONEY', () => {
    const m = getBestCarrierMatch('ONEYTSNGA1234567', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('one');
  });

  it('detects Evergreen from BL prefix EGLV', () => {
    const m = getBestCarrierMatch('EGLV148000123456', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('evergreen');
  });

  it('detects Hapag-Lloyd from BL prefix HLCU', () => {
    const m = getBestCarrierMatch('HLCUSHA1234567', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('hapag-lloyd');
  });

  it('detects COSCO from BL prefix COSU', () => {
    const m = getBestCarrierMatch('COSU6451850080', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('cosco');
  });

  it('detects ZIM from BL prefix ZIMU', () => {
    const m = getBestCarrierMatch('ZIMU1234567890', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('zim');
  });

  it('detects HMM from BL prefix HDMU', () => {
    const m = getBestCarrierMatch('HDMUABCD1234567', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('hmm');
  });

  it('detects Yang Ming from BL prefix YMLU', () => {
    const m = getBestCarrierMatch('YMLUW123456789', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('yangming');
  });

  it('detects CMA CGM via APLU (American President Lines, CMA CGM group)', () => {
    const m = getBestCarrierMatch('APLU123456789', 'bill_of_lading');
    expect(m).not.toBeNull();
    expect(m!.carrier.id).toBe('cmacgm');
  });

  it('prefers longer BL prefix when multiple match (ONEY over ONE)', () => {
    const matches = detectCarrier('ONEYTSNGA1234567', 'bill_of_lading');
    // Wan Hai uses 'WHL' (no overlap); but make sure ONE wins for ONEY.
    expect(matches[0].carrier.id).toBe('one');
    expect(matches[0].matchReason).toContain('ONEY');
  });

  it('returns no match for an unrecognised BL number', () => {
    const m = getBestCarrierMatch('XYZQ123456789', 'bill_of_lading');
    expect(m).toBeNull();
  });

  it('exposes an official tracking URL for matched BL via the registry helper', async () => {
    const m = getBestCarrierMatch('COSU6451850080', 'bill_of_lading');
    expect(m).not.toBeNull();
    const { buildTrackingUrl } = await import('../src/lib/services/carrierRegistry');
    const url = buildTrackingUrl(m!.carrier, 'COSU6451850080');
    expect(url).toMatch(/^https?:\/\//);
    expect(url.toLowerCase()).toContain('cosco');
  });
});

// ─── Carrier Registry Tests ───

describe('CARRIER_REGISTRY', () => {
  it('contains at least 15 carriers', () => {
    expect(CARRIER_REGISTRY.length).toBeGreaterThanOrEqual(15);
  });

  it('all carriers have required fields', () => {
    for (const carrier of CARRIER_REGISTRY) {
      expect(carrier.id).toBeTruthy();
      expect(carrier.carrierName).toBeTruthy();
      expect(carrier.carrierCode).toBeTruthy();
      expect(carrier.trackingUrl).toBeTruthy();
      expect(carrier.containerPrefixes.length).toBeGreaterThan(0);
      expect(carrier.supportedLookupTypes.length).toBeGreaterThan(0);
    }
  });

  it('Maersk is in the registry', () => {
    const maersk = CARRIER_REGISTRY.find((c) => c.id === 'maersk');
    expect(maersk).toBeDefined();
    expect(maersk!.containerPrefixes).toContain('MSKU');
  });
});
