import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, promoCode } = await req.json();

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided');
    }

    // Fetch shipping rates
    const { data: shippingRates, error: shippingError } = await supabase
      .from('shipping_rates')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (shippingError) throw shippingError;

    // Fetch promo code if provided
    let promoCodeData = null;
    if (promoCode) {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        promoCodeData = data;
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Apply discount if valid promo code
    let discount = 0;
    if (promoCodeData) {
      if (promoCodeData.discount_type === 'percentage') {
        discount = subtotal * (promoCodeData.discount_value / 100);
      } else {
        discount = promoCodeData.discount_value;
      }

      // Apply minimum purchase amount check
      if (promoCodeData.min_purchase_amount && subtotal < promoCodeData.min_purchase_amount) {
        discount = 0;
      }

      // Apply maximum discount amount
      if (promoCodeData.max_discount_amount && discount > promoCodeData.max_discount_amount) {
        discount = promoCodeData.max_discount_amount;
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'cad',
      line_items: items.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      shipping_options: shippingRates.map(rate => ({
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(rate.price * 100), // Convert to cents
            currency: 'cad',
          },
          display_name: rate.name,
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: rate.estimated_days_min || 1,
            },
            maximum: {
              unit: 'business_day',
              value: rate.estimated_days_max || 7,
            },
          },
        },
      })),
      discounts: discount > 0 ? [{
        coupon: await stripe.coupons.create({
          amount_off: Math.round(discount * 100), // Convert to cents
          currency: 'cad',
          duration: 'once',
        }),
      }] : [],
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
    });

    return new Response(
      JSON.stringify({ id: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});