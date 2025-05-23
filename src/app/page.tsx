'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const TOTAL_IMAGES = 77

export default function Home() {
  const [index, setIndex] = useState<number | null>(1)
  const [showIndicator, setShowIndicator] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500) // Start fading
    const hideTimer = setTimeout(() => setShowIndicator(false), 3000) // Remove after fade
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const dismissIndicator = () => {
    setFadeOut(true)
    setTimeout(() => setShowIndicator(false), 500)
  }

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2

    if (showIndicator) dismissIndicator()

    setIndex((prev) => {
      if (!prev) return 1
      if (isLeft) return prev === 1 ? TOTAL_IMAGES : prev - 1
      return prev === TOTAL_IMAGES ? 1 : prev + 1
    })
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

      {showIndicator && (
        <div
          className={`absolute bottom-[10%] left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm select-none pointer-events-none transition-opacity duration-500 ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          tap right
        </div>
      )}
    </div>
  )
}
