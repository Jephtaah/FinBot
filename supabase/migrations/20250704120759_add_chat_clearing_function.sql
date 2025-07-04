-- Add DELETE policy for messages (if not exists)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'messages' 
    and policyname = 'Users can delete their own messages'
  ) then
    create policy "Users can delete their own messages"
      on messages for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Create function to delete chat messages for a specific assistant
CREATE OR REPLACE FUNCTION delete_chat_messages(
  p_user_id UUID,
  p_assistant_id TEXT
)
RETURNS void AS $$
BEGIN
  -- Delete messages for specific user and assistant
  DELETE FROM messages
  WHERE user_id = p_user_id
  AND assistant_id = p_assistant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_chat_messages(UUID, TEXT) TO authenticated;