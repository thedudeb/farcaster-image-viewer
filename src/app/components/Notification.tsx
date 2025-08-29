import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { trackArtistProfileClick } from '../lib/analytics';

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
    // For Epoch 5 and 6 notices, don't auto-hide - wait for user interaction
    if (type !== 'epoch5-notice' && type !== 'epoch6-notice') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose, type]);

  if (!isVisible) return null;

  // Special styling for Epoch 5 and 6 notices
  if (type === 'epoch5-notice' || type === 'epoch6-notice') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-4 rounded-lg shadow-lg transition-opacity duration-300 max-w-md text-center">
        <div className="mb-3">
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          {artistProfile && (
            <button
                          onClick={async () => {
              // Track artist profile click based on type
              const artistName = type === 'epoch5-notice' ? '@Greywash' : '@Chronist';
              trackArtistProfileClick(artistName);
              
              try {
                console.log('Profile button clicked, artistProfile:', artistProfile);
                  
                  // Use the new Mini App SDK
                  console.log('Mini App SDK loaded:', sdk);
                  
                  if (sdk && sdk.actions) {
                    console.log('Mini App SDK actions available:', Object.keys(sdk.actions));
                    
                    // Use the official viewProfile method with FID to minimize app and show profile
                    if (sdk.actions.viewProfile) {
                      const fid = type === 'epoch5-notice' ? 1075107 : 499579; // Greywash: 1075107, Chronist: 499579
                      console.log(`Using viewProfile method with FID ${fid}`);
                      await sdk.actions.viewProfile({ fid });
                      console.log('Successfully opened profile with viewProfile');
                    } else {
                      console.log('viewProfile not available, using openUrl fallback');
                      // Fallback to openUrl with farcaster:// scheme
                      const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                      await sdk.actions.openUrl(mainClientUrl);
                      console.log('Successfully opened with openUrl');
                    }
                    
                  } else {
                    console.log('Mini App SDK not available, falling back to window.open');
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
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
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