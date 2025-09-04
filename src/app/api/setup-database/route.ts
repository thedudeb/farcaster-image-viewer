import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Create analytics_events table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        epoch_id INTEGER,
        image_index INTEGER,
        user_id VARCHAR(50),
        session_id VARCHAR(100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_agent TEXT,
        ip_address INET,
        additional_data JSONB
      )
    `;
    
    // Create user_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        user_id VARCHAR(50),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE,
        total_events INTEGER DEFAULT 0,
        epochs_visited INTEGER[],
        user_agent TEXT,
        ip_address INET
      )
    `;
    
    // Create epoch_completions table
    await sql`
      CREATE TABLE IF NOT EXISTS epoch_completions (
        id SERIAL PRIMARY KEY,
        epoch_id INTEGER NOT NULL,
        user_id VARCHAR(50),
        session_id VARCHAR(100),
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_images INTEGER,
        time_to_complete INTERVAL
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_epoch_completions_epoch_id ON epoch_completions(epoch_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id)`;
    
    // Test the tables
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM analytics_events) as total_events,
        (SELECT COUNT(*) FROM user_sessions) as total_sessions,
        (SELECT COUNT(*) FROM epoch_completions) as total_completions
    `;
    
    console.log('✅ Database tables created successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      stats: {
        totalEvents: result.rows[0].total_events,
        totalSessions: result.rows[0].total_sessions,
        totalCompletions: result.rows[0].total_completions
      }
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
