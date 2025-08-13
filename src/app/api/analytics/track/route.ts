import { NextRequest, NextResponse } from 'next/server';
import { insertAnalyticsEvent, upsertUserSession, recordEpochCompletion } from '../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventType, 
      epochId, 
      imageIndex, 
      userId, 
      timestamp,
      sessionId 
    } = body;

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || undefined;

    // Insert analytics event into database
    await insertAnalyticsEvent({
      eventType,
      epochId,
      imageIndex,
      userId,
      sessionId,
      userAgent,
      ipAddress,
      additionalData: { timestamp }
    });

    // Update user session
    if (sessionId) {
      await upsertUserSession({
        sessionId,
        userId,
        userAgent,
        ipAddress
      });
    }

    // Record epoch completion if this is an epoch_completion event
    if (eventType === 'epoch_completion' && epochId) {
      await recordEpochCompletion({
        epochId,
        userId,
        sessionId,
        totalImages: imageIndex || 0
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
