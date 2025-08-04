// Common prop type definitions for better type checking
export const ProductType = {
  id: 'string',
  name: 'string',
  description: 'string',
  price: 'number',
  image_url: 'string',
  in_stock: 'boolean',
  created_at: 'string'
}

export const SessionType = {
  id: 'string',
  title: 'string',
  description: 'string',
  session_date: 'string',
  session_time: 'string',
  price: 'number',
  image_url: 'string',
  created_at: 'string'
}

export const BlogType = {
  id: 'string',
  title: 'string',
  content: 'string',
  excerpt: 'string',
  image_url: 'string',
  published: 'boolean',
  created_at: 'string'
}

export const UserType = {
  id: 'string',
  email: 'string',
  created_at: 'string'
}