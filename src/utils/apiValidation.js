// API response validation schemas
export const schemas = {
  product: {
    id: 'string',
    name: 'string',
    description: 'string',
    price: 'number',
    image_url: 'string',
    in_stock: 'boolean'
  },
  
  session: {
    id: 'string',
    title: 'string',
    description: 'string',
    session_date: 'string',
    session_time: 'string',
    price: 'number',
    image_url: 'string'
  },
  
  blog: {
    id: 'string',
    title: 'string',
    content: 'string',
    excerpt: 'string',
    image_url: 'string',
    published: 'boolean'
  }
}

export const validateResponse = (data, schemaName) => {
  const schema = schemas[schemaName]
  if (!schema) return data
  
  if (Array.isArray(data)) {
    return data.map(item => validateItem(item, schema))
  }
  
  return validateItem(data, schema)
}

const validateItem = (item, schema) => {
  if (!item || typeof item !== 'object') return item
  
  const validated = {}
  
  for (const [key, expectedType] of Object.entries(schema)) {
    const value = item[key]
    
    if (value !== undefined && value !== null) {
      if (expectedType === 'string' && typeof value === 'string') {
        validated[key] = value
      } else if (expectedType === 'number' && typeof value === 'number') {
        validated[key] = value
      } else if (expectedType === 'boolean' && typeof value === 'boolean') {
        validated[key] = value
      } else {
        // Type mismatch - keep original value but log warning
        if (import.meta.env.DEV) {
          console.warn(`Type mismatch for ${key}: expected ${expectedType}, got ${typeof value}`)
        }
        validated[key] = value
      }
    }
  }
  
  // Include any additional fields not in schema
  for (const [key, value] of Object.entries(item)) {
    if (!(key in schema)) {
      validated[key] = value
    }
  }
  
  return validated
}