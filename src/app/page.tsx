'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Menu from './components/menu'
import { sendFarcasterNotification } from './lib/notifications'
import { 
  trackImageView, 
  trackEpochCompletion, 
  trackEpochSwitch, 
  trackMenuOpen, 
  trackSessionStart,
  clearAnalyticsCache
} from './lib/analytics'
import * as frame from '@farcaster/frame-sdk'

// ZoomableImage component for pinch-to-zoom functionality
const ZoomableImage = ({ 
  src, 
  alt, 
  onLoad, 
  onLoadStart, 
  priority = false 
}: { 
  src: string; 
  alt: string; 
  onLoad: () => void; 
  onLoadStart: () => void; 
  priority?: boolean;
}) => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, [src]);

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches);
      lastTouchCenter.current = getCenter(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && scale > 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      
      setTranslateX(prev => prev + deltaX);
      setTranslateY(prev => prev + deltaY);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);
      
      if (lastTouchDistance.current > 0) {
        const newScale = scale * (currentDistance / lastTouchDistance.current);
        const clampedScale = Math.max(1, Math.min(3, newScale)); // Limit zoom between 1x and 3x
        
        if (clampedScale !== scale) {
          setScale(clampedScale);
          
          // Adjust translation to keep zoom centered
          if (imageRef.current) {
            const rect = imageRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = currentCenter.x - centerX;
            const deltaY = currentCenter.y - centerY;
            
            setTranslateX(prev => prev + deltaX * (clampedScale - scale) / scale);
            setTranslateY(prev => prev + deltaY * (clampedScale - scale) / scale);
          }
        }
      }
      
      lastTouchDistance.current = currentDistance;
      lastTouchCenter.current = currentCenter;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  };

  const handleDoubleClick = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  return (
    <div 
      ref={imageRef}
      className="w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
          transformOrigin: 'center center',
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          className="object-contain w-full h-full"
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          priority={priority}
          loading="eager"
          sizes="100vw"
          quality={85}
        />
      </div>
      
      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm z-10">
          {Math.round(scale * 100)}%
        </div>
      )}
      
      {/* Zoom hint */}
      {scale === 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded text-sm opacity-75 pointer-events-none">
          Pinch to zoom • Double-tap to reset
        </div>
      )}
    </div>
  );
};

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
  { id: 5, name: 'Epoch 5-Greywash', totalImages: 6, locked: false },
];

// Debounce function for analytics
const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Epoch preloader class
class EpochPreloader {
  private loadedEpochs = new Set<number>();
  private loadingEpochs = new Set<number>();
  private imageCache = new Map<string, HTMLImageElement>();

  async preloadEpoch(epochId: number): Promise<void> {
    if (this.loadedEpochs.has(epochId) || this.loadingEpochs.has(epochId)) {
      return; // Already loaded or loading
    }

    this.loadingEpochs.add(epochId);
    
    const epochData = EPOCHS.find(e => e.id === epochId);
    if (!epochData || epochData.totalImages === 0) {
      this.loadedEpochs.add(epochId);
      this.loadingEpochs.delete(epochId);
      return;
    }

    const extension = epochId === 5 ? 'jpeg' : 'jpg';
    const promises: Promise<void>[] = [];

    // Preload all images in the epoch
    for (let i = 1; i <= epochData.totalImages; i++) {
      const imageSrc = `/images/epoch${epochId}/${i}.${extension}`;
      const cacheKey = `${epochId}-${i}`;
      
      if (!this.imageCache.has(cacheKey)) {
                 const promise = new Promise<void>((resolve) => {
           const img = new window.Image();
                     img.onload = () => {
             this.imageCache.set(cacheKey, img);
             this.manageCacheSize(); // Manage cache size after adding new image
             resolve();
           };
          img.onerror = () => {
            console.warn(`Failed to preload image: ${imageSrc}`);
            resolve(); // Don't fail the whole epoch for one bad image
          };
          img.src = imageSrc;
        });
        promises.push(promise);
      }
    }

    try {
      await Promise.all(promises);
      this.loadedEpochs.add(epochId);
      console.log(`Epoch ${epochId} preloaded successfully`);
    } catch (error) {
      console.error(`Failed to preload epoch ${epochId}:`, error);
    } finally {
      this.loadingEpochs.delete(epochId);
    }
  }

