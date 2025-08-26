import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate time filter based on range
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
    epochStatsResult.rows.forEach((row: { epoch_id: number; opens: string; completions: string; avg_time_seconds: string | null }) => {
      const opens = parseInt(row.opens) || 0;
      const completions = parseInt(row.completions) || 0;
      const completionRate = opens > 0 ? (completions / opens) * 100 : 0;
      
      epochStats[row.epoch_id] = {
        opens,
        completions,
        completionRate,
        avgTimeSpent: parseFloat(row.avg_time_seconds || '0') * 1000 || 0, // Convert to milliseconds
        dropoffPoints: []
      };
    });

    // Add drop-off points to epoch stats
    dropoffResult.rows.forEach((row: { epoch_id: number; image_index: number; drop_offs: string }) => {
      if (epochStats[row.epoch_id]) {
        epochStats[row.epoch_id].dropoffPoints.push({
          imageIndex: row.image_index,
          count: parseInt(row.drop_offs)
        });
      }
    });

    // Sort drop-off points by count
    Object.values(epochStats).forEach((epoch) => {
      epoch.dropoffPoints.sort((a, b) => b.count - a.count);
    });

    // Process session statistics
    const sessionStats = {
      totalSessions: parseInt(sessionStatsResult.rows[0]?.total_sessions) || 0,
      totalUsers: parseInt(sessionStatsResult.rows[0]?.total_users) || 0,
      avgSessionDuration: parseFloat(sessionStatsResult.rows[0]?.avg_session_duration || '0') * 1000 || 0 // Convert to milliseconds
    };

    // Process recent activity
    const recentActivity = recentActivityResult.rows.map((row: { timestamp: string; event_type: string; epoch_id: number | null; user_id: string | null }) => ({
      timestamp: row.timestamp,
      eventType: row.event_type,
      epochId: row.epoch_id,
      userId: row.user_id
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
