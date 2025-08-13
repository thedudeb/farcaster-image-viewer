-- Analytics Events Table
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
);

-- User Sessions Table
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
);

-- Epoch Completion Stats
CREATE TABLE IF NOT EXISTS epoch_completions (
  id SERIAL PRIMARY KEY,
  epoch_id INTEGER NOT NULL,
  user_id VARCHAR(50),
  session_id VARCHAR(100),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_images INTEGER,
  time_to_complete INTERVAL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_epoch_completions_epoch_id ON epoch_completions(epoch_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
