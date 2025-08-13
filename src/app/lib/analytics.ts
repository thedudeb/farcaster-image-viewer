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
  return (window as any).userFid || null;
};

// Track analytics event
export const trackEvent = async (eventType: string, data: any = {}) => {
  try {
    const userId = getUserId();
    const sessionId = getSessionId();
    
    const payload = {
      eventType,
      userId,
      sessionId,
      timestamp: Date.now(),
      ...data
    };

    // Send to analytics endpoint
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};

// Track when user views an image
export const trackImageView = (epochId: number, imageIndex: number) => {
  trackEvent('image_view', { epochId, imageIndex });
};

// Track when user completes an epoch (reaches last image)
export const trackEpochCompletion = (epochId: number, totalImages: number) => {
  trackEvent('epoch_completion', { epochId, totalImages });
};

// Track when user switches epochs
export const trackEpochSwitch = (fromEpochId: number, toEpochId: number) => {
  trackEvent('epoch_switch', { fromEpochId, toEpochId });
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
