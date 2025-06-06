import { NextResponse } from 'next/server';

// Farcaster API endpoint for notifications
const FARCASTER_API_URL = 'https://api.farcaster.xyz/v2/notifications';

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const FARCASTER_API_KEY = process.env.FARCASTER_API_KEY;

    if (!FARCASTER_API_KEY) {
      return NextResponse.json(
        { error: 'Farcaster API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(FARCASTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FARCASTER_API_KEY}`,
      },
      body: JSON.stringify({
        recipient: userId,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 