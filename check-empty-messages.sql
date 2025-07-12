-- Check for empty or null messages in the database
SELECT 
  id,
  role,
  content,
  length(content) as content_length,
  assistant_id,
  created_at
FROM chat_messages 
WHERE 
  content IS NULL 
  OR content = '' 
  OR trim(content) = ''
ORDER BY created_at DESC;

-- Count empty messages
SELECT 
  'Empty messages count' as info,
  COUNT(*) as count
FROM chat_messages 
WHERE 
  content IS NULL 
  OR content = '' 
  OR trim(content) = '';

-- Delete empty messages (uncomment to run)
-- DELETE FROM chat_messages 
-- WHERE 
--   content IS NULL 
--   OR content = '' 
--   OR trim(content) = '';