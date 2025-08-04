// Application constants
export const APP_CONFIG = {
  name: 'YasMade',
  description: 'Handmade embroidery, creative sessions, and artistic inspiration for your home and life.',
  currency: 'CAD',
  defaultLocale: 'en-US'
}

export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxAge: 10 * 60 * 1000 // 10 minutes
}

export const UI_CONFIG = {
  headerHeight: 80,
  animationDuration: 300,
  toastDuration: 5000,
  debounceDelay: 300,
  throttleLimit: 100
}

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export const ROUTES = {
  home: '/',
  products: '/products',
  productDetail: '/products/:id',
  blog: '/blog',
  blogPost: '/blog/:id',
  sessions: '/sessions',
  sessionDetail: '/sessions/:id',
  contact: '/contact',
  cart: '/cart',
  admin: {
    login: '/admin/login',
    dashboard: '/admin',
    products: '/admin/products',
    blogs: '/admin/blogs',
    sessions: '/admin/sessions',
    orders: '/admin/orders',
    settings: '/admin/settings'
  }
}

export const API_ENDPOINTS = {
  products: 'products',
  blogs: 'blogs',
  sessions: 'sessions',
  subscribers: 'subscribers',
  orders: 'orders',
  settings: 'settings'
}