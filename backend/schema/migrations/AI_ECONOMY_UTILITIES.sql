-- ============================================================================
-- 🚀 AI ECONOMY UTILITIES
-- ============================================================================
-- This script adds helper functions for the AI Economy system.
-- ============================================================================

BEGIN;

/**
 * Deduct credits from a tenant's balance.
 * Returns the new balance or errors if insufficient credits.
 */
CREATE OR REPLACE FUNCTION deduct_tenant_credits(
    p_tenant_id UUID,
    p_amount DECIMAL(12, 4)
) RETURNS DECIMAL(12, 4) AS $$
DECLARE
    v_current_balance DECIMAL(12, 4);
BEGIN
    -- Get current balance with lock
    SELECT ai_credits_balance INTO v_current_balance
    FROM tenants
    WHERE id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found: %', p_tenant_id;
    END IF;

    -- Optional: Allow slightly negative balance or enforce strictly positive
    -- For now, we enforce strictly positive because this is a "managed" cost.
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient AI credits. Balance: %, Required: %', v_current_balance, p_amount;
    END IF;

    -- Update balance
    UPDATE tenants
    SET ai_credits_balance = ai_credits_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_tenant_id
    RETURNING ai_credits_balance INTO v_current_balance;

    RETURN v_current_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Add credits to a tenant's balance (Admin only)
 */
CREATE OR REPLACE FUNCTION add_tenant_credits(
    p_tenant_id UUID,
    p_amount DECIMAL(12, 4)
) RETURNS DECIMAL(12, 4) AS $$
DECLARE
    v_new_balance DECIMAL(12, 4);
BEGIN
    UPDATE tenants
    SET ai_credits_balance = ai_credits_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_tenant_id
    RETURNING ai_credits_balance INTO v_new_balance;

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ✅ SUCCESS: AI Economy Utilities ready.
SELECT 'Economy utilities installed.' as result;
