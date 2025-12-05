# 🔧 FIX: Supabase Redirecting to Localhost

## The Problem

After email confirmation, Supabase redirects to:
```
http://localhost:3000/#access_token=...
```

Instead of your production URL.

## ✅ THE FIX (2 minutes)

### Step 1: Update Supabase Site URL

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings:**
   - Click **Authentication** (left sidebar)
   - Click **URL Configuration**

3. **Update Site URL:**
   - Find **Site URL** field
   - Change from: `http://localhost:3000`
   - Change to: `https://your-vercel-url.vercel.app`
   - Or: `https://yourdomain.com` (if using custom domain)

4. **Update Redirect URLs:**
   - Find **Redirect URLs** section
   - Add your production URL:
     ```
     https://your-vercel-url.vercel.app/*
     https://yourdomain.com/*
     ```
   - You can keep localhost for development too

5. **Click Save**

### Step 2: Verify Settings

Your configuration should look like:

```
Site URL:
https://talk2chat.vercel.app

Redirect URLs:
https://talk2chat.vercel.app/*
https://yourdomain.com/*
http://localhost:5173/*  (for local dev)
```

## 📋 Complete Supabase Configuration

### Authentication → URL Configuration

**Site URL:**
```
https://your-production-url.vercel.app
```

**Redirect URLs** (add all these):
```
https://your-production-url.vercel.app/**
https://yourdomain.com/**
http://localhost:5173/**
```

### Authentication → Email Templates

**Confirm signup template:**

Update the confirmation link to use:
```
{{ .SiteURL }}
```

This will automatically use the Site URL you configured.

Default template should look like:
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

The `{{ .ConfirmationURL }}` will automatically use the correct Site URL.

## ⚠️ Important Notes

### Multiple Environments

If you have:
- **Development:** `http://localhost:5173`
- **Staging:** `https://staging.yourdomain.com`
- **Production:** `https://yourdomain.com`

Set **Site URL** to production, and add all URLs to **Redirect URLs**.

### Custom Domain

If using a custom domain:
1. Set Site URL to: `https://yourdomain.com`
2. Add both to Redirect URLs:
   - `https://talk2chat.vercel.app/**`
   - `https://yourdomain.com/**`

## 🧪 Test the Fix

### Test Email Confirmation:

1. **Sign up with a new email**
2. **Check inbox** for confirmation email
3. **Click confirmation link**
4. ✅ **Should redirect to production URL!**
5. Should see: `https://your-url.vercel.app/#access_token=...`

### Test Login:

1. Login with confirmed account
2. Should redirect to dashboard
3. No localhost references

## 🔍 Where to Find Your Production URL

### Vercel URL:
- Go to Vercel Dashboard
- Your project
- Should see: `talk2chat.vercel.app` or similar
- Full URL: `https://talk2chat.vercel.app`

### Custom Domain:
- If you've added a custom domain
- Use: `https://yourdomain.com`

## 📝 Quick Checklist

- [ ] Supabase → Authentication → URL Configuration
- [ ] Site URL updated to production URL
- [ ] Redirect URLs include production URL
- [ ] Redirect URLs include `/**` wildcard
- [ ] Click Save
- [ ] Test signup flow
- [ ] Confirmation redirects to production ✅

## 🎯 Step-by-Step Visual Guide

**1. Supabase Dashboard:**
```
Dashboard → Your Project → Authentication
```

**2. URL Configuration:**
```
Left Sidebar → URL Configuration
```

**3. Update Site URL:**
```
Site URL: https://talk2chat.vercel.app
```

**4. Update Redirect URLs:**
```
Click "Add URL"
Enter: https://talk2chat.vercel.app/**
Click "Add URL"  
Enter: http://localhost:5173/** (for local dev)
```

**5. Save:**
```
Click "Save" at bottom
```

## ✅ After Fix

All Supabase redirects will use your production URL:
- ✅ Email confirmations
- ✅ Password reset
- ✅ Magic links
- ✅ OAuth redirects

## 🚀 Pro Tip

**For Multiple Environments:**

Keep localhost in Redirect URLs for local development, but set Site URL to production. This way:
- Production emails → Production URL
- Local testing → Can still work
- Staging → Add staging URL to Redirect list

---

**Go to Supabase now and update the Site URL!** 🎯
