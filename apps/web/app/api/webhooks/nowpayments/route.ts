import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!;

function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = sortObject(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-nowpayments-sig');
  const payload = JSON.parse(rawBody);

  const sortedPayload = JSON.stringify(sortObject(payload));
  const expectedSignature = crypto.createHmac('sha512', ipnSecret).update(sortedPayload).digest('hex');

  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid IPN signature' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { order_id: clinicId, payment_status: paymentStatus, payment_id: paymentId } = payload;

  if (['finished', 'confirmed'].includes(paymentStatus)) {
    await supabase.from('subscriptions').upsert(
      {
        clinic_id: clinicId,
        plan: 'standard',
        status: 'active',
        payment_method: 'crypto',
        nowpayments_payment_id: paymentId,
        usd_equivalent: 50.0,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'clinic_id' }
    );
  } else if (['failed', 'expired'].includes(paymentStatus)) {
    await supabase.from('subscriptions').update({ status: 'incomplete' }).eq('clinic_id', clinicId);
  }

  return Response.json({ received: true });
}
