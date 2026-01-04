-- Enable Row Level Security
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own items
CREATE POLICY "Users can view their own pantry items"
ON pantry_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to add their own items
CREATE POLICY "Users can insert their own pantry items"
ON pantry_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own items
CREATE POLICY "Users can delete their own pantry items"
ON pantry_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to update their own items (optional, but good practice)
CREATE POLICY "Users can update their own pantry items"
ON pantry_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
