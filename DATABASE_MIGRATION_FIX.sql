-- Database Migration to Fix Tenant Relationships
-- Run this SQL in your Supabase SQL editor to fix the CloudScan table

-- Step 1: Add the new tenant_id column to cloud_scan table
ALTER TABLE cloud_scan 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: Update existing records to use proper tenant_id instead of random UUIDs
-- Note: This assumes you want to assign existing scans to the first available tenant
-- You may need to adjust this based on your specific requirements
UPDATE cloud_scan 
SET tenant_id = created_by 
WHERE tenant_id IS NULL AND created_by IS NOT NULL;

-- Step 3: For any scans with random UUIDs that don't match real tenants,
-- assign them to the first available tenant (you may want to delete these instead)
UPDATE cloud_scan 
SET tenant_id = (SELECT id FROM tenant LIMIT 1)
WHERE tenant_id IS NULL 
   OR tenant_id NOT IN (SELECT id FROM tenant);

-- Step 4: Add foreign key constraint to ensure data integrity
ALTER TABLE cloud_scan 
ADD CONSTRAINT fk_cloud_scan_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenant(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Make tenant_id NOT NULL after all data is migrated
ALTER TABLE cloud_scan 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 6: Remove the old created_by column (optional - you can keep it if needed)
-- ALTER TABLE cloud_scan DROP COLUMN IF EXISTS created_by;

-- Step 7: Update service_scan_result to ensure proper tenant relationships
-- Remove default UUIDs and ensure all records have proper tenant_id
UPDATE service_scan_result 
SET tenant_id = (
    SELECT cs.tenant_id 
    FROM cloud_scan cs 
    WHERE cs.id = service_scan_result.scan_id
)
WHERE tenant_id IS NULL 
   OR tenant_id NOT IN (SELECT id FROM tenant);

-- Step 8: Ensure service_scan_result foreign keys are properly set
ALTER TABLE service_scan_result 
ALTER COLUMN scan_id SET NOT NULL;

ALTER TABLE service_scan_result 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cloud_scan_tenant_id ON cloud_scan(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_scan_status ON cloud_scan(status);
CREATE INDEX IF NOT EXISTS idx_cloud_scan_created_at ON cloud_scan(created_at);

CREATE INDEX IF NOT EXISTS idx_service_scan_result_tenant_id ON service_scan_result(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_scan_result_scan_id ON service_scan_result(scan_id);

-- Step 10: Clean up any orphaned records (optional)
-- Delete service scan results that don't have corresponding cloud scans
DELETE FROM service_scan_result 
WHERE scan_id NOT IN (SELECT id FROM cloud_scan);

-- Verification queries to check the migration
-- Run these to verify everything is working correctly:

-- Check that all cloud_scan records have valid tenant_id
SELECT COUNT(*) as total_scans,
       COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as scans_with_tenant,
       COUNT(CASE WHEN tenant_id IN (SELECT id FROM tenant) THEN 1 END) as scans_with_valid_tenant
FROM cloud_scan;

-- Check that all service_scan_result records have valid references
SELECT COUNT(*) as total_results,
       COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as results_with_tenant,
       COUNT(CASE WHEN scan_id IS NOT NULL THEN 1 END) as results_with_scan
FROM service_scan_result;

-- Show tenant distribution
SELECT t.id as tenant_id, 
       COALESCE(t.name->>'company', 'Unknown') as tenant_name,
       COUNT(cs.id) as scan_count
FROM tenant t
LEFT JOIN cloud_scan cs ON cs.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY scan_count DESC; 