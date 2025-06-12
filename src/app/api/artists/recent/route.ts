import { NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TEST_FIDS = [879829, 18561, 290249];

export async function GET() {
  console.log('NEYNAR_API_KEY:', process.env.NEYNAR_API_KEY ? 'Loaded' : 'Undefined'); // Debug log
  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'Missing Neynar API key' }, { status: 500 });
  }

  try {
    const fidsQuery = TEST_FIDS.join(',');
    const response = await fetch(`https://api.neynar.com/v2/farcaster/users/bulk?fids=${fidsQuery}`, {
      method: 'GET',
      headers: {
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Neynar fetch failed:', response.status, await response.text()); // Log failure details
      return NextResponse.json({ error: 'Failed to fetch from Neynar' }, { status: 500 });
    }

    const data = await response.json();
    // Return only relevant info for the overlay
    const artists = (data.users || []).map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfp: user.pfp_url,
    }));

    return NextResponse.json({ artists });
  } catch (error) {
    console.error('Unexpected error fetching artists:', error); // More specific error log
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 