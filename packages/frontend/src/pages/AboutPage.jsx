import { motion } from 'framer-motion'
import { FiHeart, FiUsers, FiStar, FiArrowRight } from 'react-icons/fi'

function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={containerVariants}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="./slide-4.jpeg"
            alt="YasMade Embroidery Art"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <motion.div 
          variants={itemVariants}
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            About <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">YasMade</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed">
            Where creativity meets mindfulness in every stitch
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20 z-20">
        <div className="container-custom">
          {/* Story Card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 mb-16 backdrop-blur-sm"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mr-4">
                    <FiHeart className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Story</h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Yasmade is a handmade embroidery brand that celebrates creativity, mindfulness, and the beauty of slow art. Founded by Yasmeen, Yasmade creates elegant embroidery hoops and stitched designs for home décor and gifts.
                  Alongside her art, Yasmeen offers engaging embroidery workshops for kids, teens, and adults , encouraging creativity, focus, and confidence through the art of stitching. Whether you’re looking for a handmade keepsake or a creative experience, Yasmade is where inspiration is stitched into every detail.
                </p>
                {/* <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Alongside her art, Yasmeen offers engaging embroidery workshops for kids, teens, and adults, encouraging creativity, focus, and confidence through the art of stitching.
                </p> */}
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiStar className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Handcrafted Excellence</h3>
                    <p className="text-gray-600 dark:text-gray-300">Every piece tells a story of dedication and artistry</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>



          {/* CTA Section */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-12 text-center"
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-6">Join Our Creative Journey</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Whether you are drawn to our handcrafted embroidery pieces, eager to learn the art of stitching, or simply inspired by our love for Islamic art, we would love to have you join our growing creative community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/contact" className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                  Contact Us
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a href="/sessions" className="inline-flex items-center px-8 py-4 bg-white/20 text-white rounded-full font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm">
                  Join a Workshop
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default AboutPage