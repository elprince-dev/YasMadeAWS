import { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { apiCache, getCacheKey } from '../utils/cache'
import { logger } from '../utils/logger'
import { buildQuery, handleSupabaseError } from '../utils/supabaseHelpers'

export const useSupabaseQuery = (table, options = {}) => {
  const { supabase } = useSupabase()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    select = '*',
    filters = {},
    orderBy = null,
    limit = null,
    single = false,
    cache = true
  } = options

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheKey = getCacheKey(table, { select, filters, orderBy, limit, single })
        
        // Check cache first
        if (cache) {
          const cachedData = apiCache.get(cacheKey)
          if (cachedData) {
            setData(cachedData)
            setLoading(false)
            return
          }
        }

        // Execute query using helper
        const { data: result, error } = await buildQuery(supabase, table, options)

        if (error) throw error

        // Cache the result
        if (cache) {
          apiCache.set(cacheKey, result)
        }

        setData(result)
      } catch (err) {
        const errorMessage = handleSupabaseError(err)
        logger.error(errorMessage, `useSupabaseQuery:${table}`)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, table, JSON.stringify(options)])

  return { data, loading, error }
}