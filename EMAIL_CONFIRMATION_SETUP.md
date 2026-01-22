# Email Confirmation Setup Guide

## Problem
You're not receiving email confirmation emails when users sign up.

## Solution

### For Hosted Supabase (Production/Staging)

1. **Enable Email Confirmations in Dashboard:**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Navigate to **Authentication → Settings**
   - Scroll to **Email Auth** section
   - Toggle ON **"Enable email confirmations"**
   - Save changes

2. **Configure SMTP (Required for Production):**
   
   Supabase's built-in email service has very limited sending capacity. For production, you need to configure SMTP:
   
   - In **Authentication → Settings → Email Auth**
   - Scroll to **SMTP Settings**
   - Configure one of these providers:
     - **SendGrid** (recommended)
     - **AWS SES**
     - **Mailgun**
     - **Postmark**
     - **Custom SMTP**
   
   Example SendGrid configuration:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender email: noreply@yourdomain.com
   Sender name: Your App Name
   ```

3. **Verify Email Templates:**
   - Go to **Authentication → Email Templates**
   - Ensure "Confirm signup" template is enabled
   - Customize the template if needed

### For Local Development

If you're running Supabase locally (`supabase start`), emails are captured by Inbucket:

1. **Check Inbucket Email Interface:**
   - Open: http://localhost:54324
   - All emails sent during local development appear here
   - You can view and click confirmation links from this interface

2. **Enable Email Confirmations Locally:**
   - Edit `supabase/config.toml`
   - Find `[auth.email]` section
   - Change `enable_confirmations = false` to `enable_confirmations = true`
   - Restart Supabase: `supabase stop && supabase start`

### Quick Check: Are You Using Local or Hosted?

Check your `.env.local` file:
- If `NEXT_PUBLIC_SUPABASE_URL` contains `localhost` or `127.0.0.1` → **Local**
- If it contains `supabase.co` → **Hosted** (follow hosted instructions above)

### Testing Email Sending

After configuring:

1. **Sign up a new user**
2. **Check:**
   - Hosted: Check the email inbox (and spam folder)
   - Local: Check Inbucket at http://localhost:54324
3. **If still not receiving:**
   - Check Supabase Dashboard → **Logs → Auth Logs** for email sending errors
   - Verify SMTP credentials are correct
   - Check rate limits (Supabase free tier has email sending limits)

### Alternative: Disable Email Confirmation (Development Only)

If you want to skip email confirmation for development:

1. **Supabase Dashboard → Authentication → Settings**
2. **Email Auth → Enable email confirmations** → Toggle OFF
3. Users can sign in immediately after signup

⚠️ **Warning:** Only disable email confirmation in development. Production should always require email verification for security.

### Troubleshooting

**Emails not sending even after configuration:**
- Verify SMTP credentials are correct
- Check Supabase logs for SMTP errors
- Ensure sender email is verified in your email provider
- Check if you've hit rate limits

**Emails going to spam:**
- Configure SPF/DKIM records for your domain
- Use a reputable email service (SendGrid, AWS SES, etc.)
- Avoid using generic sender addresses

**Local development emails not showing:**
- Ensure Inbucket is running: `supabase status`
- Check Inbucket port: http://localhost:54324
- Restart Supabase if needed
