-- Add service_areas to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}';

-- Add video_url to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS video_url text;

-- Add is_published to sales (for draft/publish functionality)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Add private seller fields to sales (for non-company sales)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_name text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_email text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_phone text;

-- Make company_id optional for private seller sales
ALTER TABLE sales ALTER COLUMN company_id DROP NOT NULL;

-- Add index for finding sales by company
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);

-- Add index for finding published sales
CREATE INDEX IF NOT EXISTS idx_sales_is_published ON sales(is_published);
