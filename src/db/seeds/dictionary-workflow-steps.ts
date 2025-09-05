// src/db/seeds/dictionary-workflow-steps.ts
import { db } from '@/db'
import { workflowSteps } from '@/db/schema'
import { DICTIONARY_WORKFLOW_STEPS } from '@/db/dictionary-workflow-steps'

export async function seedDictionaryWorkflowSteps() {
  console.log('🌱 Seeding dictionary workflow steps...')
  
  try {
    // Get all dictionary workflow steps
    const stepsToInsert = Object.values(DICTIONARY_WORKFLOW_STEPS)
    
    console.log(`📊 Inserting ${stepsToInsert.length} dictionary workflow steps...`)
    
    for (const step of stepsToInsert) {
      try {
        await db.insert(workflowSteps).values({
          stepCode: step.stepCode,
          stepName: step.stepName,
          stepDescription: step.stepDescription,
          stepCategory: step.stepCategory,
          stepOrder: step.stepOrder,
          isUserAction: step.isUserAction,
          isRobotAction: step.isRobotAction,
          isSystemAction: step.isSystemAction,
          expectedDurationMs: step.expectedDurationMs,
          isCritical: step.isCritical,
          requiresApproval: step.requiresApproval
        }).onConflictDoNothing()
        
        console.log(`  ✅ ${step.stepCode} - ${step.stepName}`)
      } catch (error) {
        // Skip if already exists
        if (error instanceof Error && error.message.includes('duplicate key')) {
          console.log(`  ⚠️  ${step.stepCode} already exists, skipping`)
        } else {
          console.error(`  ❌ Failed to insert ${step.stepCode}:`, error)
        }
      }
    }
    
    console.log('✅ Dictionary workflow steps seeded successfully!')
    
  } catch (error) {
    console.error('❌ Failed to seed dictionary workflow steps:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedDictionaryWorkflowSteps()
    .then(() => {
      console.log('🎉 Dictionary workflow steps seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Dictionary workflow steps seeding failed:', error)
      process.exit(1)
    })
}