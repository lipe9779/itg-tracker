// ─── Tracking Provider Abstraction ───
// Defines the interface and implementations for carrier-specific tracking.

import { InputType } from './inputDetector';
import { CarrierDefinition, buildTrackingUrl } from './carrierRegistry';

export interface TrackingResult {
  carrierName: string;
  containerNumber?: string;
  billOfLadingNumber?: string;
  vesselName?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  etd?: string; // ISO date string
  eta?: string; // ISO date string
  currentStatus?: string;
  lastEventLocation?: string;
  lastEventDate?: string; // ISO date string
  sourceType: 'official_api' | 'official_tracking_page' | 'third_party_api' | 'manual_review' | 'mock_data';
  sourceUrl?: string;
  rawResponseJson?: string;
  confidenceScore: number;
  error?: string;
  errorCode?: TrackingErrorCode;
}

export type TrackingErrorCode =
  | 'carrier_not_identified'
  | 'website_blocks_automation'
  | 'captcha_required'
  | 'login_required'
  | 'no_shipment_found'
  | 'parser_failed'
  | 'network_error'
  | 'unsupported_carrier'
  | 'rate_limited'
  | 'unknown_error';

export interface TrackingProvider {
  carrierId: string;
  carrierName: string;
  supports(inputType: InputType): boolean;
  detectConfidence(input: string, inputType: InputType): number;
  track(input: string, inputType: InputType, carrier?: CarrierDefinition): Promise<TrackingResult>;
}

// ─── Third-Party Provider Interface ───
export interface ThirdPartyTrackingProvider {
  providerName: string;
  track(input: string, inputType: InputType, carrier?: CarrierDefinition): Promise<TrackingResult>;
}

// ─── Mock Provider (for testing) ───
export class MockTrackingProvider implements TrackingProvider {
  carrierId = 'mock';
  carrierName = 'Mock Carrier';

  supports(): boolean {
    return true;
  }

  detectConfidence(): number {
    return 1.0;
  }

  async track(input: string, inputType: InputType, carrier?: CarrierDefinition): Promise<TrackingResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const carrierName = carrier?.carrierName ?? 'Maersk';
    const trackingUrl = carrier ? buildTrackingUrl(carrier, input) : `https://www.maersk.com/tracking/${input}`;

    // Special test case for COSU6451850080
    if (input.toUpperCase() === 'COSU6451850080' || input === '6451850080') {
      return {
        carrierName: 'COSCO Shipping',
        containerNumber: 'CCLU6739485',
        billOfLadingNumber: 'COSU6451850080',
        vesselName: 'COSCO EGYPT',
        portOfLoading: 'Shanghai, China',
        portOfDischarge: 'Sokhna, Egypt',
        etd: '2026-05-10T12:00:00Z',
        eta: '2026-06-05T18:30:00Z',
        currentStatus: 'In Transit',
        lastEventLocation: 'Singapore Port',
        lastEventDate: '2026-05-17T06:00:00Z',
        sourceType: 'mock_data',
        sourceUrl: trackingUrl,
        confidenceScore: 0.95,
        rawResponseJson: JSON.stringify({
          mock: true,
          matchedTestScenario: 'COSU6451850080',
          originalCarrier: 'COSCO Shipping',
          routing: 'Shanghai to Sokhna (Egypt)',
          note: 'This mock data represents the exact test scenario for COSU6451850080.',
        }),
      };
    }

    const vesselName = `${carrierName.toUpperCase().split(' ')[0]} EXPRESS`;

    return {
      carrierName: carrierName,
      containerNumber: inputType === 'container' ? input : (carrier?.containerPrefixes[0] || 'MSKU') + '1234567',
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : (carrier?.blPrefixes[0] || 'MAEU') + '123456789',
      vesselName: vesselName,
      portOfLoading: 'Shanghai, China',
      portOfDischarge: 'Genoa, Italy',
      etd: '2026-06-01T00:00:00Z',
      eta: '2026-07-05T00:00:00Z',
      currentStatus: 'In Transit',
      lastEventLocation: 'Singapore',
      lastEventDate: '2026-06-15T08:00:00Z',
      sourceType: 'mock_data',
      sourceUrl: trackingUrl,
      confidenceScore: 0.85,
      rawResponseJson: JSON.stringify({
        mock: true,
        detectedCarrier: carrierName,
        note: 'This is mock data for UI testing. Not real shipment data.',
      }),
    };
  }
}

