// Archivo: test-insert.js
// Prueba simple para identificar dónde falla el INSERT

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { Pool } = require('@neondatabase/serverless');

async function testInserts() {
  console.log('🧪 Testing specific INSERT operations...\n');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('1️⃣  Testing workflow_steps INSERT...');
    
    // Test 1: Insert ONE workflow step (minimal data)
    try {
      const result = await pool.query(`
        INSERT INTO workflow_steps (step_code, step_name, step_category, step_order)
        VALUES ($1, $2, $3, $4)
        RETURNING step_id, step_code, step_name
      `, ['test_step', 'Test Step', 'testing', 999]);
      
      console.log('✅ workflow_steps INSERT successful:', result.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM workflow_steps WHERE step_code = $1', ['test_step']);
      console.log('🧹 Test data cleaned up');
      
    } catch (error) {
      console.error('❌ workflow_steps INSERT failed:', error.message);
      console.log('💡 This tells us the exact problem with workflow_steps');
    }

    console.log('\n2️⃣  Testing approval_requests INSERT...');
    
    // Test 2: Insert ONE approval request (minimal data)  
    try {
      const result = await pool.query(`
        INSERT INTO approval_requests (requester, assigned_approver, approver_status, comments)
        VALUES ($1, $2, $3, $4)
        RETURNING request_id, requester, approver_status
      `, ['test@test.com', 'manager@test.com', 'pending', 'Test request']);
      
      console.log('✅ approval_requests INSERT successful:', result.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM approval_requests WHERE requester = $1', ['test@test.com']);
      console.log('🧹 Test data cleaned up');
      
    } catch (error) {
      console.error('❌ approval_requests INSERT failed:', error.message);
      console.log('💡 This tells us the exact problem with approval_requests');
      
      // Try with explicit ID to see if createId() is the problem
      try {
        console.log('🔄 Trying with explicit UUID...');
        const result2 = await pool.query(`
          INSERT INTO approval_requests (request_id, requester, assigned_approver, approver_status, comments)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING request_id, requester, approver_status
        `, ['test-uuid-123', 'test2@test.com', 'manager2@test.com', 'pending', 'Test request 2']);
        
        console.log('✅ approval_requests INSERT with explicit ID successful:', result2.rows[0]);
        
        await pool.query('DELETE FROM approval_requests WHERE request_id = $1', ['test-uuid-123']);
        console.log('🧹 Test data cleaned up');
        
      } catch (error2) {
        console.error('❌ approval_requests INSERT with explicit ID also failed:', error2.message);
      }
    }

    console.log('\n3️⃣  Testing bulk INSERT (like in seed)...');
    
    // Test 3: Try bulk insert similar to seed
    try {
      const bulkSteps = [
        ['request_created', 'Request Created', 'submission', 10],
        ['pending_approval', 'Pending Approval', 'approval', 50]
      ];
      
      for (const [code, name, category, order] of bulkSteps) {
        await pool.query(`
          INSERT INTO workflow_steps (step_code, step_name, step_category, step_order, is_robot_action)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (step_code) DO NOTHING
        `, [code, name, category, order, true]);
      }
      
      console.log('✅ Bulk INSERT successful');
      
      // Check how many were inserted
      const count = await pool.query('SELECT COUNT(*) as count FROM workflow_steps WHERE step_code IN ($1, $2)', ['request_created', 'pending_approval']);
      console.log(`📊 ${count.rows[0].count} steps in database`);
      
    } catch (error) {
      console.error('❌ Bulk INSERT failed:', error.message);
    }

    console.log('\n4️⃣  Checking table structure...');
    
    // Test 4: Verify table structure
    try {
      const workflowStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_steps' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 workflow_steps structure:');
      workflowStructure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
      });
      
      const requestsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'approval_requests' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 approval_requests structure:');
      requestsStructure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
      });
      
    } catch (error) {
      console.error('❌ Structure check failed:', error.message);
    }

    console.log('\n✅ Test completed! Check the results above to identify the exact issue.');
    
  } catch (error) {
    console.error('💥 General test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testInserts();