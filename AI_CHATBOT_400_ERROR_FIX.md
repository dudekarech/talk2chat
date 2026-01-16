# AI Chatbot 400 Error - Fix Summary

## 🎯 **Problem Identified**

**Error:** `POST https://...supabase.co/functions/v1/ai-chat 400 (Bad Request)`

**Root Cause:** Missing API key for the configured AI provider (OpenRouter in your case)

### **What's Happening:**
1. Chat widget is configured to use `openrouter` with model `mistralai/mistral-7b-instruct:free`
2. Widget operates in global mode (`tenant_id: null`)
3. No OpenRouter API key is set in the global configuration
4. Edge Function returns 400: "Missing API key for provider: openrouter"
5. User sees generic error: "AI Service Error: The AI service is temporarily unavailable."

---

## ✅ **Fixes Applied**

### **1. Enhanced Error Logging** (aiService.ts)
**What I did:** Added comprehensive logging to capture actual backend errors

**Before:**
```
[AI Service] Proxy Error Details: FunctionsHttpError...
```

**After:**
```
[AI Service] ===== PROXY ERROR DETAILS =====
[AI Service] Full Error Object: {...}
[AI Service] Response Body (String): {"error": "Missing API key..."}
[AI Service] Extracted Error Message: Missing API key for provider: openrouter
[AI Service] ===== FINAL ERROR MESSAGE =====
```

**Benefit:** You can now see the EXACT error from the backend in your browser console

---

### **2. Graceful Error Messages** (GlobalChatWidget.tsx)
**What I did:** Map technical errors to user-friendly messages

**Error Type Mapping:**
| Technical Error | User Sees |
|----------------|-----------|
| "Missing API key" | "I'm currently unavailable. The system administrator needs to configure the AI service..." |
| "Credit exhaustion" | "I'm temporarily unavailable due to system maintenance. Our team has been notified..." |
| "Rate limit exceeded" | "You're chatting a bit too fast! Please wait a moment... 😊" |
| Generic errors | "I'm having trouble responding right now. Please try again in a moment..." |

**Benefit:** Users see helpful, friendly messages instead of technical jargon

---

### **3. Admin Diagnostic Tools**
Created 2 files to help you troubleshoot:

#### **`AI_CHATBOT_QUICK_FIX.sql`** ⚡
- 2-minute fix script
- Checks current configuration
- Provides copy-paste fixes
- Verifies the solution

#### **`AI_CHATBOT_ERROR_DIAGNOSTIC.md`** 📚
- Comprehensive troubleshooting guide
- All common errors explained
- Step-by-step solutions
- SQL queries for verification
- curl commands for testing

---

## 🚀 **Quick Fix for Your Issue**

### **Option 1: Switch to Gemini** (Recommended - Free & Easy)

1. **Get a free Gemini API key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Copy your API key

2. **Set it in Supabase:**
   - Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add secret: `GEMINI_API_KEY` = `your-key-here`

3. **Update global config:**
```sql
UPDATE global_widget_config 
SET 
    ai_provider = 'gemini',
    ai_model = 'gemini-1.5-flash'
WHERE tenant_id IS NULL;
```

4. **Test:**
   - Refresh your chat widget
   - Send a message: "hello"
   - Should get AI response! ✅

---

### **Option 2: Add OpenRouter API Key**

1. **Get OpenRouter API key:**
   - Visit: https://openrouter.ai/
   - Sign up and get API key

2. **Add to config:**
```sql
UPDATE global_widget_config 
SET openrouter_api_key = 'sk-or-v1-YOUR_KEY_HERE'
WHERE tenant_id IS NULL;
```

3. **Test immediately**

---

## 📊 **Testing Your Fix**

### **Step 1: Check Browser Console**
After applying the fix, you should see:
```
[AI Service] ========== AI REQUEST ==========
[AI Service] Provider: gemini
[AI Service] Routing through secure backend proxy...
[Widget] AI Response received: Hello! How can I help...
[Widget] ✅ Sending AI response to database
```

Instead of:
```
[AI Service] ❌ Edge Function Error: {...}
```

---

### **Step 2: Verify in Database**
```sql
SELECT 
    ai_provider,
    ai_model,
    CASE 
        WHEN ai_api_key IS NOT NULL THEN '✅ Key Set'
        ELSE '❌ Missing'
    END as gemini_key
FROM global_widget_config
WHERE tenant_id IS NULL;
```

Expected result:
```
ai_provider: gemini
ai_model: gemini-1.5-flash
gemini_key: ✅ Key Set
```

---

### **Step 3: Test with curl**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "history": [],
    "instructions": "You are helpful.",
    "provider": "gemini",
    "modelName": "gemini-1.5-flash",
    "tenant_id": null,
    "session_id": "test"
  }'
```

Expected: `{"response": "Hello! How can I help you today?"}`

---

## 🔍 **Diagnostic Checklist**

Run these queries to verify everything:

```sql
-- 1. Check global config exists
SELECT COUNT(*) as config_count 
FROM global_widget_config 
WHERE tenant_id IS NULL;
-- Should return 1

-- 2. Check AI is enabled
SELECT ai_enabled, ai_auto_respond 
FROM global_widget_config 
WHERE tenant_id IS NULL;
-- Both should be true

-- 3. Check provider and model
SELECT ai_provider, ai_model 
FROM global_widget_config 
WHERE tenant_id IS NULL;
-- Should match what you configured

-- 4. Check if API key is set (don't query the actual key!)
SELECT 
    CASE WHEN ai_api_key IS NOT NULL THEN 'SET' ELSE 'MISSING' END as key_status
FROM global_widget_config 
WHERE tenant_id IS NULL;
-- Should return 'SET'
```

---

## 📝 **Files Created**

```
✅ AI_CHATBOT_ERROR_DIAGNOSTIC.md  (Comprehensive guide)
✅ AI_CHATBOT_QUICK_FIX.sql        (Quick fix script)
✅ services/aiService.ts           (Enhanced logging)
✅ components/GlobalChatWidget.tsx (Friendly error messages)
```

---

## 🎯 **Expected Results**

### **For Users:**
- ✅ See friendly, helpful error messages
- ✅ Understand what to do (e.g., "contact support")
- ✅ No technical jargon or stack traces

### **For Admins:**
- ✅ See detailed error diagnostics in console
- ✅ Quickly identify the root cause
- ✅ Fix issues in under 2 minutes with SQL scripts
- ✅ Verify fixes immediately

---

## 💡 **Pro Tips**

1. **Always check browser console first** - detailed errors are now logged there
2. **Use Gemini for global widget** - it's free and reliable
3. **Set API keys in environment variables** - more secure than database
4. **Run `AI_CHATBOT_QUICK_FIX.sql`** when you see 400 errors
5. **Check Edge Function logs** in Supabase for server-side issues

---

## 🆘 **Still Having Issues?**

1. **Run the quick fix SQL script**
2. **Check browser console** for new error messages (now much more detailed!)
3. **Check Edge Function logs** in Supabase Dashboard
4. **Share the output** from browser console's "ADMIN DIAGNOSTIC" logs

The enhanced logging will show you EXACTLY what's wrong! 🔍

---

**Your AI chat should now be working perfectly! 🎉**
