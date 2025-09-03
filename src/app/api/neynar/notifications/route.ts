import { NextResponse } from 'next/server';
import { NeynarNotifications } from '@/app/lib/notifications';

export async function POST(request: Request) {
  try {
    const { message, userId, type = 'notification' } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    const neynar = new NeynarNotifications(neynarApiKey);

    // Get user info to verify they exist
    const user = await neynar.getUserByFid(parseInt(userId));
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, we'll return success since direct casting requires signer_uuid
    // In the future, this can be enhanced with actual casting capabilities
    const notificationData = {
      success: true,
      message: 'Notification prepared successfully',
      user: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
      },
      notification: {
        type,
        message,
        timestamp: new Date().toISOString(),
      },
      note: 'Direct casting requires user wallet connection (signer_uuid)',
    };

    console.log('Neynar notification prepared:', notificationData);

    return NextResponse.json(notificationData);
  } catch (error) {
    console.error('Error in Neynar notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to check Neynar API status and usage
export async function GET() {
  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    const neynar = new NeynarNotifications(neynarApiKey);
    const usage = await neynar.checkApiUsage();

    return NextResponse.json({
      status: 'active',
      provider: 'Neynar',
      tier: 'Free',
      usage,
      endpoints: [
        'User lookup (1000 calls/month)',
        'User casts (1000 calls/month)',
        'Trending feeds (1000 calls/month)',
        'Frame interactions (1000 calls/month)',
      ],
      note: 'Direct casting requires user wallet connection',
    });
  } catch (error) {
    console.error('Error checking Neynar status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
