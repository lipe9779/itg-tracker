// ─── Carrier Registry ───
// Static registry of major ocean carriers with prefix mappings and tracking URLs.

export interface CarrierDefinition {
  id: string;
  carrierName: string;
  carrierCode: string;
  scacCode: string;
  containerPrefixes: string[];
  blPrefixes: string[];
  trackingUrl: string;
  trackingUrlTemplate?: string;
  apiAvailable: boolean;
  apiDocumentationUrl?: string;
  parserStrategy: string;
  supportedLookupTypes: ('container' | 'bill_of_lading' | 'booking')[];
  website: string;
  notes: string;
}

export const CARRIER_REGISTRY: CarrierDefinition[] = [
  {
    id: 'maersk',
    carrierName: 'Maersk',
    carrierCode: 'MAEU',
    scacCode: 'MAEU',
    containerPrefixes: ['MSKU', 'MRKU', 'MRSU', 'MAEU'],
    blPrefixes: ['MAEU', 'MSKU'],
    trackingUrl: 'https://www.maersk.com/tracking/',
    trackingUrlTemplate: 'https://www.maersk.com/tracking/{number}',
    apiAvailable: true,
    apiDocumentationUrl: 'https://api.maersk.com/',
    parserStrategy: 'maersk_api',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.maersk.com',
    notes: 'Maersk offers a public tracking API. Container prefixes MSKU, MRKU, MRSU are common.',
  },
  {
    id: 'msc',
    carrierName: 'MSC (Mediterranean Shipping Company)',
    carrierCode: 'MSCU',
    scacCode: 'MSCU',
    containerPrefixes: ['MSCU', 'MEDU', 'MSDU'],
    blPrefixes: ['MSCU', 'MEDU'],
    trackingUrl: 'https://www.msc.com/track-a-shipment',
    trackingUrlTemplate: 'https://www.msc.com/track-a-shipment?query={number}',
    apiAvailable: false,
    parserStrategy: 'msc_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.msc.com',
    notes: 'MSC uses JavaScript-heavy tracking page. May require CAPTCHA.',
  },
  {
    id: 'cmacgm',
    carrierName: 'CMA CGM',
    carrierCode: 'CMDU',
    scacCode: 'CMDU',
    containerPrefixes: ['CMAU', 'CMCU', 'CGMU'],
    blPrefixes: ['CMAU', 'CMDU'],
    trackingUrl: 'https://www.cma-cgm.com/ebusiness/tracking',
    trackingUrlTemplate: 'https://www.cma-cgm.com/ebusiness/tracking/search?Reference={number}',
    apiAvailable: false,
    parserStrategy: 'cmacgm_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.cma-cgm.com',
    notes: 'CMA CGM tracking page uses dynamic JavaScript rendering.',
  },
  {
    id: 'hapag-lloyd',
    carrierName: 'Hapag-Lloyd',
    carrierCode: 'HLCU',
    scacCode: 'HLCU',
    containerPrefixes: ['HLCU', 'HLXU'],
    blPrefixes: ['HLCU', 'HLXU'],
    trackingUrl: 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html',
    trackingUrlTemplate: 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={number}',
    apiAvailable: false,
    parserStrategy: 'hapag_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.hapag-lloyd.com',
    notes: 'Hapag-Lloyd tracking may require login for full details.',
  },
  {
    id: 'one',
    carrierName: 'Ocean Network Express (ONE)',
    carrierCode: 'ONEY',
    scacCode: 'ONEY',
    containerPrefixes: ['ONEU', 'KKFU', 'NYKU', 'MOFU'],
    blPrefixes: ['ONEY', 'ONEU'],
    trackingUrl: 'https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking',
    trackingUrlTemplate: 'https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?redir=Y&cntr={number}',
    apiAvailable: false,
    parserStrategy: 'one_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.one-line.com',
    notes: 'ONE inherited containers from NYK, MOL, and K-Line.',
  },
  {
    id: 'evergreen',
    carrierName: 'Evergreen Marine',
    carrierCode: 'EGLV',
    scacCode: 'EGLV',
    containerPrefixes: ['EISU', 'EGHU', 'EGSU', 'EMCU'],
    blPrefixes: ['EGLV'],
    trackingUrl: 'https://www.evergreen-line.com/dynamic_page/cargo-tracking',
    apiAvailable: false,
    parserStrategy: 'evergreen_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.evergreen-line.com',
    notes: 'Evergreen tracking page.',
  },
  {
    id: 'cosco',
    carrierName: 'COSCO Shipping',
    carrierCode: 'COSU',
    scacCode: 'COSU',
    containerPrefixes: ['CCLU', 'COSU', 'CBHU', 'CSNU', 'CSLU'],
    blPrefixes: ['COSU', 'CCLU'],
    trackingUrl: 'https://www.coscoshipping.it/cargo-tracking',
    trackingUrlTemplate: 'https://www.coscoshipping.it/cargo-tracking/bill/{number}',
    apiAvailable: false,
    parserStrategy: 'cosco_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.coscoshipping.com',
    notes: 'COSCO tracking page.',
  },
  {
    id: 'oocl',
    carrierName: 'OOCL',
    carrierCode: 'OOLU',
    scacCode: 'OOLU',
    containerPrefixes: ['OOLU', 'OOCU'],
    blPrefixes: ['OOLU'],
    trackingUrl: 'https://www.oocl.com/eng/ourservices/eservices/cargotracking/',
    apiAvailable: false,
    parserStrategy: 'oocl_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.oocl.com',
    notes: 'OOCL tracking page.',
  },
  {
    id: 'yangming',
    carrierName: 'Yang Ming',
    carrierCode: 'YMLU',
    scacCode: 'YMLU',
    containerPrefixes: ['YMLU', 'YMMU'],
    blPrefixes: ['YMLU'],
    trackingUrl: 'https://www.yangming.com/e-service/track-trace/track-trace.aspx',
    apiAvailable: false,
    parserStrategy: 'yangming_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.yangming.com',
    notes: 'Yang Ming tracking page.',
  },
  {
    id: 'zim',
    carrierName: 'ZIM',
    carrierCode: 'ZIMU',
    scacCode: 'ZIMU',
    containerPrefixes: ['ZIMU', 'ZCSU'],
    blPrefixes: ['ZIMU'],
    trackingUrl: 'https://www.zim.com/tools/track-a-shipment',
    trackingUrlTemplate: 'https://www.zim.com/tools/track-a-shipment?consnumber={number}',
    apiAvailable: false,
    parserStrategy: 'zim_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.zim.com',
    notes: 'ZIM tracking page.',
  },
  {
    id: 'hmm',
    carrierName: 'HMM (Hyundai Merchant Marine)',
    carrierCode: 'HDMU',
    scacCode: 'HDMU',
    containerPrefixes: ['HDMU', 'HMMU'],
    blPrefixes: ['HDMU'],
    trackingUrl: 'https://www.hmm21.com/cms/business/ebiz/trackTrace/trackTrace/index.jsp',
    apiAvailable: false,
    parserStrategy: 'hmm_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.hmm21.com',
    notes: 'HMM tracking page.',
  },
  {
    id: 'pil',
    carrierName: 'Pacific International Lines (PIL)',
    carrierCode: 'PILU',
    scacCode: 'PCIU',
    containerPrefixes: ['PCIU', 'PILU'],
    blPrefixes: ['PCIU', 'PILU'],
    trackingUrl: 'https://www.pilship.com/en--/120.html',
    apiAvailable: false,
    parserStrategy: 'pil_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.pilship.com',
    notes: 'PIL tracking page.',
  },
  {
    id: 'wanhai',
    carrierName: 'Wan Hai Lines',
    carrierCode: 'WHLC',
    scacCode: 'WHLC',
    containerPrefixes: ['WHLU', 'WHSU'],
    blPrefixes: ['WHLC'],
    trackingUrl: 'https://www.wanhai.com/views/cargoTrack/CargoTrack.xhtml',
    apiAvailable: false,
    parserStrategy: 'wanhai_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.wanhai.com',
    notes: 'Wan Hai tracking page.',
  },
  {
    id: 'matson',
    carrierName: 'Matson',
    carrierCode: 'MATS',
    scacCode: 'MATS',
    containerPrefixes: ['MATU'],
    blPrefixes: ['MATS'],
    trackingUrl: 'https://www.matson.com/shipment-tracking.html',
    apiAvailable: false,
    parserStrategy: 'matson_web',
    supportedLookupTypes: ['container', 'bill_of_lading', 'booking'],
    website: 'https://www.matson.com',
    notes: 'Matson tracking page. Primarily Pacific routes.',
  },
  {
    id: 'seaboard',
    carrierName: 'Seaboard Marine',
    carrierCode: 'SMLU',
    scacCode: 'SMLU',
    containerPrefixes: ['SMLU', 'SMCU'],
    blPrefixes: ['SMLU'],
    trackingUrl: 'https://www.seaboardmarine.com/tracking',
    apiAvailable: false,
    parserStrategy: 'seaboard_web',
    supportedLookupTypes: ['container', 'bill_of_lading'],
    website: 'https://www.seaboardmarine.com',
    notes: 'Seaboard Marine tracking page. Caribbean and Latin America routes.',
  },
];

/**
 * Get a carrier by its ID.
 */
export function getCarrierById(id: string): CarrierDefinition | undefined {
  return CARRIER_REGISTRY.find((c) => c.id === id);
}

/**
 * Get all carriers.
 */
export function getAllCarriers(): CarrierDefinition[] {
  return CARRIER_REGISTRY;
}

/**
 * Build a tracking URL for a given carrier and tracking number.
 */
export function buildTrackingUrl(carrier: CarrierDefinition, trackingNumber: string): string {
  if (carrier.trackingUrlTemplate) {
    return carrier.trackingUrlTemplate.replace('{number}', trackingNumber);
  }
  return carrier.trackingUrl;
}
