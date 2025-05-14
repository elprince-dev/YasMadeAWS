import { motion } from 'framer-motion'

function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-24"
    >
      <div className="container-custom">
        {/* Hero Section */}
        <div className="relative h-[400px] rounded-2xl overflow-hidden mb-16">
          <img
            src="https://images.pexels.com/photos/4620467/pexels-photo-4620467.jpeg"
            alt="Islamic Embroidery Art"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 to-fuchsia-900/80 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
              About YasMade
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Our Story</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              YasMade began as a personal journey of faith expression through the art of embroidery. 
              What started as a quiet evening hobby has blossomed into a passion for creating 
              meaningful pieces that bring beauty and remembrance into Muslim homes.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Each piece is handcrafted with attention to detail and love, inspired by Islamic art 
              and the beauty of our faith. Our embroidery work combines traditional techniques with 
              contemporary designs, creating pieces that are both meaningful and beautiful.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              At YasMade, our mission is to create beautiful, handcrafted Islamic embroidery that 
              brings both aesthetic beauty and spiritual remembrance into homes. We believe in the 
              power of art to inspire, uplift, and connect people to their faith.
            </p>
          </div>

          {/* Creative Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Creative Sessions</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Beyond creating products, YasMade has grown to include workshops where both adults 
              and children can learn this traditional craft in a nurturing environment. Our sessions 
              are designed to be inclusive, engaging, and spiritually enriching.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Our Values</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Quality craftsmanship in every piece',
                'Spiritual mindfulness in our work',
                'Community engagement through creative sessions',
                'Preservation of traditional Islamic arts',
                'Continuous learning and improvement'
              ].map((value, index) => (
                <li 
                  key={index}
                  className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                  <span className="text-gray-700 dark:text-gray-300">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Join Our Journey */}
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-white">Join Our Journey</h2>
            <p className="text-lg text-white mb-6">
              Whether you're interested in our handcrafted pieces, want to learn embroidery, or 
              simply share in our appreciation for Islamic art, we welcome you to be part of our 
              growing community.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="/contact" className="btn-secondary bg-white text-gray-900">
                Contact Us
              </a>
              <a href="/sessions" className="btn-secondary bg-white text-gray-900">
                Join a Session
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AboutPage