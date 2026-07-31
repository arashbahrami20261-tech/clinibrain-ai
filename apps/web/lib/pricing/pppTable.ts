import { createServiceClient } from '@/lib/supabase/server';

const DEFAULT_MULTIPLIER = 0.5; // fallback for any country not in the table
const DEFAULT_CURRENCY = 'USD';

export async function getLocalizedPrice(countryCode: string, baseUsd: number) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('pricing_multipliers')
    .select('currency_code, ppp_multiplier')
    .eq('country_code', countryCode.toUpperCase())
    .maybeSingle();

  const multiplier = data?.ppp_multiplier ?? DEFAULT_MULTIPLIER;
  const currency = data?.currency_code ?? DEFAULT_CURRENCY;
  const localizedAmount = Math.round(baseUsd * multiplier * 100) / 100;

  return { currency, multiplier, localizedAmount, usdEquivalent: baseUsd };
        }
