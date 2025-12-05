# ✅ FIX: Email Column Migration

## Issue
You got this error when running `USER_PROFILES_SCHEMA.sql`:
```
ERROR: policy "Users can view their own profile" for table "user_profiles" already exists
```

This means the `user_profiles` table was already created in a previous run!

## ✅ Solution

Instead of running the full schema (which tries to create everything again), just add the missing `email` column.

## 🚀 Run This Instead:

### In Supabase SQL Editor:
1. Open the SQL Editor
2. Run this file: **`ADD_EMAIL_TO_USER_PROFILES.sql`**

Or copy and paste this:

```sql
-- Add email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Email column added to user_profiles';
    ELSE
        RAISE NOTICE 'Email column already exists in user_profiles';
    END IF;
END $$;
```

3. Click **Run**
4. ✅ Done! The email column is now added

## 📋 What This Does

- Checks if `email` column exists
- If not, adds it
- If it already exists, does nothing
- **Safe to run multiple times!**

## ✅ After Running

Your `user_profiles` table now has:
- `id` - Primary key
- `user_id` - References auth.users
- **`email`** ← **NEW!**
- `name`
- `role`
- `status`
- `phone`
- `department`
- `avatar_url`
- `bio`
- `created_at`
- `updated_at`

## 🎊 You're Done!

Now you can:
1. Refresh your browser
2. Go to `/admin/users`
3. Start creating user invites!

The User Management system is now **fully functional!** 🚀
