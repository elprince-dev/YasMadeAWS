import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LazyImage from '../common/LazyImage'
import QuranVerse from '../common/QuranVerse'

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const slides = [
    '/slide-4.jpeg',
    '/slide-2.jpeg',
    '/slide-3.jpeg',
    '/slide-1.jpeg',
    '/slide-5.jpeg',
    '/slide-6.jpeg',
    '/slide-7.jpeg',
    '/slide-8.jpeg'
  ]

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setTimeout(() => setIsTransitioning(false), 800)
    }
  }, [isTransitioning, slides.length])

  const goToSlide = useCallback((index) => {
    if (!isTransitioning && index !== currentSlide) {
      setIsTransitioning(true)
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 800)
    }
  }, [isTransitioning, currentSlide])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <>
      <div className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Slideshow Background */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="absolute inset-0"
            >
              <LazyImage 
                src={slides[currentSlide]}
                alt={`YasMade embroidery slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Subtle vignette effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
        </div>

        {/* Tagline Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="bg-black/30 backdrop-blur-sm rounded-2xl px-8 py-6 md:px-12 md:py-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
              Where Every Stitch
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light drop-shadow-lg">
              Tells a Story of Faith & Love
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <motion.div 
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/products" className="btn-primary text-center shadow-2xl hover:shadow-violet-500/25">
              Shop Collection
            </Link>
            <Link to="/sessions" className="btn-secondary text-center bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
              Join a Workshop
            </Link>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-3 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                  index === currentSlide 
                    ? 'bg-white scale-150 shadow-lg' 
                    : 'bg-white/40 hover:bg-white/70 hover:scale-125'
                } disabled:cursor-not-allowed`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quranic Verse Section */}
      {/* <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <QuranVerse />
          </motion.div>
        </div>
      </div> */}
    </>
  )
}

export default Hero