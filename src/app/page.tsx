'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const TOTAL_IMAGES = 77

export default function Home() {
  const [index, setIndex] = useState<number | null>(1)
  const [showIndicator, setShowIndicator] = useState(true)
  const touchStartX = useRef<number | null>(null)

  // Hide indicator after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowIndicator(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Handle click/tap to navigate images and hide indicator
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2

    // Hide the indicator on first interaction
    if (showIndicator) setShowIndicator(false)

    setIndex((prev) => {
      if (!prev) return 1
      if (isLeft) return prev === 1 ? TOTAL_IMAGES : prev - 1
      return prev === TOTAL_IMAGES ? 1 : prev + 1
    })
  }

  // Handle swipe start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  // Handle swipe end, check if swipe happened, and hide indicator
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    if (Math.abs(touchEndX - touchStartX.current) > 30) {
      if (showIndicator) setShowIndicator(false)
    }
    touchStartX.current = null
  }

  const imageSrc = index ? `/images/${index}.jpg` : ''

  return (
    <div
      className="w-screen h-screen bg-black flex items-center justify-center relative"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {index && (
        <Image
          src={imageSrc}
          alt={`Image ${index}`}
          width={1920}
          height={1080}
          className="object-contain w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/images/fallback.jpg'
          }}
        />
      )}

      {/* Indicator overlay */}
      {showIndicator && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '1rem',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>⬅️</span>
          <span>Click or Tap</span>
          <span style={{ fontSize: '1.5rem' }}>➡️</span>
        </div>
      )}
    </div>
  )
}
