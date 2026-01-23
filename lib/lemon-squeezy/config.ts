/**
 * Lemon Squeezy configuration helpers.
 * This file does NOT use "use server" to allow synchronous functions.
 */

/**
 * Get the variant ID for checkout based on environment configuration.
 * Uses test variant ID when in test mode, otherwise uses live variant ID.
 * 
 * @throws Error if the required environment variable is not set
 */
export function getCheckoutVariantId(): string {
  const isTestMode = process.env.LEMON_SQUEEZY_TEST_MODE === "true";
  
  if (isTestMode) {
    const testVariantId = process.env.LEMON_SQUEEZY_TEST_VARIANT_ID;
    if (!testVariantId) {
      throw new Error(
        'LEMON_SQUEEZY_TEST_VARIANT_ID is required when LEMON_SQUEEZY_TEST_MODE is "true".\n' +
        'Set it in your .env.local file with your test variant ID from Lemon Squeezy.'
      );
    }
    console.log('[getCheckoutVariantId] Using TEST variant ID:', testVariantId);
    return testVariantId;
  }
  
  const liveVariantId = process.env.LEMON_SQUEEZY_VARIANT_ID;
  if (!liveVariantId) {
    throw new Error(
      'LEMON_SQUEEZY_VARIANT_ID is required for live checkout.\n' +
      'Set it in your .env.local file with your live variant ID from Lemon Squeezy.'
    );
  }
  console.log('[getCheckoutVariantId] Using LIVE variant ID:', liveVariantId);
  return liveVariantId;
}
