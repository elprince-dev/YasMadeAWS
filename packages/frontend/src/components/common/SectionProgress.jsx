import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function SectionProgress() {
  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'products', label: 'Products' },
    { id: 'blog', label: 'Blog' },
    { id: 'workshops', label: 'Workshops' },
    { id: 'story', label: 'Story' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
        <div className="flex flex-col space-y-3">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group relative"
            >
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeSection 
                  ? 'bg-primary-600 scale-125' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-primary-400'
              }`} />
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                  {section.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SectionProgress