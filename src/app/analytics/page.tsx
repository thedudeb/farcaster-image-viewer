'use client'

import { useState, useEffect } from 'react';

interface AnalyticsData {
  summary: any[];
  completionStats: any[];
  dropOffPoints: any[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Error loading analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <button 
            onClick={fetchAnalyticsData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>

        {!data && (
          <div className="text-center py-12">
            <p className="text-gray-600">No analytics data available yet.</p>
            <p className="text-gray-500 mt-2">Start using the app to see analytics here!</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Summary (Last 30 Days)</h2>
              <div className="space-y-3">
                {data.summary.length > 0 ? (
                  data.summary.map((event, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">{event.event_type}</span>
                      <span className="text-blue-600 font-bold">{event.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No events recorded yet</p>
                )}
              </div>
            </div>

            {/* Epoch Completion Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Epoch Completion Stats</h2>
              <div className="space-y-3">
                {data.completionStats.length > 0 ? (
                  data.completionStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">Epoch {stat.epoch_id}</span>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">{stat.completions} completions</div>
                        {stat.avg_time_seconds && (
                          <div className="text-sm text-gray-500">
                            Avg: {Math.round(stat.avg_time_seconds)}s
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No epoch completions recorded yet</p>
                )}
              </div>
            </div>

            {/* Drop-off Points */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Drop-off Points (Last 7 Days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.dropOffPoints.length > 0 ? (
                  data.dropOffPoints.map((point, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm font-medium text-red-800">
                        Epoch {point.epoch_id} - Image {point.image_index}
                      </div>
                      <div className="text-red-600 font-bold">{point.drop_offs} drop-offs</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-full">No drop-off data available yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