  isEpochLoaded(epochId: number): boolean {
    return this.loadedEpochs.has(epochId);
  }

  isEpochLoading(epochId: number): boolean {
    return this.loadingEpochs.has(epochId);
  }

  getCachedImage(epochId: number, imageIndex: number): HTMLImageElement | null {
    const cacheKey = `${epochId}-${imageIndex}`;
    return this.imageCache.get(cacheKey) || null;
  }

  clearCache(): void {
    this.imageCache.clear();
    this.loadedEpochs.clear();
    this.loadingEpochs.clear();
  }

  // Manage cache size to prevent memory issues
  private manageCacheSize(): void {
    const maxCacheSize = 500; // Maximum number of cached images
    if (this.imageCache.size > maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const keysToRemove = Array.from(this.imageCache.keys()).slice(0, this.imageCache.size - maxCacheSize);
      keysToRemove.forEach(key => this.imageCache.delete(key));
      console.log(`Cleared ${keysToRemove.length} cached images to manage memory`);
    }
  }
}

// Global preloader instance
const epochPreloader = new EpochPreloader();

export default function Home() {
  const [currentEpoch, setCurrentEpoch] = useState(5)
  const [index, setIndex] = useState<number | null>(1)
  
  // Track session start only once
  useEffect(() => {
    trackSessionStart();
    
    // Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = performance.now();
      console.log(`App load time: ${loadTime.toFixed(2)}ms`);
    }
  }, []);
  
  const [showIndicator, setShowIndicator] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMenuButton, setShowMenuButton] = useState(true)
  const [showTapRightOverlay, setShowTapRightOverlay] = useState(false)
  const [showGreywashTapRight, setShowGreywashTapRight] = useState(false)
  const [hasTapped, setHasTapped] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nextImage, setNextImage] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imageKey, setImageKey] = useState(0)
  const [epochLoading, setEpochLoading] = useState(false)
  
  // Track viewed images to avoid duplicate analytics
  const viewedImages = useRef<Set<string>>(new Set())
  
  // Haptic feedback helper function
  const triggerHapticFeedback = async () => {
    console.log('Triggering haptic feedback...');
    try {
      // Try multiple approaches for haptic feedback
      
      // 1. Try Farcaster SDK haptic feedback (if available)
      try {
        const frame = await import('@farcaster/frame-sdk');
        if (frame.sdk && frame.sdk.actions) {
          console.log('Farcaster SDK available, checking for haptic methods...');
          console.log('Available actions:', Object.keys(frame.sdk.actions));
          
          // Check if there are any haptic-related methods (using type assertion for exploration)
          const actions = frame.sdk.actions as any;
          if (actions.hapticFeedback) {
            console.log('Using Farcaster SDK hapticFeedback');
            await actions.hapticFeedback('medium');
            return;
          }
          
          if (actions.vibrate) {
            console.log('Using Farcaster SDK vibrate');
            await actions.vibrate(50);
            return;
          }
          
          if (actions.triggerHaptic) {
            console.log('Using Farcaster SDK triggerHaptic');
            await actions.triggerHaptic('medium');
            return;
          }
        }
      } catch (sdkError) {
        console.log('Farcaster SDK haptic methods not available:', sdkError);
      }
      
      // 2. Try TBA-specific haptic feedback
      try {
        if (typeof window !== 'undefined' && (window as any).TBA && (window as any).TBA.hapticFeedback) {
          console.log('Using TBA hapticFeedback');
          (window as any).TBA.hapticFeedback('medium');
          return;
        }
        
        if (typeof window !== 'undefined' && (window as any).tba && (window as any).tba.hapticFeedback) {
          console.log('Using tba hapticFeedback');
          (window as any).tba.hapticFeedback('medium');
          return;
        }
      } catch (tbaError) {
        console.log('TBA haptic feedback not available:', tbaError);
      }
      
      // 3. Try navigator.vibrate as fallback
      if ("vibrate" in navigator && navigator.vibrate) {
        console.log('Using navigator.vibrate fallback');
        navigator.vibrate(50);
      } else {
        console.log('No haptic feedback methods available');
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
    }
  };
  
  // Debug tap right overlay state changes
  useEffect(() => {
    console.log('Tap right overlay state changed:', { showTapRightOverlay, menuOpen, currentEpoch })
  }, [showTapRightOverlay, menuOpen, currentEpoch])
  
  // Debounced analytics tracking
  const debouncedTrackImageView = useCallback(
    (epochId: number, imageIndex: number) => {
      const key = `${epochId}-${imageIndex}`
      if (!viewedImages.current.has(key)) {
        viewedImages.current.add(key)
        trackImageView(epochId, imageIndex)
      }
    },
    []
  )

  // Preload current epoch on mount and adjacent epochs in background
  useEffect(() => {
    // Preload current epoch immediately
    epochPreloader.preloadEpoch(currentEpoch);
    
    // Preload adjacent epochs in background for better UX
    const preloadAdjacentEpochs = async () => {
      const currentEpochIndex = EPOCHS.findIndex(e => e.id === currentEpoch);
      if (currentEpochIndex === -1) return;
      
      // Preload next epoch
      const nextEpoch = EPOCHS[currentEpochIndex + 1];
      if (nextEpoch && !nextEpoch.locked) {
        setTimeout(() => {
          epochPreloader.preloadEpoch(nextEpoch.id);
        }, 2000); // Delay to prioritize current epoch
      }
      
      // Preload previous epoch
      const prevEpoch = EPOCHS[currentEpochIndex - 1];
      if (prevEpoch && !prevEpoch.locked) {
        setTimeout(() => {
          epochPreloader.preloadEpoch(prevEpoch.id);
        }, 3000); // Longer delay for previous epoch
      }
    };
    
    preloadAdjacentEpochs();
  }, [currentEpoch]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (menuOpen) return; // Don't handle keyboard events when menu is open
      
      const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
      const totalImages = currentEpochData?.totalImages || 0

      if (e.key === 'ArrowLeft') {
        setIndex((prev) => {
          if (!prev) return 1;
          const newIndex = prev === 1 ? totalImages : prev - 1;
          return newIndex;
        });
        setImageKey(prev => prev + 1)
        setShowTapRightOverlay(false); // Hide tap right overlay when navigating
        setShowGreywashTapRight(false); // Hide Greywash tap right overlay when navigating
      } else if (e.key === 'ArrowRight') {
        setIndex((prev) => {
          if (!prev) return 1;
          const newIndex = prev === totalImages ? 1 : prev + 1;
          return newIndex;
        });
        setImageKey(prev => prev + 1)
        setShowTapRightOverlay(false); // Hide tap right overlay when navigating
        setShowGreywashTapRight(false); // Hide Greywash tap right overlay when navigating
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEpoch, menuOpen]);

  // Reset indicator when epoch changes
  useEffect(() => {
    setShowIndicator(true)
    setFadeOut(false)
    // Set indicator and menu button to fade out after 3 seconds and hide after 3 seconds
    const fadeAndHideTimer = setTimeout(() => {
      setFadeOut(true);
      setShowIndicator(false);
      setShowMenuButton(false);
    }, 3000)
    return () => {
      clearTimeout(fadeAndHideTimer)
    }
  }, [currentEpoch])

  // Show tap right overlay when new epoch is loaded
  useEffect(() => {
    // Don't show regular tap right overlay for Epoch 5 (it has its own special overlay)
    if (currentEpoch === 5) {
      return;
    }
    
    // Show tap right overlay for 5 seconds when epoch changes
    setShowTapRightOverlay(true);
    const tapRightTimer = setTimeout(() => {
      setShowTapRightOverlay(false);
    }, 5000);
    
    return () => clearTimeout(tapRightTimer);
  }, [currentEpoch]);

  // Show Epoch 5 disclaimer on first load and start loading epoch
  useEffect(() => {
    if (currentEpoch === 5) {
      // Start loading Epoch 5 immediately when notification appears
      epochPreloader.preloadEpoch(5);
      
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showNotification', { 
          detail: {
            message: `This epoch was created and curated by another amazing artist, @Greywash`,
            type: 'epoch5-notice',
            artistProfile: 'https://warpcast.com/greywash'
          } 
        }));
        
        // Show Greywash tap right overlay for 9 seconds after notification
        setShowTapRightOverlay(false); // Hide regular overlay first
        setShowGreywashTapRight(true);
        const tapRightTimer = setTimeout(() => {
          setShowGreywashTapRight(false);
        }, 9000);
        
        return () => clearTimeout(tapRightTimer);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentEpoch]);

  // Optimized image loading and analytics tracking
  useEffect(() => {
    if (!index) return

    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0
    
    // Only track epoch completion if this is the last image
    if (index === totalImages) {
      trackEpochCompletion(currentEpoch, totalImages);
    }
    
    // Debounced analytics tracking instead of immediate
    debouncedTrackImageView(currentEpoch, index)
    
    // Check if current image is already cached
    const cachedImage = epochPreloader.getCachedImage(currentEpoch, index);
    if (cachedImage) {
      setIsLoading(false);
    }
    
    // Only update image key when actually needed
    setImageKey(prev => prev + 1)
  }, [index, currentEpoch, debouncedTrackImageView])

  const dismissIndicator = () => {
    setFadeOut(true)
    // Keep the indicator element in the DOM briefly for the fade out transition
    setTimeout(() => {
      setShowIndicator(false)
    }, 500)
  }

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2
    const isTopLeft = clientX < currentTarget.clientWidth / 2 && clientY < currentTarget.clientHeight * 0.2;
    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0

    // If menu is open, only handle right taps to close menu
    if (menuOpen) {
      if (!isLeft) {
        setMenuOpen(false)
        setShowTapRightOverlay(false)
      }
      return
    }

    if (isTopLeft) {
      if (!showMenuButton) {
        setShowMenuButton(true)
      }
      return
    }

    if (isLeft) {
      setIndex((prev) => {
        if (!prev) return 1;
        const newIndex = prev === 1 ? totalImages : prev - 1;
        return newIndex;
      });
      setImageKey(prev => prev + 1);
      setShowTapRightOverlay(false); // Hide tap right overlay when navigating
      setShowGreywashTapRight(false); // Hide Greywash tap right overlay when navigating
      triggerHapticFeedback();
    } else {
      setIndex((prev) => {
        if (!prev) return 1;
        const newIndex = prev === totalImages ? 1 : prev + 1;
        return newIndex;
      });
      setImageKey(prev => prev + 1);
      setShowTapRightOverlay(false); // Hide tap right overlay when navigating
      setShowGreywashTapRight(false); // Hide Greywash tap right overlay when navigating
      triggerHapticFeedback();
    }
  }

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the tap from triggering navigation
    console.log('Menu button clicked - setting states...')
    setMenuOpen(true)
    setShowTapRightOverlay(false) // Don't show tap right overlay when menu is open
    setShowGreywashTapRight(false) // Ensure Greywash overlay is hidden when regular menu is opened
    trackMenuOpen()
    console.log('Menu button clicked - states set')
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    if (Math.abs(touchEndX - touchStartX.current) > 30 && showIndicator) {
      dismissIndicator()
    }
    touchStartX.current = null
  }

  const handleEpochChange = async (epochId: number) => {
    console.log('Epoch change started:', { from: currentEpoch, to: epochId })
    const previousEpoch = currentEpoch;
    setCurrentEpoch(epochId);
    setIndex(1);
    setImageKey(prev => prev + 1);
    setShowIndicator(true);
    setFadeOut(false);
    setMenuOpen(false);
    setShowMenuButton(false);
    setShowGreywashTapRight(false);
    setEpochLoading(true);
    console.log('Epoch change - states reset')
    
    // Clear viewed images for new epoch
    viewedImages.current.clear()
    // Clear analytics cache for new epoch
    clearAnalyticsCache()
    
    // Track epoch switch
    trackEpochSwitch(previousEpoch, epochId);
    
    const epochName = EPOCHS.find(e => e.id === epochId)?.name;
    window.dispatchEvent(new CustomEvent('showNotification', { detail: { message: `Switched to ${epochName}` } }));
    
    // Show special notification for Epoch 5-Greywash
    if (epochId === 5) {
      window.dispatchEvent(new CustomEvent('showNotification', { 
        detail: { 
          message: `This epoch was created and curated by another amazing artist, @Greywash`,
          type: 'epoch5-notice',
          artistProfile: 'https://warpcast.com/greywash' // Replace with actual Farcaster profile URL
        } 
      }));
    }
    
    // Start preloading the new epoch
    try {
      await epochPreloader.preloadEpoch(epochId);
      setEpochLoading(false);
    } catch (error) {
      console.error('Failed to preload epoch:', error);
      setEpochLoading(false);
    }
    
    try {
      // TODO: Replace with actual Farcaster user ID
      const userId = 'YOUR_FARCASTER_USER_ID'; // This should be the user's Farcaster ID
      await sendFarcasterNotification(`New epoch available: ${epochName}! Check it out now.`, userId);
    } catch (error) {
      console.error('Failed to send Farcaster notification:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!index) return;
    const imageUrl = `${window.location.origin}/images/epoch${currentEpoch}/${index}.jpg`;
    const appUrl = window.location.origin;
    const composeUrl = `https://warpcast.com/~/compose?text=Check out this dope image from Epoch ${currentEpoch} on @0ffline viewer&embeds[]=${encodeURIComponent(imageUrl)}&embeds[]=${encodeURIComponent(appUrl)}`;

    try {
      await frame.sdk.actions.openUrl(composeUrl);
    } catch (err) {
      window.open(composeUrl, '_blank');
    }
  };

  const imageSrc = index ? `/images/epoch${currentEpoch}/${index}.${currentEpoch === 5 ? 'jpeg' : 'jpg'}` : ''



  return (
    <div
      className="w-screen h-screen bg-black flex items-center justify-center relative"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Menu Button */}
      {showMenuButton && (
        <button
          onClick={handleMenuButtonClick}
          className={`absolute top-4 left-4 z-10 bg-black/30 text-white p-2 rounded-lg hover:bg-black/50 transition-all duration-300`}
        >
          <Image
            src="/new-menu-icon.png"
            alt="Menu Icon"
            width={72}
            height={72}
          />
        </button>
      )}

      {/* Share Button */}
      {showMenuButton && (
        <button
          onClick={handleShare}
          className={`absolute top-4 right-4 z-10 bg-black/30 text-white p-2 rounded-lg hover:bg-black/50 transition-all duration-300`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      )}

      {index && (
        <div className="relative w-full h-full">
          <ZoomableImage
            key={imageKey}
            src={imageSrc}
            alt={`Image ${index} from Epoch ${currentEpoch}`}
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
            priority
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Epoch Loading Indicator */}
          {epochLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Loading Epoch {currentEpoch}...</p>
                <p className="text-sm opacity-75 mt-2">Preloading all images for smooth navigation</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showTapRightOverlay && (
        <div
          className={`fixed bottom-[10%] left-1/2 transform -translate-x-1/2 text-white text-sm select-none pointer-events-none transition-opacity duration-500 z-[60] ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}
        >
          <p>tap right</p>
        </div>
      )}
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 text-white text-xs bg-black/50 p-2 rounded">
          <div>showTapRightOverlay: {showTapRightOverlay.toString()}</div>
          <div>menuOpen: {menuOpen.toString()}</div>
          <div>showGreywashTapRight: {showGreywashTapRight.toString()}</div>
          <div>fadeOut: {fadeOut.toString()}</div>
          {showTapRightOverlay && (
            <div style={{ backgroundColor: 'red', color: 'white', padding: '5px', marginTop: '5px' }}>
              TAP RIGHT OVERLAY SHOULD BE VISIBLE!
            </div>
          )}
        </div>
      )}

      {/* Greywash Epoch 5 Tap Right Overlay */}
      {showGreywashTapRight && (
        <div
          className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 text-white text-sm select-none pointer-events-none transition-opacity duration-500 opacity-100"
        >
          <p>tap right</p>
        </div>
      )}

      {menuOpen && (
        <Menu 
          onClose={() => {
            setMenuOpen(false)
            setShowTapRightOverlay(false)
          }} 
          onEpochChange={handleEpochChange}
          currentEpoch={currentEpoch}
        />
      )}
    </div>
  )
}
