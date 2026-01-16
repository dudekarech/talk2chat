-- ===========================================================================
-- AI CHATBOT QUICK FIX SCRIPT
-- ===========================================================================
-- This script helps you quickly diagnose and fix the most common AI chat issues
-- Run this in Supabase SQL Editor
-- ===========================================================================

-- ============== STEP 1: DIAGNOSE THE PROBLEM ==============

-- Check global widget configuration
SELECT 
    'GLOBAL CONFIG STATUS' as check_type,
    ai_provider as current_provider,
    ai_model as current_model,
    CASE 
        WHEN ai_api_key IS NOT NULL THEN '✅ Gemini Key SET'
        ELSE '❌ Gemini Key MISSING'
    END as gemini_status,
    CASE 
        WHEN openrouter_api_key IS NOT NULL THEN '✅ OpenRouter Key SET'
        ELSE '❌ OpenRouter Key MISSING'
    END as openrouter_status,
    CASE 
        WHEN openai_api_key IS NOT NULL THEN '✅ OpenAI Key SET'
        ELSE '❌ OpenAI Key MISSING'
    END as openai_status,
    CASE 
        WHEN anthropic_api_key IS NOT NULL THEN '✅ Anthropic Key SET'
        ELSE '❌ Anthropic Key MISSING'
    END as anthropic_status
FROM global_widget_config
WHERE tenant_id IS NULL
LIMIT 1;

-- Check environment variables status (you can only see these in Supabase dashboard)
-- Go to: Project Settings → Edge Functions → Secrets
-- Verify: GEMINI_API_KEY is set

-- ============== STEP 2: QUICK FIX OPTIONS ==============

-- OPTION A: Switch to Gemini (if you have GEMINI_API_KEY env var set)
-- This is the recommended fix for global widgets
/*
UPDATE global_widget_config 
SET 
    ai_provider = 'gemini',
    ai_model = 'gemini-1.5-flash'
WHERE tenant_id IS NULL;
*/

-- OPTION B: Add OpenRouter API Key directly to config
-- Get free API key from: https://openrouter.ai/
/*
UPDATE global_widget_config 
SET openrouter_api_key = 'sk-or-v1-YOUR_KEY_HERE'
WHERE tenant_id IS NULL;
*/

-- OPTION C: Add Gemini API Key to config  
-- Get free API key from: https://aistudio.google.com/app/apikey
/*
UPDATE global_widget_config 
SET ai_api_key = 'YOUR_GEMINI_KEY_HERE'
WHERE tenant_id IS NULL;
*/

-- ============== STEP 3: VERIFY THE FIX ==============

-- Re-check configuration after applying fixes
SELECT 
    'VERIFICATION' as check_type,
    ai_provider,
    ai_model,
    CASE 
        WHEN ai_provider = 'gemini' AND ai_api_key IS NOT NULL THEN '✅ GEMINI CONFIGURED'
        WHEN ai_provider = 'openrouter' AND openrouter_api_key IS NOT NULL THEN '✅ OPENROUTER CONFIGURED'
        WHEN ai_provider = 'openai' AND openai_api_key IS NOT NULL THEN '✅ OPENAI CONFIGURED'
        ELSE '❌ API KEY STILL MISSING FOR ' || COALESCE(ai_provider, 'NO PROVIDER')
    END as status
FROM global_widget_config
WHERE tenant_id IS NULL;

-- ============== STEP 4: TEST AI CHAT ==============

-- Now test the chat wit in your app
-- You should see in browser console:
-- [AI Service] ✅ Success indicators
-- [Widget] ✅ Sending AI response to database

-- If you still see errors, check:
-- 1. Browser Console for detailed error messages
-- 2. Supabase Edge Functions → ai-chat → Logs
-- 3. Run the full diagnostic queries in AI_CHATBOT_ERROR_DIAGNOSTIC.md

-- ============== BONUS: FIX FOR ALL TENANTS ==============

-- If you want to fix AI for ALL tenant widgets at once:
/*
UPDATE global_widget_config 
SET 
    ai_provider = 'gemini',
    ai_model = 'gemini-1.5-flash'
WHERE tenant_id IS NOT NULL;  -- Only tenant configs, not global
*/

-- ============== EMERGENCY FALLBACK ==============

-- If nothing else works, create a minimal global config:
/*
INSERT INTO global_widget_config (
    tenant_id,
    config_key,
    ai_enabled,
    ai_provider,
    ai_model,
    ai_auto_respond,
    ai_knowledge_base
) VALUES (
    NULL,
    'global_widget',
    true,
    'gemini',
    'gemini-1.5-flash',
    true,
    'You are a helpful customer support assistant.'
)
ON CONFLICT (tenant_id, config_key) 
DO UPDATE SET
    ai_enabled = true,
    ai_provider = 'gemini',
    ai_model = 'gemini-1.5-flash',
    ai_auto_respond = true;
*/

-- ============== DONE! ==============
-- After running one of the fixes above:
-- 1. Refresh your chat widget page
-- 2. Send a test message
-- 3. Check browser console for [Widget] ✅ success messages
-- 4. Enjoy working AI chat! 🎉
