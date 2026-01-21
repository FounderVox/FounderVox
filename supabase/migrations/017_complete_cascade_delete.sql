-- Ensure all FK constraints have CASCADE delete for user data
-- This ensures complete cleanup when a user account is deleted

-- Update recordings foreign key to cascade on delete
ALTER TABLE recordings
  DROP CONSTRAINT IF EXISTS recordings_user_id_fkey,
  ADD CONSTRAINT recordings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update notes foreign key to cascade on delete
ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey,
  ADD CONSTRAINT notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update action_items foreign key to cascade on delete
ALTER TABLE action_items
  DROP CONSTRAINT IF EXISTS action_items_user_id_fkey,
  ADD CONSTRAINT action_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update brain_dump foreign key to cascade on delete
ALTER TABLE brain_dump
  DROP CONSTRAINT IF EXISTS brain_dump_user_id_fkey,
  ADD CONSTRAINT brain_dump_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update investor_updates foreign key to cascade on delete
ALTER TABLE investor_updates
  DROP CONSTRAINT IF EXISTS investor_updates_user_id_fkey,
  ADD CONSTRAINT investor_updates_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RPC function for complete user account deletion
-- This function deletes all user data in the correct order
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the same user (security check)
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Delete all user data in order (foreign key constraints handle cascading)
  -- Being explicit ensures complete deletion even if CASCADE fails

  -- Delete action items
  DELETE FROM action_items WHERE user_id = target_user_id;

  -- Delete brain dump items
  DELETE FROM brain_dump WHERE user_id = target_user_id;

  -- Delete investor updates
  DELETE FROM investor_updates WHERE user_id = target_user_id;

  -- Delete recordings
  DELETE FROM recordings WHERE user_id = target_user_id;

  -- Delete notes
  DELETE FROM notes WHERE user_id = target_user_id;

  -- Delete profile (this should be last before auth user)
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.delete_user_account(uuid) IS
  'Securely deletes all data associated with a user account. Only the account owner can call this function.';
