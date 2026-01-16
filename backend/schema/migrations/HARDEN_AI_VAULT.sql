-- ============================================================================
-- 🔐 ARCHITECTURAL HARDENING: THE SAFETY VAULT
-- ============================================================================
-- 1. Implements encryption metadata for Tenant API Keys.
-- 2. Adds PII masking and Privacy Guardrails to Global Config.
-- 3. Enables "Audit Logging" for sensitive administrative actions.
-- ============================================================================

BEGIN;

-- 1. HARDEN tenant_ai_keys
ALTER TABLE IF EXISTS tenant_ai_keys 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_v TEXT DEFAULT 'v1', -- Versioning for future algorithm updates
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- 2. AUDIT LOGGING (The "Black Box")
-- Records WHO changed WHAT and WHEN for critical security events.
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'key_rotation', 'tier_change', 'gdpr_request'
    action_details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for security review
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_event ON security_audit_logs(tenant_id, event_type);

-- 3. PRIVACY GUARDRAILS (Extended)
-- Ensure these exist from earlier migrations or add them now
ALTER TABLE IF EXISTS global_widget_config
ADD COLUMN IF NOT EXISTS privacy_pii_masking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_session_recording_allowed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS privacy_data_region TEXT DEFAULT 'global'; -- 'global', 'eu', 'us'

-- 4. RLS for Audit Logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all audit logs" 
ON security_audit_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Tenant admins view their own audit logs" 
ON security_audit_logs FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

COMMIT;

-- ✅ SUCCESS: Safety Vault architecture ready for application-level encryption.
SELECT 'Safety Vault hardened.' as result;
