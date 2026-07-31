import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { getLocalizedPrice } from '@/lib/pricing/pppTable';
import { verifyCardCountryMatchesClaim } from '@/lib/pricing/verifyCardCountry';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const BASE_PRICE_USD = 50;

export async function POST(req: NextRequest) {
  const { clinicId, paymentMethodId, claimedCountry, email } = await req.json();

  if (!clinicId || !paymentMethodId || !claimedCountry || !email) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const cardCountry = paymentMethod.card?.country || null;

  const check = verifyCardCountryMatchesClaim(cardCountry, claimedCountry);
  const effectiveCountry = check.allowed ? claimedCountry : 'US';

  const pricing = await getLocalizedPrice(effectiveCountry, BASE_PRICE_USD);

  const supabase = createServiceClient();
  const { data: clinic } = await supabase
    .from('clinics')
    .select('stripe_customer_id')
    .eq('id', clinicId)
    .single();

  let customerId = clinic?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, payment_method: paymentMethodId });
    customerId = customer.id;
    await supabase.from('clinics').update({ stripe_customer_id: customerId }).eq('id', clinicId);
  } else {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const price = await stripe.prices.create({
    unit_amount: Math.round(pricing.localizedAmount * 100),
    currency: pricing.currency.toLowerCase(),
    recurring: { interval: 'month' },
    product_data: { name: 'CliniBrain AI — Monthly Subscription' },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    expand: ['latest_invoice.payment_intent'],
  });

  await supabase.from('subscriptions').upsert(
    {
      clinic_id: clinicId,
      plan: 'standard',
      status: 'active',
      payment_method: 'stripe',
      stripe_subscription_id: subscription.id,
      currency_charged: pricing.currency,
      amount_charged: pricing.localizedAmount,
      usd_equivalent: BASE_PRICE_USD,
      country_at_signup: effectiveCountry,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    },
    { onConflict: 'clinic_id' }
  );

  return Response.json({
    success: true,
    subscriptionId: subscription.id,
    priceCharged: pricing.localizedAmount,
    currency: pricing.currency,
    pricingAdjustmentApplied: check.allowed,
    note: check.allowed ? null : 'Standard pricing applied — region could not be verified against payment method.',
  });
         }
