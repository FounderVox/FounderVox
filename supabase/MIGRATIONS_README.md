# FounderNote Database Migrations

## 🚀 RECOMMENDED: Use Complete Setup (Single File)

**Run this ONE file to set up everything:**

### **000_complete_setup.sql** ⭐ RECOMMENDED
- **Completely cleans up** any existing tables, functions, triggers, and policies
- **Creates everything fresh** from scratch
- **No conflicts** - safe to run multiple times
- **Includes:** profiles table, notes table, all functions, triggers, RLS policies, and indexes

**How to use:**
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy and paste the entire contents of `000_complete_setup.sql`
3. Click "Run"
4. Done! Your database is fully set up.

---

## Alternative: Individual Migrations (if needed)

If you prefer to run migrations individually, use this order:

1. **001_initial_schema.sql** - Creates the `profiles` table and sets up user authentication extensions
2. **002_notes_schema.sql** - Creates the `notes` table with support for starred and recent notes
3. **003_fix_profile_schema.sql** - Fixes any missing columns in the profiles table (run if you get 400 errors)

**Note:** The complete setup file (`000_complete_setup.sql`) replaces all three individual files and is recommended.

## How to Run Complete Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy and paste the **ENTIRE** contents of `000_complete_setup.sql` into the SQL Editor
3. Click "Run" to execute
4. Check the output - you should see success messages
5. Done! Your database is fully configured

## What the Complete Setup Does

### 000_complete_setup.sql (Complete Setup)

**Cleanup Phase:**
- Drops all existing triggers, policies, functions, indexes, and tables
- Ensures a clean slate before setup

**Setup Phase:**
- **Profiles Table:** User profiles with onboarding, demo status, and usage tracking
- **Notes Table:** Voice notes with starred/recent support, templates, and metadata
- **Functions:** 
  - `handle_new_user()` - Auto-creates profile on signup
  - `handle_updated_at()` - Updates timestamps
  - `update_user_recordings_count()` - Tracks note count
  - `update_note_last_accessed()` - For future use
- **Triggers:** Auto-profile creation, timestamp updates, recordings count sync
- **RLS Policies:** 8 policies ensuring users can only access their own data
- **Indexes:** 8 indexes for optimal query performance

**Verification:**
- Automatically verifies tables and RLS are set up correctly
- Shows success messages when complete

## Verification

After running both migrations, you can verify with:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'notes');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'notes');

-- Check policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'notes');
```

## Notes

- All migrations are idempotent (safe to run multiple times)
- RLS policies ensure users can only access their own data
- The notes table supports starred notes via `is_starred` boolean column
- Recent notes are queried by `created_at` descending order
- The `last_accessed_at` column can be updated in application code when notes are viewed