// ─── Base Carrier Provider (stub) ───
// Real carrier providers extend this. They construct the tracking URL
// and return a clear message that live scraping is not implemented.
class BaseCarrierProvider implements TrackingProvider {
  carrierId: string;
  carrierName: string;
  carrier: CarrierDefinition;

  constructor(carrier: CarrierDefinition) {
    this.carrierId = carrier.id;
    this.carrierName = carrier.carrierName;
    this.carrier = carrier;
  }

  supports(inputType: InputType): boolean {
    if (inputType === 'container') return this.carrier.supportedLookupTypes.includes('container');
    if (inputType === 'bill_of_lading') return this.carrier.supportedLookupTypes.includes('bill_of_lading');
    return false;
  }

  detectConfidence(input: string, inputType: InputType): number {
    if (inputType === 'container') {
      const prefix = input.substring(0, 4).toUpperCase();
      if (this.carrier.containerPrefixes.includes(prefix)) return 0.9;
    }
    if (inputType === 'bill_of_lading') {
      for (const blPrefix of this.carrier.blPrefixes) {
        if (input.toUpperCase().startsWith(blPrefix)) return 0.75;
      }
    }
    return 0;
  }

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    const trackingUrl = buildTrackingUrl(this.carrier, input);

    return {
      carrierName: this.carrierName,
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
      sourceType: 'official_tracking_page',
      sourceUrl: trackingUrl,
      confidenceScore: 0,
      currentStatus: 'Unable to retrieve — live tracking not implemented for this carrier',
      error: `Live tracking is not yet implemented for ${this.carrierName}. Please visit the official tracking page directly.`,
      errorCode: 'unsupported_carrier',
    };
  }
}

// ─── Maersk Provider ───
export class MaerskProvider extends BaseCarrierProvider {
  constructor(carrier: CarrierDefinition) {
    super(carrier);
  }

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    const trackingUrl = buildTrackingUrl(this.carrier, input);

    // Maersk has a public API, but requires API key
    const apiKey = process.env.MAERSK_API_KEY;
    if (!apiKey) {
      return {
        carrierName: this.carrierName,
        containerNumber: inputType === 'container' ? input : undefined,
        billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
        sourceType: 'official_tracking_page',
        sourceUrl: trackingUrl,
        confidenceScore: 0.9,
        currentStatus: 'API key not configured — visit official tracking page',
        error: 'Maersk API key (MAERSK_API_KEY) is not configured. Please set it in .env to enable live tracking, or visit the tracking page directly.',
        errorCode: 'unsupported_carrier',
      };
    }

