// GET /api/admin/requests - List recent tracking requests (admin/debug)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const [requests, total] = await Promise.all([
      prisma.trackingRequest.findMany({
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        include: {
          TrackingResult: true,
        },
      }),
      prisma.trackingRequest.count(),
    ]);

    return NextResponse.json({
      total,
      limit,
      offset,
      requests: requests.map((r) => ({
        id: r.id,
        userInput: r.user_input,
        inputType: r.input_type,
        detectedCarrier: r.detected_carrier,
        carrierConfidenceScore: r.carrier_confidence_score,
        status: r.status,
        errorReason: r.error_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        result: r.TrackingResult[0]
          ? {
              carrierName: r.TrackingResult[0].carrier_name,
              containerNumber: r.TrackingResult[0].container_number,
              billOfLadingNumber: r.TrackingResult[0].bill_of_lading_number,
              vesselName: r.TrackingResult[0].vessel_name,
              portOfLoading: r.TrackingResult[0].port_of_loading,
              portOfDischarge: r.TrackingResult[0].port_of_discharge,
              etd: r.TrackingResult[0].etd,
              eta: r.TrackingResult[0].eta,
              currentStatus: r.TrackingResult[0].current_status,
              lastEventLocation: r.TrackingResult[0].last_event_location,
              lastEventDate: r.TrackingResult[0].last_event_date,
              sourceType: r.TrackingResult[0].source_type,
              sourceUrl: r.TrackingResult[0].source_url,
              rawResponseJson: r.TrackingResult[0].raw_response_json,
              confidenceScore: r.TrackingResult[0].confidence_score,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('[API/admin/requests] Error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
