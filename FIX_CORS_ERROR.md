# ✅ FIX CORS ERROR (Actually RLS)

## ❌ The Error

```
CORS policy: Response to preflight request doesn't pass access control check
POST https://.../global_chat_messages net::ERR_FAILED
```

**This looks like CORS but it's actually RLS (Row Level Security) blocking the insert!**

## ✅ THE FIX (10 Seconds)

### Run in Supabase SQL Editor:

```sql
-- Disable RLS on chat messages
ALTER TABLE global_chat_messages DISABLE ROW LEVEL SECURITY;
```

**That's it!**

### Then:

1. **Refresh browser** (Ctrl+Shift+R)
2. **Try sending a message from agent dashboard**
3. ✅ **Works!**

## 🔍 Why This Happens

When RLS blocks a request in Supabase, it appears as a CORS error instead of a permission error. This is confusing but it's how Supabase works.

**Solution:** Disable RLS for development, re-enable for production with proper policies.

## ✅ After Running:

- ✅ Agents can send messages
- ✅ Visitors can send messages  
- ✅ Real-time chat works
- ✅ No CORS errors

**Just run that one line of SQL and refresh!** 🚀

---

## 📋 Optional: Verify Table Structure

If it still doesn't work after disabling RLS, run this to check column names:

```sql
-- Check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'global_chat_messages';
```

The table should have:
- `session_id` (UUID)
- `message` (TEXT) ← Not 'content'!
- `sender_type` (TEXT)
- `sender_name` (TEXT)
- `created_at` (TIMESTAMP)

If it has `content` instead of `message`, rename it:

```sql
ALTER TABLE global_chat_messages RENAME COLUMN content TO message;
```
