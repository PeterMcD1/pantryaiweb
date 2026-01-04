-- It seems the user_id column was created with a UNIQUE constraint, 
-- which means a user can only have one item. We need to remove this.

ALTER TABLE pantry_items DROP CONSTRAINT IF EXISTS pantry_items_user_id_key;

-- Also check if there is a unique index and drop it if it exists separately
DROP INDEX IF EXISTS pantry_items_user_id_key;
