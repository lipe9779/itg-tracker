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
 */
function detectFromBLPrefix(input: string): CarrierMatch[] {
  const matches: CarrierMatch[] = [];

  for (const carrier of CARRIER_REGISTRY) {
    for (const blPrefix of carrier.blPrefixes) {
      if (input.toUpperCase().startsWith(blPrefix)) {
        matches.push({
          carrier,
          confidence: 0.75,
          matchReason: `BL prefix "${blPrefix}" matches ${carrier.carrierName}`,
        });
        break;
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
  let matches: CarrierMatch[] = [];

  // If we have an inferred carrier, prioritize it at the top
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
    // If no BL prefix match, try container prefix detection as fallback
    if (prefixMatches.length === 0) {
      prefixMatches = detectFromContainerPrefix(input);
      // Lower confidence for cross-type match
      prefixMatches = prefixMatches.map((m) => ({
        ...m,
        confidence: m.confidence * 0.6,
        matchReason: m.matchReason + ' (cross-type fallback)',
      }));
    }
  }

  // Merge matches ensuring no duplicates
  for (const pm of prefixMatches) {
    if (!matches.some((m) => m.carrier.id === pm.carrier.id)) {
      matches.push(pm);
    }
  }

  // Sort by confidence descending
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
