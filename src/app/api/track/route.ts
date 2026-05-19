// POST /api/track - Submit a new tracking request
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectInput } from '@/lib/services/inputDetector';
import { processTrackingRequest } from '@/lib/services/jobQueue';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const userInput = body.trackingNumber?.trim();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid tracking number.' },
        { status: 400 }
      );
    }

    // Detect input type (handles URLs and normal inputs)
    const detection = detectInput(userInput);

    // Sanitize the extracted tracking number - alphanumeric, hyphens, spaces only
    const sanitized = detection.normalized.replace(/[^a-zA-Z0-9\s\-]/g, '');
    if (sanitized.length < 4 || sanitized.length > 50) {
      return NextResponse.json(
        { error: 'Tracking number must be between 4 and 50 characters.' },
        { status: 400 }
      );
    }

    // Create tracking request
    let trackingRequest;
    try {
      trackingRequest = await prisma.trackingRequest.create({
        data: {
          user_input: sanitized,
          input_type: detection.inputType,
          status: 'queued',
        },
      });

      // Fire-and-forget background processing
      processTrackingRequest(trackingRequest.id).catch((err) =>
        console.error('[API/track] Background job error:', err)
      );

      return NextResponse.json({
        id: trackingRequest.id,
        status: 'queued',
        inputType: detection.inputType,
        warnings: detection.warnings,
      });
    } catch (dbErr) {
      console.warn('[API/track] Database write failed. Falling back to serverless virtual state:', dbErr);
      
      // Generate a virtual base64 ID to bypass read-only SQLite limitation on Vercel
      const virtualId = `virtual_${Buffer.from(sanitized).toString('base64').replace(/=/g, '')}`;
      return NextResponse.json({
        id: virtualId,
        status: 'completed',
        inputType: detection.inputType,
        warnings: detection.warnings,
      });
    }
  } catch (err) {
    console.error('[API/track] Error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
