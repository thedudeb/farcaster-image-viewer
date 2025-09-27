import { useState, useEffect } from 'react';

interface UserInfo {
  fid: number;
  username?: string;
  addedAt: string;
  lastActivity: string;
  hasNotifications: boolean;
  eventsCount: number;
}

interface NotificationStats {
  totalUsers: number;
  usersWithNotifications: number;
  notificationRate: number;
}

interface SendResult {
  success: boolean;
  data?: {
    type: string;
    results: {
      sent: number;
      failed: number;
      noToken: number;
      rateLimited: number;
    };
    errors: string[];
  };
  error?: string;
}

export default function NotificationDashboard() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [activeTab, setActiveTab] = useState<'send' | 'users'>('send');
  
  const [notification, setNotification] = useState({
    type: 'custom' as 'epoch' | 'artist' | 'app_update' | 'event' | 'custom',
    title: '',
    body: '',
    target: 'all' as 'all' | 'followers',
    targetFid: '',
    // Type-specific fields
    epochId: '',
    artistName: '',
    artistFid: '',
    feature: '',
    eventName: '',
  });

  const fetchData = async () => {
    try {
      // Fetch users from admin API
      const usersResponse = await fetch('/api/admin');
      const usersData = await usersResponse.json();
      
      if (usersData.success) {
        setUsers(usersData.data.users);
      }

      // Fetch notification stats
      const statsResponse = await fetch('/api/notifications/send');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendNotification = async () => {
    setSending(true);
    setResult(null);
    
    try {
      const payload: {
        type: string;
        title: string;
        body: string;
        target: string;
        epochId?: number;
        artistName?: string;
        artistFid?: number;
        feature?: string;
        eventName?: string;
        targetFid?: number;
      } = {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        target: notification.target,
      };

      // Add type-specific fields
      if (notification.type === 'epoch') {
        payload.epochId = parseInt(notification.epochId);
        payload.artistName = notification.artistName;
        payload.artistFid = parseInt(notification.artistFid);
      } else if (notification.type === 'artist') {
        payload.artistName = notification.artistName;
      } else if (notification.type === 'app_update') {
        payload.feature = notification.feature;
      } else if (notification.type === 'event') {
        payload.eventName = notification.eventName;
      }

      if (notification.target === 'followers' && notification.targetFid) {
        payload.targetFid = parseInt(notification.targetFid);
      }

      console.log('Sending notification with payload:', payload);

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      console.log('Notification response:', data);
      
      setResult(data);
      
      if (data.success) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error('Notification send error:', error);
      setResult({ 
        success: false, 
        error: `Network error: ${error instanceof Error ? error.message : String(error)}` 
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'epoch': return 'Notify about new epoch releases';
      case 'artist': return 'Send artist announcements';
      case 'app_update': return 'Announce new app features';
      case 'event': return 'Promote special events';
      case 'custom': return 'Send custom notifications';
      default: return '';
    }
  };

  const isFormValid = () => {
    if (!notification.title || !notification.body) return false;
    
    switch (notification.type) {
      case 'epoch':
        return notification.epochId && notification.artistName && notification.artistFid;
      case 'artist':
        return notification.artistName;
      case 'app_update':
        return notification.feature;
      case 'event':
        return notification.eventName;
      case 'custom':
        return true;
      default:
        return false;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage Farcaster Mini App notifications and users
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{stats.usersWithNotifications}</div>
            <div className="text-sm text-gray-500">
              of {stats.totalUsers} users ({stats.notificationRate.toFixed(1)}%)
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'send'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Send Notifications
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Send Notifications Tab */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
            <select
              value={notification.type}
              onChange={(e) => setNotification(prev => ({ ...prev, type: e.target.value as 'epoch' | 'artist' | 'app_update' | 'event' | 'custom' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom Notification</option>
              <option value="epoch">Epoch Release</option>
              <option value="artist">Artist Announcement</option>
              <option value="app_update">App Update</option>
              <option value="event">Special Event</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getTypeDescription(notification.type)}</p>
          </div>

          {/* Type-specific fields */}
          {notification.type === 'epoch' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Epoch ID</label>
                <input
                  type="number"
                  value={notification.epochId}
                  onChange={(e) => setNotification(prev => ({ ...prev, epochId: e.target.value }))}
                  placeholder="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artist Name</label>
                <input
                  type="text"
                  value={notification.artistName}
                  onChange={(e) => setNotification(prev => ({ ...prev, artistName: e.target.value }))}
                  placeholder="Iteration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artist FID</label>
                <input
                  type="number"
                  value={notification.artistFid}
                  onChange={(e) => setNotification(prev => ({ ...prev, artistFid: e.target.value }))}
                  placeholder="14491"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {notification.type === 'artist' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artist Name</label>
              <input
                type="text"
                value={notification.artistName}
                onChange={(e) => setNotification(prev => ({ ...prev, artistName: e.target.value }))}
                placeholder="Iteration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {notification.type === 'app_update' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feature Name</label>
              <input
                type="text"
                value={notification.feature}
                onChange={(e) => setNotification(prev => ({ ...prev, feature: e.target.value }))}
                placeholder="Enhanced Notifications"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {notification.type === 'event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                value={notification.eventName}
                onChange={(e) => setNotification(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="Art Exhibition Opening"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Title and Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={notification.title}
              onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select
              value={notification.target}
              onChange={(e) => setNotification(prev => ({ ...prev, target: e.target.value as 'all' | 'followers' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All users with notifications enabled</option>
              <option value="followers">Followers of specific FID</option>
            </select>
          </div>

          {notification.target === 'followers' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target FID</label>
              <input
                type="number"
                value={notification.targetFid}
                onChange={(e) => setNotification(prev => ({ ...prev, targetFid: e.target.value }))}
                placeholder="14491"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendNotification}
            disabled={sending || !isFormValid()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </button>

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.success ? (
                <div>
                  <p className="font-semibold">Notification sent successfully!</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p>Sent: {result.data?.results.sent}</p>
                    <p>Failed: {result.data?.results.failed}</p>
                    <p>No token: {result.data?.results.noToken}</p>
                    <p>Rate limited: {result.data?.results.rateLimited}</p>
                  </div>
                  {result.data?.errors && result.data.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Errors:</p>
                      <ul className="text-xs list-disc list-inside">
                        {result.data.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>Error: {result.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Users with Mini App</h4>
            <button
              onClick={fetchData}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notifications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
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
                      {formatDate(user.addedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastActivity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.eventsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No users found. Users will appear here when they add the mini app.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
