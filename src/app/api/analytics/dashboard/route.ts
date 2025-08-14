import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, getEpochCompletionStats, getUserDropOffPoints } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all analytics data
    const [summary, completionStats, dropOffPoints] = await Promise.all([
      getAnalyticsSummary(),
      getEpochCompletionStats(),
      getUserDropOffPoints()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        completionStats,
        dropOffPoints
      }
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
