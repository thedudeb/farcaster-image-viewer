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

  const handleImageLoad = () => {
    onLoad();
  };

  const handleImageLoadStart = () => {
    onLoadStart();
  };

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
          onLoad={handleImageLoad}
          onLoadStart={handleImageLoadStart}
          priority={priority}
          loading="eager"
          sizes="100vw"
          quality={85}
        />
      </div>
    </div>
  );
};

// Calendar component for featured artists
const Calendar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [profilePictures, setProfilePictures] = useState<Record<number, string>>({});
  
  // Featured artists data with actual dates and FIDs
  const featuredArtists = {
    '2024-08-19': { name: 'Greywash', epoch: 5, fid: 1075107 }, // Aug 21-27
    '2024-08-26': { name: 'dwn2earth', epoch: 6, fid: 288204 }, // Aug 27-Sep 2
    '2024-09-02': { name: 'Chronist', epoch: 7, fid: 499579 }, // Sep 2-9
  };

  // Debug: Log the featured artists data
  useEffect(() => {
    console.log('Featured artists data:', featuredArtists);
    console.log('Current month:', currentMonth.toISOString().split('T')[0]);
  }, [currentMonth]);

  // Fetch profile pictures from Neynar API
  useEffect(() => {
    const fetchProfilePictures = async () => {
      try {
        const fids = Object.values(featuredArtists).map(artist => artist.fid);
        const uniqueFids = [...new Set(fids)];
        
        console.log('Fetching profile pictures for FIDs:', uniqueFids);
        
        const response = await fetch('/api/artists/recent');
        if (response.ok) {
          const data = await response.json();
          const pictures: Record<number, string> = {};
          
          data.artists?.forEach((artist: { fid: number; pfp: string }) => {
            pictures[artist.fid] = artist.pfp;
            console.log(`Loaded profile picture for FID ${artist.fid}:`, artist.pfp ? 'Success' : 'No URL');
          });
          
          console.log('Profile pictures loaded:', Object.keys(pictures));
          setProfilePictures(pictures);
        } else {
          console.error('Failed to fetch artists:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to fetch profile pictures:', error);
      }
    };

    fetchProfilePictures();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getArtistForWeek = (weekStart: Date) => {
    const weekKey = formatDate(weekStart);
    return featuredArtists[weekKey as keyof typeof featuredArtists];
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Artists Calendar</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
            <h3 className="text-xl font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-3">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-32 bg-gray-50 rounded-lg"></div>;
              }

              const weekStart = getWeekStart(day);
              const artist = getArtistForWeek(weekStart);
              const isWeekStart = day.getDay() === 0;
              const isToday = formatDate(day) === formatDate(new Date());

              // Debug logging
              if (isWeekStart && artist) {
                console.log(`Week starting ${formatDate(weekStart)}:`, artist.name, 'FID:', artist.fid, 'Profile pic:', profilePictures[artist.fid] ? 'Yes' : 'No');
              }

              return (
                <div
                  key={index}
                  className={`h-32 rounded-lg border-2 transition-all duration-200 ${
                    isToday 
                      ? 'border-blue-500 bg-blue-50' 
                      : isWeekStart && artist
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="p-3 h-full flex flex-col">
                    <div className={`text-sm font-medium ${
                      isToday ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {isWeekStart && artist && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        {profilePictures[artist.fid] ? (
                          <img 
                            src={profilePictures[artist.fid]} 
                            alt={artist.name}
                            className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-purple-300"
                            onError={(e) => {
                              console.log('Profile picture failed to load for:', artist.name);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-purple-700">
                          {artist.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Epoch {artist.epoch}
                        </div>
                        <div className="text-xs text-gray-400">
                          FID: {artist.fid}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-300 bg-purple-50 rounded"></div>
              <span>Featured Artist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
  { id: 5, name: 'Epoch 5', totalImages: 6, locked: false },
  { id: 6, name: 'Epoch 6', totalImages: 10, locked: true },
  { id: 7, name: 'Epoch 7', totalImages: 45, locked: false, artist: 'Chronist', fid: 499579 },
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
  private loadingQueue = new Map<string, Promise<void>>();

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

    const extension = epochId === 5 ? 'jpeg' : epochId === 6 ? 'png' : epochId === 7 ? 'jpg' : 'jpg';
    
    // Progressive loading: load current + next few images first, then the rest
    const currentImageIndex = 1; // Start with first image
    const priorityImages = this.getPriorityImageIndices(currentImageIndex, epochData.totalImages);
    
    // Load priority images first (current + next 3)
    await this.loadPriorityImages(epochId, priorityImages, extension);
    
    // Then load the rest in background
    this.loadRemainingImages(epochId, priorityImages, epochData.totalImages, extension);
    
    this.loadedEpochs.add(epochId);
    this.loadingEpochs.delete(epochId);
    console.log(`Epoch ${epochId} preloaded successfully`);
  }

  private getPriorityImageIndices(currentIndex: number, totalImages: number): number[] {
    const priority = [currentIndex];
    
    // Add next 5 images for ultra-smooth navigation
    for (let i = 1; i <= 5; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex <= totalImages) {
        priority.push(nextIndex);
      }
    }
    
    // Add previous 2 images if available
    for (let i = 1; i <= 2; i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 1) {
        priority.unshift(prevIndex);
      }
    }
    
    return priority;
  }

  private async loadPriorityImages(epochId: number, priorityIndices: number[], extension: string): Promise<void> {
    const promises = priorityIndices.map(index => 
      this.loadSingleImage(epochId, index, extension, true)
    );
    
    try {
      await Promise.all(promises);
      console.log(`Priority images for epoch ${epochId} loaded`);
    } catch (error) {
      console.error(`Failed to load priority images for epoch ${epochId}:`, error);
    }
  }

  private loadRemainingImages(epochId: number, priorityIndices: number[], totalImages: number, extension: string): void {
    // Load remaining images in background
    for (let i = 1; i <= totalImages; i++) {
      if (!priorityIndices.includes(i)) {
        this.loadSingleImage(epochId, i, extension, false);
      }
    }
  }

  private async loadSingleImage(epochId: number, imageIndex: number, extension: string, isPriority: boolean): Promise<void> {
    const imageSrc = `/images/epoch${epochId}/${imageIndex}.${extension}`;
    const cacheKey = `${epochId}-${imageIndex}`;
    
    // Check if already cached
    if (this.imageCache.has(cacheKey)) {
      return;
    }

    // Check if already loading
    if (this.loadingQueue.has(cacheKey)) {
      return this.loadingQueue.get(cacheKey);
    }

    // Create loading promise
    const loadingPromise = new Promise<void>((resolve) => {
      const img = new window.Image();
      
      img.onload = () => {
        this.imageCache.set(cacheKey, img);
        this.loadingQueue.delete(cacheKey);
        this.manageCacheSize();
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${imageSrc}`);
        this.loadingQueue.delete(cacheKey);
        resolve(); // Don't fail the whole epoch for one bad image
      };
      
      // Set loading priority
      if (isPriority) {
        img.loading = 'eager';
      }
      
      img.src = imageSrc;
    });

    this.loadingQueue.set(cacheKey, loadingPromise);
    return loadingPromise;
  }

  // Preload specific image range (for navigation)
  async preloadImageRange(epochId: number, startIndex: number, endIndex: number): Promise<void> {
    const epochData = EPOCHS.find(e => e.id === epochId);
    if (!epochData) return;

    const extension = epochId === 5 ? 'jpeg' : epochId === 6 ? 'png' : epochId === 7 ? 'jpg' : 'jpg';
    const promises: Promise<void>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 1 && i <= epochData.totalImages) {
        promises.push(this.loadSingleImage(epochId, i, extension, true));
      }
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error(`Failed to preload image range for epoch ${epochId}:`, error);
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
    this.loadingQueue.clear();
    this.loadedEpochs.clear();
    this.loadingEpochs.clear();
  }

  // Manage cache size to prevent memory issues
  private manageCacheSize(): void {
    const maxCacheSize = 200; // Reduced from 500 to improve performance
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
    
    // Start preloading epoch 7 images immediately when app loads
    // This happens during the mini app loading screen
    epochPreloader.preloadEpoch(7).catch(error => {
      console.error('Failed to preload epoch 7:', error);
    });
    
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
  const [calendarOpen, setCalendarOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [nextImage, setNextImage] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imageKey, setImageKey] = useState(0)
  
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
          const actions = frame.sdk.actions as Record<string, unknown>;
          if ('hapticFeedback' in actions && typeof actions.hapticFeedback === 'function') {
            console.log('Using Farcaster SDK hapticFeedback');
            await (actions.hapticFeedback as (type: string) => Promise<void>)('medium');
            return;
          }
          
          if ('vibrate' in actions && typeof actions.vibrate === 'function') {
            console.log('Using Farcaster SDK vibrate');
            await (actions.vibrate as (duration: number) => Promise<void>)(50);
            return;
          }
          
          if ('triggerHaptic' in actions && typeof actions.triggerHaptic === 'function') {
            console.log('Using Farcaster SDK triggerHaptic');
            await (actions.triggerHaptic as (type: string) => Promise<void>)('medium');
            return;
          }
        }
      } catch (sdkError) {
        console.log('Farcaster SDK haptic methods not available:', sdkError);
      }
      
      // 2. Try TBA-specific haptic feedback
      try {
        const windowWithTBA = window as typeof window & {
          TBA?: { hapticFeedback?: (type: string) => void };
          tba?: { hapticFeedback?: (type: string) => void };
        };
        
        if (typeof window !== 'undefined' && windowWithTBA.TBA?.hapticFeedback) {
          console.log('Using TBA hapticFeedback');
          windowWithTBA.TBA.hapticFeedback('medium');
          return;
        }
        
        if (typeof window !== 'undefined' && windowWithTBA.tba?.hapticFeedback) {
          console.log('Using tba hapticFeedback');
          windowWithTBA.tba.hapticFeedback('medium');
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
    
    // Only update image key when actually needed
    setImageKey(prev => prev + 1)
  }, [index, currentEpoch, debouncedTrackImageView])

  // Check if we have a cached image to avoid loading state
  useEffect(() => {
    if (index && currentEpoch) {
      const cachedImage = epochPreloader.getCachedImage(currentEpoch, index);
      if (cachedImage) {
        // Image is already cached, no loading needed
      }
    }
  }, [index, currentEpoch]);

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
    
    // Start preloading the new epoch silently in background
    epochPreloader.preloadEpoch(epochId).catch(error => {
      console.error('Failed to preload epoch:', error);
    });
    
    try {
      // TODO: Replace with actual Farcaster user ID
      const userId = 'YOUR_FARCASTER_USER_ID'; // This should be the user's Farcaster ID
      await sendFarcasterNotification(`New epoch available: ${epochName}! Check it out now.`, userId);
    } catch (error) {
      console.error('Failed to send Farcaster notification:', error);
    }
  };

  // Preload nearby images when navigating
  const preloadNearbyImages = useCallback((epochId: number, currentIndex: number) => {
    const epochData = EPOCHS.find(e => e.id === epochId);
    if (!epochData) return;

    const startIndex = Math.max(1, currentIndex - 3);
    const endIndex = Math.min(epochData.totalImages, currentIndex + 4);
    
    // Preload range in background
    epochPreloader.preloadImageRange(epochId, startIndex, endIndex);
  }, []);

  // Update preloading when index changes
  useEffect(() => {
    if (index && currentEpoch) {
      preloadNearbyImages(currentEpoch, index);
    }
  }, [index, currentEpoch, preloadNearbyImages]);

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

  const imageSrc = index ? `/images/epoch${currentEpoch}/${index}.${currentEpoch === 5 ? 'jpeg' : currentEpoch === 6 ? 'png' : 'jpg'}` : ''

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

      {/* Calendar Button */}
      {showMenuButton && (
        <button
          onClick={() => setCalendarOpen(true)}
          className={`absolute top-4 right-16 z-10 bg-black/30 text-white p-2 rounded-lg hover:bg-black/50 transition-all duration-300`}
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      )}

      {index && (
        <div className="relative w-full h-full">
          <ZoomableImage
            key={imageKey}
            src={imageSrc}
            alt={`Image ${index} from Epoch ${currentEpoch}`}
            onLoad={() => {}} // Removed onLoad
            onLoadStart={() => {}} // Removed onLoadStart
            priority
          />
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

      {/* Calendar */}
      <Calendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  )
}
