"use server";
import {
  createCheckoutUrl,
  createCustomerPortal,
} from "../../lib/lemon-squeezy/server";
import { getCheckoutVariantId } from "../../lib/lemon-squeezy/config";
import { getCustomerId } from "../../supabase/database/user";
import { getSubscriptionId } from "../../supabase/database/subscriptions";
import { createClient } from "../../src/lib/supabase/server";

/**
 * Start checkout for the beta plan.
 * Uses variant ID from environment variables (no dynamic fetching).
 */
export async function handleCheckout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const variantId = getCheckoutVariantId();
  
  const checkoutUrl = await createCheckoutUrl({
    variantId,
    userEmail: user?.email!,
    userId: user?.id!,
  });

  return checkoutUrl;
}

export async function getCustomerPortalUrl() {
  const supabaseClient = await createClient();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return null;
  }
  const customerId = await getCustomerId(supabaseClient, user.id);
  const subscriptionId = await getSubscriptionId(supabaseClient, customerId);
  const url = await createCustomerPortal(subscriptionId);
  console.log(url);
  return url;
}

/**
 * Start checkout flow for new users after onboarding.
 * Uses variant ID from environment variables (no dynamic fetching).
 */
export async function startOnboardingCheckout() {
  try {
    console.log('[startOnboardingCheckout] Starting checkout flow...');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[startOnboardingCheckout] No user found');
      return null;
    }

    console.log('[startOnboardingCheckout] User found:', user.id);

    // Get variant ID from environment variables
    const variantId = getCheckoutVariantId();
    console.log('[startOnboardingCheckout] Using variant ID from env:', variantId);

    // Create checkout URL with redirect to success page after completion
    // The success page will poll for payment confirmation before redirecting to dashboard
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log('[startOnboardingCheckout] Creating checkout URL with redirect:', `${appUrl}/payment/success`);
    
    const checkoutUrl = await createCheckoutUrl({
      variantId,
      userEmail: user.email || "",
      userId: user.id,
      redirectUrl: `${appUrl}/payment/success`,
    });

    console.log('[startOnboardingCheckout] Checkout URL created:', checkoutUrl ? 'Success' : 'Failed');
    return checkoutUrl;
  } catch (error) {
    console.error('[startOnboardingCheckout] Error:', error);
    return null;
  }
}