/**
 * STRICT enforcement mode (as requested): if the card's issuing country
 * doesn't match the country used to calculate the discounted price, the
 * discount is rejected and the standard USD price is charged instead.
 * This check runs server-side at the moment of payment — a client can
 * never be trusted to self-report its own country.
 */
export function verifyCardCountryMatchesClaim(
  cardCountry: string | null,
  claimedCountry: string
): { allowed: boolean; reason: string | null } {
  if (!cardCountry) {
    // Some card types/networks don't expose a country — fail closed.
    return { allowed: false, reason: 'Card country could not be verified' };
  }
  if (cardCountry.toUpperCase() !== claimedCountry.toUpperCase()) {
    return {
      allowed: false,
      reason: `Card country (${cardCountry}) does not match detected region (${claimedCountry})`,
    };
  }
  return { allowed: true, reason: null };
        }
