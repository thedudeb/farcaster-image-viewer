import { NextRequest, NextResponse } from 'next/server';
import { insertAnalyticsEvent, upsertUserSession, recordEpochCompletion } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Analytics API: Starting to process request');
    
    const body = await request.json();
    const { 
      eventType, 
      epochId, 
      imageIndex, 
      userId, 
      timestamp,
      sessionId 
    } = body;

    console.log('Analytics API: Received event:', { eventType, epochId, imageIndex, userId, sessionId });

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     undefined;

    console.log('Analytics API: About to insert analytics event');

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
    }).then(() => {
      console.log('Analytics API: Event inserted successfully:', eventType);
    }).catch(error => {
      console.error('Analytics API: Insert error details:', {
        error: error.message,
        stack: error.stack,
        eventType,
        epochId,
        imageIndex
      });
    });

    console.log('Analytics API: About to update user session');

    // Update user session in background
    if (sessionId) {
      upsertUserSession({
        sessionId,
        userId,
        userAgent,
        ipAddress
      }).then(() => {
        console.log('Analytics API: Session updated successfully:', sessionId);
      }).catch(error => {
        console.error('Analytics API: Session upsert error details:', {
          error: error.message,
          stack: error.stack,
          sessionId
        });
      });
    }

    // Record epoch completion if this is an epoch_completion event
    if (eventType === 'epoch_completion' && epochId) {
      console.log('Analytics API: About to record epoch completion');
      recordEpochCompletion({
        epochId,
        userId,
        sessionId,
        totalImages: imageIndex || 0
      }).then(() => {
        console.log('Analytics API: Epoch completion recorded:', epochId);
      }).catch(error => {
        console.error('Analytics API: Epoch completion error details:', {
          error: error.message,
          stack: error.stack,
          epochId
        });
      });
    }

    console.log('Analytics API: Waiting for analytics promise');

    // Only wait for the main analytics insert
    await analyticsPromise;

    console.log('Analytics API: Request completed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API: Top-level error details:', {
      error: error.message,
      stack: error.stack
    });
    // Don't fail the request, just log the error
    return NextResponse.json({ success: false, error: 'Analytics tracking failed' }, { status: 200 });
  }
}
