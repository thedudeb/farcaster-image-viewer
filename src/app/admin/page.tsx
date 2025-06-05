"use client";

import { useEffect, useState } from "react";

interface UserInfo {
  fid: number;
  username?: string;
  addedAt: string;
  lastActivity: string;
  hasNotifications: boolean;
  eventsCount: number;
}

interface Analytics {
  totalUsers: number;
  usersWithNotifications: number;
  recentUsers: number;
}

interface AdminData {
  analytics: Analytics;
  users: UserInfo[];
}

interface SendResult {
  success: boolean;
  data?: {
    targetedUsers: number;
    results: {
      sent: number;
      failed: number;
      noToken: number;
      rateLimited: number;
    };
  };
  error?: string;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    title: "",
    body: "",
  });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      console.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const sendBulkNotification = async () => {
    setSending(true);
    setSendResult(null);
    
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notification,
          targetUsers: "notifications_enabled",
        }),
      });
      
      const result = await response.json();
      setSendResult(result);
      
      if (result.success) {
        setNotification({ title: "", body: "" });
        // Refresh data to see updated activity
        setTimeout(fetchData, 1000);
      }
    } catch {
      setSendResult({ success: false, error: "Network error" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteUser = async (fid: number) => {
    if (!confirm(`Are you sure you want to delete user ${fid}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${fid}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Refresh data to see updated user list
        fetchData();
      } else {
        alert('Failed to delete user');
      }
    } catch {
      alert('Failed to delete user');
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load admin data</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">0ffline Viewer Admin</h1>
          <p className="text-gray-600">Manage your Farcaster frame users and notifications</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{data.analytics.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">With Notifications</h3>
            <p className="text-3xl font-bold text-green-600">{data.analytics.usersWithNotifications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New This Week</h3>
            <p className="text-3xl font-bold text-purple-600">{data.analytics.recentUsers}</p>
          </div>
        </div>

        {/* Bulk Notification Sender */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Notification</h2>
          <p className="text-sm text-gray-600 mb-4">
            Send to all users with notifications enabled ({data.analytics.usersWithNotifications} users)
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={notification.body}
                onChange={(e) => setNotification(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Notification message..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                maxLength={500}
              />
            </div>
            
            <button
              onClick={sendBulkNotification}
              disabled={sending || !notification.title || !notification.body}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>

          {sendResult && (
            <div className={`mt-4 p-4 rounded-md ${sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {sendResult.success ? (
                <div>
                  <p className="font-semibold">Notifications sent successfully!</p>
                  <p className="text-sm mt-1">
                    Targeted: {sendResult.data?.targetedUsers} users
                    <br />
                    Sent: {sendResult.data?.results.sent}
                    <br />
                    Failed: {sendResult.data?.results.failed}
                    <br />
                    No token: {sendResult.data?.results.noToken}
                    <br />
                    Rate limited: {sendResult.data?.results.rateLimited}
                  </p>
                </div>
              ) : (
                <p>Error: {sendResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Users ({data.users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notifications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.users.map((user) => (
                  <tr key={user.fid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.hasNotifications 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.hasNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteUser(user.fid)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete user"
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 