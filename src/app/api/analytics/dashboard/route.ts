import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    console.log('Dashboard API: Fetching analytics for timeRange:', timeRange);

    // Calculate time filter based on timeRange
    const now = new Date();
    let timeFilter: Date;
    
    switch (timeRange) {
      case '24h':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    console.log('Dashboard API: Time filter:', timeFilter.toISOString());

    // Get epoch statistics
    const epochStatsResult = await sql`
      SELECT 
        epoch_id,
        COUNT(CASE WHEN event_type = 'epoch_open' THEN 1 END) as opens,
        COUNT(CASE WHEN event_type = 'epoch_completion' THEN 1 END) as completions,
        AVG(CASE WHEN event_type = 'epoch_completion' THEN 
          EXTRACT(EPOCH FROM (timestamp - (
            SELECT MIN(timestamp) 
            FROM analytics_events 
            WHERE session_id = ae.session_id AND epoch_id = ae.epoch_id
          )))
        END) as avg_time_seconds
      FROM analytics_events ae
      WHERE timestamp >= ${timeFilter.toISOString()}
        AND epoch_id IS NOT NULL
      GROUP BY epoch_id
      ORDER BY epoch_id
    `;

    console.log('Dashboard API: Epoch stats result rows:', epochStatsResult.rows.length);
    console.log('Dashboard API: Epoch stats data:', epochStatsResult.rows);

    // Check if there are any analytics events at all
    const totalEventsResult = await sql`
      SELECT COUNT(*) as total_events, 
             MIN(timestamp) as earliest_event,
             MAX(timestamp) as latest_event
      FROM analytics_events
    `;
    
    console.log('Dashboard API: Total events in database:', totalEventsResult.rows[0]);

    // Get drop-off points
    const dropoffResult = await sql`
      SELECT 
        epoch_id,
        image_index,
        COUNT(*) as drop_offs
      FROM analytics_events
      WHERE event_type = 'epoch_leave'
        AND timestamp >= ${timeFilter.toISOString()}
        AND epoch_id IS NOT NULL
        AND image_index IS NOT NULL
      GROUP BY epoch_id, image_index
      ORDER BY epoch_id, drop_offs DESC
    `;

    // Get session statistics
    const sessionStatsResult = await sql`
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT user_id) as total_users,
        AVG(session_duration) as avg_session_duration
      FROM (
        SELECT 
          session_id,
          user_id,
          EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration
        FROM analytics_events
        WHERE timestamp >= ${timeFilter.toISOString()}
        GROUP BY session_id, user_id
      ) session_data
    `;

    // Get recent activity
    const recentActivityResult = await sql`
      SELECT 
        event_type,
        epoch_id,
        user_id,
        timestamp
      FROM analytics_events
      WHERE timestamp >= ${timeFilter.toISOString()}
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    // Process epoch statistics
    const epochStats: { [epochId: number]: {
      opens: number;
      completions: number;
      completionRate: number;
      avgTimeSpent: number;
      dropoffPoints: { imageIndex: number; count: number }[];
    } } = {};
    epochStatsResult.rows.forEach((row) => {
      const opens = parseInt(row.opens as string) || 0;
      const completions = parseInt(row.completions as string) || 0;
      const completionRate = opens > 0 ? (completions / opens) * 100 : 0;
      
      epochStats[row.epoch_id as number] = {
        opens,
        completions,
        completionRate,
        avgTimeSpent: parseFloat(row.avg_time_seconds as string || '0') * 1000 || 0, // Convert to milliseconds
        dropoffPoints: []
      };
    });

    // Add drop-off points to epoch stats
    dropoffResult.rows.forEach((row) => {
      if (epochStats[row.epoch_id as number]) {
        epochStats[row.epoch_id as number].dropoffPoints.push({
          imageIndex: row.image_index as number,
          count: parseInt(row.drop_offs as string)
        });
      }
    });

    // Sort drop-off points by count
    Object.values(epochStats).forEach((epoch) => {
      epoch.dropoffPoints.sort((a, b) => b.count - a.count);
    });

    // Process session statistics
    const sessionStats = {
      totalSessions: parseInt(sessionStatsResult.rows[0]?.total_sessions as string) || 0,
      totalUsers: parseInt(sessionStatsResult.rows[0]?.total_users as string) || 0,
      avgSessionDuration: parseFloat(sessionStatsResult.rows[0]?.avg_session_duration as string || '0') * 1000 || 0 // Convert to milliseconds
    };

    // Process recent activity
    const recentActivity = recentActivityResult.rows.map((row) => ({
      timestamp: row.timestamp as string,
      eventType: row.event_type as string,
      epochId: row.epoch_id as number | null,
      userId: row.user_id as string | null
    }));

    return NextResponse.json({
      epochStats,
      sessionStats,
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        epochStats: {},
        sessionStats: { totalSessions: 0, totalUsers: 0, avgSessionDuration: 0 },
        recentActivity: []
      },
      { status: 500 }
    );
  }
}
