// Generate a unique session ID for this user session
const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('farcaster-viewer-session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('farcaster-viewer-session', sessionId);
  }
  return sessionId;
};

// Get user ID from Farcaster context
const getUserId = () => {
  if (typeof window === 'undefined') return null;
  return (window as { userFid?: string }).userFid || null;
};

// Simple cache to prevent duplicate analytics calls
const analyticsCache = new Set<string>();

// Session tracking for epoch visits and progress
const sessionState = {
  visitedEpochs: new Set<number>(),
  currentEpoch: null as number | null,
  currentImageIndex: null as number | null,
  sessionStartTime: Date.now()
};

// Track analytics event
export const trackEvent = async (eventType: string, data: Record<string, unknown> = {}) => {
  // Skip analytics in development to avoid database connection issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics (dev): Skipping event:', eventType, data);
    return;
  }

  try {
    // Create a cache key to prevent duplicate calls
    const cacheKey = `${eventType}-${JSON.stringify(data)}`;
    if (analyticsCache.has(cacheKey)) {
      console.log('Analytics: Skipping duplicate event:', eventType, data);
      return; // Skip if already tracked
    }
    analyticsCache.add(cacheKey);
    
    // Limit cache size to prevent memory issues
    if (analyticsCache.size > 1000) {
      const firstKey = analyticsCache.values().next().value;
      if (firstKey) {
        analyticsCache.delete(firstKey);
      }
    }

    const userId = getUserId();
    const sessionId = getSessionId();
    
    const payload = {
      eventType,
      userId,
      sessionId,
      timestamp: Date.now(),
      ...data
    };

    console.log('Analytics: Sending event:', payload);

    // Send to analytics endpoint
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Analytics: Event sent successfully:', eventType);
    } else {
      console.error('Analytics: Failed to send event:', eventType, response.status);
    }
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};

// Track when user views an image
export const trackImageView = (epochId: number, imageIndex: number) => {
  // Update session state
  sessionState.currentEpoch = epochId;
  sessionState.currentImageIndex = imageIndex;
  
  // Track first visit to epoch
  if (!sessionState.visitedEpochs.has(epochId)) {
    sessionState.visitedEpochs.add(epochId);
    trackEpochOpen(epochId);
  }
  
  trackEvent('image_view', { epochId, imageIndex });
};

// Track when user completes an epoch (reaches last image)
export const trackEpochCompletion = (epochId: number, totalImages: number) => {
  trackEvent('epoch_completion', { epochId, totalImages });
};

// Track when user switches epochs
export const trackEpochSwitch = (fromEpochId: number, toEpochId: number) => {
  // Track leaving the previous epoch
  if (fromEpochId && sessionState.currentImageIndex) {
    trackEpochLeave(fromEpochId, sessionState.currentImageIndex, 'epoch_switch');
  }
  
  trackEvent('epoch_switch', { fromEpochId, toEpochId });
};

// Track when user opens an epoch for the first time in a session
export const trackEpochOpen = (epochId: number) => {
  trackEvent('epoch_open', { epochId });
};

// Track when user leaves an epoch (switches to different epoch or closes app)
export const trackEpochLeave = (epochId: number, lastImageIndex: number, reason: 'epoch_switch' | 'app_close' | 'menu_close') => {
  trackEvent('epoch_leave', { epochId, lastImageIndex, reason });
};

// Track when user opens overlay menu
export const trackMenuOpen = () => {
  trackEvent('menu_open');
};

// Track when user clicks "View Artist Profile"
export const trackArtistProfileClick = (artistName: string) => {
  trackEvent('artist_profile_click', { artistName });
};

// Track when user clicks "Request a Curate"
export const trackCurateRequest = () => {
  trackEvent('curate_request');
};

// Track when user shares an image
export const trackImageShare = (epochId: number, imageIndex: number) => {
  trackEvent('image_share', { epochId, imageIndex });
};

// Track app session start
export const trackSessionStart = () => {
  trackEvent('session_start');
};

// Track app session end (when user closes or navigates away)
export const trackSessionEnd = (lastEpochId?: number, lastImageIndex?: number) => {
  // Track leaving the current epoch if we have session state
  if (sessionState.currentEpoch && sessionState.currentImageIndex) {
    trackEpochLeave(sessionState.currentEpoch, sessionState.currentImageIndex, 'app_close');
  }
  
  trackEvent('session_end', { 
    lastEpochId: lastEpochId || sessionState.currentEpoch, 
    lastImageIndex: lastImageIndex || sessionState.currentImageIndex,
    sessionDuration: Date.now() - sessionState.sessionStartTime,
    visitedEpochs: Array.from(sessionState.visitedEpochs)
  });
};

// Track calendar opens
export const trackCalendarOpen = () => {
  trackEvent('calendar_open');
};

// Track calendar artist profile clicks
export const trackCalendarArtistClick = (artistName: string, epochId: number) => {
  trackEvent('calendar_artist_click', { artistName, epochId });
};

// Clear analytics cache (useful when switching epochs)
export const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

// Reset session state (useful when starting a new session)
export const resetSessionState = () => {
  sessionState.visitedEpochs.clear();
  sessionState.currentEpoch = null;
  sessionState.currentImageIndex = null;
  sessionState.sessionStartTime = Date.now();
};
