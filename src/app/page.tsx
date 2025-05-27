'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Menu from './components/menu'

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
];

export default function Home() {
  const [currentEpoch, setCurrentEpoch] = useState(2)
  const [index, setIndex] = useState<number | null>(1)
  const [showIndicator, setShowIndicator] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [imageExt, setImageExt] = useState<'jpg' | 'png'>('jpg')
  const [isLoading, setIsLoading] = useState(true)
  const [nextImage, setNextImage] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imageKey, setImageKey] = useState(0)

  // Reset indicator when epoch changes
  useEffect(() => {
    setShowIndicator(true)
    setFadeOut(false)
    const fadeTimer = setTimeout(() => setFadeOut(true), 4500)
    const hideTimer = setTimeout(() => setShowIndicator(false), 5000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [currentEpoch])

  // Preload next image
  useEffect(() => {
    if (!index) return

    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0
    const nextIndex = index === totalImages ? 1 : index + 1
    const nextImageSrc = `/images/epoch${currentEpoch}/${nextIndex}.${imageExt}`

    const img = new window.Image()
    img.src = nextImageSrc
    img.onload = () => {
      setNextImage(nextImageSrc)
    }
  }, [index, currentEpoch, imageExt])

  const dismissIndicator = () => {
    setFadeOut(true)
    setTimeout(() => setShowIndicator(false), 500)
  }

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (menuOpen) return

    const { clientX, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2
    const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
    const totalImages = currentEpochData?.totalImages || 0

    if (showIndicator) dismissIndicator()

    setIndex((prev) => {
      if (!prev) return 1
      
      // Handle navigation for both epochs
      if (isLeft) {
        // When tapping left at first image, go to last image
        if (prev === 1) {
          return totalImages
        }
        return prev - 1
      } else {
        // When tapping right at last image, go to first image
        if (prev === totalImages) {
          return 1
        }
        return prev + 1
      }
    })
    setImageExt('jpg')
    setImageKey(prev => prev + 1)
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

  const handleEpochChange = (epochId: number) => {
    setCurrentEpoch(epochId);
    setIndex(1);
    setImageExt('jpg');
    setImageKey(prev => prev + 1);
    setShowIndicator(true);
    setFadeOut(false);
    setMenuOpen(false);
  };

  const imageSrc = index ? `/images/epoch${currentEpoch}/${index}.${imageExt}` : ''

  return (
    <div
      className="w-screen h-screen bg-black flex items-center justify-center relative"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Menu Button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
      >
        <Image
          src="/new-menu-icon.png"
          alt="Menu Icon"
          width={96}
          height={96}
        />
      </button>

      {index && (
        <div className="relative w-full h-full">
          <Image
            key={imageKey}
            src={imageSrc}
            alt={`Image ${index} from Epoch ${currentEpoch}`}
            width={1920}
            height={1080}
            className="object-contain w-full h-full transition-opacity duration-300"
            onLoadingComplete={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
            onError={(e) => {
              if (imageExt === 'jpg') {
                setImageExt('png')
                setImageKey(prev => prev + 1)
              } else {
                // If both jpg and png fail, try the next image
                const currentEpochData = EPOCHS.find(e => e.id === currentEpoch)
                const totalImages = currentEpochData?.totalImages || 0
                const nextIndex = index === totalImages ? 1 : index + 1
                setIndex(nextIndex)
                setImageExt('jpg')
                setImageKey(prev => prev + 1)
                setIsLoading(true)
              }
            }}
            priority
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {showIndicator && (
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
        />
      )}
    </div>
  )
}