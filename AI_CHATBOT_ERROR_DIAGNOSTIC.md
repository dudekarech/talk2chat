# AI Chatbot Error Diagnostic Guide

## 🔍 **Common Errors & Solutions**

### **Error: 400 Bad Request - "Missing API key"**

**Symptom:**
```
POST https://...supabase.co/functions/v1/ai-chat 400 (Bad Request)
AI Service Error: The AI service is temporarily unavailable.
```

**Root Cause:**
The AI provider (e.g., OpenRouter, Gemini, OpenAI) is configured in the widget but **no API key** is set.

**Solutions:**

#### For Global Widget (tenant_id: null):
1. Open Supabase SQL Editor
2. Check if global config exists:
```sql
SELECT * FROM global_widget_config WHERE tenant_id IS NULL;
```

3. **Option A - Add API Key to Global Config:**
```sql
UPDATE global_widget_config
SET openrouter_api_key = 'sk-or-v1-YOUR_KEY_HERE'
WHERE tenant_id IS NULL;
```

4. **Option B - Set Environment Variable:**
   - In Supabase Dashboard → Project Settings → Edge Functions
   - Add secret: `GEMINI_API_KEY` or relevant provider key
   - Restart Edge Functions

5. **Option C - Switch to Gemini with Env Var:**
```sql
UPDATE global_widget_config
SET 
    ai_provider = 'gemini',
    ai_model = 'gemini-1.5-flash'
WHERE tenant_id IS NULL;
```
Then ensure `GEMINI_API_KEY` is set in Supabase Edge Function secrets.

---

#### For Tenant Widget (tenant_id: UUID):
1. Go to **Widget Configuration** page
2. Navigate to **AI Integration** section
3. Select your provider (OpenRouter, Gemini, OpenAI, etc.)
4. **Enter your API key** in the corresponding field
5. Click **Save Changes**

---

### **Error: 400 Bad Request - "Configuration not found"**

**Symptom:**
```
Configuration not found for tenant: [tenant-uuid]
```

**Root Cause:**
No widget configuration exists for the specified tenant.

**Solution:**
1. Login as the tenant owner/admin
2. Navigate to **Widget Configuration**
3. Configure at least basic settings (AI provider, model)
4. Save the configuration

---

### **Error: "Rate limit exceeded"**

**Symptom:**
```
Rate limit exceeded. Please wait a moment before sending another message.
```

**Root Cause:**
More than 10 AI requests in 1 minute from the same session (anti-abuse protection).

**Solution:**
- Wait 60 seconds before sending more messages
- Or adjust the rate limit in `supabase/functions/ai-chat/index.ts` line 120

---

### **Error: "Credit exhaustion"**

**Symptom:**
```
I'm sorry, I'm currently unable to process your request due to system maintenance (Credit Exhaustion).
```

**Root Cause:**
Tenant's AI credits balance is 0 or negative.

**Solution:**
1. **For Super Admins:**
   - Go to **Tenants Management**
   - Find the tenant
   - Click **+TopUp** to add credits

2. **Check Credit Balance:**
```sql
SELECT name, ai_credits_balance 
FROM tenants 
WHERE id = 'YOUR_TENANT_ID';
```

3. **Add Credits Manually:**
```sql
SELECT add_tenant_credits('YOUR_TENANT_ID', 1000.0);
```

---

## 🛠️ **Quick Diagnostic Checklist**

### **Step 1: Check Browser Console**
Open DevTools (F12) → Console tab, look for:
```
[AI Service] ===== PROXY ERROR DETAILS =====
[AI Service] Response Body (String): ...
[AI Service] Extracted Error Message: ...
```

This will show the ACTUAL error from the backend.

---

### **Step 2: Verify Widget Configuration**

