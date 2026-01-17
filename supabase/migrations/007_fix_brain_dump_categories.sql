-- Fix brain dump category constraint to match frontend types
-- Frontend expects: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
-- Old constraint had: 'meeting' | 'thought' | 'question' | 'concern' | 'personal'

-- Drop the old constraint if it exists
ALTER TABLE brain_dump DROP CONSTRAINT IF EXISTS brain_dump_category_check;

-- Map old categories to new ones
UPDATE brain_dump SET category = 'decision' WHERE category = 'thought';
UPDATE brain_dump SET category = 'blocker' WHERE category = 'concern';
UPDATE brain_dump SET category = 'followup' WHERE category = 'personal';

-- Add the correct constraint matching frontend types
ALTER TABLE brain_dump
ADD CONSTRAINT brain_dump_category_check
CHECK (category IN ('meeting', 'blocker', 'decision', 'question', 'followup'));
