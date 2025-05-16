'use client'

import { useState } from 'react'
import Image from 'next/image'

const TOTAL_IMAGES = 79

export default function Home() {
  const [index, setIndex] = useState<number | null>(1)

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e
    const isLeft = clientX < currentTarget.clientWidth / 2

    setIndex((prev) => {
      if (!prev) return 1
      if (isLeft) return prev === 1 ? TOTAL_IMAGES : prev - 1
      return prev === TOTAL_IMAGES ? 1 : prev + 1
    })
  }

  const imageSrc = index ? `/images/${index}.jpg` : ''

  return (
    <div
      className="w-screen h-screen bg-black flex items-center justify-center"
      onClick={handleTap}
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
    </div>
  )
}