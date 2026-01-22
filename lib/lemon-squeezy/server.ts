"use server";

import {
  createCheckout,
  getSubscription,
  getVariant,
  lemonSqueezySetup,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";


export async function configureLemonSqueezy() {
  // Debug: Log env var status
  console.log('[configureLemonSqueezy] Checking env vars:');
  console.log('  LEMON_SQUEEZY_API:', process.env.LEMON_SQUEEZY_API ? `Set (${process.env.LEMON_SQUEEZY_API.substring(0, 20)}...)` : 'NOT SET');
  console.log('  LEMON_SQUEEZY_STORE_ID:', process.env.LEMON_SQUEEZY_STORE_ID || 'NOT SET');
  console.log('  LEMON_SQUEEZY_WEBHOOK_SECRET:', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ? 'Set' : 'NOT SET');
  console.log('  LEMON_SQUEEZY_TEST_MODE:', process.env.LEMON_SQUEEZY_TEST_MODE || 'NOT SET (defaults to false)');
  
  const requiredVars = [
    "LEMON_SQUEEZY_API",
    "LEMON_SQUEEZY_STORE_ID",
    "LEMON_SQUEEZY_WEBHOOK_SECRET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    return {
      error: `Missing required LEMONSQUEEZY env variables: ${missingVars.join(
        ", ",
      )}. Please, set them in your .env file.`,
    };
  }

  lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API });
  return { error: null };
}

export async function getAllProducts() {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error('[getAllProducts] Configuration error:', error);
    return [];
  }
  
  try {
    console.log('[getAllProducts] Fetching products for store:', process.env.LEMON_SQUEEZY_STORE_ID);
    const products = await listProducts({
      filter: {
        storeId: process.env.LEMON_SQUEEZY_STORE_ID!,
      },
    });

    console.log('[getAllProducts] API response:', {
      hasData: !!products.data,
      hasDataData: !!products.data?.data,
      productCount: products.data?.data?.length || 0,
      error: products.error ? JSON.stringify(products.error) : 'none'
    });

    if (!products.data) {
      console.error('[getAllProducts] No data in response:', JSON.stringify(products, null, 2));
      return [];
    }

    return products.data.data;
  } catch (error) {
    console.error('[getAllProducts] Exception:', error);
    return [];
  }
}

export async function getFirstVariant(productId: string) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error('[getFirstVariant] Configuration error:', error);
    return null;
  }
  
  try {
    console.log('[getFirstVariant] Fetching variants for product:', productId);
    const variants = await listVariants({
      filter: {
        productId,
      },
    });

    console.log('[getFirstVariant] API response:', {
      hasData: !!variants.data,
      hasDataData: !!variants.data?.data,
      variantCount: variants.data?.data?.length || 0,
      error: variants.error ? JSON.stringify(variants.error) : 'none'
    });

    if (!variants.data || !variants.data.data || variants.data.data.length === 0) {
      console.error('[getFirstVariant] No variants found. Response:', JSON.stringify(variants, null, 2));
      return null;
    }

    return variants.data.data[0];
  } catch (error) {
    console.error('[getFirstVariant] Exception:', error);
    return null;
  }
}

export async function createCheckoutUrl({
  variantId,
  userEmail = "",
  userId = "",
  embed = false,
  redirectUrl,
}: {
  variantId: string;
  userEmail: string;
  userId: string;
  embed?: boolean;
  redirectUrl?: string;
}) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }

  if (!process.env.LEMON_SQUEEZY_STORE_ID) {
    console.error(
      "LEMONSQUEEZY_STORE_ID is not defined in environment variables",
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      "NEXT_PUBLIC_APP_URL is not defined, using default redirect URL (http://localhost:3000)",
    );
    // Don't return null - use fallback instead
  }

  // Determine test mode from environment variable
  const testMode = process.env.LEMON_SQUEEZY_TEST_MODE === "true";
  console.log('[createCheckoutUrl] Creating checkout with test_mode:', testMode);

  try {
    const checkout = await createCheckout(
      process.env.LEMON_SQUEEZY_STORE_ID!,
      variantId,
      {
        testMode,
        checkoutOptions: {
          embed,
          media: true,
          logo: !embed,
        },
        checkoutData: {
          email: userEmail,
          custom: {
            user_id: userId,
          },
        },
        productOptions: {
          enabledVariants: [Number(variantId)],
          redirectUrl: redirectUrl || `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/dashboard`,
        },
      },
    );

    // Enhanced logging for debugging
    const checkoutUrl = checkout.data?.data?.attributes?.url;
    const checkoutTestMode = checkout.data?.data?.attributes?.test_mode;
    
    console.log('[createCheckoutUrl] Checkout response:', {
      hasData: !!checkout.data,
      hasDataData: !!checkout.data?.data,
      hasAttributes: !!checkout.data?.data?.attributes,
      hasUrl: !!checkoutUrl,
      url: checkoutUrl || 'none',
      test_mode: checkoutTestMode,
      error: checkout.error ? JSON.stringify(checkout.error) : 'none'
    });

    if (!checkoutUrl) {
      console.error("[createCheckoutUrl] Failed to create checkout URL. Response:", JSON.stringify(checkout, null, 2));
      return null;
    }

    return checkoutUrl;
  } catch (error) {
    console.error("[createCheckoutUrl] Exception creating checkout:", error);
    return null;
  }
}

export async function createCustomerPortal(subscriptionId: string) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }

  const { data } = await getSubscription(subscriptionId);
  if (!data?.data?.attributes?.urls?.customer_portal_update_subscription) {
    return null;
  }
  return data?.data?.attributes.urls.customer_portal_update_subscription;
}

export async function getProductVariant(variantId: number | string) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }
  const variant = await getVariant(variantId);
  return variant?.data?.data;
}