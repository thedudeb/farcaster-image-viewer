import { NextResponse } from 'next/server';
import { NeynarNotifications } from '@/app/lib/notifications';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fids = searchParams.get('fids');
    const username = searchParams.get('username');

    if (!fids && !username) {
      return NextResponse.json(
        { error: 'Either fids or username parameter is required' },
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

    if (fids) {
      // Get users by FIDs
      const fidsArray = fids.split(',').map(fid => parseInt(fid.trim()));
      const users = await neynar.getUsersByFids(fidsArray);
      
      return NextResponse.json({
        success: true,
        users,
        count: users.length,
        source: 'Neynar API',
      });
    } else if (username) {
      // For username lookup, we'd need to implement a different endpoint
      // Neynar free tier doesn't have direct username lookup, but we can work around it
      return NextResponse.json({
        success: false,
        error: 'Username lookup not available in free tier',
        note: 'Use FID lookup instead: /api/neynar/users?fids=123,456',
        alternatives: [
          'Use FID lookup: /api/neynar/users?fids=123,456',
          'Upgrade to paid tier for username search',
        ],
      });
    }

    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Neynar users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST endpoint for bulk user operations
export async function POST(request: Request) {
  try {
    const { fids, operation = 'lookup' } = await request.json();

    if (!fids || !Array.isArray(fids)) {
      return NextResponse.json(
        { error: 'fids array is required' },
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

    switch (operation) {
      case 'lookup':
        const users = await neynar.getUsersByFids(fids);
        return NextResponse.json({
          success: true,
          operation: 'lookup',
          users,
          count: users.length,
          source: 'Neynar API',
        });

      case 'casts':
        // Get recent casts for multiple users
        const userCastsPromises = fids.map(fid => neynar.getUserCasts(fid, 5));
        const userCastsResults = await Promise.all(userCastsPromises);
        
        const castsData = fids.map((fid, index) => ({
          fid,
          casts: userCastsResults[index] || [],
          castCount: userCastsResults[index]?.length || 0,
        }));

        return NextResponse.json({
          success: true,
          operation: 'casts',
          data: castsData,
          source: 'Neynar API',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use "lookup" or "casts"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in Neynar users POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
