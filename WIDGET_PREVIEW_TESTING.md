# Widget Preview Testing Guide

## Automated Test Scenarios

### Test 1: Tenant Preview Isolation ✅

**Objective**: Verify tenants see only their widget configuration in preview

**Steps**:
1. Create two test tenant accounts (TenantA, TenantB)
2. Login as TenantA
3. Configure widget:
   - Primary Color: `#FF0000` (Red)
   - Team Name: "Tenant A Support"
   - Welcome Message: "Hello from Tenant A"
4. Click "Preview Widget"
5. **Expected**: Modal opens showing red widget with "Tenant A Support"
6. Close preview
7. Logout

8. Login as TenantB
9. Configure widget:
   - Primary Color: `#00FF00` (Green)
   - Team Name: "Tenant B Support"
   - Welcome Message: "Hello from Tenant B"
10. Click "Preview Widget"
11. **Expected**: Modal opens showing green widget with "Tenant B Support"
12. **Expected**: NO red color or "Tenant A" text visible

**Pass Criteria**:
- ✅ Each tenant sees only their configuration
- ✅ No cross-tenant data leakage
- ✅ Different colors/branding displayed correctly

---

### Test 2: Preview Stays in Dashboard ✅

**Objective**: Verify preview doesn't navigate away from dashboard

**Steps**:
1. Login as any tenant
2. Navigate to `/tenant/widget`
3. Note the current URL
4. Click "Preview Widget"
5. **Expected**: Modal overlay appears
6. **Expected**: URL remains `/tenant/widget` (no navigation)
7. Check browser tab title
8. **Expected**: Still showing dashboard page
9. Close preview
10. **Expected**: Still on `/tenant/widget`

**Pass Criteria**:
- ✅ URL does not change
- ✅ No new browser tab/window opens
- ✅ Page does not reload
- ✅ Dashboard remains accessible behind modal

---

### Test 3: Global Admin Preview ✅

**Objective**: Verify global admin can preview global widget

**Steps**:
1. Login as global admin
2. Navigate to `/global/widget`
3. Configure widget:
   - Primary Color: `#8b5cf6` (Purple)
   - Team Name: "TalkChat Support"
   - Welcome Message: "Welcome to TalkChat"
4. Click "Preview Widget"
5. **Expected**: Modal opens showing purple widget
6. **Expected**: "TalkChat Support" displayed
7. **Expected**: NOT showing any tenant-specific configuration

**Pass Criteria**:
- ✅ Global admin sees global configuration
- ✅ No tenant data visible in global admin preview
- ✅ Modal works same as tenant preview

---

### Test 4: Landing Page Widget Unaffected ✅

**Objective**: Verify public landing page still shows global widget

**Steps**:
1. Logout (or use incognito window)
2. Navigate to `/` (landing page)
3. **Expected**: Chat widget button visible (bottom-right)
4. **Expected**: Widget uses GLOBAL configuration (not tenant)
5. Click widget button
6. **Expected**: Widget opens normally
7. **Expected**: Shows "TalkChat Support" (global config)

**Pass Criteria**:
- ✅ Public widget still works
- ✅ Shows global configuration
- ✅ Does NOT show any tenant's configuration
- ✅ Does NOT auto-open (unless configured)

---

### Test 5: Preview Functional Testing ✅

**Objective**: Verify widget is actually functional in preview

**Steps**:
1. Login as tenant
2. Open widget preview
3. Click the chat button in preview
4. Enter name and email in pre-chat form
5. Click "Start Chat"
6. **Expected**: Chat session starts
7. Type a message
8. **Expected**: Message appears in chat
9. Check database
10. **Expected**: Session and message saved with correct tenant_id

**Pass Criteria**:
- ✅ Widget is interactive in preview
- ✅ Can start chat sessions
- ✅ Can send messages
- ✅ Data correctly associated with tenant

---

### Test 6: Configuration Live Update ✅

**Objective**: Verify configuration changes reflect in preview

**Steps**:
1. Login as tenant
2. Set primary color to Red (`#FF0000`)
3. Click "Save Configuration"
4. Open preview
5. **Expected**: Widget is red
6. Close preview
7. Change primary color to Blue (`#0000FF`)
8. Click "Save Configuration"
9. Open preview again
10. **Expected**: Widget is now blue (updated)

