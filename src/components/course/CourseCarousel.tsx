'use client'

import { useRef, useState, useEffect, ReactNode } from 'react'

interface CourseCarouselProps {
  title: string
  children: ReactNode
}

export function CourseCarousel({ title, children }: CourseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const resizeObs = new ResizeObserver(checkScroll)
    resizeObs.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      resizeObs.disconnect()
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = 230 + 16 // card width + gap
    const visibleCards = Math.floor(el.clientWidth / cardWidth)
    const scrollAmount = cardWidth * Math.max(1, visibleCards - 1)
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mb-10">
      <h2
        className="text-[28px] font-semibold text-white mb-5 px-4 md:px-8 lg:px-12"
      >
        {title}
      </h2>

      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: 'linear-gradient(to right, rgba(10,10,10,0.9) 0%, transparent 100%)',
            }}
            aria-label="Rolar para a esquerda"
          >
            <span className="text-white text-3xl font-light select-none">&lsaquo;</span>
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-8 lg:px-12 pb-2 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {children}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: 'linear-gradient(to left, rgba(10,10,10,0.9) 0%, transparent 100%)',
            }}
            aria-label="Rolar para a direita"
          >
            <span className="text-white text-3xl font-light select-none">&rsaquo;</span>
          </button>
        )}
      </div>

      {/* Hide native scrollbar via inline style tag */}
      <style>{`
        div[class*="overflow-x-auto"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
