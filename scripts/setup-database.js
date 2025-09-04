const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Neon database tables...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../src/app/lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await sql.query(schema);
    
    console.log('✅ Database tables created successfully!');
    
    // Test the connection and show some stats
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM analytics_events) as total_events,
        (SELECT COUNT(*) FROM user_sessions) as total_sessions,
        (SELECT COUNT(*) FROM epoch_completions) as total_completions
    `;
    
    console.log('📊 Current database stats:');
    console.log(`   - Total events: ${result.rows[0].total_events}`);
    console.log(`   - Total sessions: ${result.rows[0].total_sessions}`);
    console.log(`   - Total completions: ${result.rows[0].total_completions}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
