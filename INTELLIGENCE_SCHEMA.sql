-- ============================================================================
-- 🔥 VISITOR INTELLIGENCE & CART TRACKING
-- ============================================================================
-- Consolidation of Heatmap and Shopify Cart tracking infrastructure.
-- This script is idempotent and safe to re-run.
-- ============================================================================

BEGIN;

-- 1. HEATMAP DATA
CREATE TABLE IF NOT EXISTS public.visitor_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.global_chat_sessions(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    x_pct FLOAT NOT NULL, -- Horizontal click position (0 to 100)
    y_pct FLOAT NOT NULL, -- Vertical click position (0 to 100)
    viewport_width INT NOT NULL,
    viewport_height INT NOT NULL,
    element_id TEXT, -- Optional: ID of clicked element
    element_tag TEXT, -- Optional: Tag of clicked element
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SHOPIFY CART EVENTS (The Logs)
CREATE TABLE IF NOT EXISTS public.shopify_cart_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id UUID REFERENCES public.global_chat_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'cart_add', 'cart_remove', 'cart_view', 'checkout_start', 'purchase'
    product_id TEXT,
    product_name TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    cart_total DECIMAL(10,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ABANDONED CARTS (The State)
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id UUID REFERENCES public.global_chat_sessions(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_name TEXT,
    checkout_url TEXT,
    products JSONB,
    cart_total DECIMAL(10,2) DEFAULT 0.0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active', -- 'active', 'abandoned', 'recovered', 'converted'
    is_abandoned BOOLEAN DEFAULT false,
    abandoned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_clicks_tenant ON public.visitor_clicks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clicks_url ON public.visitor_clicks(page_url);
CREATE INDEX IF NOT EXISTS idx_cart_events_tenant ON public.shopify_cart_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_tenant ON public.abandoned_carts(tenant_id, status);

-- 5. RLS ENABLEMENT
ALTER TABLE public.visitor_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_cart_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES (Tenant Isolation)
-- Ensure policies only created if they don't exist
DO $$ 
BEGIN
    -- Visitor Clicks
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_clicks' AND policyname = 'Tenants view own clicks') THEN
        CREATE POLICY "Tenants view own clicks" ON public.visitor_clicks FOR SELECT
        USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()) OR (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'super_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_clicks' AND policyname = 'Public insert clicks') THEN
        CREATE POLICY "Public insert clicks" ON public.visitor_clicks FOR INSERT WITH CHECK (true);
    END IF;

    -- Shopify Cart Events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopify_cart_events' AND policyname = 'Tenants view own cart events') THEN
        CREATE POLICY "Tenants view own cart events" ON public.shopify_cart_events FOR SELECT
        USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()) OR (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'super_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopify_cart_events' AND policyname = 'Public insert cart events') THEN
        CREATE POLICY "Public insert cart events" ON public.shopify_cart_events FOR INSERT WITH CHECK (true);
    END IF;

    -- Abandoned Carts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'abandoned_carts' AND policyname = 'Tenants view own abandoned carts') THEN
        CREATE POLICY "Tenants view own abandoned carts" ON public.abandoned_carts FOR SELECT
        USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()) OR (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'super_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'abandoned_carts' AND policyname = 'Public maintain carts') THEN
        CREATE POLICY "Public maintain carts" ON public.abandoned_carts FOR ALL USING (true);
    END IF;
END $$;

COMMIT;

SELECT 'Intelligence infrastructure ready.' as result;
