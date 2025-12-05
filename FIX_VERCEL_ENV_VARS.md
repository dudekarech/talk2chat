# 🚨 FIX: Environment Variables Missing in Vercel

## The Problem
```
Uncaught Error: supabaseUrl is required
```

**Cause:** Environment variables not configured in Vercel deployment.

## ✅ THE FIX (1 minute)

### Step 1: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 2: Add to Vercel

**Option A: Via Vercel Dashboard**

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select `talk2chat` project
3. Click **Settings** → **Environment Variables**
4. Add these TWO variables:

```
Name: VITE_SUPABASE_URL
Value: https://rwcfkcgunbjzunwwrmki.supabase.co (your actual URL)

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGc... (your actual anon key)
```

5. **Important:** Select **Production, Preview, and Development** for both
6. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the three dots (•••) on the latest deployment
3. Click **Redeploy**
4. ✅ Wait 30 seconds
5. **Site will work!**

---

## **Option B: Via Vercel CLI (if you have it)**

```bash
# Add environment variables
vercel env add VITE_SUPABASE_URL
# Paste your URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your key when prompted

# Redeploy
vercel --prod
```

---

## 📋 Verify Variables Are Set

After adding:

1. Go to Settings → Environment Variables
2. You should see:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
3. Both should have values (partially hidden)

---

## 🎯 Quick Video Guide

**To add environment variables in Vercel:**

1. **Dashboard** → **Your Project**
2. **Settings** (top nav)
3. **Environment Variables** (left sidebar)
4. **Add New** button
5. Enter name: `VITE_SUPABASE_URL`
6. Enter value: Your Supabase URL
7. Select all environments (Production, Preview, Development)
8. Click **Save**
9. Repeat for `VITE_SUPABASE_ANON_KEY`
10. **Deployments** → **Redeploy** latest

---

## ⚠️ Common Mistakes

### ❌ Wrong: Missing VITE_ prefix
```
SUPABASE_URL=https://...  ← Won't work!
```

### ✅ Correct: With VITE_ prefix
```
VITE_SUPABASE_URL=https://...  ← Works!
```

### ❌ Wrong: Not selecting Production environment
- Must check "Production" when adding variable

### ✅ Correct: All environments selected
- Production ✓
- Preview ✓  
- Development ✓

---

## 🔍 How to Find Your Supabase Values

**Supabase URL:**
1. Supabase Dashboard → Settings → API
2. Look for **Project URL**
3. Copy the full URL: `https://xxx.supabase.co`

**Anon Key:**
1. Same page (Settings → API)
2. Look for **Project API keys**
3. Find **anon** / **public** key
4. Click to reveal and copy (starts with `eyJ...`)

---

## ✅ After Fix

Your deployment should:
- ✅ Load without blank screen
- ✅ Show login page
- ✅ Connect to Supabase
- ✅ All features work

---

## 🚀 Quick Steps Summary

1. **Get** Supabase URL and anon key
2. **Add** to Vercel → Settings → Environment Variables
3. **Redeploy** from Deployments tab
4. ✅ **Done!**

---

**Go to your Vercel dashboard NOW and add those two environment variables!**
