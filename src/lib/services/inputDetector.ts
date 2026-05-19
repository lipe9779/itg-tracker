// ─── Input Detection Service ───
// Detects whether user input is a container number or Bill of Lading,
// and validates ISO 6346 check digit for container numbers.

export type InputType = 'container' | 'bill_of_lading' | 'unknown';

export interface InputDetectionResult {
  inputType: InputType;
  normalized: string;
  isValid: boolean;
  warnings: string[];
  inferredCarrierId?: string;
}

// ISO 6346 character values for check digit calculation
const ISO6346_CHAR_VALUES: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
  J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
  S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

/**
 * Validates ISO 6346 check digit for a container number.
 * Container format: 4 letters + 7 digits (last digit is check digit)
 */
export function validateISO6346CheckDigit(containerNumber: string): boolean {
  const upper = containerNumber.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z]{4}\d{7}$/.test(upper)) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = upper[i];
    let value: number;
    if (/[A-Z]/.test(char)) {
      value = ISO6346_CHAR_VALUES[char] ?? 0;
    } else {
      value = parseInt(char, 10);
    }
    sum += value * Math.pow(2, i);
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 0 : remainder;
  return checkDigit === parseInt(upper[10], 10);
}

/**
 * Checks if a string looks like a container number (ISO 6346-like format).
 * 4 letters followed by 7 digits.
 */
export function isContainerNumberFormat(input: string): boolean {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z]{4}\d{7}$/.test(cleaned);
}

/**
 * Extracts tracking number and infers carrier from a URL string if applicable.
 */
export function extractTrackingNumberFromUrl(input: string): { trackingNumber: string; inferredCarrierId?: string } {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed) && !/^www\./i.test(trimmed)) {
    return { trackingNumber: trimmed };
  }

  let urlStr = trimmed;
  if (/^www\./i.test(trimmed)) {
    urlStr = 'http://' + trimmed;
  }

  try {
    const url = new URL(urlStr);
    
    let inferredCarrierId: string | undefined;
    const hostname = url.hostname.toLowerCase();
    if (hostname.includes('cosco')) inferredCarrierId = 'cosco';
    else if (hostname.includes('maersk')) inferredCarrierId = 'maersk';
    else if (hostname.includes('msc.')) inferredCarrierId = 'msc';
    else if (hostname.includes('cma-cgm') || hostname.includes('cmacgm')) inferredCarrierId = 'cmacgm';
    else if (hostname.includes('hapag')) inferredCarrierId = 'hapag-lloyd';
    else if (hostname.includes('one-line')) inferredCarrierId = 'one';
    else if (hostname.includes('evergreen')) inferredCarrierId = 'evergreen';
    else if (hostname.includes('oocl')) inferredCarrierId = 'oocl';
    else if (hostname.includes('yangming')) inferredCarrierId = 'yangming';
    else if (hostname.includes('zim.')) inferredCarrierId = 'zim';
    else if (hostname.includes('hmm')) inferredCarrierId = 'hmm';
    else if (hostname.includes('pilship')) inferredCarrierId = 'pil';
    else if (hostname.includes('wanhai')) inferredCarrierId = 'wanhai';
    else if (hostname.includes('matson')) inferredCarrierId = 'matson';
    else if (hostname.includes('seaboard')) inferredCarrierId = 'seaboard';

    const params = ['number', 'container', 'bl', 'booking', 'ref', 'query', 'q', 'consnumber', 'Reference'];
    for (const param of params) {
      const val = url.searchParams.get(param);
      if (val && val.trim().length >= 6) {
        return { trackingNumber: val.trim(), inferredCarrierId };
      }
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      for (let i = pathSegments.length - 1; i >= 0; i--) {
        const seg = pathSegments[i];
        if (/^[a-zA-Z0-9_-]{6,30}$/.test(seg)) {
          const cleaned = seg.replace(/[-_]/g, '');
          if (cleaned.length >= 6) {
            return { trackingNumber: cleaned, inferredCarrierId };
          }
        }
      }
    }
  } catch (e) {
    // Ignore and fall back
  }

  return { trackingNumber: trimmed };
}

/**
 * Detects input type and validates it.
 */
export function detectInput(rawInput: string): InputDetectionResult {
  const { trackingNumber, inferredCarrierId } = extractTrackingNumberFromUrl(rawInput);
  
  const normalized = trackingNumber.toUpperCase().replace(/[\s-]/g, '');
  const warnings: string[] = [];

  // Check for container number format
  if (isContainerNumberFormat(normalized)) {
    const checkDigitValid = validateISO6346CheckDigit(normalized);
    if (!checkDigitValid) {
      warnings.push(
        'Container number check digit is invalid. This may not be a valid ISO 6346 container number, but we will attempt tracking anyway.'
      );
    }
    return {
      inputType: 'container',
      normalized,
      isValid: checkDigitValid,
      warnings,
      inferredCarrierId,
    };
  }

  // Check for Bill of Lading patterns
  if (/^[A-Z0-9]{6,30}$/.test(normalized) && normalized.length >= 6) {
    return {
      inputType: 'bill_of_lading',
      normalized,
      isValid: true,
      warnings: [],
      inferredCarrierId,
    };
  }

  // If it's too short or has invalid characters
  if (normalized.length < 4) {
    warnings.push('Input is too short to be a valid tracking number.');
  }

  return {
    inputType: 'unknown',
    normalized,
    isValid: false,
    warnings,
    inferredCarrierId,
  };
}
