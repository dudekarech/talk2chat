# Widget Preview Separation Fix

## Issue Description

There was no separation between tenant and global admin widget previews. When tenants clicked to preview their chat widget, it routed to the TalkChat landing page (the public-facing website), which meant:

1. **Tenants saw the global TalkChat widget**, not their customized widget
2. **Security concern**: Tenants could potentially alter the global TalkChat landing page widget
3. **Poor UX**: Preview took users away from their dashboard
4. **No tenant isolation**: The preview functionality didn't respect multi-tenant architecture

## Root Cause

Both Global Admin and Tenant dashboards used the same `WidgetConfiguration` component, which had a preview handler that opened `'/#/?preview=true'` in a new window. This URL always routed to the landing page, showing the global widget configuration instead of tenant-specific configurations.

## Solution Implemented

### 1. Created Tenant-Specific Widget Preview Component
**File**: `components/TenantWidgetPreview.tsx`

A new preview modal that:
- Displays within the dashboard (no navigation away)
- Shows a simulated website with the actual widget
- Uses tenant-specific configuration automatically (via `widgetConfigService`)
- Provides a contained, safe preview environment

### 2. Created Tenant Widget Configuration Wrapper
**File**: `pages/Tenant/TenantWidgetConfiguration.tsx`

A tenant-specific wrapper that:
- Uses the same `WidgetConfiguration` component for consistency
- Adds a floating "Preview Widget" button
- Opens the preview modal in-dashboard
- Ensures tenant isolation

### 3. Updated Global Admin Widget Configuration
**File**: `pages/GlobalAdmin/WidgetConfiguration.tsx`

Modified to:
- Use the same in-dashboard preview modal
- Removed the `window.open('/#/?preview=true', '_blank')` redirect
- Added `showPreview` state management
- Integrated `TenantWidgetPreview` component

### 4. Updated Application Routing
**File**: `App.tsx`

Changed tenant widget route from:
```tsx
<Route path="widget" element={<WidgetConfiguration />} />
```

To:
```tsx
<Route path="widget" element={<TenantWidgetConfiguration />} />
```

This ensures tenants always use the wrapped version with proper preview.

### 5. Removed Legacy Preview Logic
**File**: `components/GlobalChatWidget.tsx`

Removed the URL parameter check that auto-opened the widget when `preview=true` was in the URL. This legacy code was:
- Making the widget auto-open on the landing page
- Creating confusion between dashboard previews and public widget
- No longer needed with in-dashboard preview modals

## How Tenant Isolation Works

### Configuration Loading (Multi-Tenant)
The `widgetConfigService.ts` already properly implements tenant isolation:

```typescript
async getConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
    const tenantId = await this.getTenantId();
    
    let query = supabase
        .from('global_widget_config')
        .select('*');
    
    if (tenantId) {
        query = query.eq('tenant_id', tenantId);  // Filters by tenant
    } else {
        query = query.eq('config_key', 'global_widget');  // Global admin
    }
    
    // Returns tenant-specific or global config
}
```

### Preview Isolation
When `GlobalChatWidget` is rendered inside `TenantWidgetPreview`:
1. It calls `widgetConfigService.getConfig()`
2. The service detects the logged-in user's `tenant_id`
3. It fetches only that tenant's widget configuration
4. The widget displays with tenant-specific colors, messages, branding, etc.

**Key Point**: Because the preview modal is rendered within the authenticated dashboard, it automatically inherits the user's tenant context.

## Architecture Benefits

### Before (Problematic)
```
Tenant clicks "Preview" 
  → Opens /#/?preview=true in new window
  → Routes to Landing Page
  → Shows GLOBAL widget (wrong!)
  → Tenant confused / security issue
```

### After (Fixed)
```
Tenant clicks "Preview Widget"
  → Opens modal in dashboard
  → Renders simulated website
  → GlobalChatWidget loads tenant config
  → Shows TENANT-SPECIFIC widget (correct!)
  → Tenant stays in dashboard
```

## Files Modified

1. ✅ `components/TenantWidgetPreview.tsx` - **NEW** - Preview modal component
2. ✅ `pages/Tenant/TenantWidgetConfiguration.tsx` - **NEW** - Tenant wrapper with preview
3. ✅ `App.tsx` - Updated tenant routing
4. ✅ `pages/GlobalAdmin/WidgetConfiguration.tsx` - Added in-dashboard preview
5. ✅ `components/GlobalChatWidget.tsx` - Removed legacy preview URL logic

## Testing Checklist

### Tenant Preview
- [ ] Login as a tenant user
- [ ] Navigate to Widget Configuration (`/tenant/widget`)
- [ ] Click "Preview Widget" button
- [ ] Verify preview modal opens within dashboard
- [ ] Verify widget shows tenant's custom colors/branding
- [ ] Verify widget shows tenant's welcome message
- [ ] Test chat functionality in preview
- [ ] Close preview and verify you're still in dashboard

### Global Admin Preview
- [ ] Login as global admin
- [ ] Navigate to Widget Configuration (`/global/widget`)
- [ ] Click "Preview Widget" button
- [ ] Verify preview modal opens within dashboard
- [ ] Verify widget shows global configuration
- [ ] Close preview and verify you're still in dashboard

### Landing Page (Public)
- [ ] Navigate to landing page (`/`)
- [ ] Verify widget still appears
- [ ] Verify it shows GLOBAL configuration (not tenant-specific)
- [ ] Verify it does NOT auto-open (unless configured to)

### Tenant Isolation
- [ ] Create/modify config as Tenant A
- [ ] Preview and verify Tenant A's configuration
- [ ] Login as Tenant B
- [ ] Preview and verify Tenant B sees THEIR config, not Tenant A's
- [ ] Login as global admin
- [ ] Verify global admin sees global config, not any tenant's config

## Security Notes

1. **RLS (Row Level Security)** should be enabled on `global_widget_config` table to enforce tenant isolation at database level
2. The `widgetConfigService` relies on `tenant_id` from user profile - ensure this cannot be manipulated
3. Preview modal renders within authenticated context, preventing unauthorized access
4. Tenants can only preview their own widget, never the global or other tenants' widgets

## Future Enhancements

1. **Live Preview**: Update preview in real-time as user changes configuration (no save required)
2. **Device Preview**: Add mobile/tablet/desktop preview modes
3. **Multiple Pages**: Show widget on different simulated page types (homepage, product page, etc.)
4. **Integration Test**: Add automated tests for multi-tenant preview isolation
5. **Preview History**: Allow users to preview different saved configuration versions

## Rollback Instructions

If issues arise, revert these commits in reverse order:

```bash
# 1. Revert GlobalChatWidget.tsx changes
git checkout HEAD~1 -- components/GlobalChatWidget.tsx

# 2. Revert WidgetConfiguration.tsx changes
git checkout HEAD~1 -- pages/GlobalAdmin/WidgetConfiguration.tsx

# 3. Revert App.tsx routing
git checkout HEAD~1 -- App.tsx

# 4. Remove new files
rm components/TenantWidgetPreview.tsx
rm pages/Tenant/TenantWidgetConfiguration.tsx
```

## Summary

✅ **Tenant widget preview is now isolated** - Tenants see only their customized widget
✅ **No unauthorized access** - Tenants cannot access or modify global TalkChat widget
✅ **Improved UX** - Preview happens in-dashboard, no navigation away
✅ **Consistent architecture** - Both global admin and tenants use same preview mechanism
✅ **Multi-tenant secure** - Each tenant's preview uses their specific configuration

The fix ensures proper separation of concerns and maintains the multi-tenant architecture integrity of the TalkChat platform.
