# Quick Reference: Widget Preview Fix

## Problem → Solution

### ❌ BEFORE (Broken)
```
┌─────────────────────────────────────┐
│  Tenant Dashboard                   │
│  ┌──────────────────────────────┐  │
│  │ Widget Configuration         │  │
│  │                              │  │
│  │ [Save] [Preview Widget] ─────┼──┼──> Opens /#/?preview=true
│  └──────────────────────────────┘  │           │
└─────────────────────────────────────┘           │
                                                  ▼
                                    ┌──────────────────────────┐
                                    │  TalkChat Landing Page   │
                                    │  (Public Website)        │
                                    │                          │
                                    │  ⚠️  Shows GLOBAL widget │
                                    │  ⚠️  Wrong configuration │
                                    │  ⚠️  Security risk       │
                                    └──────────────────────────┘
```

### ✅ AFTER (Fixed)
```
┌────────────────────────────────────────────────────────────┐
│  Tenant Dashboard                                          │
│  ┌──────────────────────────────────┐                     │
│  │ Widget Configuration             │                     │
│  │                                  │                     │
│  │ [Save] [Preview Widget] ────────┼──┐                  │
│  └──────────────────────────────────┘  │                  │
│                                         ▼                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🎨 Widget Preview Modal (In-Dashboard)              │ │
│  │ ┌──────────────────────────────────────────────┐    │ │
│  │ │ Simulated Website                            │    │ │
│  │ │ [Header] [Navigation] [Content]              │    │ │
│  │ │                                               │    │ │
│  │ │                        ┌──────────────────┐  │    │ │
│  │ │                        │ Chat Widget      │  │    │ │
│  │ │                        │ ✅ Tenant Config │  │    │ │
│  │ │                        └──────────────────┘  │    │ │
│  │ └──────────────────────────────────────────────┘    │ │
│  │                                    [Close Preview]   │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Component Flow

```
User Action: Click "Preview Widget"
     │
     ├─ Global Admin ──> WidgetConfiguration.tsx
     │                       │
     │                       ├─ handlePreview()
     │                       │     │
     │                       │     └─> setShowPreview(true)
     │                       │
     │                       └─> TenantWidgetPreview modal opens
     │                              │
     │                              └─> Loads GLOBAL config
     │
     └─ Tenant User ──> TenantWidgetConfiguration.tsx
                             │
                             ├─> Wraps WidgetConfiguration.tsx
                             │
                             ├─ handlePreview()
                             │     │
                             │     └─> setShowPreview(true)
                             │
                             └─> TenantWidgetPreview modal opens
                                    │
                                    └─> Loads TENANT config
                                          (via tenant_id)
```

## Configuration Resolution

```
widgetConfigService.getConfig()
     │
     ├─ Check: Is user authenticated?
     │     │
     │     └─ Yes ──> Get user profile
     │               │
     │               └─ Has tenant_id?
     │                     │
     │                     ├─ Yes ──> SELECT * WHERE tenant_id = [user's tenant]
     │                     │              │
     │                     │              └─> 🎯 Tenant Config
     │                     │
     │                     └─ No ───> SELECT * WHERE config_key = 'global_widget'
     │                                   │
     │                                   └─> 🌐 Global Config
     │
     └─ No ──> Return null (show error)
```

## Key Files

| File | Purpose | Type |
|------|---------|------|
| `TenantWidgetPreview.tsx` | Preview modal component | **NEW** |
| `TenantWidgetConfiguration.tsx` | Tenant wrapper with preview | **NEW** |
| `WidgetConfiguration.tsx` | Main config component (shared) | **MODIFIED** |
| `GlobalChatWidget.tsx` | The actual widget | **MODIFIED** |
| `App.tsx` | Application routing | **MODIFIED** |
| `widgetConfigService.ts` | Config management with tenant isolation | Existing |

## Usage

### For Tenants
1. Navigate to: `/tenant/widget`
2. Customize your widget (colors, messages, etc.)
3. Click **"Preview Widget"** button (floating bottom-right)
4. Modal opens showing simulated website
5. Test your widget
6. Close preview
7. Click **"Save Configuration"**

### For Global Admin
1. Navigate to: `/global/widget`
2. Customize global widget
3. Click **"Preview Widget"** button (in action bar)
4. Modal opens showing simulated website
5. Test global widget
6. Close preview
7. Click **"Save Configuration"**

## Security Benefits

✅ **Tenant Isolation**: Each tenant can only preview their config
✅ **No Cross-Access**: Tenants cannot see or modify global widget
✅ **No Navigation**: Users stay in authenticated dashboard
✅ **RLS Ready**: Works with Row Level Security on database
✅ **Session Based**: Uses current auth session for config lookup

---

**Status**: ✅ Implemented and Ready for Testing
**Version**: 1.0.0
**Date**: 2025-12-23
