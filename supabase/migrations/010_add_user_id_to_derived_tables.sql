-- ============================================
-- MIGRATION 010: Add user_id to derived tables
-- Purpose: Enable direct user queries, simplify RLS
-- (Only action_items, brain_dump, investor_updates - others removed in 009)
-- ============================================

-- Step 1: Add user_id columns (nullable first)
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE brain_dump ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE investor_updates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Backfill user_id from recordings
UPDATE action_items ai SET user_id = r.user_id FROM recordings r WHERE ai.recording_id = r.id AND ai.user_id IS NULL;
UPDATE brain_dump bd SET user_id = r.user_id FROM recordings r WHERE bd.recording_id = r.id AND bd.user_id IS NULL;
UPDATE investor_updates iu SET user_id = r.user_id FROM recordings r WHERE iu.recording_id = r.id AND iu.user_id IS NULL;

-- Step 3: Make NOT NULL after backfill
ALTER TABLE action_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE brain_dump ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE investor_updates ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS action_items_user_id_idx ON action_items(user_id);
CREATE INDEX IF NOT EXISTS action_items_user_status_idx ON action_items(user_id, status);
CREATE INDEX IF NOT EXISTS action_items_user_deadline_idx ON action_items(user_id, deadline);
CREATE INDEX IF NOT EXISTS brain_dump_user_id_idx ON brain_dump(user_id);
CREATE INDEX IF NOT EXISTS brain_dump_user_category_idx ON brain_dump(user_id, category);
CREATE INDEX IF NOT EXISTS investor_updates_user_id_idx ON investor_updates(user_id);

-- Step 5: Drop old complex RLS policies
DROP POLICY IF EXISTS "Users can view their action items" ON action_items;
DROP POLICY IF EXISTS "Users can insert their action items" ON action_items;
DROP POLICY IF EXISTS "Users can update their action items" ON action_items;
DROP POLICY IF EXISTS "Users can delete their action items" ON action_items;

DROP POLICY IF EXISTS "Users can view their brain dumps" ON brain_dump;
DROP POLICY IF EXISTS "Users can insert their brain dumps" ON brain_dump;
DROP POLICY IF EXISTS "Users can update their brain dumps" ON brain_dump;
DROP POLICY IF EXISTS "Users can delete their brain dumps" ON brain_dump;

DROP POLICY IF EXISTS "Users can view their investor updates" ON investor_updates;
DROP POLICY IF EXISTS "Users can insert their investor updates" ON investor_updates;
DROP POLICY IF EXISTS "Users can update their investor updates" ON investor_updates;
DROP POLICY IF EXISTS "Users can delete their investor updates" ON investor_updates;

-- Step 6: Create simple direct RLS policies
CREATE POLICY "Users can view own action items" ON action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action items" ON action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action items" ON action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action items" ON action_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own brain dumps" ON brain_dump FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brain dumps" ON brain_dump FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brain dumps" ON brain_dump FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brain dumps" ON brain_dump FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investor updates" ON investor_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investor updates" ON investor_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investor updates" ON investor_updates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investor updates" ON investor_updates FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Add trigger to auto-populate user_id on insert
CREATE OR REPLACE FUNCTION set_user_id_from_recording()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.recording_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM recordings WHERE id = NEW.recording_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS action_items_set_user_id ON action_items;
DROP TRIGGER IF EXISTS brain_dump_set_user_id ON brain_dump;
DROP TRIGGER IF EXISTS investor_updates_set_user_id ON investor_updates;

CREATE TRIGGER action_items_set_user_id BEFORE INSERT ON action_items FOR EACH ROW EXECUTE FUNCTION set_user_id_from_recording();
CREATE TRIGGER brain_dump_set_user_id BEFORE INSERT ON brain_dump FOR EACH ROW EXECUTE FUNCTION set_user_id_from_recording();
CREATE TRIGGER investor_updates_set_user_id BEFORE INSERT ON investor_updates FOR EACH ROW EXECUTE FUNCTION set_user_id_from_recording();
