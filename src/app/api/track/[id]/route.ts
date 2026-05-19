// GET /api/track/[id] - Get tracking request status and result
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id.startsWith('virtual_')) {
      const base64Part = id.substring(8);
      // Pad base64 if needed
      const padded = base64Part.padEnd(base64Part.length + (4 - (base64Part.length % 4)) % 4, '=');
      const userInput = Buffer.from(padded, 'base64').toString('utf-8');

      const { detectInput } = await import('@/lib/services/inputDetector');
      const { getBestCarrierMatch } = await import('@/lib/services/carrierDetector');
      const { getTrackingProvider, MockTrackingProvider } = await import('@/lib/services/trackingProviders');
      const { buildTrackingUrl } = await import('@/lib/services/carrierRegistry');

      const detection = detectInput(userInput);
      const carrierMatch = getBestCarrierMatch(
        detection.normalized,
        detection.inputType,
        detection.inferredCarrierId
      );

      // Check MOCK_MODE from environment
      const MOCK_MODE = process.env.MOCK_MODE === 'true';

      let result;
      if (MOCK_MODE) {
        const mockProvider = new MockTrackingProvider();
        result = await mockProvider.track(detection.normalized, detection.inputType, carrierMatch?.carrier);
      } else if (carrierMatch) {
        const provider = getTrackingProvider(carrierMatch.carrier.id);
        if (provider) {
          result = await provider.track(detection.normalized, detection.inputType);
        } else {
          const trackingUrl = buildTrackingUrl(carrierMatch.carrier, detection.normalized);
          result = {
            carrierName: carrierMatch.carrier.carrierName,
            containerNumber: detection.inputType === 'container' ? detection.normalized : undefined,
            billOfLadingNumber: detection.inputType === 'bill_of_lading' ? detection.normalized : undefined,
            sourceType: 'official_tracking_page',
            sourceUrl: trackingUrl,
            confidenceScore: carrierMatch.confidence,
            currentStatus: 'Automated tracking not available for this carrier',
            error: `No tracking provider implemented for ${carrierMatch.carrier.carrierName}. Please visit the official tracking page.`,
            errorCode: 'unsupported_carrier',
          };
        }
      } else {
        const hint =
          detection.inputType === 'bill_of_lading'
            ? 'We could not recognise the carrier from this Bill of Lading number. Please double-check the number, or select the issuing carrier manually so we can route you to the correct tracking page.'
            : 'We could not recognise the carrier from this tracking number. Please verify the number, or select the carrier manually.';
        result = {
          carrierName: 'Unknown',
          containerNumber: detection.inputType === 'container' ? detection.normalized : undefined,
          billOfLadingNumber: detection.inputType === 'bill_of_lading' ? detection.normalized : undefined,
          sourceType: 'manual_review',
          confidenceScore: 0,
          currentStatus: 'Carrier could not be identified',
          error: hint,
          errorCode: 'carrier_not_identified',
        };
      }

      return NextResponse.json({
        id: id,
        userInput: detection.normalized,
        inputType: detection.inputType,
        detectedCarrier: carrierMatch?.carrier.carrierName ?? null,
        carrierConfidenceScore: carrierMatch?.confidence ?? null,
        status: result.error ? 'failed' : 'completed',
        errorReason: result.error ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        result: {
          carrierName: result.carrierName,
          containerNumber: result.containerNumber ?? null,
          billOfLadingNumber: result.billOfLadingNumber ?? null,
          vesselName: result.vesselName ?? null,
          portOfLoading: result.portOfLoading ?? null,
          portOfDischarge: result.portOfDischarge ?? null,
          etd: result.etd ?? null,
          eta: result.eta ?? null,
          currentStatus: result.currentStatus ?? null,
          lastEventLocation: result.lastEventLocation ?? null,
          lastEventDate: result.lastEventDate ?? null,
          sourceType: result.sourceType,
          sourceUrl: result.sourceUrl ?? null,
          confidenceScore: result.confidenceScore,
          createdAt: new Date().toISOString(),
        }
      });
    }

    const trackingRequest = await prisma.trackingRequest.findUnique({
      where: { id },
      include: {
        TrackingResult: true,
      },
    });

    if (!trackingRequest) {
      return NextResponse.json(
        { error: 'Tracking request not found.' },
        { status: 404 }
      );
    }

    const result = trackingRequest.TrackingResult[0] ?? null;

    return NextResponse.json({
      id: trackingRequest.id,
      userInput: trackingRequest.user_input,
      inputType: trackingRequest.input_type,
      detectedCarrier: trackingRequest.detected_carrier,
      carrierConfidenceScore: trackingRequest.carrier_confidence_score,
      status: trackingRequest.status,
      errorReason: trackingRequest.error_reason,
      createdAt: trackingRequest.created_at,
      updatedAt: trackingRequest.updated_at,
      result: result
        ? {
            carrierName: result.carrier_name,
            containerNumber: result.container_number,
            billOfLadingNumber: result.bill_of_lading_number,
            vesselName: result.vessel_name,
            portOfLoading: result.port_of_loading,
            portOfDischarge: result.port_of_discharge,
            etd: result.etd,
            eta: result.eta,
            currentStatus: result.current_status,
            lastEventLocation: result.last_event_location,
            lastEventDate: result.last_event_date,
            sourceType: result.source_type,
            sourceUrl: result.source_url,
            confidenceScore: result.confidence_score,
            createdAt: result.created_at,
          }
        : null,
    });
  } catch (err) {
    console.error('[API/track/id] Error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
