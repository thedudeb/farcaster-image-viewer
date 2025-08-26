'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

interface ArtistAnalyticsData {
  epochId: number;
  artistName: string;
  stats: {
    opens: number;
    completions: number;
    completionRate: number;
    avgTimeSpent: number;
    totalUsers: number;
    dropoffPoints: { imageIndex: number; count: number }[];
  };
  recentActivity: {
    timestamp: string;
    eventType: string;
    userId?: string;
  }[];
}

export default function ArtistAnalyticsPage() {
  const params = useParams();
  const epochId = Number(params.epochId);
  const [data, setData] = useState<ArtistAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistAnalytics();
  }, [epochId]);

  const fetchArtistAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/artist/${epochId}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch artist analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Artist Analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">No data available for this epoch</p>
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
            {data.artistName} - Epoch {data.epochId}
          </motion.h1>
          <p className="text-purple-300 mt-2">Your epoch performance analytics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <div className="text-center">
              <p className="text-purple-300 text-sm">Total Opens</p>
              <p className="text-3xl font-bold text-purple-400">
                {data.stats.opens.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
            <div className="text-center">
              <p className="text-green-300 text-sm">Completions</p>
              <p className="text-3xl font-bold text-green-400">
                {data.stats.completions.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-center">
              <p className="text-blue-300 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-400">
                {data.stats.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6">
            <div className="text-center">
              <p className="text-orange-300 text-sm">Avg Time</p>
              <p className="text-3xl font-bold text-orange-400">
                {Math.round(data.stats.avgTimeSpent / 1000 / 60)}m
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Completion Rate Visualization */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Completion Rate</h2>
          <div className="relative">
            <div className="w-full bg-slate-700 rounded-full h-8">
              <motion.div 
                className="bg-gradient-to-r from-green-500 to-green-400 h-8 rounded-full flex items-center justify-center"
                initial={{ width: 0 }}
                animate={{ width: `${data.stats.completionRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <span className="text-white font-bold text-sm">
                  {data.stats.completionRate.toFixed(1)}%
                </span>
              </motion.div>
            </div>
            <div className="flex justify-between text-sm text-slate-400 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Drop-off Analysis */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Where Users Stop</h2>
          <div className="space-y-3">
            {data.stats.dropoffPoints.slice(0, 10).map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-sm font-bold">{point.imageIndex}</span>
                  </div>
                  <span className="text-white">Image {point.imageIndex}</span>
                </div>
                <span className="text-red-400 font-bold">{point.count} users</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-white capitalize">
                    {activity.eventType.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