**Pass Criteria**:
- ✅ Preview reflects saved configuration
- ✅ Configuration changes persist
- ✅ Multiple previews show updated config

---

### Test 7: Multi-Browser Session ✅

**Objective**: Verify tenant isolation across browser sessions

**Steps**:
1. Browser A: Login as TenantA, configure red widget
2. Browser B: Login as TenantB, configure green widget
3. Browser A: Preview widget
4. **Expected**: Red widget shown
5. Browser B: Preview widget
6. **Expected**: Green widget shown
7. Browser A: Change to blue, save, preview
8. **Expected**: Blue widget (not affected by TenantB)

**Pass Criteria**:
- ✅ Sessions are isolated
- ✅ No interference between tenants
- ✅ Concurrent usage works correctly

---

### Test 8: Permission Check ✅

**Objective**: Verify unauthorized users cannot access preview

**Steps**:
1. Logout completely
2. Try to navigate directly to `/tenant/widget`
3. **Expected**: Redirect to login page
4. Login as TenantA
5. Try to access `/global/widget`
6. **Expected**: Access denied or redirect
7. (If applicable) Try to manipulate tenant_id in browser dev tools
8. **Expected**: Preview still shows correct tenant config (server-side validation)

**Pass Criteria**:
- ✅ Auth required for widget configuration
- ✅ Tenants cannot access global admin routes
- ✅ Cannot fake tenant_id to see other configs

---

### Test 9: Mobile Responsiveness ✅

**Objective**: Verify preview works on mobile devices

**Steps**:
1. Login as tenant
2. Resize browser to mobile viewport (375x667)
3. Navigate to widget configuration
4. Click "Preview Widget" button
5. **Expected**: Modal is responsive and usable
6. **Expected**: Widget displays correctly in preview
7. Test on actual mobile device (if available)

**Pass Criteria**:
- ✅ Preview modal fits mobile screen
- ✅ Widget preview is visible
- ✅ UI elements are accessible
- ✅ No horizontal scroll

---

### Test 10: Performance & Loading ✅

**Objective**: Verify preview opens quickly without performance issues

**Steps**:
1. Login as tenant
2. Configure widget with many features enabled
3. Open browser dev tools > Network tab
4. Click "Preview Widget"
5. Measure time to modal appearance
6. **Expected**: Modal opens in < 500ms
7. Check console for errors
8. **Expected**: No JavaScript errors
9. Monitor memory usage
10. Open/close preview 10 times rapidly

**Pass Criteria**:
- ✅ Preview opens quickly (< 500ms)
- ✅ No console errors
- ✅ No memory leaks
- ✅ Smooth performance on repeated use

---

## Quick Test Checklist

Use this for rapid validation after deployment:

### Tenant Preview
- [ ] Preview button visible
- [ ] Modal opens on click
- [ ] Widget shows tenant config
- [ ] Can interact with widget
- [ ] Close button works
- [ ] No navigation away
- [ ] Config changes reflect after save

### Global Admin Preview  
- [ ] Preview button visible
- [ ] Modal opens on click
- [ ] Widget shows global config
- [ ] Not showing tenant data
- [ ] Close button works

### Public Landing Page
- [ ] Widget visible on landing page
- [ ] Shows global config
- [ ] Does not auto-open (unless configured)
- [ ] Functions normally

### Security
- [ ] Tenants can't see other tenant configs
- [ ] Tenants can't access global config
- [ ] Auth required for preview
- [ ] RLS enforced (if enabled)

---

## Regression Testing

After any updates to these files, re-run all tests:
- `components/TenantWidgetPreview.tsx`
- `pages/Tenant/TenantWidgetConfiguration.tsx`
- `pages/GlobalAdmin/WidgetConfiguration.tsx`
- `components/GlobalChatWidget.tsx`
- `services/widgetConfigService.ts`
- `App.tsx`

---

## Bug Report Template

If you find issues:

```markdown
**Bug**: [Brief description]

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Steps to Reproduce**:
1. 
2. 
3. 

**Environment**:
- User Role: [Tenant / Global Admin / Public]
- Browser: [Chrome / Firefox / Safari / Edge]
- Device: [Desktop / Mobile / Tablet]

**Screenshots**: [Attach if relevant]

**Console Errors**: [Paste any errors from browser console]
```

---

**Testing Status**: ⏳ Pending
**Last Tested**: [Date]
**Tested By**: [Name]
