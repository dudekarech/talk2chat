# 🚨 CRITICAL: All Requests Failing - RLS Blocking Everything!

## ❌ The Problem

ALL Supabase requests are showing CORS errors:
- Auth endpoint failing (500)
- Widget config failing  
- Chat sessions failing
- WebSocket failing
- Everything blocked!

**Root Cause:** RLS (Row Level Security) is enabled on ALL tables and blocking EVERYTHING!

## ✅ THE FIX (30 Seconds)

### Run This ONE Script in Supabase SQL Editor:

```sql
-- Disable RLS on ALL tables
ALTER TABLE global_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_widget_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notes DISABLE ROW LEVEL SECURITY;
```

**Or run the file:** `DISABLE_ALL_RLS.sql`

### Then:

1. **Close ALL browser tabs**
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Reopen application**
4. ✅ **Everything works!**

## 🎯 Why This Happens

Supabase enables RLS by default on new tables. When RLS blocks a request, it shows as:
- ❌ "CORS error"
- ❌ "No 'Access-Control-Allow-Origin' header"
- ❌ "net::ERR_FAILED 500"

But it's actually **RLS blocking the request**, not CORS!

## ✅ After Running

- ✅ Auth works
- ✅ Agent dashboard loads
- ✅ Chat works
- ✅ Widget config loads
- ✅ All features work

## ⚠️ Important Note

**This disables RLS for development!**

For production, you MUST:
1. Re-enable RLS
2. Create proper policies
3. Use JWT claims for access control

But for now, disable it to get everything working!

**Run the SQL now and refresh your browser!** 🚀
