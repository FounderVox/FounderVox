# Debugging Signup Issues

## Common Issues and Solutions

### 1. Email Not Being Sent

**Check Supabase Email Configuration:**

1. Go to your Supabase Dashboard → **Authentication → Email Templates**
2. Verify that email templates are enabled
3. Check **Settings → Auth → Email Auth**:
   - Enable "Enable email confirmations" (if you want email verification)
   - OR disable it for development (users can sign in immediately)

**For Development (Skip Email Verification):**

1. Go to **Authentication → Settings**
2. Under **Email Auth**, toggle OFF "Enable email confirmations"
3. This allows users to sign in immediately without email verification

**For Production (Enable Email Verification):**

1. Go to **Authentication → Settings**
2. Under **Email Auth**, toggle ON "Enable email confirmations"
3. Configure SMTP settings if using custom email provider
4. Or use Supabase's built-in email service (limited)

### 2. Profile Not Being Created

**Check the Trigger:**

1. Go to **Database → Functions**
2. Look for `handle_new_user` function
3. Check if it exists and is enabled

**Check the Trigger on auth.users:**

1. Go to **Database → Triggers**
2. Look for `on_auth_user_created` trigger
3. Verify it's attached to `auth.users` table

**Manual Check:**

Run this query in SQL Editor:
```sql
-- Check if user exists in auth.users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if profile exists
SELECT id, email, display_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check trigger logs (if any errors occurred)
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'handle_new_user';
```

### 3. Debug Steps

**Step 1: Check Browser Console**
- Open browser DevTools (F12)
- Go to Console tab
- Look for `[FounderVox:Auth]` logs
- Check for any errors

**Step 2: Check Supabase Logs**
- Go to **Logs → Postgres Logs**
- Look for any errors related to `handle_new_user`
- Check for RLS policy violations

**Step 3: Verify Database Setup**
- Run this query to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'notes');
```

**Step 4: Test Trigger Manually**
```sql
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Step 5: Check RLS Policies**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

### 4. Quick Fix: Disable Email Verification (Development)

If you want to test signup without email verification:

1. **Supabase Dashboard → Authentication → Settings**
2. **Email Auth → Enable email confirmations** → Toggle OFF
3. Users can now sign in immediately after signup

### 5. Quick Fix: Manual Profile Creation

If the trigger isn't working, you can manually create profiles:

```sql
-- For a specific user (replace USER_ID with actual user ID)
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  onboarding_completed,
  onboarding_step,
  recordings_count,
  demo_completed
)
SELECT 
  id,
  email,
  split_part(email, '@', 1),
  false,
  0,
  0,
  false
FROM auth.users
WHERE id = 'USER_ID_HERE'
ON CONFLICT (id) DO NOTHING;
```

### 6. Environment Variables Check

Make sure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 7. Common Errors

**Error: "new row violates row-level security policy"**
- Solution: Check RLS policies are correctly set up
- Run the complete setup SQL again

**Error: "function handle_new_user() does not exist"**
- Solution: The function wasn't created
- Run the complete setup SQL again

**Error: "relation 'public.profiles' does not exist"**
- Solution: The profiles table wasn't created
- Run the complete setup SQL again

**No error but no profile created:**
- Check Supabase logs for trigger execution errors
- The trigger might be failing silently
- Check browser console for detailed logs

