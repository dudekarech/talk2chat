-- ============================================================================
-- 🔥 VISITOR HEATMAP ENGINE
-- ============================================================================
-- Stores individual click events for visual analysis.
-- Uses relative percentages (0-100) for cross-device consistency.
-- ============================================================================

BEGIN;

-- 1. Create Heatmap Data Table
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
    element_tag TEXT, -- Optional: Tag of clicked element (e.g., BUTTON, A)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_visitor_clicks_tenant_id ON visitor_clicks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visitor_clicks_page_url ON visitor_clicks(page_url);
CREATE INDEX IF NOT EXISTS idx_visitor_clicks_created_at ON visitor_clicks(created_at);

-- 3. Add Heatmap Toggle to Widget Configuration
ALTER TABLE public.global_widget_config 
ADD COLUMN IF NOT EXISTS heatmap_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS heatmap_pro_tier_only BOOLEAN DEFAULT true;

-- 4. Enable RLS
ALTER TABLE public.visitor_clicks ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Tenants can view their own heatmap data"
    ON public.visitor_clicks FOR SELECT
    USING (tenant_id IS NOT DISTINCT FROM (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can insert click data"
    ON public.visitor_clicks FOR INSERT
    WITH CHECK (true); -- Publicly writeable for visitors (guarded by tenant_id)

COMMIT;

-- ✅ SUCCESS
SELECT 'Heatmap infrastructure ready.' as result;
