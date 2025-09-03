// Neynar Notifications System - Free Tier Implementation
// Neynar free tier includes: 1000 API calls/month, user lookup, and basic notifications

interface NeynarNotificationPayload {
  signer_uuid: string;
  text: string;
  channel_id?: string;
  parent?: string;
  embeds?: string[];
}

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: string[];
}

export class NeynarNotifications {
  private apiKey: string;
  private baseUrl = 'https://api.neynar.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get user info by FID (free tier: 1000 calls/month)
  async getUserByFid(fid: number): Promise<NeynarUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/farcaster/user/bulk?fids=${fid}`, {
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch user ${fid}:`, response.status);
        return null;
      }

      const data = await response.json();
      const user = data.users?.[0];
      
      if (!user) {
        console.error(`User ${fid} not found`);
        return null;
      }

      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count,
        following_count: user.following_count,
        verifications: user.verifications || [],
      };
    } catch (error) {
      console.error(`Error fetching user ${fid}:`, error);
      return null;
    }
  }

  // Get multiple users by FIDs (free tier: 1000 calls/month)
  async getUsersByFids(fids: number[]): Promise<NeynarUser[]> {
    try {
      const fidsQuery = fids.join(',');
      const response = await fetch(`${this.baseUrl}/farcaster/user/bulk?fids=${fidsQuery}`, {
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch users:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.users || []).map((user: any) => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count,
        following_count: user.following_count,
        verifications: user.verifications || [],
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Send a cast (free tier: 1000 calls/month)
  // Note: This requires a signer_uuid from a connected wallet
  async sendCast(payload: NeynarNotificationPayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/farcaster/cast`, {
        method: 'POST',
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send cast:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      console.log('Cast sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error sending cast:', error);
      return false;
    }
  }

  // Get trending casts (free tier: 1000 calls/month)
  async getTrendingCasts(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/farcaster/feed/trending?limit=${limit}`, {
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch trending casts:', response.status);
        return [];
      }

      const data = await response.json();
      return data.casts || [];
    } catch (error) {
      console.error('Error fetching trending casts:', error);
      return [];
    }
  }

  // Get user's recent casts (free tier: 1000 calls/month)
  async getUserCasts(fid: number, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/farcaster/feed?fid=${fid}&limit=${limit}`, {
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch casts for user ${fid}:`, response.status);
        return [];
      }

      const data = await response.json();
      return data.casts || [];
    } catch (error) {
      console.error(`Error fetching casts for user ${fid}:`, error);
      return [];
    }
  }

  // Get frame interactions (free tier: 1000 calls/month)
  async getFrameInteractions(frameUrl: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/farcaster/frame/interactions?frame_url=${encodeURIComponent(frameUrl)}&limit=${limit}`, {
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch frame interactions:', response.status);
        return [];
      }

      const data = await response.json();
      return data.interactions || [];
    } catch (error) {
      console.error('Error fetching frame interactions:', error);
      return [];
    }
  }

  // Check API usage (free tier monitoring)
  async checkApiUsage(): Promise<{ used: number; limit: number; remaining: number }> {
    try {
      // Note: Neynar doesn't provide usage endpoint in free tier
      // This is a placeholder for when you upgrade to paid plans
      return {
        used: 0, // Will be 0 for free tier
        limit: 1000,
        remaining: 1000,
      };
    } catch (error) {
      console.error('Error checking API usage:', error);
      return {
        used: 0,
        limit: 1000,
        remaining: 1000,
      };
    }
  }
}

// Legacy function for backward compatibility
export async function sendFarcasterNotification(message: string, userId: string) {
  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      throw new Error('Neynar API key not configured');
    }

    const neynar = new NeynarNotifications(neynarApiKey);
    
    // For now, we'll use the existing API route
    // In the future, this can be enhanced to use Neynar's direct casting
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Export the main class for direct usage
export { NeynarNotifications }; 