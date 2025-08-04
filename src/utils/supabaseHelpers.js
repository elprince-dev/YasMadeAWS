// Supabase query helpers to reduce code duplication
export const buildQuery = (supabase, table, options = {}) => {
  const {
    select = '*',
    filters = {},
    orderBy = null,
    limit = null,
    single = false
  } = options

  let query = supabase.from(table).select(select)

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.startsWith('gt.')) {
        query = query.gt(key, value.substring(3))
      } else if (typeof value === 'string' && value.startsWith('lt.')) {
        query = query.lt(key, value.substring(3))
      } else if (typeof value === 'string' && value.startsWith('gte.')) {
        query = query.gte(key, value.substring(4))
      } else if (typeof value === 'string' && value.startsWith('lte.')) {
        query = query.lte(key, value.substring(4))
      } else {
        query = query.eq(key, value)
      }
    }
  })

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending })
  }

  // Apply limit
  if (limit) {
    query = query.limit(limit)
  }

  return single ? query.single() : query
}

export const handleSupabaseError = (error) => {
  if (error?.code === 'PGRST116') {
    return 'No data found'
  }
  if (error?.code === '23505') {
    return 'This item already exists'
  }
  return error?.message || 'An unexpected error occurred'
}