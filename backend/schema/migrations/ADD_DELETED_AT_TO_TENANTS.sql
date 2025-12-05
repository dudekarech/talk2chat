-- Add deleted_at column to tenants for soft deletes
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
