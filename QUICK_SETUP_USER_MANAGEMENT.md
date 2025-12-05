# ⚡ QUICK SETUP - User Management & Agent Dashboard

## 🎯 Get Agents Up and Running in 10 Minutes!

### Step 1: Run Database Migration (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of: `backend/schema/migrations/USER_PROFILES_SCHEMA.sql`
3. Click **"Run"**
4. ✅ You should see: "Success. No rows returned"

This creates:
- `user_profiles` table
- `agent_stats` table  
- All necessary indexes
- Security policies (RLS)

### Step 2: Add Routes to Your App (2 minutes)

In your main routing file (e.g., `App.tsx` or `routes.tsx`):

```tsx
import { Users } from './pages/GlobalAdmin/Users';
import { AgentDashboard } from './pages/AgentDashboard';

// Add these routes:
<Route path="/admin/users" element={<Users />} />
<Route path="/agent/dashboard" element={<AgentDashboard />} />
```

### Step 3: Create Your First Agent (3 minutes)

1. Navigate to: `http://localhost:5173/admin/users`
2. Click **"Add User"** button
3. Fill in:
   ```
   Name: Demo Agent
   Email: agent@test.com
   Password: Demo123!
   Role: Agent
   Department: Support
   ```
4. Click **"Create User"**
5. ✅ Success! Agent account created!

### Step 4: Test Agent Login (3 minutes)

The agent can now login with:
- **Email:** `agent@test.com`
- **Password:** `Demo123!`

After login, they'll see:
- ✅ Their personal dashboard
- ✅ Live metrics (chats, response time, ratings)
- ✅ Active conversations
- ✅ Visitor information (when chat selected)

## 🎯 What You Get

### For Admins:
```
Global Admin → Users
├── User list with search/filter
├── Create new users (agents, managers, admins)
├── Edit user details
├── Suspend/reactivate users
└── Delete users
```

### For Agents:
```
Agent Dashboard
├── Welcome greeting
├── Today's stats
│   ├── Active chats
│   ├── Completed chats
│   ├── Avg response time
│   └── Satisfaction rating
├── Active conversations list
│   ├── Click to view details
│   └── Live updates
└── Visitor information panel
    ├── Device & location
    ├── Page views
    ├── Time tracking
    ├── Scroll depth
    └── Click tracking
```

## 📊 Live Metrics Examples

When an agent handles chats, they see:

**Active Chats:** 3 (+12%)  
**Completed Today:** 12 (+8%)  
**Avg Response:** 45s (-15%)  
**Satisfaction:** 95% (+5%)  

All numbers update **in real-time** without refreshing!

## 🔄 Real-Time Updates

The dashboard uses Supabase subscriptions for:
- ✅ New chat notifications
- ✅ Chat status changes
- ✅ Stats updates
- ✅ Visitor tracking updates

No polling needed - it's truly real-time!

## 🎨 Features at a Glance

### User Management:
- ✅ Full CRUD (Create, Read, Update, Delete)
- ✅ Role-based access (Super Admin, Admin, Manager, Agent)
- ✅ Search by name/email
- ✅ Filter by role and status
- ✅ Beautiful modals
- ✅ Supabase Auth integration

### Agent Dashboard:
- ✅ Real-time metrics
- ✅ Active chat list
- ✅ Visitor information
- ✅ Performance tracking
- ✅ Online/offline toggle
- ✅ Quick actions
- ✅ Responsive design

## 🚀 Next Steps

1. **Create multiple agents**
   - Add different departments
   - Assign various roles
   - Test permissions

2. **Enable visitor tracking**
   - Go to Widget Configuration
   - Enable tracking features
   - Agents will see data in dashboard

3. **Start routing chats to agents**
   - As visitors chat, assign to agents
   - Agents see in "Active Conversations"
   - Click chat to view visitor info

4. **Monitor performance**
   - Check daily stats
   - Review response times
   - Analyze satisfaction ratings

## 💡 Pro Tips

1. **Test with multiple accounts**
   -  Create an admin and agent
   - Login as each to see different views

2. **Enable all tracking features**
   - Widget Config → Visitor Tracking
   - Enable all options
   - Agents get rich visitor data

3. **Use keyboard shortcuts**
   - Ctrl+Enter to send messages (coming soon)
   - Tab to navigate forms quickly

4. **Set up departments**
   - Create agents by department
   - Filter/assign chats by department

## 🎊 You're Done!

Your system now has:
- ✅ User management for admins
- ✅ Agent dashboards with live metrics
- ✅ Real-time updates
- ✅ Visitor tracking integration
- ✅ Performance monitoring

**Agents can login and start handling chats with full visibility!** 🚀

---

**Need help?** Check `USER_MANAGEMENT_GUIDE.md` for detailed documentation!
