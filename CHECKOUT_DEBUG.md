# Checkout Flow Debug Guide

## Problem
After completing onboarding (entering name and use cases), users are not being redirected to the payment checkout page.

## Debugging Steps

### 1. Check Browser Console
After clicking "Continue" on the use-cases page, open your browser's Developer Tools (F12) and check the Console tab. You should see logs like:

```
[FounderNote:Onboarding] Use cases saved, starting checkout flow
[startOnboardingCheckout] Starting checkout flow...
[startOnboardingCheckout] User found: [user-id]
[startOnboardingCheckout] Fetching products...
[startOnboardingCheckout] Total products: X
[startOnboardingCheckout] Subscription products: X
```

**Look for:**
- Any error messages
- "No subscription products found" - means products aren't configured
- "Checkout URL is null" - means checkout creation failed
- Any other error messages

### 2. Check Environment Variables
Make sure these are set in your `.env.local` file:

```env
LEMON_SQUEEZY_API=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id_here
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

**To get these values:**
1. Go to https://app.lemonsqueezy.com/settings/api
2. Create an API key if you don't have one
3. Copy the API key → `LEMON_SQUEEZY_API`
4. Go to https://app.lemonsqueezy.com/settings/stores
5. Copy your Store ID → `LEMON_SQUEEZY_STORE_ID`
6. Go to https://app.lemonsqueezy.com/settings/webhooks
7. Create a webhook and copy the secret → `LEMON_SQUEEZY_WEBHOOK_SECRET`

### 3. Check Lemon Squeezy Products
**Important:** Products must be named with "subscription" prefix!

1. Go to https://app.lemonsqueezy.com/products
2. Check if you have any products
3. **Product names MUST start with "subscription"** (e.g., "subscription_pro", "subscription_basic")
4. Each product must have at least one variant
5. Variants must be active and have pricing set

**Example product setup:**
- Product name: `subscription_pro`
- Variant: `Monthly` or `Yearly` with pricing

### 4. Check Server Logs
If running locally, check your terminal/console where Next.js is running. Look for:
- `[startOnboardingCheckout]` logs
- Any error messages
- API call failures

### 5. Test the Checkout Function Directly
You can test if the checkout function works by temporarily adding this to a page:

```typescript
import { startOnboardingCheckout } from '@/features/account/server'

// In a button click handler:
const testCheckout = async () => {
  const url = await startOnboardingCheckout()
  console.log('Checkout URL:', url)
  if (url) {
    window.location.href = url
  }
}
```

### 6. Common Issues and Fixes

**Issue: "No subscription products found"**
- **Fix:** Create products in Lemon Squeezy with names starting with "subscription"
- **Fix:** Make sure products are published/active

**Issue: "Checkout URL is null"**
- **Fix:** Check `NEXT_PUBLIC_APP_URL` is set correctly
- **Fix:** Verify Lemon Squeezy API key has correct permissions
- **Fix:** Check if `createCheckoutUrl` is returning null (check server logs)

**Issue: "No variant found"**
- **Fix:** Make sure each product has at least one variant
- **Fix:** Variants must be active

**Issue: Silent failure (no errors, just redirects to dashboard)**
- **Fix:** Check browser console for the detailed logs we added
- **Fix:** Check if server action is being called (should see logs)
- **Fix:** Verify the import path is correct

### 7. Verify the Flow
The expected flow is:
1. User completes onboarding (name + use cases)
2. `handleContinue()` is called
3. Profile is updated with `onboarding_completed: true`
4. `startOnboardingCheckout()` is called
5. Function fetches products from Lemon Squeezy
6. Finds first product starting with "subscription"
7. Gets first variant of that product
8. Creates checkout URL
9. Redirects user to checkout URL

### 8. Quick Test Checklist
- [ ] Environment variables are set
- [ ] Lemon Squeezy products exist with "subscription" prefix
- [ ] Products have active variants
- [ ] Browser console shows logs (not just errors)
- [ ] Server logs show the function is being called
- [ ] No network errors in browser Network tab

### 9. Still Not Working?
If you've checked everything above and it's still not working:

1. **Share the browser console logs** - especially any `[startOnboardingCheckout]` or `[FounderNote:Onboarding]` logs
2. **Share server logs** - any errors from the server
3. **Verify products in Lemon Squeezy dashboard** - take a screenshot of your products page
4. **Check if the function is even being called** - look for the first log `[startOnboardingCheckout] Starting checkout flow...`

The enhanced logging we added should help identify exactly where the flow is failing.
