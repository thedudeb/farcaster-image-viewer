import { sql } from '@vercel/postgres';

export interface AnalyticsEvent {
  eventType: string;
  epochId?: number;
  imageIndex?: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  additionalData?: Record<string, unknown>;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface EpochCompletion {
  epochId: number;
  userId?: string;
  sessionId?: string;
  totalImages: number;
}

// Insert analytics event
export async function insertAnalyticsEvent(event: AnalyticsEvent) {
  try {
    const result = await sql`
      INSERT INTO analytics_events (
        event_type, 
        epoch_id, 
        image_index, 
        user_id, 
        session_id, 
        user_agent, 
        ip_address, 
        additional_data
      ) VALUES (
        ${event.eventType},
        ${event.epochId || null},
        ${event.imageIndex || null},
        ${event.userId || null},
        ${event.sessionId || null},
        ${event.userAgent || null},
        ${event.ipAddress || null},
        ${event.additionalData ? JSON.stringify(event.additionalData) : null}
      )
    `;
    return result;
  } catch (error) {
    console.error('Error inserting analytics event:', error);
    throw error;
  }
}

// Create or update user session
export async function upsertUserSession(session: UserSession) {
  try {
    const result = await sql`
      INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address)
      VALUES (${session.sessionId}, ${session.userId || null}, ${session.userAgent || null}, ${session.ipAddress || null})
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        total_events = user_sessions.total_events + 1
      RETURNING *
    `;
    return result;
  } catch (error) {
    console.error('Error upserting user session:', error);
    throw error;
  }
}

// Record epoch completion
export async function recordEpochCompletion(completion: EpochCompletion) {
  try {
    const result = await sql`
      INSERT INTO epoch_completions (epoch_id, user_id, session_id, total_images)
      VALUES (${completion.epochId}, ${completion.userId || null}, ${completion.sessionId || null}, ${completion.totalImages})
    `;
    return result;
  } catch (error) {
    console.error('Error recording epoch completion:', error);
    throw error;
  }
}

// Get analytics summary
export async function getAnalyticsSummary() {
  try {
    const result = await sql`
      SELECT 
        event_type,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM analytics_events 
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY event_type, DATE_TRUNC('day', timestamp)
      ORDER BY date DESC, count DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
}

// Get epoch completion stats
export async function getEpochCompletionStats() {
  try {
    const result = await sql`
      SELECT 
        epoch_id,
        COUNT(*) as completions,
        AVG(EXTRACT(EPOCH FROM time_to_complete)) as avg_time_seconds
      FROM epoch_completions 
      WHERE completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY epoch_id
      ORDER BY epoch_id
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting epoch completion stats:', error);
    throw error;
  }
}

// Get user drop-off points
export async function getUserDropOffPoints() {
  try {
    const result = await sql`
      SELECT 
        epoch_id,
        image_index,
        COUNT(*) as drop_offs
      FROM analytics_events 
      WHERE event_type = 'image_view' 
        AND timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY epoch_id, image_index
      ORDER BY epoch_id, image_index
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting user drop-off points:', error);
    throw error;
  }
}
