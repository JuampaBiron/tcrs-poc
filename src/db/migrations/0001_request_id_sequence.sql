-- Create a sequence for request IDs to ensure atomicity and uniqueness
CREATE SEQUENCE IF NOT EXISTS request_id_sequence
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999999999999  -- 12-digit max
  CACHE 10;              -- Cache 10 numbers for better performance

-- Grant usage on sequence to ensure proper access
GRANT USAGE, SELECT ON SEQUENCE request_id_sequence TO PUBLIC;

-- If you want to start from a specific number (e.g., if you have existing data)
-- ALTER SEQUENCE request_id_sequence RESTART WITH 1;