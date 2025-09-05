// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { 
  db, 
  workflowSteps, 
  workflowHistory,
  approvalRequests, 
  invoiceData,
  accountsMaster, 
  facility, 
  approverList,
  glCodingUploadedData,
  glCodingData,
  tiffFileGeneration,
  NewWorkflowStep, 
  NewApprovalRequest, 
  NewAccountsMaster, 
  NewFacility, 
  NewApproverList 
} from "./index"
import { REQUEST_STATUS } from "@/constants"
import { readFileSync } from 'fs'
import { join } from 'path'

// ===== WORKFLOW STEPS DATA (HARDCODED) =====
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



// ===== CSV PARSING UTILITIES =====
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const record: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })
    
    return record
  })
}

function readCSVFile(filename: string): Record<string, string>[] {
  try {
    const csvPath = join(process.cwd(), 'src', 'db', filename)
    const csvContent = readFileSync(csvPath, 'utf-8')
    return parseCSV(csvContent)
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error)
    return []
  }
}

// ===== CLEAR ALL TABLES FUNCTION =====
export async function clearAllTables() {
  console.log("🧹 Clearing all tables...")
  
  try {
    // Delete in order to respect foreign key constraints
    // Wrap each delete in try-catch to handle missing tables gracefully
    
    try {
      console.log("   • Clearing workflow history...")
      await db.delete(workflowHistory)
    } catch (error) {
      console.log("   ⚠️  workflow_history table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing GL coding data...")
      await db.delete(glCodingData)
    } catch (error) {
      console.log("   ⚠️  gl_coding_data table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing GL coding uploaded data...")
      await db.delete(glCodingUploadedData)
    } catch (error) {
      console.log("   ⚠️  gl_coding_uploaded_data table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing TIFF file generation...")
      await db.delete(tiffFileGeneration)
    } catch (error) {
      console.log("   ⚠️  tiff_file_generation table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing invoice data...")
      await db.delete(invoiceData)
    } catch (error) {
      console.log("   ⚠️  invoice_data table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing approval requests...")
      await db.delete(approvalRequests)
    } catch (error) {
      console.log("   ⚠️  approval_requests table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing approver list...")
      await db.delete(approverList)
    } catch (error) {
      console.log("   ⚠️  approver_list table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing facility master...")
      await db.delete(facility)
    } catch (error) {
      console.log("   ⚠️  facility table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing accounts master...")
      await db.delete(accountsMaster)
    } catch (error) {
      console.log("   ⚠️  accounts table doesn't exist, skipping...")
    }
    
    try {
      console.log("   • Clearing workflow steps...")
      await db.delete(workflowSteps)
    } catch (error) {
      console.log("   ⚠️  workflow_steps table doesn't exist, skipping...")
    }
    
    console.log("✅ Table clearing completed (some tables may not have existed)")
    
  } catch (error) {
    console.error("❌ Error during table clearing process:", error)
    throw error
  }
}

// ===== SEEDING FUNCTIONS =====

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

export async function seedAccountsMaster() {
  console.log("🌱 Seeding accounts master data...")
  
  try {
    // Check if accounts already exist
    const existingAccounts = await db.select().from(accountsMaster).limit(1)
    
    if (existingAccounts.length > 0) {
      console.log("✅ Accounts master data already exists, skipping seed")
      return
    }

    // Read and parse CSV
    const csvData = readCSVFile('AccountsMaster.csv')
    
    if (csvData.length === 0) {
      console.log("⚠️  No AccountsMaster.csv data found, skipping")
      return
    }

    // Transform CSV data to database format
    const accountsData: NewAccountsMaster[] = csvData.map(row => ({
      accountCode: row.AccountCode,
      accountDescription: row.AccountDescription,
      accountCombined: row.AccountCombined
    }))

    // Insert accounts in batches
    const batchSize = 100
    let totalInserted = 0
    
    for (let i = 0; i < accountsData.length; i += batchSize) {
      const batch = accountsData.slice(i, i + batchSize)
      await db.insert(accountsMaster).values(batch)
      totalInserted += batch.length
      console.log(`📊 Inserted ${totalInserted}/${accountsData.length} accounts...`)
    }
    
    console.log(`✅ Successfully seeded ${totalInserted} accounts`)
    
  } catch (error) {
    console.error("❌ Error seeding accounts master:", error)
    throw error
  }
}

