# 🔧 COMPLETE SETUP GUIDE - Widget Configuration Fix

## 📋 What You Need to Do (In Order!)

### ✅ STEP 1: Run the Complete Migration SQL

1. **Open this file:** `backend/schema/migrations/COMPLETE_FIX.sql`
2. **Copy EVERYTHING** from that file
3. **Go to Supabase SQL Editor:**  
   https://supabase.com/dashboard/project/rwcfkcgunbjzunwwrmki/sql
4. **Paste and Run** the SQL

This will:
- ✅ Add all missing columns (secondary_color, offline_message, team_name, etc.)
- ✅ Remove duplicate rows
- ✅ Add unique constraint

---

### ✅ STEP 2: Fix the Preview Button

The preview button in `WidgetConfiguration.tsx` is missing its onClick handler.

**Find line 499** in `pages/GlobalAdmin/WidgetConfiguration.tsx`:

```tsx
// FIND THIS (around line 499):
<button className="px-4 py-2 bg-slate-700...">
    <Eye className="w-4 h-4" />
    Preview Widget
</button>

// REPLACE WITH THIS:
<button 
    onClick={() => window.open('/#/?preview=true', '_blank')}
    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
>
    <Eye className="w-4 h-4" />
    Preview Widget
</button>
```

---

### ✅ STEP 3: Test Everything

After running the SQL migration:

1. **Refresh your browser** completely (Ctrl+Shift+R)
2. **Go to Widget Configuration:** `http://localhost:5173/#/global/widget`
3. **Make changes:**
   - Change Primary Color to `#FF0000` (red)
   - Change Team Name to "Test Support"
4. **Click "Save Configuration"**
5. **Wait for** the green success message
6. **Click "Preview Widget"** → Should open in new tab
7. **Go to Landing Page:** `http://localhost:5173/#/`
8. **Check the widget:**
   - Button should be RED
   - Header should say "Test Support"
   - Colors should match your config

---

## 🐛 Current Errors & Solutions

### Error: "Could not find the 'secondary_color' column"
**Solution:** Run the COMPLETE_FIX.sql migration (Step 1)

### Error: "Cannot coerce the result to single JSON object"
**Solution:** The COMPLETE_FIX.sql migration removes duplicates

### Error: Preview button not working
**Solution:** Add onClick handler (Step 2)

### Error: Changes not reflecting in widget
**Solution:** After saving config, refresh the page where widget is displayed

---

## 📁 Important Files

- **SQL Migration:** `backend/schema/migrations/COMPLETE_FIX.sql`
- **Widget Config Page:** `pages/GlobalAdmin/WidgetConfiguration.tsx`
- **Chat Widget:** `components/GlobalChatWidget.tsx`
- **Config Service:** `services/widgetConfigService.ts`
- **Config Hook:** `hooks/useWidgetConfig.ts`

---

## 🎯 Expected Behavior After Fix

1. ✅ Save button saves changes to Supabase
2. ✅ Changes persist after page refresh
3. ✅ Preview button opens widget in new tab
4. ✅ Widget reflects your color/text changes
5. ✅ No console errors

---

## 🆘 If Something's Not Working

**Check Console Logs:**
- Press F12 → Console tab
- Look for errors
- If you see "406" errors → Run the SQL migration
- If you see "column not found" → Run the SQL migration

**Verify Database:**
```sql
-- Run this in Supabase SQL Editor to check:
SELECT COUNT(*) as total, config_key 
FROM global_widget_config 
GROUP BY config_key;

-- Should return exactly 1 row
```

**Clear Browser Cache:**
- Hard refresh: Ctrl+Shift+R
- Or clear cache in DevTools

---

## ✨ Next Steps After Fix

Once everything works:
1. Customize your widget colors, messages, etc.
2. Test the preview mode
3. Test on the landing page
4. Deploy and use the embed code for production

**ALL DONE!** 🎉
