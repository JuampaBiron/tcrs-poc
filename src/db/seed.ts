// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, workflowSteps, approvalRequests, NewWorkflowStep, NewApprovalRequest } from "./index"
import { REQUEST_STATUS } from "@/constants"
//console.log("DATABASE_URL:", process.env.DATABASE_URL);
// Datos iniciales para WorkflowSteps basados en dbdiagram.txt
const initialWorkflowSteps: NewWorkflowStep[] = [
  {
    stepCode: "request_created",
    stepName: "Request Created",
    stepDescription: "Initial request submitted by user",
    stepCategory: "submission",
    stepOrder: 10,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: false,
    requiresApproval: false
  },
  {
    stepCode: "validation_started",
    stepName: "Validation Started",
    stepDescription: "System begins validation of request data",
    stepCategory: "validation",
    stepOrder: 20,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 500,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "approver_assigned",
    stepName: "Approver Assigned",
    stepDescription: "System assigns appropriate approver based on rules",
    stepCategory: "assignment",
    stepOrder: 30,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 200,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "validation_passed",
    stepName: "Validation Passed",
    stepDescription: "All validation checks completed successfully",
    stepCategory: "validation",
    stepOrder: 40,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "pending_approval",
    stepName: "Pending Approval",
    stepDescription: "Request waiting for approver action",
    stepCategory: "approval",
    stepOrder: 50,
    isUserAction: false,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: false,
    requiresApproval: true
  },
  {
    stepCode: "approved",
    stepName: "Request Approved",
    stepDescription: "Approver has approved the request",
    stepCategory: "approval",
    stepOrder: 60,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: false,
    requiresApproval: false
  },
  {
    stepCode: "rejected",
    stepName: "Request Rejected",
    stepDescription: "Approver has rejected the request",
    stepCategory: "approval",
    stepOrder: 65,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: false,
    requiresApproval: false
  },
  {
    stepCode: "pdf_consolidation_start",
    stepName: "PDF Consolidation Start",
    stepDescription: "Begin consolidating PDF documents",
    stepCategory: "processing",
    stepOrder: 70,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "pdf_consolidated",
    stepName: "PDF Consolidated",
    stepDescription: "All PDF documents have been consolidated",
    stepCategory: "processing",
    stepOrder: 80,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 3000,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "tiff_generation_start",
    stepName: "TIFF Generation Start",
    stepDescription: "Begin converting PDF to TIFF format",
    stepCategory: "processing",
    stepOrder: 90,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 0,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "tiff_generated",
    stepName: "TIFF Generated",
    stepDescription: "PDF successfully converted to TIFF format",
    stepCategory: "processing",
    stepOrder: 100,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 45000,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "documents_stored",
    stepName: "Documents Stored",
    stepDescription: "All documents stored in final location",
    stepCategory: "storage",
    stepOrder: 110,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 2000,
    isCritical: true,
    requiresApproval: false
  },
  {
    stepCode: "notification_sent",
    stepName: "Notification Sent",
    stepDescription: "Completion notification sent to stakeholders",
    stepCategory: "notification",
    stepOrder: 120,
    isUserAction: false,
    isRobotAction: true,
    isSystemAction: false,
    expectedDurationMs: 500,
    isCritical: false,
    requiresApproval: false
  },
  {
    stepCode: "workflow_completed",
    stepName: "Workflow Completed",
    stepDescription: "Entire workflow process completed successfully",
    stepCategory: "completion",
    stepOrder: 130,
    isUserAction: false,
    isRobotAction: false,
    isSystemAction: true,
    expectedDurationMs: 0,
    isCritical: false,
    requiresApproval: false
  },
  {
    stepCode: "workflow_failed",
    stepName: "Workflow Failed",
    stepDescription: "Workflow process failed due to error",
    stepCategory: "completion",
    stepOrder: 140,
    isUserAction: false,
    isRobotAction: false,
    isSystemAction: true,
    expectedDurationMs: 0,
    isCritical: true,
    requiresApproval: false
  }
]

// Sample approval requests for testing
const sampleRequests: NewApprovalRequest[] = [
  {
    requester: "test@sisuadigital.com",
    assignedApprover: "manager1@sisuadigital.com", 
    approverStatus: REQUEST_STATUS.PENDING,
    comments: "TCRS - Branch 1 - Vendor A - PO-12345 - Invoice $2,500 CAD"
  },
  {
    requester: "test@sisuadigital.com",
    assignedApprover: "manager2@sisuadigital.com",
    approverStatus: REQUEST_STATUS.PENDING, 
    comments: "Sitech - Vendor B - PO-67890 - Invoice $1,800 CAD"
  },
  {
    requester: "user2@sisuadigital.com",
    assignedApprover: "manager1@sisuadigital.com",
    approverStatus: REQUEST_STATUS.APPROVED,
    comments: "TCRS - Branch 2 - Vendor C - PO-54321 - Invoice $4,200 CAD",
    approvedDate: new Date()
  },
  {
    requester: "user3@sisuadigital.com", 
    assignedApprover: "manager3@sisuadigital.com",
    approverStatus: REQUEST_STATUS.PENDING,
    comments: "Fused-Canada - Vendor D - PO-98765 - Invoice $3,100 CAD"
  },
  {
    requester: "test@sisuadigital.com",
    assignedApprover: "manager2@sisuadigital.com",
    approverStatus: REQUEST_STATUS.REJECTED,
    comments: "Fused-UK - Vendor E - PO-11111 - Invoice $5,600 GBP - Missing documentation"
  }
]

export async function seedWorkflowSteps() {
  console.log("🌱 Seeding workflow steps...")
  
  try {
    // Check if steps already exist
    const existingSteps = await db.select().from(workflowSteps).limit(1)
    
    if (existingSteps.length > 0) {
      console.log("✅ Workflow steps already exist, skipping seed")
      return
    }

    // Insert initial workflow steps
    const result = await db.insert(workflowSteps).values(initialWorkflowSteps).returning()
    
    console.log(`✅ Successfully seeded ${result.length} workflow steps`)
    console.log("📋 Step categories:", [...new Set(result.map(s => s.stepCategory))])
    
  } catch (error) {
    console.error("❌ Error seeding workflow steps:", error)
    throw error
  }
}

export async function seedSampleRequests() {
  console.log("🌱 Seeding sample approval requests...")
  
  try {
    // Check if requests already exist
    const existingRequests = await db.select().from(approvalRequests).limit(1)
    
    if (existingRequests.length > 0) {
      console.log("✅ Sample requests already exist, skipping seed")
      return
    }

    // Insert sample requests
    const result = await db.insert(approvalRequests).values(sampleRequests).returning()
    
    console.log(`✅ Successfully seeded ${result.length} sample requests`)
    console.log("📊 Request statuses:", result.map(r => `${r.approverStatus}: ${r.comments?.substring(0, 50)}...`))
    
  } catch (error) {
    console.error("❌ Error seeding sample requests:", error)
    throw error
  }
}

export async function seedDatabase() {
  console.log("🌱 Starting database seed...")
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!")
    console.log("💡 Make sure .env.local exists with DATABASE_URL=...")
    process.exit(1)
  }
  
  await seedWorkflowSteps()
  await seedSampleRequests()
  
  console.log("✅ Database seeding completed!")
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seed completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Seed failed:", error)
      process.exit(1)
    })
}