import { getProductVariant } from "../../../../../lib/lemon-squeezy/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { upsertProduct } from "../../../../../supabase/database/products";
import { insertSubscription } from "../../../../../supabase/database/subscriptions";
import { updateCustomerId } from "../../../../../supabase/database/user";
import crypto from "node:crypto";

// Events that grant access
const accessGrantingEvents = [
  "order_created",           // One-time payments
  "subscription_created",
  "subscription_resumed",
  "subscription_unpaused",
];

// Events that revoke access
const accessRevokingEvents = [
  "subscription_cancelled",
  "subscription_expired",
];

// All events we handle
const handledEvents = [
  "order_created",
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "subscription_paused",
  "subscription_cancelled",
  "subscription_unpaused",
  "subscription_expired",
];

export async function POST(request: Request) {
  console.log('[Webhook] Received request');
  
  if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    console.error('[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set');
    return new Response("Lemon Squeezy Webhook Secret not set in .env", {
      status: 500,
    });
  }

  // First, make sure the request is from Lemon Squeezy.
  const rawBody = await request.text();
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(
    request.headers.get("X-Signature") || "",
    "utf8",
  );

  if (!crypto.timingSafeEqual(digest, signature)) {
    console.error('[Webhook] Invalid signature');
    return new Response("Invalid signature.", { status: 400 });
  }

  const data = JSON.parse(rawBody);
  const eventName = data.meta.event_name;

  console.log('[Webhook] Received event:', eventName);
  console.log('[Webhook] Custom data:', JSON.stringify(data.meta.custom_data));

  if (!handledEvents.includes(eventName)) {
    console.log('[Webhook] Event not handled:', eventName);
    return new Response("Webhook received", { status: 200 });
  }

  const userId = data.meta.custom_data?.user_id;
  if (!userId) {
    console.error('[Webhook] User ID not found in custom_data');
    return new Response("User ID not found", { status: 400 });
  }

  console.log('[Webhook] Processing for user:', userId);

  const supabaseAdmin = createServiceRoleClient();

  // Handle one-time payment (order_created)
  if (eventName === "order_created") {
    console.log('[Webhook] Processing one-time payment');
    
    const order = data.data;
    const customerId = order.attributes.customer_id;
    
    if (customerId) {
      // Update customer ID on profile
      await updateCustomerId(supabaseAdmin, {
        userId,
        customerId: customerId.toString(),
      });
    }

    // Grant beta access
    console.log('[Webhook] Granting beta access to user:', userId);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_paid_beta: true,
        onboarding_completed: true,
        subscription_tier: 'beta',
        customer_id: customerId?.toString() || null,
      })
      .eq('id', userId);
    
    if (error) {
      console.error('[Webhook] Error updating profile:', error);
      return new Response("Error updating profile", { status: 500 });
    }
    
    console.log('[Webhook] Successfully granted beta access to user:', userId);
    return new Response("Order Complete", { status: 200 });
  }

  // Handle subscription events
  const subscription = data.data as Subscription;
  const productId = subscription.attributes.product_id;
  const variantId = subscription.attributes.variant_id;
  const productName = subscription.attributes.product_name;
  const variant = await getProductVariant(variantId);
  const price = variant?.attributes?.price;

  const customerId = subscription.attributes.customer_id;
  if (!customerId) {
    console.error('[Webhook] Customer ID not found');
    return new Response("Customer ID not found", { status: 400 });
  }

  // Upsert product and update customer ID
  const productUpsert = upsertProduct(supabaseAdmin, {
    variant_id: variantId.toString(),
    product_id: productId.toString(),
    name: productName,
    price: price!,
  });

  const customerUpsert = updateCustomerId(supabaseAdmin, {
    userId,
    customerId: customerId.toString(),
  });

  await Promise.all([productUpsert, customerUpsert]);

  // Insert/update subscription record
  await insertSubscription(supabaseAdmin, {
    customerId: customerId.toString(),
    subscriptionId:
      subscription.attributes.first_subscription_item?.subscription_id || 0, 
    productId: productId.toString(),
    variantId: variantId.toString(),
    status: subscription.attributes.status,
    cancelled: subscription.attributes.cancelled,
    renewsAt: subscription.attributes.renews_at,
    endsAt: subscription.attributes.ends_at,
    createdAt: subscription.attributes.created_at,
    updatedAt: subscription.attributes.updated_at,
  });

  // Handle access granting events (subscription created, resumed, unpaused)
  if (accessGrantingEvents.includes(eventName)) {
    console.log('[Webhook] Granting beta access to user:', userId);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_paid_beta: true,
        onboarding_completed: true,
        subscription_tier: 'beta',
        customer_id: customerId.toString(),
      })
      .eq('id', userId);
    
    if (error) {
      console.error('[Webhook] Error updating profile for access grant:', error);
    } else {
      console.log('[Webhook] Successfully granted beta access to user:', userId);
    }
  }

  // Handle access revoking events (subscription cancelled, expired)
  if (accessRevokingEvents.includes(eventName)) {
    console.log('[Webhook] Revoking beta access for user:', userId);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_paid_beta: false,
        subscription_tier: 'free'
      })
      .eq('id', userId);
    
    if (error) {
      console.error('[Webhook] Error updating profile for access revoke:', error);
    } else {
      console.log('[Webhook] Successfully revoked beta access for user:', userId);
    }
  }

  return new Response("Order Complete", { status: 200 });
}