**For Global Widget:**
```sql
SELECT 
    ai_provider,
    ai_model,
    CASE 
        WHEN ai_api_key IS NOT NULL THEN 'Gemini: SET ✅'
        ELSE 'Gemini: MISSING ❌'
    END as gemini_key,
    CASE 
        WHEN openrouter_api_key IS NOT NULL THEN 'OpenRouter: SET ✅'
        ELSE 'OpenRouter: MISSING ❌'
    END as openrouter_key,
    CASE 
        WHEN openai_api_key IS NOT NULL THEN 'OpenAI: SET ✅'
        ELSE 'OpenAI: MISSING ❌'
    END as openai_key
FROM global_widget_config
WHERE tenant_id IS NULL;
```

**For Tenant Widget:**
```sql
SELECT 
    tenant_id,
    ai_provider,
    ai_model,
    CASE 
        WHEN ai_api_key IS NOT NULL THEN 'Gemini: SET ✅'
        ELSE 'Gemini: MISSING ❌'
    END as gemini_key,
    CASE 
        WHEN openrouter_api_key IS NOT NULL THEN 'OpenRouter: SET ✅'
        ELSE 'OpenRouter: MISSING ❌'
    END as openrouter_key
FROM global_widget_config
WHERE tenant_id = 'YOUR_TENANT_ID';
```

---

### **Step 3: Test Edge Function Directly**

Use curl or Postman:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "history": [],
    "instructions": "You are a helpful assistant.",
    "provider": "gemini",
    "modelName": "gemini-1.5-flash",
    "tenant_id": null,
    "session_id": "test-123"
  }'
```

Expected response:
- ✅ **200 OK**: `{"response": "Hello! How can I help you?"}`
- ❌ **400 Bad Request**: `{"error": "Missing API key for provider: gemini"}`

---

### **Step 4: Check Edge Function Logs**

1. Open Supabase Dashboard
2. Go to **Edge Functions** → **ai-chat**
3. Click **Logs** tab
4. Look for recent errors with detailed stack traces

Common errors in logs:
```
[AI Proxy] Missing API key for provider: openrouter, Global: true
```

---

## 🎯 **Most Common Fix**

**95% of AI chat errors** are due to missing API keys. Here's the fastest fix:

### **Option 1: Use Gemini with Environment Variable** (Recommended for Global)
```
1. Get a free Gemini API key: https://aistudio.google.com/app/apikey
2. In Supabase → Settings → Edge Functions → Secrets
3. Add: GEMINI_API_KEY = your-key-here
4. Update global config to use Gemini:
   UPDATE global_widget_config 
   SET ai_provider = 'gemini', ai_model = 'gemini-1.5-flash' 
   WHERE tenant_id IS NULL;
```

### **Option 2: Use TalkChat AI (Managed)** (Requires Credits)
```sql
UPDATE global_widget_config 
SET ai_provider = 'talkchat', ai_model = 'gemini-1.5-flash' 
WHERE tenant_id IS NULL;
```
Then add credits to the system tenant.

---

## 📊 **Error Message Reference**

| Error Message | What it Means | Quick Fix |
|--------------|---------------|-----------|
| "Missing API key for provider: X" | No API key configured for provider X | Add API key in widget settings or env vars |
| "Configuration not found" | Widget config doesn't exist | Create widget configuration |
| "Rate limit exceeded" | Too many messages too fast | Wait 60 seconds |
| "Credit Exhaustion" | Tenant ran out of AI credits | Add credits via Tenants Management |
| "Model only available on Pro" | Free plan trying to use premium model | Upgrade plan or use free models |
| "Edge Function returned a non-2xx status code" | Generic Edge Function error | Check browser console for detailed error |

---

## 🚀 **Prevention Tips**

1. **Always set a default API key** in environment variables for global widget
2. **Monitor credit balances** - set up alerts when credits drop below 100
3. **Test widget configuration** after changes using the diagnostic curl command
4. **Check Edge Function logs** regularly for patterns
5. **Use managed AI (TalkChat)** to avoid key management headaches

---

## 📝 **Need More Help?**

1. Run diagnostic queries above
2. Check browser console for detailed errors
3. Check Edge Function logs in Supabase
4. Share the EXACT error message from console
5. Share the widget configuration SQL output