    // If API key is set, attempt real API call
    try {
      const apiUrl = `https://api.maersk.com/track/${input}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Consumer-Key': apiKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          carrierName: this.carrierName,
          containerNumber: inputType === 'container' ? input : undefined,
          billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
          sourceType: 'official_api',
          sourceUrl: apiUrl,
          confidenceScore: 0.5,
          currentStatus: 'API returned an error',
          error: `Maersk API returned HTTP ${response.status}`,
          errorCode: response.status === 429 ? 'rate_limited' : 'network_error',
          rawResponseJson: await response.text(),
        };
      }

      const data = await response.json();
      return {
        carrierName: this.carrierName,
        containerNumber: inputType === 'container' ? input : undefined,
        billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
        vesselName: data.vesselName,
        portOfLoading: data.origin?.city,
        portOfDischarge: data.destination?.city,
        etd: data.departure,
        eta: data.arrival,
        currentStatus: data.status,
        lastEventLocation: data.latestEvent?.location,
        lastEventDate: data.latestEvent?.date,
        sourceType: 'official_api',
        sourceUrl: apiUrl,
        confidenceScore: 0.95,
        rawResponseJson: JSON.stringify(data),
      };
    } catch (err) {
      return {
        carrierName: this.carrierName,
        containerNumber: inputType === 'container' ? input : undefined,
        billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
        sourceType: 'official_api',
        sourceUrl: trackingUrl,
        confidenceScore: 0.3,
        currentStatus: 'Network error while contacting Maersk API',
        error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
        errorCode: 'network_error',
      };
    }
  }
}

// ─── MSC Provider ───
export class MSCProvider extends BaseCarrierProvider {
  constructor(carrier: CarrierDefinition) {
    super(carrier);
  }

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    const trackingUrl = buildTrackingUrl(this.carrier, input);

    return {
      carrierName: this.carrierName,
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
      sourceType: 'official_tracking_page',
      sourceUrl: trackingUrl,
      confidenceScore: 0.9,
      currentStatus: 'MSC tracking requires JavaScript-heavy page interaction',
      error: 'MSC tracking page uses CAPTCHA and dynamic JavaScript. Automated tracking is not reliably possible. Please visit the official tracking page.',
      errorCode: 'website_blocks_automation',
    };
  }
}

// ─── CMA CGM Provider ───
export class CMACGMProvider extends BaseCarrierProvider {
  constructor(carrier: CarrierDefinition) {
    super(carrier);
  }

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    const trackingUrl = buildTrackingUrl(this.carrier, input);

    return {
      carrierName: this.carrierName,
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
      sourceType: 'official_tracking_page',
      sourceUrl: trackingUrl,
      confidenceScore: 0.9,
      currentStatus: 'CMA CGM tracking requires dynamic page rendering',
      error: 'CMA CGM tracking page uses dynamic JavaScript rendering. Automated tracking is not yet implemented. Please visit the official tracking page.',
      errorCode: 'website_blocks_automation',
    };
  }
}

// ─── Provider Registry ───
import { CARRIER_REGISTRY } from './carrierRegistry';

const providerMap: Record<string, new (carrier: CarrierDefinition) => TrackingProvider> = {
  maersk: MaerskProvider,
  msc: MSCProvider,
  cmacgm: CMACGMProvider,
};

export function getTrackingProvider(carrierId: string): TrackingProvider | null {
  const carrier = CARRIER_REGISTRY.find((c) => c.id === carrierId);
  if (!carrier) return null;

  const ProviderClass = providerMap[carrierId] ?? BaseCarrierProvider;
  return new ProviderClass(carrier);
}

export function getMockProvider(): TrackingProvider {
  return new MockTrackingProvider();
}

// ─── Third-Party Provider Stubs ───
// These are placeholders for third-party tracking APIs that can be plugged in later.

export class ShipsGoProvider implements ThirdPartyTrackingProvider {
  providerName = 'ShipsGo';

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    const apiKey = process.env.SHIPSGO_API_KEY;
    if (!apiKey) {
      return {
        carrierName: 'Unknown',
        sourceType: 'third_party_api',
        confidenceScore: 0,
        currentStatus: 'ShipsGo API key not configured',
        error: 'SHIPSGO_API_KEY environment variable is not set.',
        errorCode: 'unsupported_carrier',
        containerNumber: inputType === 'container' ? input : undefined,
        billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
      };
    }

    // Real implementation would go here
    return {
      carrierName: 'Unknown',
      sourceType: 'third_party_api',
      sourceUrl: 'https://shipsgo.com/api',
      confidenceScore: 0,
      currentStatus: 'ShipsGo integration not yet implemented',
      error: 'ShipsGo API integration is a placeholder. Implement real API call here.',
      errorCode: 'unsupported_carrier',
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
    };
  }
}

export class VizionProvider implements ThirdPartyTrackingProvider {
  providerName = 'Vizion';

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    return {
      carrierName: 'Unknown',
      sourceType: 'third_party_api',
      confidenceScore: 0,
      currentStatus: 'Vizion integration not yet implemented',
      error: 'Vizion API integration is a placeholder.',
      errorCode: 'unsupported_carrier',
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
    };
  }
}

export class Project44Provider implements ThirdPartyTrackingProvider {
  providerName = 'project44';

  async track(input: string, inputType: InputType): Promise<TrackingResult> {
    return {
      carrierName: 'Unknown',
      sourceType: 'third_party_api',
      confidenceScore: 0,
      currentStatus: 'project44 integration not yet implemented',
      error: 'project44 API integration is a placeholder.',
      errorCode: 'unsupported_carrier',
      containerNumber: inputType === 'container' ? input : undefined,
      billOfLadingNumber: inputType === 'bill_of_lading' ? input : undefined,
    };
  }
}
