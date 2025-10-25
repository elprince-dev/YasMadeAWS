import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16'
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productId, name, description, price, image, stripeProductId, stripePriceId } = await req.json()

    let productData = {
      name,
      description,
      images: image ? [image] : undefined
    }

    // Create or update Stripe product
    let product
    if (stripeProductId) {
      product = await stripe.products.update(stripeProductId, productData)
    } else {
      product = await stripe.products.create(productData)
    }

    // Create or update price
    let priceData = {
      currency: 'cad',
      product: product.id,
      unit_amount: Math.round(price * 100), // Convert to cents
    }

    let newPrice
    if (stripePriceId) {
      // Stripe doesn't allow updating prices, so we create a new one
      newPrice = await stripe.prices.create(priceData)
      // Deactivate the old price
      await stripe.prices.update(stripePriceId, { active: false })
    } else {
      newPrice = await stripe.prices.create(priceData)
    }

    return new Response(
      JSON.stringify({
        productId: product.id,
        priceId: newPrice.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})