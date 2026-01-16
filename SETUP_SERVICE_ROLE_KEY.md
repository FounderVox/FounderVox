# Setup Service Role Key for Recording Uploads

## Why This Is Required

Server-side database operations (like creating recording records) need to bypass Row Level Security (RLS) policies. The service role key allows API routes to perform these operations securely.

**This is safe because:**
- The service role key is ONLY used in server-side API routes
- It's NEVER exposed to the client/browser
- It's the standard Supabase approach for server-side operations

## How to Get Your Service Role Key

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/_/settings/api
   - Or: Dashboard → Your Project → Settings → API

2. **Find the "service_role" key:**
   - Look for the section labeled "Project API keys"
   - Find the **"service_role"** key (it's a secret key, different from the anon key)
   - It will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

3. **Add it to your `.env.local` file:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Verification

After adding the key and restarting, try recording again. You should see in the console:
```
[Upload] Using service role client (bypasses RLS)
[Upload] Successfully inserted with service role client
```

## Important Notes

- ⚠️ **NEVER** commit the service role key to git
- ✅ The `.env.local` file is already in `.gitignore`
- ✅ The service role key only works server-side (secure)
- ✅ This is the recommended Supabase pattern for API routes

## Troubleshooting

If you still see RLS errors after adding the key:
1. Make sure you copied the **service_role** key (not the anon key)
2. Make sure there are no extra spaces in `.env.local`
3. Restart your dev server completely
4. Check the console logs for detailed error messages



