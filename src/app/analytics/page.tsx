'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsData {
  epochStats: {
    [epochId: number]: {
      opens: number;
      completions: number;
      completionRate: number;
      avgTimeSpent: number;
      dropoffPoints: { imageIndex: number; count: number }[];
    };
  };
  sessionStats: {
    totalSessions: number;
    avgSessionDuration: number;
    totalUsers: number;
  };
  recentActivity: {
    timestamp: string;
    eventType: string;
    epochId?: number;
    userId?: string;
  }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative z-10 p-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Analytics Dashboard
          </motion.h1>
          <p className="text-purple-300 mt-2">Real-time insights into user engagement</p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="px-8 mb-8">
        <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-lg w-fit">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                timeRange === range
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-purple-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="px-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Total Sessions</p>
                <p className="text-3xl font-bold text-purple-400">
                  {data?.sessionStats.totalSessions.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Unique Users</p>
                <p className="text-3xl font-bold text-blue-400">
                  {data?.sessionStats.totalUsers.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Avg Session</p>
                <p className="text-3xl font-bold text-green-400">
                  {data?.sessionStats.avgSessionDuration ? 
                    `${Math.round(data.sessionStats.avgSessionDuration / 1000 / 60)}m` : '0m'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Epoch Analytics */}
      <div className="px-8 mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Epoch Performance
        </motion.h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data?.epochStats && Object.entries(data.epochStats).map(([epochId, stats]) => (
            <motion.div
              key={epochId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 cursor-pointer"
              onClick={() => setSelectedEpoch(Number(epochId))}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Epoch {epochId}</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">{stats.completionRate.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Opens</span>
                  <span className="text-white font-medium">{stats.opens.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Completions</span>
                  <span className="text-white font-medium">{stats.completions.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg Time</span>
                  <span className="text-white font-medium">
                    {Math.round(stats.avgTimeSpent / 1000 / 60)}m
                  </span>
                </div>
                
                {/* Completion Rate Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-8 mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Recent Activity
        </motion.h2>
        
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data?.recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-white capitalize">
                    {activity.eventType.replace('_', ' ')}
                  </span>
                  {activity.epochId && (
                    <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                      Epoch {activity.epochId}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Epoch Detail Modal */}
      <AnimatePresence>
        {selectedEpoch && data?.epochStats[selectedEpoch] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEpoch(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/30 rounded-xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Epoch {selectedEpoch} Details</h3>
                <button
                  onClick={() => setSelectedEpoch(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">
                      {data.epochStats[selectedEpoch].opens.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">Total Opens</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">
                      {data.epochStats[selectedEpoch].completionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-slate-400">Completion Rate</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Drop-off Points</h4>
                  <div className="space-y-2">
                    {data.epochStats[selectedEpoch].dropoffPoints.slice(0, 5).map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                        <span className="text-sm text-slate-300">Image {point.imageIndex}</span>
                        <span className="text-sm text-red-400">{point.count} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
