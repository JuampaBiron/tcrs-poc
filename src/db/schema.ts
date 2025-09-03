import { pgTable, varchar, timestamp, decimal, boolean, integer, serial, text, primaryKey, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { REQUEST_STATUS } from '@/constants'

// ===== NEXTAUTH TABLES =====
export const users = pgTable('user', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: varchar('image', { length: 255 }),
})

export const accounts = pgTable(
  'account',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).notNull().primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

// ===== TCRS BUSINESS TABLES =====

// Invoice Data Table
export const invoiceData = pgTable('invoice_data', {
  requestId: varchar('request_id', { length: 255 }).primaryKey(),
  company: varchar('company', { length: 255 }),
  tcrsCompany: boolean('tcrs_company'),
  branch: varchar('branch', { length: 255 }),
  vendor: varchar('vendor', { length: 255 }),
  po: varchar('po', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 10 }),
  approver: varchar('approver', { length: 255 }),
  blobUrl: varchar('blob_url', { length: 500 }),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// Approval Requests Table
export const approvalRequests = pgTable('approval_requests', {
  requestId: varchar('request_id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requester: varchar('requester', { length: 255 }),
  assignedApprover: varchar('assigned_approver', { length: 255 }),
  approverStatus: varchar('approver_status', { length: 50 }).$type<typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]>(),
  approvedDate: timestamp('approved_date'),
  comments: varchar('comments', { length: 1000 }),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// Approver List Table
export const approverList = pgTable('approver_list',
  {
    approverId: varchar('approver_id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
    erp: varchar('erp', { length: 255 }),
    branch: varchar('branch', { length: 255 }),
    authorizedAmount: decimal('authorized_amount', { precision: 12, scale: 2 }),
    authorizedApprover: varchar('authorized_approver', { length: 255 }),
    emailAddress: varchar('email_address', { length: 255 }),
    backUpApprover: varchar('back_up_approver', { length: 255 }),
    backUpEmailAddress: varchar('back_up_email_address', { length: 255 }),
  },
  (table) => ({
    uniqueAuthorizedApproverBranch: unique('unique_authorized_approver_branch').on(table.authorizedApprover, table.branch),
  })
)

// TIFF File Generation Table
export const tiffFileGeneration = pgTable('tiff_file_generation', {
  genId: varchar('gen_id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar('request_id', { length: 255 }).notNull(),
  generationStatus: varchar('generation_status', { length: 50 }),
  fileName: varchar('file_name', { length: 255 }),
  blobUrl: varchar('blob_url', { length: 500 }),
  createdDate: timestamp('created_date').defaultNow(),
})

// GL Coding Uploaded Data Table
export const glCodingUploadedData = pgTable('gl_coding_uploaded_data', {
  uploadId: varchar('upload_id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar('request_id', { length: 255 }).notNull(),
  uploader: varchar('uploader', { length: 255 }),
  uploadedFile: boolean('uploaded_file'),
  status: varchar('status', { length: 50 }),
  blobUrl: varchar('blob_url', { length: 500 }),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// GL Coding Data Table
export const glCodingData = pgTable('gl_coding_data', {
  glCodingId: serial('gl_coding_id').primaryKey(),
  uploadId: varchar('upload_id', { length: 255 }).notNull(),
  accountCode: varchar('account_code', { length: 255 }),
  facilityCode: varchar('facility_code', { length: 255 }),
  taxCode: varchar('tax_code', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  equipment: varchar('equipment', { length: 255 }),
  comments: text('comments'),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// Accounts Master Table
export const accountsMaster = pgTable('accounts', {
  accountCode: varchar('account_code', { length: 255 }).primaryKey(),
  accountDescription: varchar('account_description', { length: 255 }),
  accountCombined: varchar('account_combined', { length: 255 }),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// Facility Master Table
export const facility = pgTable('facility', {
  facilityCode: varchar('facility_code', { length: 255 }).primaryKey(),
  facilityDescription: varchar('facility_description', { length: 255 }),
  facilityCombined: varchar('facility_combined', { length: 255 }),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
})

// ===== NEW WORKFLOW TABLES =====

// WorkflowSteps Master Table  
export const workflowSteps = pgTable('workflow_steps', {
  stepId: serial('step_id').primaryKey(),
  stepCode: varchar('step_code', { length: 100 }).notNull().unique(),
  stepName: varchar('step_name', { length: 255 }).notNull(),
  stepDescription: text('step_description'),
  stepCategory: varchar('step_category', { length: 100 }).notNull(),
  stepOrder: integer('step_order'),
  isUserAction: boolean('is_user_action').default(false),
  isRobotAction: boolean('is_robot_action').default(false),
  isSystemAction: boolean('is_system_action').default(false),
  expectedDurationMs: integer('expected_duration_ms'),
  isCritical: boolean('is_critical').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  createdDate: timestamp('created_date').defaultNow(),
  modifiedDate: timestamp('modified_date'),
}, (table) => ({
  idxWorkflowStepsCategoryOrder: index('idx_workflow_steps_category_order').on(table.stepCategory, table.stepOrder),
  idxWorkflowStepsCode: index('idx_workflow_steps_code').on(table.stepCode),
}))

// WorkflowHistory Table
export const workflowHistory = pgTable('workflow_history', {
  historyId: varchar('history_id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar('request_id', { length: 255 }).notNull(),
  stepId: integer('step_id').notNull(),
  executedBy: varchar('executed_by', { length: 255 }),
  executedDate: timestamp('executed_date').notNull(),
  duration: integer('duration'),
  success: boolean('success').default(true),
  errorCode: varchar('error_code', { length: 100 }),
  notes: text('notes'),
  robotJobId: varchar('robot_job_id', { length: 255 }),
  relatedEntityId: varchar('related_entity_id', { length: 255 }),
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  createdDate: timestamp('created_date').defaultNow(),
}, (table) => ({
  idxWorkflowTimeline: index('idx_workflow_timeline').on(table.requestId, table.executedDate),
  idxWorkflowStepMonitoring: index('idx_workflow_step_monitoring').on(table.stepId, table.executedDate),
  idxWorkflowErrors: index('idx_workflow_errors').on(table.success, table.errorCode, table.executedDate),
  idxWorkflowRobotTracking: index('idx_workflow_robot_tracking').on(table.executedBy, table.executedDate),
  idxWorkflowPerformance: index('idx_workflow_performance').on(table.stepId, table.duration),
  idxWorkflowAudit: index('idx_workflow_audit').on(table.executedDate),
}))

// ===== RELATIONS =====

// WorkflowHistory relations
export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  approvalRequest: one(approvalRequests, {
    fields: [workflowHistory.requestId],
    references: [approvalRequests.requestId],
  }),
  workflowStep: one(workflowSteps, {
    fields: [workflowHistory.stepId],
    references: [workflowSteps.stepId],
  }),
}))

// ApprovalRequests relations
export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  invoiceData: one(invoiceData, {
    fields: [approvalRequests.requestId],
    references: [invoiceData.requestId],
  }),
  approver: one(approverList, {
    fields: [approvalRequests.assignedApprover],
    references: [approverList.authorizedApprover],
  }),
  glCodingData: many(glCodingUploadedData),
  tiffFiles: many(tiffFileGeneration),
  workflowHistory: many(workflowHistory),
}))

// GLCodingData relations
export const glCodingDataRelations = relations(glCodingData, ({ one }) => ({
  upload: one(glCodingUploadedData, {
    fields: [glCodingData.uploadId],
    references: [glCodingUploadedData.uploadId],
  }),
  account: one(accountsMaster, {
    fields: [glCodingData.accountCode],
    references: [accountsMaster.accountCode],
  }),
  facility: one(facility, {
    fields: [glCodingData.facilityCode],
    references: [facility.facilityCode],
  }),
}))

// GLCodingUploadedData relations
export const glCodingUploadedDataRelations = relations(glCodingUploadedData, ({ one, many }) => ({
  approvalRequest: one(approvalRequests, {
    fields: [glCodingUploadedData.requestId],
    references: [approvalRequests.requestId],
  }),
  codingData: many(glCodingData),
}))

// TiffFileGeneration relations
export const tiffFileGenerationRelations = relations(tiffFileGeneration, ({ one }) => ({
  approvalRequest: one(approvalRequests, {
    fields: [tiffFileGeneration.requestId],
    references: [approvalRequests.requestId],
  }),
}))

// NextAuth relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}))

// ===== TYPE EXPORTS =====
export type NewUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

export type NewAccount = typeof accounts.$inferInsert
export type Account = typeof accounts.$inferSelect

export type NewSession = typeof sessions.$inferInsert
export type Session = typeof sessions.$inferSelect

export type NewVerificationToken = typeof verificationTokens.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect

export type NewInvoiceData = typeof invoiceData.$inferInsert
export type InvoiceData = typeof invoiceData.$inferSelect

export type NewApprovalRequest = typeof approvalRequests.$inferInsert
export type ApprovalRequest = typeof approvalRequests.$inferSelect

export type NewApproverList = typeof approverList.$inferInsert
export type ApproverList = typeof approverList.$inferSelect

export type NewTiffFileGeneration = typeof tiffFileGeneration.$inferInsert
export type TiffFileGeneration = typeof tiffFileGeneration.$inferSelect

export type NewGLCodingUploadedData = typeof glCodingUploadedData.$inferInsert
export type GLCodingUploadedData = typeof glCodingUploadedData.$inferSelect

export type NewGLCodingData = typeof glCodingData.$inferInsert
export type GLCodingData = typeof glCodingData.$inferSelect

export type NewAccountsMaster = typeof accountsMaster.$inferInsert
export type AccountsMaster = typeof accountsMaster.$inferSelect

export type NewFacility = typeof facility.$inferInsert
export type Facility = typeof facility.$inferSelect

export type NewWorkflowStep = typeof workflowSteps.$inferInsert
export type WorkflowStep = typeof workflowSteps.$inferSelect

export type NewWorkflowHistory = typeof workflowHistory.$inferInsert
export type WorkflowHistory = typeof workflowHistory.$inferSelect