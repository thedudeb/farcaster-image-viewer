# 🚀 Neynar Notifications Setup Guide

## Overview
This guide will help you set up Neynar notifications for your 0ffline Viewer mini app using their **free tier** (1,000 API calls/month).

## 🎯 What You Get with Free Tier

### ✅ **Included Features:**
- **1,000 API calls per month** - Generous for most use cases
- **User lookup by FID** - Get user profiles, follower counts, etc.
- **User casts and feeds** - Access recent posts from users
- **Trending casts** - Get popular content
- **Frame interactions** - Track how users interact with your frame
- **Basic user analytics** - Follower counts, verification status

### 🔒 **Free Tier Limitations:**
- **No direct casting** (requires user wallet connection via `signer_uuid`)
- **No username search** (FID lookup only)
- **Rate limited** to 1,000 calls/month
- **No webhook support**

## 🚀 Quick Start

### 1. Get Your Neynar API Key
1. Go to [neynar.com](https://neynar.com)
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key

### 2. Set Environment Variable
Add your API key to your `.env.local` file:
```bash
NEYNAR_API_KEY=your_api_key_here
```

### 3. Test the Integration
Visit `/neynar-demo` in your app to test all features!

## 📱 API Endpoints

### User Lookup
```typescript
// Get user by FID
GET /api/neynar/users?fids=15351

// Get multiple users
GET /api/neynar/users?fids=15351,1075107,288204,499579

// Bulk operations
POST /api/neynar/users
{
  "fids": [15351, 1075107],
  "operation": "lookup" // or "casts"
}
```

### Notifications
```typescript
// Send notification (preparation)
POST /api/neynar/notifications
{
  "message": "Check out this amazing art!",
  "userId": "15351",
  "type": "epoch_notification"
}

// Check API status
GET /api/neynar/notifications
```

## 💻 Code Examples

### Basic User Lookup
```typescript
import { NeynarNotifications } from '@/app/lib/notifications';

const neynar = new NeynarNotifications(process.env.NEYNAR_API_KEY!);

// Get user info
const user = await neynar.getUserByFid(15351);
console.log(user.display_name, user.follower_count);

// Get multiple users
const users = await neynar.getUsersByFids([15351, 1075107, 288204]);
```

### Get User Casts
```typescript
// Get recent casts from a user
const casts = await neynar.getUserCasts(15351, 10);
console.log(`User has ${casts.length} recent casts`);
```

### Trending Content
```typescript
// Get trending casts
const trending = await neynar.getTrendingCasts(5);
console.log('Trending content:', trending);
```

## 🎨 Use Cases for Your App

### 1. **User Analytics Dashboard**
- Track follower counts for artists
- Monitor engagement with your epochs
- Identify trending creators

### 2. **Smart Notifications**
- Prepare personalized messages
- Target users based on their activity
- Schedule notifications for new epochs

### 3. **Content Discovery**
- Find trending art content
- Discover new artists to feature
- Monitor what's popular in the community

### 4. **Frame Analytics**
- Track how users interact with your frame
- Measure engagement rates
- Optimize user experience

## 🔧 Advanced Usage

### Rate Limiting
The free tier gives you 1,000 calls/month. Here's how to manage it:

```typescript
// Check your usage (placeholder for free tier)
const usage = await neynar.checkApiUsage();
console.log(`${usage.remaining} calls remaining this month`);
```

### Error Handling
```typescript
try {
  const user = await neynar.getUserByFid(12345);
  if (!user) {
    console.log('User not found');
    return;
  }
  // Process user data
} catch (error) {
  console.error('API call failed:', error);
  // Handle gracefully
}
```

### Batch Operations
```typescript
// Efficiently get multiple users
const fids = [15351, 1075107, 288204, 499579];
const users = await neynar.getUsersByFids(fids);

// Process in batches to stay within limits
const batchSize = 10;
for (let i = 0; i < fids.length; i += batchSize) {
  const batch = fids.slice(i, i + batchSize);
  const batchUsers = await neynar.getUsersByFids(batch);
  // Process batch
}
```

## 🚨 Important Notes

### 1. **No Direct Casting in Free Tier**
```typescript
// This won't work without signer_uuid (paid feature)
await neynar.sendCast({
  signer_uuid: "user_wallet_uuid", // Required but not available in free tier
  text: "Hello Farcaster!"
});
```

### 2. **FID vs Username**
- **Free tier**: Only FID lookup available
- **Paid tier**: Username search available
- **Workaround**: Store FIDs in your database

### 3. **Rate Limits**
- **1,000 calls/month** = ~33 calls/day
- **Plan accordingly** for high-traffic periods
- **Cache results** when possible

## 🔄 Migration from Current System

Your current notification system will continue to work. The new Neynar system adds:

1. **Better user data** (follower counts, verification status)
2. **Content discovery** (trending casts, user feeds)
3. **Frame analytics** (interaction tracking)
4. **Scalable infrastructure** (Neynar's robust API)

## 📊 Monitoring & Analytics

### Track API Usage
```typescript
// Check remaining calls
const status = await fetch('/api/neynar/notifications');
const data = await status.json();
console.log('API Status:', data);
```

### Log Important Events
```typescript
// Log user lookups
console.log(`User lookup: ${user.display_name} (@${user.username})`);

// Log trending content
console.log(`Trending casts: ${casts.length} items fetched`);
```

## 🆘 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check your `.env.local` file
   - Ensure `NEYNAR_API_KEY` is set
   - Restart your development server

2. **"User not found"**
   - Verify the FID is correct
   - Check if the user exists on Farcaster
   - Ensure your API key has proper permissions

3. **Rate limit exceeded**
   - Check your monthly usage
   - Implement caching for repeated requests
   - Consider upgrading to paid tier

### Debug Mode
Enable detailed logging:
```typescript
// Add to your environment
DEBUG=neynar:*

// Or log manually
console.log('API Response:', response);
console.log('User Data:', user);
```

## 🚀 Next Steps

1. **Test the demo page** at `/neynar-demo`
2. **Integrate user lookups** into your admin dashboard
3. **Add trending content** to your app
4. **Monitor API usage** to stay within limits
5. **Consider upgrading** when you need direct casting

## 📞 Support

- **Neynar Docs**: [docs.neynar.com](https://docs.neynar.com)
- **Free Tier Limits**: [neynar.com/pricing](https://neynar.com/pricing)
- **API Reference**: [api.neynar.com](https://api.neynar.com)

---

**Happy building! 🎨✨**

Your 0ffline Viewer now has powerful Neynar integration that will help you understand your users better and create more engaging experiences!
