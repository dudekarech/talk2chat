# 🚀 DEPLOYMENT GUIDE - Vercel + Custom Domain

## Why Vercel?

**Best platform for your React + Vite + Supabase app:**
- ✅ Free tier (generous)
- ✅ Automatic Git deployments
- ✅ Custom domain support (free SSL)
- ✅ Built for React/Vite
- ✅ Global CDN
- ✅ Environment variables
- ✅ Zero configuration needed

## 📋 Pre-Deployment Checklist

### 1. **Re-Enable RLS (IMPORTANT!)** 🔒

You disabled RLS for development. **MUST enable for production!**

Run in Supabase SQL Editor:

```sql
-- Re-enable RLS on all tables
ALTER TABLE global_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_widget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notes ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust as needed)
-- Allow authenticated users to read/write their own data

-- Example: Users can view all chat sessions
CREATE POLICY "authenticated_can_view_sessions"
ON global_chat_sessions FOR SELECT
TO authenticated
USING (true);

-- Example: Users can create messages
CREATE POLICY "authenticated_can_create_messages"
ON global_chat_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Example: Anyone can view widget config
CREATE POLICY "anyone_can_view_widget_config"
ON global_widget_config FOR SELECT
TO anon, authenticated
USING (true);

-- Add more policies as needed for your security requirements
```

### 2. **Create Production Environment Variables**

Create a `.env.production` file:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Get these from:**
Supabase Dashboard → Settings → API → Project URL & anon/public key

### 3. **Verify Build Works Locally**

```bash
npm run build
```

Should create a `dist` folder with no errors.

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Vercel Dashboard**

1. Go to: https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave empty)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL` → Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key
6. Click "Deploy"
7. ✅ Done! Your site is live!

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? your-project-name
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Step 3: Add Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Enter your domain: `yourdomain.com`
   - Click "Add"

2. **Update DNS (at your domain registrar):**

   Add these records:

   **For root domain (yourdomain.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   **Or use Vercel nameservers (recommended):**
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

3. **Wait for DNS propagation** (5-60 minutes)
4. ✅ SSL certificate auto-generated!

## 📁 Required Files

### `vercel.json` (Create in project root)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### `.gitignore` (Verify these are included)

```
node_modules
dist
.env
.env.local
.env.production
.vercel
```

### `package.json` (Verify build script)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🔧 Troubleshooting

### Build Fails?

**Check:**
1. All imports use correct paths
2. No TypeScript errors: `npm run build`
3. Dependencies installed: `npm install`

### Environment Variables Not Working?

**Solution:**
1. In Vercel, go to Settings → Environment Variables
2. Add each variable
3. Redeploy: Git push or click "Redeploy" in Vercel

### Routes Not Working (404)?

**Solution:**
- Verify `vercel.json` rewrites configuration
- Make sure using HashRouter OR configure SPA fallback

### CORS Errors in Production?

**Solution:**
1. Check Supabase URL is correct
2. Verify anon key is correct
3. Check RLS policies allow access

## 🎯 Post-Deployment

### 1. Update Supabase Settings

In Supabase Dashboard → Settings → API:
- Add your production URL to **Allowed Origins**
- Example: `https://yourdomain.com`

### 2. Test Everything

- ✅ Login works
- ✅ Signup works
- ✅ Chat widget works
- ✅ Agent dashboard works
- ✅ Admin panel works
- ✅ Database operations work

### 3. Set Up Monitoring

Vercel provides:
- Analytics (free)
- Error tracking
- Performance monitoring

Enable in: Project → Analytics

### 4. Enable Custom Domain SSL

**Automatic!** Vercel handles:
- SSL certificate generation
- Auto-renewal
- HTTPS redirect

## 🚀 Alternative Platforms

### **Netlify** (Also Great)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Build command: npm run build
# Publish directory: dist
```

### **Cloudflare Pages** (Fast & Free)

1. Go to: https://pages.cloudflare.com
2. Connect GitHub
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables
5. Deploy

### **Railway** (Full-stack option)

Good if you need backend services later.

## 📊 Cost Comparison

**Free Tiers:**

| Platform | Free Bandwidth | Build Minutes | Domains |
|----------|---------------|---------------|---------|
| Vercel | 100GB/month | Unlimited | Unlimited |
| Netlify | 100GB/month | 300 min/month | Unlimited |
| Cloudflare | Unlimited | 500 builds/month | Unlimited |

**Recommendation: Vercel** for your use case!

## 🎉 Quick Start (30 seconds)

```bash
# 1. Build locally to test
npm run build

# 2. Push to GitHub
git add .
git commit -m "Deploy"
git push

# 3. Import to Vercel
# Go to vercel.com → Import → Select repo → Deploy

# Done! ✅
```

## 📝 Final Checklist

Before going live:

- [ ] RLS re-enabled in Supabase with proper policies
- [ ] Environment variables set in Vercel
- [ ] Build succeeds locally
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Custom domain configured
- [ ] DNS updated
- [ ] SSL working (https://)
- [ ] All features tested in production
- [ ] Supabase allowed origins updated

## 🚀 Ready to Deploy!

**Recommended flow:**
1. Re-enable RLS (see above)
2. Push to GitHub
3. Deploy to Vercel (literally 2 clicks)
4. Add custom domain
5. Test everything
6. Go live! 🎉

Vercel is free for your use case and handles everything automatically!
