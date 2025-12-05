# Global Chat WebSocket Setup Guide

## Step 1: Set Up Supabase Database

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/rwcfkcgunbjzunwwrmki

2. Navigate to **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste the contents of `backend/schema/global_chat_schema.sql`

5. Click **Run** to execute the schema

6. Verify tables were created:
   - `global_chat_sessions`
   - `global_chat_messages`
   - `global_widget_config`
   - `global_chat_notes`

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

## Step 2: Enable Realtime

1. In Supabase Dashboard, go to **Database** → **Replication**

2. Enable replication for these tables:
   - ✅ `global_chat_sessions`
   - ✅ `global_chat_messages`
   - ✅ `global_widget_config`

3. Click **Save**

## Step 3: Verify Environment Variables

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://rwcfkcgunbjzunwwrmki.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

✅ **Already configured in your project!**

## Step 4: Test the Connection

1. Restart your dev server:
```bash
npm run dev
```

2. Open browser console and check for connection logs

3. You should see:
```
[Realtime] Channel session:xxx status: SUBSCRIBED
```

## How It Works

### Architecture

```
Landing Page Widget          Global Admin Inbox
       ↓                            ↓
   WebSocket ←→ Supabase Realtime ←→ WebSocket
       ↑                            ↑
   PostgreSQL Database (Single Source of Truth)
```

### Real-Time Flow

1. **Visitor sends message** on landing page
   - Widget calls `globalChatService.sendMessage()`
   - Message inserted into `global_chat_messages` table
   - Supabase Realtime broadcasts to all subscribers

2. **Admin sees message** in inbox
   - Inbox subscribed to `subscribeToAllSessions()`
   - Receives real-time INSERT event
   - Updates UI with new message

3. **Admin replies**
   - Inbox calls `globalChatService.sendMessage()`
   - Message inserted into database
   - Widget receives real-time update
   - Displays agent reply

### Key Features

✅ **Automatic Multi-Tenant Support**
- Each tenant can use the same infrastructure
- Visitor IDs ensure session isolation
- Row Level Security (RLS) enforces access control

✅ **Bidirectional Communication**
- WebSocket-based (no polling)
- Sub-100ms latency
- Automatic reconnection

✅ **Scalability**
- Supabase handles all WebSocket connections
- No need for separate WebSocket server
- Auto-scales with your usage

✅ **Persistence**
- All messages stored in PostgreSQL
- Complete chat history
- Searchable and exportable

## Database Tables

### `global_chat_sessions`
Stores chat session information
- id, visitor_name, visitor_email, visitor_id
- status (open/pending/resolved)
- assigned_to (agent ID)
- tags, visitor_metadata
- timestamps

### `global_chat_messages`
Stores individual messages
- id, session_id, content
- sender_type (visitor/agent/system)
- sender_id, sender_name
- timestamps

### `global_widget_config`
Stores widget customization
- colors, position, shape
- messages, behavior settings
- security settings

### `global_chat_notes`
Internal agent notes (not visible to visitors)

## API Usage Examples

### Create a Session
```typescript
const { session } = await globalChatService.createSession({
  visitor_name: 'John Doe',
  visitor_email: 'john@example.com',
  visitor_id: 'unique_browser_id',
  visitor_metadata: {
    ip: '192.168.1.1',
    location: 'San Francisco, US',
    browser: 'Chrome 122'
  }
});
```

### Send a Message
```typescript
const { message } = await globalChatService.sendMessage({
  session_id: session.id,
  content: 'Hello! How can I help?',
  sender_type: 'visitor',
  sender_name: 'John Doe'
});
```

### Subscribe to Real-Time Updates
```typescript
// In the widget
globalChatService.subscribeToSession(
  sessionId,
  (message) => {
    // Handle new message
    console.log('New message:', message);
  }
);

// In the admin inbox
globalChatService.subscribeToAllSessions(
  (session) => console.log('New session:', session),
  (message) => console.log('New message:', message),
  (update) => console.log('Session updated:', update)
);
```

### Clean Up
```typescript
// Unsubscribe when component unmounts
globalChatService.unsubscribeAll();
```

## Security

### Row Level Security (RLS)
- ✅ Enabled on all tables
- Anonymous users can create sessions and send messages
- Only authenticated admins can update sessions
- Visitors can only see their own data

### CORS & Domain Whitelisting
- Configure allowed domains in `global_widget_config`
- Validate origins on sensitive operations
- Optional CAPTCHA for spam prevention

## Troubleshooting

### Messages not appearing in real-time?
1. Check Supabase Dashboard → Database → Replication
2. Ensure tables are enabled for replication
3. Check browser console for WebSocket errors
4. Verify `.env` variables are correct

### "Failed to subscribe" errors?
1. Check Supabase project is not paused
2. Verify network connectivity
3. Check browser console for CORS errors
4. Try refreshing the page

### Database connection issues?
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check Supabase project status
3. Ensure RLS policies are correct
4. Check table permissions

## Next Steps

Once the schema is set up, you're ready to:
1. ✅ Update the chat widget to use real Supabase
2. ✅ Update the inbox to use real Supabase  
3. ✅ Test bidirectional communication
4. ✅ Add typing indicators
5. ✅ Add file attachment support

---

**Ready to proceed with integration!** 🚀
