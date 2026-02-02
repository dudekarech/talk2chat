# TalkChat Niche Feature Strategy: Voice & AI Expansion

## 1. The "Voice-First" Revolution (Feasibility: High)
Moving beyond text into voice interaction is the single biggest differentiator for 2026. Most widgets are text-only.

### A. "Founder Clone" AI Agent (Highest Niche Value) 💎
Instead of a generic robot voice, the AI speaks with the cloned voice of the store owner.
*   **Concept**: Users click a "Talk to [Name]" button. They speak, and the AI replies instantly in the founder's voice.
*   **Why it's Niche**: It creates an "SMB" (Small Business) emotional connection that Amazon cannot replicate.
*   **Tech Stack**:
    *   **Input**: Browser Microphone API (MediaRecorder).
    *   **Processing**: OpenAI Realtime API (Websocket) for sub-500ms latency.
    *   **Voice**: ElevenLabs Instant Voice Cloning (API).
*   **Feasibility**: **Medium**. Requires efficient websocket handling in Edge Functions to bridge the user -> OpenAI -> ElevenLabs loop.

### B. "Voice-to-Cart" Shopping Assistant 🛒
Why click filters when you can just say what you want?
*   **Concept**: User holds the mic button and says: *"Show me all the black sneakers under $100."*
*   **Action**: The widget *doesn't* just reply with text; it **injects** user-specific CSS/JS to filter the actual Shopify page results instantly.
*   **Tech Stack**:
    *   Standard Speech-to-Text (Whisper API).
    *   Function Calling (AI extracts: `{ color: 'black', category: 'sneakers', price_max: 100 }`).
    *   Code Injection: `window.talkChat.filterProducts(...)`.
*   **Feasibility**: **High**. Logic is straightforward; value is immense.

### C. WebRTC Audio/Video Calls (No Phone Function Needed) 📞
Direct browser-to-browser calling without phone numbers.
*   **Concept**: An "Escalate to Call" button. If an agent feels text is too slow, they request a call. The widget rings.
*   **Implementation**:
    *   **Signaling**: We already have **Supabase Realtime**. We use it to exchange "SDP Offers" and "ICE Candidates" (handshaking).
    *   **Connection**: Peer-to-Peer (Free) for 1:1 calls.
*   **Niche Twist**: **"Co-Browsing"**. When on a call, transmit the user's *mouse position* and *scroll depth* to the agent. The agent can "draw" on the user's screen to point at products.

---

## 2. "Invisible" AI Features (Feasibility: Very High)
Features that work passively without user input.

### A. The "Hesitation" Breaker
*   **Concept**: The AI monitors mouse movement.
    *   If a user **rapidly switches tabs** (comparison shopping) -> Trigger: *"We price match! Send us the link."*
    *   If a user **hovers 'Add to Cart' but stops** -> Trigger: *"Unsure about the size? Here's a size chart."*
*   **Feasibility**: **Very High**. Pure JavaScript event listeners in `GlobalChatWidget.tsx` sending signals to the backend.

### B. Sentiment-Based Routing
*   **Concept**: Analyze the user's typing speed and use of backspace (deletion).
    *   Lots of deletions + fast typing = **Frustrated**.
    *   Slow typing = **Confused**.
*   **Action**: Route "Frustrated" users immediately to a human; let AI handle "Confused" users (education).

---

## 3. Implementation Roadmap (Ranked by ROI)

| Feature | Dev Effort | Niche/Wow Factor | Tech Requirement |
| :--- | :--- | :--- | :--- |
| **1. Async Voice Notes (WhatsApp Style)** | low | Medium | File Uploads (Existing) |
| **2. Voice-to-Cart (Command)** | Medium | High | OpenAI + Site Integration |
| **3. Co-Browsing (Live Cursor)** | Medium | Very High | Supabase Realtime (Existing) |
| **4. Founder Clone (Realtime AI)** | High | **Extreme** | OpenAI Realtime API |
| **5. Live Video Calls (WebRTC)** | High | Medium | TURN Servers (Cost $) |

## 4. Recommended First Step: "Async Voice Notes"
Before building full calling (which requires both parties to be online), build **Voice Notes**.
1.  Add a `Mic` icon to the input area.
2.  On hold, record audio.
3.  On release, upload to Supabase Storage -> Bucket `chat-attachments`.
4.  Display an `<audio>` player in the chat.
5.  **Bonus**: Auto-transcribe it using Whisper so the agent can *read* the tech support issue instead of listening.

## 5. Feasibility Check: WebRTC + Supabase
Supabase is an *excellent* choice for WebRTC signaling.
*   **Channel**: `room:tracking` (Already exists).
*   **Event**: `signal`.
*   **Payload**: `{ type: 'offer' | 'answer' | 'candidate', data: ... }`.

We can add this to `services/globalChatRealtimeService.ts` without any new infrastructure.
