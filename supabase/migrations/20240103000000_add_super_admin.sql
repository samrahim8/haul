-- Add super admin flag to profiles
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Update sales policies to allow super admins full access

-- Drop existing sales policies
DROP POLICY IF EXISTS "Company owners can create sales" ON sales;
DROP POLICY IF EXISTS "Company owners can update their sales" ON sales;
DROP POLICY IF EXISTS "Company owners can delete their sales" ON sales;

-- Recreate with super admin access
CREATE POLICY "Company owners and super admins can create sales"
  ON sales FOR INSERT
  WITH CHECK (
    -- Super admin can create any sale
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    OR
    -- Company owner can create for their company
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.user_id = auth.uid()
    )
    OR
    -- Private sellers (no company_id)
    company_id IS NULL
  );

CREATE POLICY "Company owners and super admins can update sales"
  ON sales FOR UPDATE
  USING (
    -- Super admin can update any sale
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    OR
    -- Company owner can update their sales
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and super admins can delete sales"
  ON sales FOR DELETE
  USING (
    -- Super admin can delete any sale
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    OR
    -- Company owner can delete their sales
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Super admins can also manage companies
DROP POLICY IF EXISTS "Users can create their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;

CREATE POLICY "Users and super admins can create companies"
  ON companies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Users and super admins can update companies"
  ON companies FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Users and super admins can delete companies"
  ON companies FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );
