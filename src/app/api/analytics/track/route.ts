import { NextRequest, NextResponse } from 'next/server';
import { insertAnalyticsEvent, upsertUserSession, recordEpochCompletion } from '../../../lib/db';

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
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     undefined;

    // Make database operations non-blocking for better performance
    // Only await critical operations, let others run in background
    const analyticsPromise = insertAnalyticsEvent({
      eventType,
      epochId,
      imageIndex,
      userId,
      sessionId,
      userAgent,
      ipAddress,
      additionalData: { timestamp }
    }).catch(error => {
      console.error('Analytics insert error:', error);
    });

    // Update user session in background
    if (sessionId) {
      upsertUserSession({
        sessionId,
        userId,
        userAgent,
        ipAddress
      }).catch(error => {
        console.error('Session upsert error:', error);
      });
    }

    // Record epoch completion if this is an epoch_completion event
    if (eventType === 'epoch_completion' && epochId) {
      recordEpochCompletion({
        epochId,
        userId,
        sessionId,
        totalImages: imageIndex || 0
      }).catch(error => {
        console.error('Epoch completion error:', error);
      });
    }

    // Only wait for the main analytics insert
    await analyticsPromise;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request, just log the error
    return NextResponse.json({ success: false, error: 'Analytics tracking failed' }, { status: 200 });
  }
}
