-- Add audit fields to dictionary tables
-- Migration: add-dictionary-audit-fields.sql

-- Add audit fields to approver_list table
ALTER TABLE approver_list 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_date TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS modified_date TIMESTAMP;

-- Add audit fields to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
-- Note: accounts table already has created_date and modified_date

-- Add audit fields to facility table  
ALTER TABLE facility 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
-- Note: facility table already has created_date and modified_date

-- Update existing records to set initial audit values (optional)
-- This sets current timestamp for existing records without created_by
UPDATE approver_list 
SET created_date = NOW(), modified_date = NOW() 
WHERE created_date IS NULL;

UPDATE accounts 
SET created_date = NOW(), modified_date = NOW() 
WHERE created_date IS NULL;

UPDATE facility 
SET created_date = NOW(), modified_date = NOW() 
WHERE created_date IS NULL;

-- Add indexes for better performance on audit queries
CREATE INDEX IF NOT EXISTS idx_approver_list_created_by ON approver_list(created_by);
CREATE INDEX IF NOT EXISTS idx_approver_list_updated_by ON approver_list(updated_by);
CREATE INDEX IF NOT EXISTS idx_approver_list_modified_date ON approver_list(modified_date);

CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_by ON accounts(updated_by);
CREATE INDEX IF NOT EXISTS idx_accounts_modified_date ON accounts(modified_date);

CREATE INDEX IF NOT EXISTS idx_facility_created_by ON facility(created_by);
CREATE INDEX IF NOT EXISTS idx_facility_updated_by ON facility(updated_by);
CREATE INDEX IF NOT EXISTS idx_facility_modified_date ON facility(modified_date);