const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL

/**
 * Send a newsletter email to all subscribers via the Email API.
 * Requires an admin session token for authentication.
 *
 * @param {{ subscribers: string[], subject: string, content: string, logoUrl: string }} payload
 * @param {string} accessToken - Supabase session access token
 * @returns {Promise<{ success: boolean, failedRecipients?: string[], error?: string }>}
 */
export async function sendNewsletter({ subscribers, subject, content, logoUrl }, accessToken) {
  const response = await fetch(`${EMAIL_API_URL}/newsletter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscribers, subject, content, logoUrl }),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || `Email service error (${response.status})`)
  }

  return result
}

/**
 * Send a contact form notification to the admin via the Email API.
 * Public endpoint — no auth required.
 *
 * @param {{ name: string, email: string, subject: string, message: string }} payload
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendContactNotification({ name, email, subject, message }) {
  const response = await fetch(`${EMAIL_API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, subject, message }),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || `Email service error (${response.status})`)
  }

  return result
}

/**
 * Send an order confirmation email to the customer and admin via the Email API.
 *
 * @param {object} orderData - Order details matching OrderConfirmationRequest shape
 * @param {string} [accessToken] - Optional Supabase session access token
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendOrderConfirmation(orderData, accessToken) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(`${EMAIL_API_URL}/order-confirmation`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || `Email service error (${response.status})`)
  }

  return result
}