export async function seedFacilityMaster() {
  console.log("🌱 Seeding facility master data...")
  
  try {
    // Check if facilities already exist
    const existingFacilities = await db.select().from(facility).limit(1)
    
    if (existingFacilities.length > 0) {
      console.log("✅ Facility master data already exists, skipping seed")
      return
    }

    // Read and parse CSV
    const csvData = readCSVFile('FacilityMaster.csv')
    
    if (csvData.length === 0) {
      console.log("⚠️  No FacilityMaster.csv data found, skipping")
      return
    }

    // Transform CSV data to database format
    const facilityData: NewFacility[] = csvData.map(row => ({
      facilityCode: row.FacilityCode,
      facilityDescription: row.FacilityDescription,
      facilityCombined: row.FacilityCombined
    }))

    // Insert facilities
    const result = await db.insert(facility).values(facilityData).returning()
    
    console.log(`✅ Successfully seeded ${result.length} facilities`)
    console.log("🏢 Sample facilities:", result.slice(0, 3).map(f => f.facilityCombined))
    
  } catch (error) {
    console.error("❌ Error seeding facility master:", error)
    throw error
  }
}

export async function seedApproverList() {
  console.log("🌱 Seeding approver list...")
  
  try {
    // Check if approvers already exist
    const existingApprovers = await db.select().from(approverList).limit(1)
    
    if (existingApprovers.length > 0) {
      console.log("✅ Approver list already exists, skipping seed")
      return
    }

    // Read and parse CSV
    const csvData = readCSVFile('ApproversMaster.csv')
    
    if (csvData.length === 0) {
      console.log("⚠️  No ApproversMaster.csv data found, skipping")
      return
    }

    // Transform CSV data to database format
    const approverData: NewApproverList[] = csvData.map(row => ({
      erp: row.ERP,
      branch: row.Branch,
      authorizedAmount: row.AuthorizedAmount || null, // Keep as string for decimal type
      authorizedApprover: row.AuthorizedApprover,
      emailAddress: row.EmailAddress,
      backUpApprover: row.BackUpApprover || null,
      backUpEmailAddress: row.BackUpEmailAddress || null
    }))

    // Insert approvers
    const result = await db.insert(approverList).values(approverData).returning()
    
    console.log(`✅ Successfully seeded ${result.length} approvers`)
    console.log("👥 Sample approvers:", result.slice(0, 3).map(a => `${a.authorizedApprover} (${a.erp})`))
    
  } catch (error) {
    console.error("❌ Error seeding approver list:", error)
    throw error
  }
}


// ===== COMPLETE RESET FUNCTION =====
export async function resetDatabase() {
  console.log("🔄 Starting complete database reset...")
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!")
    console.log("💡 Make sure .env.local exists with DATABASE_URL=...")
    process.exit(1)
  }
  
  try {
    // 1. Clear all tables
    await clearAllTables()
    
    // 2. Seed technical data
    console.log("\n📋 Seeding technical data...")
    await seedWorkflowSteps()
    
    // 3. Seed master data from CSVs
    console.log("\n📚 Seeding master data from CSVs...")
    await seedAccountsMaster()
    await seedFacilityMaster()
    await seedApproverList()
    
    console.log("\n✅ Database reset and seeding completed successfully!")
    console.log("🎯 Summary:")
    console.log("   • 15 workflow steps (technical)")
    console.log("   • Accounts master data (from CSV)")
    console.log("   • Facility master data (from CSV)")
    console.log("   • Approver list (from CSV)")
    console.log("   • 5 sample approval requests")
    
  } catch (error) {
    console.error("💥 Database reset failed:", error)
    throw error
  }
}

// ===== REGULAR SEED FUNCTION (PRESERVES EXISTING DATA) =====
export async function seedDatabase() {
  console.log("🌱 Starting comprehensive database seed...")
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!")
    console.log("💡 Make sure .env.local exists with DATABASE_URL=...")
    process.exit(1)
  }
  
  try {
    // Seed in order (technical data first, then master data, then transactional)
    console.log("📋 Seeding technical data...")
    await seedWorkflowSteps()
    
    console.log("\n📚 Seeding master data from CSVs...")
    await seedAccountsMaster()
    await seedFacilityMaster()
    await seedApproverList()
    
    console.log("\n✅ Database seeding completed successfully!")
    console.log("🎯 Summary:")
    console.log("   • 15 workflow steps (technical)")
    console.log("   • Accounts master data (from CSV)")
    console.log("   • Facility master data (from CSV)")
    console.log("   • Approver list (from CSV)")
    console.log("   • 5 sample approval requests")
    
  } catch (error) {
    console.error("💥 Database seeding failed:", error)
    throw error
  }
}

// ===== MAIN EXECUTION =====
// Run seed if called directly
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'reset') {
    resetDatabase()
      .then(() => {
        console.log("🎉 Database reset completed successfully!")
        process.exit(0)
      })
      .catch((error) => {
        console.error("💥 Database reset failed:", error)
        process.exit(1)
      })
  } else {
    seedDatabase()
      .then(() => {
        console.log("🎉 All seeding completed successfully!")
        process.exit(0)
      })
      .catch((error) => {
        console.error("💥 Seeding failed:", error)
        process.exit(1)
      })
  }
}