// src/db/dictionary-workflow-steps.ts
// Dictionary Management Workflow Steps

export const DICTIONARY_WORKFLOW_STEPS = {
  // Approver Management
  APPROVER_CREATED: {
    stepCode: 'DICT_APPROVER_CREATED',
    stepName: 'Approver Created',
    stepDescription: 'New approver entry created in dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 1,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  APPROVER_UPDATED: {
    stepCode: 'DICT_APPROVER_UPDATED', 
    stepName: 'Approver Updated',
    stepDescription: 'Approver entry modified in dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 2,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  APPROVER_DELETED: {
    stepCode: 'DICT_APPROVER_DELETED',
    stepName: 'Approver Deleted', 
    stepDescription: 'Approver entry removed from dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 3,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: true,
    requiresApproval: false
  },

  // Account Management
  ACCOUNT_CREATED: {
    stepCode: 'DICT_ACCOUNT_CREATED',
    stepName: 'Account Created',
    stepDescription: 'New account entry created in dictionary', 
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 4,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  ACCOUNT_UPDATED: {
    stepCode: 'DICT_ACCOUNT_UPDATED',
    stepName: 'Account Updated',
    stepDescription: 'Account entry modified in dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT', 
    stepOrder: 5,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  ACCOUNT_DELETED: {
    stepCode: 'DICT_ACCOUNT_DELETED',
    stepName: 'Account Deleted',
    stepDescription: 'Account entry removed from dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 6,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: true,
    requiresApproval: false
  },

  // Facility Management
  FACILITY_CREATED: {
    stepCode: 'DICT_FACILITY_CREATED',
    stepName: 'Facility Created',
    stepDescription: 'New facility entry created in dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 7,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  FACILITY_UPDATED: {
    stepCode: 'DICT_FACILITY_UPDATED',
    stepName: 'Facility Updated', 
    stepDescription: 'Facility entry modified in dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 8,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: false,
    requiresApproval: false
  },
  FACILITY_DELETED: {
    stepCode: 'DICT_FACILITY_DELETED',
    stepName: 'Facility Deleted',
    stepDescription: 'Facility entry removed from dictionary',
    stepCategory: 'DICTIONARY_MANAGEMENT',
    stepOrder: 9,
    isUserAction: true,
    isRobotAction: false,
    isSystemAction: false,
    expectedDurationMs: 1000,
    isCritical: true,
    requiresApproval: false
  }
} as const;