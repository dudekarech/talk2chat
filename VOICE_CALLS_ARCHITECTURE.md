# Voice Calls Architecture: Serverless WebRTC with Supabase

## 1. Executive Summary
We can implementation full audio/video calling **without deploying a dedicated WebSocket server**. We will leverage our existing **Supabase Realtime** infrastructure for "Signaling" (the handshake) and standard browser **WebRTC** APIs for the actual media stream.

**Verdict**: Feasibility is **High**. No new server infrastructure is strictly *required* for the MVP, though a managed TURN service (like Twilio Network Traversal) is recommended for production reliability (approx. $0.40/GB) to bypass strict corporate firewalls.

---

## 2. The Architecture (Signal flow)

### A. Component Roles
1.  **Peer A (Visitor)**: Chromium/Safari Browser.
2.  **Peer B (Agent)**: Chromium/Safari Browser (Dashboard).
3.  **Signaling Server (Supabase)**: Passes messages like *"I want to call you"* and *"Here are my network details"* between peers. It **never touches** the actual audio/video data.
4.  **STUN Server (Free)**: Google's public server (`stun:stun.l.google.com:19302`). Tells Peer A what its public IP is.
5.  **TURN Server (Optional/Premium)**: Relays media if Peer A and Peer B cannot connect directly (P2P) due to firewalls.

### B. The Call Flow (Simplified)
1.  **Visitor** clicks "Call Support".
2.  **Frontend** creates a `WebRTC` object and captures Microphone stream.
3.  **Frontend** sends a `call_request` via Supabase Realtime (`room: chat_session_ID`).
4.  **Agent Dashboard** receives the event and rings.
5.  **Agent** accepts.
6.  Both sides exchange `ICE Candidates` (IP addresses) via Supabase.
7.  **Direct P2P Audio** connection is established. Audio flows directly from User <-> Agent.

---

## 3. Multi-Tenancy & Security Strategy

### A. Room Isolation
We already have `globalChatRealtimeService.ts` creating unique channels for each session (`chat_session_${id}`).
*   **Security**: This channel is *already* secured! Only the visitor (via local storage ID) and the Agent (via RLS Auth) can subscribe to this channel.
*   **Tenant Isolation**: Since the `chat_session` belongs to a specific `tenant_id`, there is zero risk of "Cross-Talk" between tenants.

### B. Premium Gating (The "Module")
We treat this as a "Capability".
1.  **Database**: Add `voice_enabled` (boolean) to the `tenants` table.
2.  **Check**: Before showing the "Call" button in the widget, the code checks:
    ```javascript
    if (config.features.voice_enabled) { showCallButton(); }
    ```
3.  **Enforcement**: In `globalChatRealtimeService`, rejecting `call_request` signals if the tenant lacks the entitlement.

---

## 4. Implementation Steps

### Phase 1: The Signaling Layer (Backend/Service)
Modify `GlobalChatRealtimeService.ts` to handle transient signaling messages.
*   **New Methods**:
    *   `sendSignal(sessionId, type: 'offer'|'answer'|'candidate', payload: any)`
    *   `onSignal(sessionId, callback)`

### Phase 2: The Frontend Logic (Hook)
Create a React Hook `useWebRTC` that abstracts the complex browser API.
*   **Inputs**: `sessionId`, `isAgent`.
*   **Outputs**: `localStream`, `remoteStream`, `callStatus` ('idle', 'ringing', 'connected').
*   **Logic**: Handles the `RTCPeerConnection` setup, `getUserMedia` permissions, and ICE candidate trickling.

### Phase 3: The UI Components
1.  **Visitor Widget**: A floating "Call" button (needs to handle mic permissions gracefully).
2.  **Agent Dashboard**: An "Incoming Call" modal with Accept/Decline.
3.  **In-Call UI**: Mute, Hangup, and a defined visualizer (waveform) so they know audio is working.

---

## 5. Potential Pitfalls & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Corporate Firewalls** | 10-15% of calls will fail on pure P2P. **Refinement**: Use Twilio Network Traversal (TURN). It's cheap and standard industry practice. We can enable this *only* for Premium tenants. |
| **Mic Permissions** | Users often deny permission. **UX**: Create a pre-call "Test Mic" modal before connecting. |
| **Agent Offline** | Don't let visitors call empty desks. **Logic**: Only show "Call" button if `agent_status` is 'online' in Javascript. |
| **Mobile Safari** | Auto-play audio is blocked. **Fix**: Ensure the audio stream starts strictly in response to a user 'tap' (click answer). |

## 6. Infrastructure Checklist
*   [x] **Signaling**: Supabase Realtime (Ready).
*   [x] **Auth**: Supabase Auth (Ready).
*   [x] **Database**: Postgres (Ready).
*   [ ] **TURN Credentials**: Needed if we want 100% reliability (Optional for MVP).

## 7. Strategic Recommendation
Start with **"Peer-to-Peer" (P2P)**. It costs **$0**.
If a connection fails, it just drops.
Later, you can upsell "Enterprise Reliability" which includes TURN servers (relay) for guaranteed connections in strict corporate environments.
