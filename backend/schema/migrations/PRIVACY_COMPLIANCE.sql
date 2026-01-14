-- ============================================================================
-- GDPR & PRIVACY COMPLIANCE FIELDS
-- ============================================================================
-- Adds fields to handle user consent and privacy disclosures in the widget.
-- ============================================================================

BEGIN;

-- 1. Add GDPR Compliance fields to global_widget_config
ALTER TABLE IF EXISTS global_widget_config 
ADD COLUMN IF NOT EXISTS gdpr_show_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gdpr_consent_text TEXT DEFAULT 'I agree to the processing of my personal data for support purposes.',
ADD COLUMN IF NOT EXISTS gdpr_show_disclaimer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gdpr_disclaimer_text TEXT DEFAULT 'We value your privacy. Your data is processed securely and only used for providing support.',
ADD COLUMN IF NOT EXISTS gdpr_disable_tracking BOOLEAN DEFAULT FALSE;

-- 2. Add Data Retention and Privacy Masking fields
ALTER TABLE IF EXISTS global_widget_config
ADD COLUMN IF NOT EXISTS retention_period_days INTEGER DEFAULT 0, -- 0 = keep forever
ADD COLUMN IF NOT EXISTS privacy_hide_ip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_mask_data BOOLEAN DEFAULT FALSE;

COMMIT;

-- ✅ SUCCESS: Privacy compliance fields added to widget configuration.
SELECT 'Privacy compliance fields added successfully.' as result;
