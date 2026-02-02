# TalkChat Email Integration Plan: Unified Inbox Hub

This document outlines the strategy for integrating Email as a first-class citizen in TalkChat's unified inbox. This allows TalkChat to act as a central hub for all customer communication (Web, WhatsApp, Social, and Email).

## 1. Core Architecture: The "Inbound/Outbound" Bridge

TalkChat will not host an email server. Instead, we will use a developer-first email engine (e.g., **Resend** or **Postmark**) to handle the transport layer.

### A. Inbound (Receiving Emails)
1.  **TalkChat Address**: Every tenant gets a unique TalkChat email (e.g., `tenant_xyz@mail.talkchat.io`).
2.  **Custom Forwarding**: Users can forward their `support@mycompany.com` to their TalkChat address.
3.  **Webhook Loop**: When an email hits our provider, they POST a JSON payload to a new Supabase Edge Function: `omnichannel-email-webhook`.

### B. Outbound (Replying)
1.  When an agent types a reply in the dashboard, the backend triggers an API call to the email provider.
2.  **Threading**: We maintain the `Message-ID` and `In-Reply-To` headers in our database to ensure replies appear in the same thread in the customer's inbox.

---

## 2. Database Schema Upgrades (`EMAIL_CHANNEL_SYNC.sql`)

### Update 1: Extend Enums
*   Add `'email'` to any `channel_type` check constraints or enums.

### Update 2: Message Metadata
*   Ensure `global_chat_messages` has a `metadata` JSONB column (or use existing) to store:
    *   `subject`: The email subject line.
    *   `message_id`: For threading.
    *   `attachments`: Array of URLs stored in Supabase Storage.

---

## 3. The Backend Implementation (Edge Function)

We will create a new Edge Function: `supabase/functions/omnichannel-email-webhook`
*   **Logic**:
    *   Parse incoming JSON (Provider -> TalkChat).
    *   Extract `From`, `Subject`, and `HtmlBody`.
    *   Call `rpc('find_or_create_email_session')`.
    *   Insert message into `global_chat_messages`.

---

## 4. UI/UX Changes: Unified Inbox

### A. Settings Dashboard
-   **Integration Card**: "Connect Support Email".
-   **Domain Verification**: UI to show DNS records (SPF/DKIM/DMARC) for tenants who want to send from their own domain.

### B. Agent Inbox
-   **Subject Lines**: Email sessions must display the "Subject" prominently in the chat list.
-   **Email Specific UI**:
    *   View "Original Email" (Modal showing full HTML).
    *   Handle attachments as standard chat file objects.

---

## 5. Feasibility & Value
-   **Effort**: **Medium**. The hardest part is DNS handling for custom domains, which the provider (Resend/Postmark) handles via their API.
-   **Value**: **High**. This moves TalkChat from a "widget" to a "SaaS helpdesk" (Zendesk-lite).
-   **Retention**: Once a company moves their email support into TalkChat, they are 10x less likely to churn.

## 6. Next Steps Workflow
1.  [ ] **Migration**: Run `EMAIL_CHANNEL_SYNC.sql` to update database schema.
2.  [ ] **Service Layer**: Add `email` handling to `omnichannelService.ts`.
3.  [ ] **Edge Function**: Deploy the email webhook receiver.
4.  [ ] **UI**: Add the "Email Integration" tab in Settings.
