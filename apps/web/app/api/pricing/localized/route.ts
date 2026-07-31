import { NextRequest } from 'next/server';
import { getLocalizedPrice } from '@/lib/pricing/pppTable';

const BASE_PRICE_USD = 50;

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') || 'US';
  const pricing = await getLocalizedPrice(country, BASE_PRICE_USD);

  return Response.json({ country, ...pricing });
}
