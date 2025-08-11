const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Starting simple seed...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if workflow_steps has data
    const { rows: existingSteps } = await pool.query('SELECT COUNT(*) as count FROM workflow_steps');
    
    if (existingSteps[0].count > 0) {
      console.log('✅ Workflow steps already exist, skipping');
    } else {
      // Insert workflow steps
      console.log('🌱 Inserting workflow steps...');
      
      const workflowSteps = [
        ['request_created', 'Request Created', 'submission', 10],
        ['validation_started', 'Validation Started', 'validation', 20],
        ['approver_assigned', 'Approver Assigned', 'assignment', 30],
        ['validation_passed', 'Validation Passed', 'validation', 40],
        ['pending_approval', 'Pending Approval', 'approval', 50],
        ['approved', 'Request Approved', 'approval', 60],
        ['rejected', 'Request Rejected', 'approval', 65],
        ['pdf_consolidation_start', 'PDF Consolidation Start', 'processing', 70],
        ['pdf_consolidated', 'PDF Consolidated', 'processing', 80],
        ['tiff_generation_start', 'TIFF Generation Start', 'processing', 90],
        ['tiff_generated', 'TIFF Generated', 'processing', 100],
        ['documents_stored', 'Documents Stored', 'storage', 110],
        ['notification_sent', 'Notification Sent', 'notification', 120],
        ['workflow_completed', 'Workflow Completed', 'completion', 130],
        ['workflow_failed', 'Workflow Failed', 'completion', 140]
      ];

      for (const [code, name, category, order] of workflowSteps) {
        await pool.query(`
          INSERT INTO workflow_steps (step_code, step_name, step_category, step_order, is_user_action, is_robot_action, is_system_action)
          VALUES ($1, $2, $3, $4, false, true, false)
        `, [code, name, category, order]);
      }
      
      console.log(`✅ Inserted ${workflowSteps.length} workflow steps`);
    }

    // Check if approval_requests has data
    const { rows: existingRequests } = await pool.query('SELECT COUNT(*) as count FROM approval_requests');
    
    if (existingRequests[0].count > 0) {
      console.log('✅ Sample requests already exist, skipping');
    } else {
      // Insert sample requests
      console.log('🌱 Inserting sample requests...');
      
      const sampleRequests = [
        ['test@sisuadigital.com', 'manager1@sisuadigital.com', 'pending', 'TCRS - Branch 1 - Vendor A - PO-12345 - Invoice $2,500 CAD'],
        ['test@sisuadigital.com', 'manager2@sisuadigital.com', 'pending', 'Sitech - Vendor B - PO-67890 - Invoice $1,800 CAD'],
        ['user2@sisuadigital.com', 'manager1@sisuadigital.com', 'approved', 'TCRS - Branch 2 - Vendor C - PO-54321 - Invoice $4,200 CAD'],
        ['user3@sisuadigital.com', 'manager3@sisuadigital.com', 'pending', 'Fused-Canada - Vendor D - PO-98765 - Invoice $3,100 CAD'],
        ['test@sisuadigital.com', 'manager2@sisuadigital.com', 'rejected', 'Fused-UK - Vendor E - PO-11111 - Invoice $5,600 GBP - Missing documentation']
      ];

      for (const [requester, approver, status, comments] of sampleRequests) {
        await pool.query(`
          INSERT INTO approval_requests (requester, assigned_approver, approver_status, comments)
          VALUES ($1, $2, $3, $4)
        `, [requester, approver, status, comments]);
      }
      
      console.log(`✅ Inserted ${sampleRequests.length} sample requests`);
    }

    console.log('🎉 Seed completed successfully!');
    
  } catch (error) {
    console.error('💥 Seed failed:', error);
  } finally {
    await pool.end();
  }
}

seed();