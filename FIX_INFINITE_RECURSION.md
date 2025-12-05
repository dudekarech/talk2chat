# 🔧 FIX: Infinite Recursion Error

## ❌ The Error
```
infinite recursion detected in policy for relation "user_profiles"
```

## 🎯 Root Cause
The RLS policies were checking the `user_profiles` table to verify if a user is an admin, which creates an **infinite loop** when trying to query that same table!

**Problematic Policy:**
```sql
CREATE POLICY "Admins can view all profiles"
USING (
    EXISTS (
        SELECT 1 FROM user_profiles  -- ❌ Checking user_profiles FROM user_profiles!
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);
```

## ✅ The Fix

### Run This SQL Script:

**In Supabase SQL Editor, run:**
`backend/schema/migrations/FIX_USER_PROFILES_POLICIES.sql`

Or copy and paste:

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "users_select_own"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "users_update_own"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_select_all"
    ON user_profiles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_insert"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_update_all"
    ON user_profiles FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_delete"
    ON user_profiles FOR DELETE
    USING (auth.role() = 'authenticated');
```

### What This Does:
1. **Drops** all the recursive policies
2. **Creates** simple policies that don't self-reference
3. **Allows** authenticated users full access (for development)

### Security Note:
⚠️ These policies allow all authenticated users to manage profiles. For production, you'll want to:
- Store roles in JWT claims (user metadata)
- Use a separate roles table
- Implement proper role-based access

But for now, this will **get your system working!**

## ✅ After Running:

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Navigate to** `/admin/users`
3. **Everything should work!** ✅

The infinite recursion error will be gone and you can:
- ✅ View users
- ✅ Create invites
- ✅ Edit users
- ✅ Delete users

## 🎊 You're Done!

The user management system should now work perfectly! 🚀

---

**For Production**: Later, you can implement proper role-based policies using JWT claims or a roles table that doesn't cause recursion.
