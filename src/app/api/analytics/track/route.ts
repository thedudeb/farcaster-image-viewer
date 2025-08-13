import { NextRequest, NextResponse } from 'next/server';

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

    // Log the analytics data (you can replace this with your preferred storage)
    console.log('Analytics Event:', {
      eventType,
      epochId,
      imageIndex,
      userId,
      timestamp: new Date(timestamp).toISOString(),
      sessionId,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.ip
    });

    // Here you could store to a database, send to analytics service, etc.
    // For now, we'll just log it and you can add your preferred storage later

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
