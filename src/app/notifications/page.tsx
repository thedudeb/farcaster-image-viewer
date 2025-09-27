"use client";

import { useEffect, useState } from "react";
import NotificationDashboard from "../components/NotificationDashboard";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notification dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
          <p className="text-gray-600 mt-2">
            Send notifications to users who have added the 0ffline Viewer mini app to their Farcaster client
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">Loading...</p>
            <p className="text-sm text-gray-500 mt-1">Users who added mini app</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications Enabled</h3>
            <p className="text-3xl font-bold text-green-600">Loading...</p>
            <p className="text-sm text-gray-500 mt-1">Users with notifications on</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Rate</h3>
            <p className="text-3xl font-bold text-purple-600">Loading...</p>
            <p className="text-sm text-gray-500 mt-1">Notification opt-in rate</p>
          </div>
        </div>

        {/* Main Dashboard */}
        <NotificationDashboard />

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Users add the 0ffline Viewer mini app to their Farcaster client</p>
            <p>• When they enable notifications, they appear in your user list</p>
            <p>• You can send targeted notifications to all users or specific groups</p>
            <p>• Notifications are delivered through the official Farcaster system</p>
            <p>• Track delivery success, failures, and user engagement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
