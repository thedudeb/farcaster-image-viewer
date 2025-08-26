import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const EPOCH_ARTISTS = {
  5: 'Greywash',
  6: 'dwn2earth',
  7: 'Chronist'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { epochId: string } }
) {
  try {
    const epochId = parseInt(params.epochId);
    const artistName = EPOCH_ARTISTS[epochId as keyof typeof EPOCH_ARTISTS];
    
    if (!artistName) {
      return NextResponse.json({ error: 'Artist not found for this epoch' }, { status: 404 });
    }

    // Get epoch statistics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const epochStatsResult = await sql`
      SELECT 
        COUNT(CASE WHEN event_type = 'epoch_open' THEN 1 END) as opens,
        COUNT(CASE WHEN event_type = 'epoch_completion' THEN 1 END) as completions,
        COUNT(DISTINCT user_id) as total_users,
        AVG(CASE WHEN event_type = 'epoch_completion' THEN 
          EXTRACT(EPOCH FROM (timestamp - (
            SELECT MIN(timestamp) 
            FROM analytics_events 
            WHERE session_id = ae.session_id AND epoch_id = ae.epoch_id
          )))
        END) as avg_time_seconds
      FROM analytics_events ae
      WHERE epoch_id = ${epochId}
        AND timestamp >= ${thirtyDaysAgo.toISOString()}
    `;

    // Get drop-off points
    const dropoffResult = await sql`
      SELECT 
        image_index,
        COUNT(*) as drop_offs
      FROM analytics_events
      WHERE event_type = 'epoch_leave'
        AND epoch_id = ${epochId}
        AND timestamp >= ${thirtyDaysAgo.toISOString()}
        AND image_index IS NOT NULL
      GROUP BY image_index
      ORDER BY drop_offs DESC
      LIMIT 10
    `;

    // Get recent activity
    const recentActivityResult = await sql`
      SELECT 
        event_type,
        user_id,
        timestamp
      FROM analytics_events
      WHERE epoch_id = ${epochId}
        AND timestamp >= ${thirtyDaysAgo.toISOString()}
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    // Process the data
    const row = epochStatsResult.rows[0];
    const opens = parseInt(row?.opens) || 0;
    const completions = parseInt(row?.completions) || 0;
    const completionRate = opens > 0 ? (completions / opens) * 100 : 0;
    const totalUsers = parseInt(row?.total_users) || 0;
    const avgTimeSpent = parseFloat(row?.avg_time_seconds) * 1000 || 0; // Convert to milliseconds

    const dropoffPoints = dropoffResult.rows.map((row: { image_index: number; drop_offs: string }) => ({
      imageIndex: row.image_index,
      count: parseInt(row.drop_offs)
    }));

    const recentActivity = recentActivityResult.rows.map((row: { timestamp: string; event_type: string; user_id: string | null }) => ({
      timestamp: row.timestamp,
      eventType: row.event_type,
      userId: row.user_id
    }));

    return NextResponse.json({
      epochId,
      artistName,
      stats: {
        opens,
        completions,
        completionRate,
        avgTimeSpent,
        totalUsers,
        dropoffPoints
      },
      recentActivity
    });

  } catch (error) {
    console.error('Artist analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist analytics data' },
      { status: 500 }
    );
  }
}
