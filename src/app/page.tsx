'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Menu from './components/menu'
import { sendFarcasterNotification } from './lib/notifications'
import * as frame from '@farcaster/frame-sdk'

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
  { id: 5, name: 'Epoch 5-Greywash', totalImages: 6, locked: false },
];

export default function Home() {
  const [currentEpoch, setCurrentEpoch] = useState(5)
  const [index, setIndex] = useState<number | null>(1)
  const [showIndicator, setShowIndicator] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMenuButton, setShowMenuButton] = useState(true)
  const [hasTapped, setHasTapped] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nextImage, setNextImage] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imageKey, setImageKey] = useState(0)

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
      } else if (e.key === 'ArrowRight') {
        setIndex((prev) => {
          if (!prev) return 1;
          const newIndex = prev === totalImages ? 1 : prev + 1;
          return newIndex;
        });
        setImageKey(prev => prev + 1)
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

  // Show Epoch 5 disclaimer on first load
  useEffect(() => {
    if (currentEpoch === 5) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showNotification', { 
          detail: { 
            message: `This one was curated, and created by another amazing artist, @Greywash`,
            type: 'epoch5-notice',
            artistProfile: 'https://warpcast.com/greywash'
          } 
        }));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentEpoch]);

  // Preload next image
  useEffect(() => {
    if (!index) return

    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0
    const nextIndex = index === totalImages ? 1 : index + 1
    const extension = currentEpoch === 5 ? 'jpeg' : 'jpg'
    const nextImageSrc = `/images/epoch${currentEpoch}/${nextIndex}.${extension}`

    const img = new window.Image()
    img.src = nextImageSrc
    img.onload = () => {
      setNextImage(nextImageSrc)
    }
    setImageKey(prev => prev + 1)
  }, [index, currentEpoch])

  const dismissIndicator = () => {
    setFadeOut(true)
    // Keep the indicator element in the DOM briefly for the fade out transition
    setTimeout(() => setShowIndicator(false), 500)
  }

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2
    const isTopLeft = clientX < currentTarget.clientWidth / 2 && clientY < currentTarget.clientHeight * 0.2;
    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0

    if (menuOpen) return

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
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
      // Use Farcaster SDK haptics for better support
      if (typeof window !== 'undefined' && (window as unknown as { sdk?: { haptics?: { impactOccurred: (type: string) => void } } }).sdk?.haptics) {
        (window as unknown as { sdk: { haptics: { impactOccurred: (type: string) => void } } }).sdk.haptics.impactOccurred('medium');
      }
      // Fallback to basic vibration if Farcaster SDK is not available
      else if ("vibrate" in navigator) {
        navigator.vibrate(100);
      }
    } else {
      setIndex((prev) => {
        if (!prev) return 1;
        const newIndex = prev === totalImages ? 1 : prev + 1;
        return newIndex;
      });
      setImageKey(prev => prev + 1);
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
      // Use Farcaster SDK haptics for better support
      if (typeof window !== 'undefined' && (window as unknown as { sdk?: { haptics?: { impactOccurred: (type: string) => void } } }).sdk?.haptics) {
        (window as unknown as { sdk: { haptics: { impactOccurred: (type: string) => void } } }).sdk.haptics.impactOccurred('medium');
      }
      // Fallback to basic vibration if Farcaster SDK is not available
      else if ("vibrate" in navigator) {
        navigator.vibrate(100);
      }
    }
  }

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the tap from triggering navigation
    setMenuOpen(true)
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
    setCurrentEpoch(epochId);
    setIndex(1);
    setImageKey(prev => prev + 1);
    setShowIndicator(true);
    setFadeOut(false);
    setMenuOpen(false);
    setShowMenuButton(false);
    
    const epochName = EPOCHS.find(e => e.id === epochId)?.name;
    window.dispatchEvent(new CustomEvent('showNotification', { detail: { message: `Switched to ${epochName}` } }));
    
    // Show special notification for Epoch 5-Greywash
    if (epochId === 5) {
      window.dispatchEvent(new CustomEvent('showNotification', { 
        detail: { 
          message: `This epoch was curated by a different artist`,
          type: 'epoch5-notice',
          artistProfile: 'https://warpcast.com/greywash' // Replace with actual Farcaster profile URL
        } 
      }));
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
          <Image
            key={imageKey}
            src={imageSrc}
            alt={`Image ${index} from Epoch ${currentEpoch}`}
            width={1920}
            height={1080}
            className="object-contain w-full h-full transition-opacity duration-300"
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
            priority
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {showIndicator && !menuOpen && (
        <div
          className={`absolute bottom-[10%] left-1/2 transform -translate-x-1/2 text-white text-sm select-none pointer-events-none transition-opacity duration-500 ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p>tap right</p>
        </div>
      )}

      {menuOpen && (
        <Menu 
          onClose={() => setMenuOpen(false)} 
          onEpochChange={handleEpochChange}
          currentEpoch={currentEpoch}
        />
      )}
    </div>
  )
}
