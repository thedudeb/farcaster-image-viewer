import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  duration?: number;
  type?: string;
  artistProfile?: string;
  onClose?: () => void;
}

export default function Notification({ message, duration = 6000, type, artistProfile, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Special styling for Epoch 5 notice
  if (type === 'epoch5-notice') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-4 rounded-lg shadow-lg transition-opacity duration-300 max-w-md text-center">
        <div className="mb-3">
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {artistProfile && (
          <button
            onClick={() => {
              try {
                console.log('Profile button clicked, artistProfile:', artistProfile);
                
                // For mobile, try a more direct approach
                if (typeof window !== 'undefined' && 'sdk' in window) {
                  const sdk = (window as { sdk?: { actions?: { close?: () => void; minimize?: () => void; minimizeFrame?: () => void; openUrl?: (url: string) => void } } }).sdk;
                  console.log('SDK available:', sdk);
                  
                  if (sdk && sdk.actions) {
                    console.log('SDK actions available:', Object.keys(sdk.actions));
                    
                    // First, try to minimize the frame (not close it)
                    if (sdk.actions.minimize) {
                      console.log('Minimizing frame first');
                      sdk.actions.minimize();
                    } else if (sdk.actions.minimizeFrame) {
                      console.log('Using minimizeFrame method');
                      sdk.actions.minimizeFrame();
                    } else if (sdk.actions.close) {
                      console.log('No minimize method, using close as fallback');
                      sdk.actions.close();
                    }
                    
                    // Then immediately try to open the profile in the main app
                    setTimeout(() => {
                      console.log('Opening profile in main app after minimize');
                      
                      // Try multiple URL formats for mobile
                      const urls = [
                        artistProfile.replace('https://warpcast.com', 'farcaster://'),
                        artistProfile.replace('https://warpcast.com', 'warpcast://'),
                        artistProfile
                      ];
                      
                      // Try each URL format
                      for (const url of urls) {
                        try {
                          console.log('Trying URL:', url);
                          window.location.href = url;
                          console.log('Successfully navigated to:', url);
                          break;
                        } catch (err) {
                          console.log('Failed to navigate to:', url, err);
                          continue;
                        }
                      }
                    }, 100);
                    
                    if (!sdk.actions.minimize && !sdk.actions.minimizeFrame && !sdk.actions.close) {
                      console.log('No minimize/close methods available, trying direct navigation');
                      // Fallback: try direct navigation
                      const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                      window.location.href = mainClientUrl;
                    }
                    
                  } else {
                    console.log('No SDK actions available');
                    window.open(artistProfile, '_blank');
                  }
                } else {
                  console.log('No SDK available');
                  window.open(artistProfile, '_blank');
                }
              } catch (err) {
                console.error('Error in profile button:', err);
                window.open(artistProfile, '_blank');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            View Artist Profile
          </button>
        )}
      </div>
    );
  }

  // Default notification styling
  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
      {message}
    </div>
  );
} 