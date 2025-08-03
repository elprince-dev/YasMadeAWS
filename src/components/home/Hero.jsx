import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QuranVerse from '../common/QuranVerse'

function Hero() {
  return (
    <>
      <div className="relative min-h-[80vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/29931438/pexels-photo-29931438/free-photo-of-cozy-embroidery-hooping-with-warm-beverages.jpeg"
            alt="Islamic embroidery artwork" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 backdrop-blur-[1px]" />
        </div>

        {/* Content */}
        <div className="relative container-custom pt-32 pb-24">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <h1 className="heading-1 mb-6 text-white">
                <span className="block">Where Every Stitch</span>
                <span className="gradient-text">Tells a story</span>
                {/* <span className="block">With Love & Faith</span> */}
              </h1>
              
              <p className="text-lg md:text-xl text-gray-200 mb-8">
                Handcrafted embroidery hoops, personalized designs, and creative workshops made with love and faith.
                
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <Link to="/products" className="btn-primary text-center">
                  Shop Collection
                </Link>
                <Link to="/sessions" className="btn-secondary text-center">
                  Join a Workshop
                </Link>
              </div>
            </motion.div>
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