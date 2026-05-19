// GET /api/track/[id] - Get tracking request status and result
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
