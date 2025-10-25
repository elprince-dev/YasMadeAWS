import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../contexts/SupabaseContext'

function QuranVerse() {
  const { supabase } = useSupabase()
  const [verse, setVerse] = useState({
    text: 'Indeed, Allah is with the patient.',
    source: "Qur'an 2:153",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVerse() {
      try {
        // Try to fetch verse from Supabase
        const { data, error } = await supabase
          .from('settings')
          .select('quran_verse, quran_verse_source')
          .single()
        
        if (error) {
          console.error('Error fetching verse:', error)
          setLoading(false)
          return
        }
        
        if (data) {
          setVerse({
            text: data.quran_verse,
            source: data.quran_verse_source,
          })
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchVerse()
  }, [supabase])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center px-4"
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-6">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></div>
          <div>
            <p className="text-xl md:text-2xl font-medium italic text-gray-800 dark:text-gray-200 mb-2">
              "{verse.text}"
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              — {verse.source}
            </p>
          </div>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></div>
        </div>
      )}
    </motion.div>
  )
}

export default QuranVerse