// ─── Carrier Detection Service ───
// Identifies the most likely carrier from a container number or BL number.

import { InputType } from './inputDetector';
import { CARRIER_REGISTRY, CarrierDefinition } from './carrierRegistry';

export interface CarrierMatch {
  carrier: CarrierDefinition;
  confidence: number;
  matchReason: string;
}

/**
 * Detect carrier from a container number prefix (first 4 letters = owner code).
 */
function detectFromContainerPrefix(input: string): CarrierMatch[] {
  const prefix = input.substring(0, 4).toUpperCase();
  const matches: CarrierMatch[] = [];

  for (const carrier of CARRIER_REGISTRY) {
    if (carrier.containerPrefixes.includes(prefix)) {
      matches.push({
        carrier,
        confidence: 0.9,
        matchReason: `Container prefix "${prefix}" matches ${carrier.carrierName}`,
      });
    }
  }

  return matches;
}

/**
 * Detect carrier from a Bill of Lading prefix.
 * Picks the LONGEST matching prefix per carrier (so "ONEY" beats "ONE").
 */
function detectFromBLPrefix(input: string): CarrierMatch[] {
  const upper = input.toUpperCase();
  const matches: CarrierMatch[] = [];

  for (const carrier of CARRIER_REGISTRY) {
    let best: { prefix: string; len: number } | null = null;
    for (const blPrefix of carrier.blPrefixes) {
      if (upper.startsWith(blPrefix) && (!best || blPrefix.length > best.len)) {
        best = { prefix: blPrefix, len: blPrefix.length };
      }
    }
    if (best) {
      // Longer prefixes give slightly higher confidence (more specific match).
      const confidence = Math.min(0.85, 0.7 + best.len * 0.02);
      matches.push({
        carrier,
        confidence,
        matchReason: `BL prefix "${best.prefix}" matches ${carrier.carrierName}`,
      });
    }
  }

  return matches;
}

/**
 * Detect carrier from SCAC code embedded at start of a BL number.
 * Some carriers use their SCAC as a BL head (e.g. EGLV1234567).
 * Acts as a last-resort match when no explicit BL prefix matched.
 */
function detectFromScacCode(input: string): CarrierMatch[] {
  const upper = input.toUpperCase();
  const matches: CarrierMatch[] = [];

  for (const carrier of CARRIER_REGISTRY) {
    const scac = carrier.scacCode?.toUpperCase();
    if (scac && scac.length >= 3 && upper.startsWith(scac)) {
      const alreadyKnown = carrier.blPrefixes.some((p) => p.toUpperCase() === scac);
      if (!alreadyKnown) {
        matches.push({
          carrier,
          confidence: 0.65,
          matchReason: `SCAC code "${scac}" matches ${carrier.carrierName}`,
        });
      }
    }
  }

  return matches;
}

/**
 * Main carrier detection function.
 * Returns matches sorted by confidence (highest first).
 */
export function detectCarrier(
  input: string,
  inputType: InputType,
  inferredCarrierId?: string
): CarrierMatch[] {
  const matches: CarrierMatch[] = [];

  // If we have an inferred carrier (e.g. from URL hostname), prioritize it.
  if (inferredCarrierId) {
    const inferredCarrier = CARRIER_REGISTRY.find((c) => c.id === inferredCarrierId);
    if (inferredCarrier) {
      matches.push({
        carrier: inferredCarrier,
        confidence: 0.95,
        matchReason: `Carrier "${inferredCarrier.carrierName}" inferred from URL hostname`,
      });
    }
  }

  let prefixMatches: CarrierMatch[] = [];
  if (inputType === 'container') {
    prefixMatches = detectFromContainerPrefix(input);
  } else if (inputType === 'bill_of_lading') {
    prefixMatches = detectFromBLPrefix(input);
    // If no BL prefix match, try container prefix detection as fallback.
    if (prefixMatches.length === 0) {
      prefixMatches = detectFromContainerPrefix(input);
      // Lower confidence for cross-type match.
      prefixMatches = prefixMatches.map((m) => ({
        ...m,
        confidence: m.confidence * 0.6,
        matchReason: m.matchReason + ' (cross-type fallback)',
      }));
    }
    // Still nothing? Try SCAC codes as a last resort.
    if (prefixMatches.length === 0) {
      prefixMatches = detectFromScacCode(input);
    }
  }

  // Merge matches ensuring no duplicates by carrier id.
  for (const pm of prefixMatches) {
    if (!matches.some((m) => m.carrier.id === pm.carrier.id)) {
      matches.push(pm);
    }
  }

  // Sort by confidence descending.
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Get the best carrier match, or null if no match found.
 */
export function getBestCarrierMatch(
  input: string,
  inputType: InputType,
  inferredCarrierId?: string
): CarrierMatch | null {
  const matches = detectCarrier(input, inputType, inferredCarrierId);
  return matches.length > 0 ? matches[0] : null;
}
