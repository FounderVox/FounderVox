"use server";
import {
  createCheckoutUrl,
  createCustomerPortal,
  getAllProducts,
  getFirstVariant,
} from "../../lib/lemon-squeezy/server";
import { getCustomerId } from "../../supabase/database/user";
import { getSubscriptionId } from "../../supabase/database/subscriptions";
import { createClient } from "../../src/lib/supabase/server";

export async function getSubscriptionProducts() {
  const products = await getAllProducts();
  const subscriptionProducts = products.filter((product) =>
    product.attributes.name.startsWith("subscription"),
  );

  const productWithVariant = await Promise.all(
    subscriptionProducts.map(async (product) => {
      const variant = await getFirstVariant(product.id);
      return {
        ...product.attributes,
        variant_id: variant?.id,
      };
    }),
  );

  return productWithVariant;
}

export async function handleCheckout(variantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

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
 * Start checkout flow for new users after onboarding
 * Gets the first subscription product and creates a checkout URL
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

    // Get all products
    console.log('[startOnboardingCheckout] Fetching products...');
    const products = await getAllProducts();
    console.log('[startOnboardingCheckout] Total products:', products.length);
    
    if (products.length === 0) {
      console.error("[startOnboardingCheckout] No products found in Lemon Squeezy store.");
      return null;
    }

    // Log all product names for debugging
    console.log('[startOnboardingCheckout] Available products:', products.map(p => p.attributes.name));

    // Use the first available product (regardless of name)
    const firstProduct = products[0];
    console.log('[startOnboardingCheckout] Using product:', firstProduct.attributes.name, 'ID:', firstProduct.id);
    
    const variant = await getFirstVariant(firstProduct.id);
    console.log('[startOnboardingCheckout] Variant found:', variant ? `ID: ${variant.id}` : 'None');

    if (!variant?.id) {
      console.error("[startOnboardingCheckout] No variant found for first subscription product");
      return null;
    }

    // Create checkout URL with redirect to success page after completion
    // The success page will poll for payment confirmation before redirecting to dashboard
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log('[startOnboardingCheckout] Creating checkout URL with redirect:', `${appUrl}/payment/success`);
    
    const checkoutUrl = await createCheckoutUrl({
      variantId: variant.id.toString(),
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