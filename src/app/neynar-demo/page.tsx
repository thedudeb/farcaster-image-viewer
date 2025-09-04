'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { NeynarNotifications } from '@/app/lib/notifications';

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: string[];
}

interface ApiUsage {
  used: number;
  limit: number;
  remaining: number;
}

export default function NeynarDemo() {
  const [apiKey, setApiKey] = useState('');
  const [neynar, setNeynar] = useState<NeynarNotifications | null>(null);
  const [status, setStatus] = useState<{ status: string; estimatedUsage: number } | null>(null);
  const [users, setUsers] = useState<NeynarUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fidsInput, setFidsInput] = useState('15351,1075107,288204,499579'); // Default FIDs
  const [notificationMessage, setNotificationMessage] = useState('Check out this amazing art on @0ffline viewer! 🎨');
  const [selectedUserId, setSelectedUserId] = useState('15351');

  // Initialize Neynar when API key is set
  useEffect(() => {
    if (apiKey && apiKey.trim()) {
      setNeynar(new NeynarNotifications(apiKey));
      setError(null);
    }
  }, [apiKey]);

  // Check API status
  const checkStatus = async () => {
    if (!neynar) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/neynar/notifications');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to check status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lookup users by FIDs
  const lookupUsers = async () => {
    if (!neynar || !fidsInput.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fids = fidsInput.split(',').map(fid => parseInt(fid.trim()));
      const fetchedUsers = await neynar.getUsersByFids(fids);
      setUsers(fetchedUsers);
    } catch (err) {
      setError('Failed to lookup users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Send notification
  const sendNotification = async () => {
    if (!neynar || !notificationMessage.trim() || !selectedUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/neynar/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: notificationMessage,
          userId: selectedUserId,
          type: 'epoch_notification',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        alert('Notification prepared successfully! Check console for details.');
      } else {
        setError(data.error || 'Failed to send notification');
      }
    } catch (err) {
      setError('Failed to send notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get trending casts
  const getTrendingCasts = async () => {
    if (!neynar) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const casts = await neynar.getTrendingCasts(5);
      console.log('Trending casts:', casts);
      alert(`Fetched ${casts.length} trending casts! Check console for details.`);
    } catch (err) {
      setError('Failed to fetch trending casts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 Neynar Notifications Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">⚙️ Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Neynar API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Neynar API key"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Get your free API key at{' '}
                  <a 
                    href="https://neynar.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    neynar.com
                  </a>
                </p>
              </div>

              <button
                onClick={checkStatus}
                disabled={!neynar || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-medium"
              >
                {loading ? 'Checking...' : 'Check API Status'}
              </button>
            </div>

            {status && (
              <div className="mt-4 p-4 bg-gray-700 rounded-md">
                <h3 className="font-semibold mb-2">API Status:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* User Lookup Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">👥 User Lookup</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  FIDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={fidsInput}
                  onChange={(e) => setFidsInput(e.target.value)}
                  placeholder="15351,1075107,288204,499579"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={lookupUsers}
                disabled={!neynar || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-medium"
              >
                {loading ? 'Looking up...' : 'Lookup Users'}
              </button>

              <button
                onClick={getTrendingCasts}
                disabled={!neynar || loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-medium"
              >
                {loading ? 'Fetching...' : 'Get Trending Casts'}
              </button>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {users.length > 0 && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Found Users ({users.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.fid} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    {user.pfp_url && (
                      <Image 
                        src={user.pfp_url} 
                        alt={user.display_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{user.display_name}</h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p>FID: {user.fid}</p>
                    <p>Followers: {user.follower_count.toLocaleString()}</p>
                    <p>Following: {user.following_count.toLocaleString()}</p>
                    {user.verifications.length > 0 && (
                      <p>Verifications: {user.verifications.length}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Panel */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">📢 Send Notification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target User ID
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map((user) => (
                  <option key={user.fid} value={user.fid}>
                    {user.display_name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={sendNotification}
            disabled={!neynar || loading || !notificationMessage.trim()}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-medium"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Free Tier Info */}
        <div className="mt-8 bg-blue-900 border border-blue-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-200">💎 Free Tier Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100">
            <div>
              <h3 className="font-semibold mb-2">✅ What&apos;s Included:</h3>
              <ul className="space-y-1 text-sm">
                <li>• 1,000 API calls per month</li>
                <li>• User lookup by FID</li>
                <li>• User casts and feeds</li>
                <li>• Trending casts</li>
                <li>• Frame interactions</li>
                <li>• Basic user analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔒 Limitations:</h3>
              <ul className="space-y-1 text-sm">
                <li>• No direct casting (requires signer_uuid)</li>
                <li>• No username search</li>
                <li>• Rate limited to 1000 calls/month</li>
                <li>• No webhook support</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-blue-200 text-sm">
            <strong>Note:</strong> Direct casting requires user wallet connection. The free tier is perfect for user lookups, 
            analytics, and preparing notifications that can be sent through other means.
          </p>
        </div>
      </div>
    </div>
  );
}
