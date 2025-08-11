import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  varchar,
  decimal,
  serial,
  index,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"
import { createId } from "@paralleldrive/cuid2"

// ===== NEXTAUTH TABLES (EXISTING) =====

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

// ===== TCRS BUSINESS TABLES (NEW) =====

export const invoiceData = pgTable("invoice_data", {
  invoiceId: varchar("invoice_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar("request_id", { length: 255 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  branch: varchar("branch", { length: 255 }),
  vendor: varchar("vendor", { length: 255 }),
  po: varchar("po", { length: 255 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }),
  approver: varchar("approver", { length: 255 }),
  blobUrl: varchar("blob_url", { length: 500 }),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
})

export const approvalRequests = pgTable("approval_requests", {
  requestId: varchar("request_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requester: varchar("requester", { length: 255 }),
  assignedApprover: varchar("assigned_approver", { length: 255 }),
  approverStatus: varchar("approver_status", { length: 50 }).$type<'pending' | 'approved' | 'rejected'>(),
  approvedDate: timestamp("approved_date"),
  comments: varchar("comments", { length: 1000 }),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
})

export const approverList = pgTable("approver_list", {
  approverId: varchar("approver_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  erp: varchar("erp", { length: 255 }),
  branch: varchar("branch", { length: 255 }),
  authorizedAmount: decimal("authorized_amount", { precision: 12, scale: 2 }),
  authorizedApprover: varchar("authorized_approver", { length: 255 }).unique(),
  emailAddress: varchar("email_address", { length: 255 }),
  backUpApprover: varchar("back_up_approver", { length: 255 }),
  backUpEmailAddress: varchar("back_up_email_address", { length: 255 })
})

export const tiffFileGeneration = pgTable("tiff_file_generation", {
  genId: varchar("gen_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  generationStatus: varchar("generation_status", { length: 50 }).$type<'pending' | 'processing' | 'completed' | 'failed'>(),
  fileName: varchar("file_name", { length: 255 }),
  blobUrl: varchar("blob_url", { length: 500 }),
  createdDate: timestamp("created_date").defaultNow()
})

export const glCodingUploadedData = pgTable("gl_coding_uploaded_data", {
  fileId: varchar("file_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  uploader: varchar("uploader", { length: 255 }),
  status: varchar("status", { length: 50 }).$type<'uploaded' | 'processing' | 'completed' | 'failed'>(),
  blobUrl: varchar("blob_url", { length: 500 }),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
})

export const glCodingData = pgTable("gl_coding_data", {
  fileId: varchar("file_id", { length: 255 }).notNull(),
  line: integer("line").notNull(),
  accountCode: varchar("account_code", { length: 255 }),
  facilityCode: varchar("facility_code", { length: 255 }),
  taxCode: varchar("tax_code", { length: 255 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  equipment: varchar("equipment", { length: 255 }),
  comments: text("comments"),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
}, (table) => ({
  pk: primaryKey({ columns: [table.fileId, table.line] })
}))

export const accountMaster = pgTable("account_master", {
  accountCode: varchar("account_code", { length: 255 }).primaryKey(),
  accountDescription: varchar("account_description", { length: 255 }),
  accountCombined: varchar("account_combined", { length: 255 }),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
})

export const facility = pgTable("facility", {
  facilityCode: varchar("facility_code", { length: 255 }).primaryKey(),
  facilityDescription: varchar("facility_description", { length: 255 }),
  facilityCombined: varchar("facility_combined", { length: 255 }),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
})

export const workflowSteps = pgTable("workflow_steps", {
  stepId: serial("step_id").primaryKey(),
  stepCode: varchar("step_code", { length: 255 }).notNull().unique(),
  stepName: varchar("step_name", { length: 255 }).notNull(),
  stepDescription: text("step_description"),
  stepCategory: varchar("step_category", { length: 100 }).notNull(),
  stepOrder: integer("step_order"),
  isUserAction: boolean("is_user_action").default(false),
  isRobotAction: boolean("is_robot_action").default(false),
  isSystemAction: boolean("is_system_action").default(false),
  expectedDurationMs: integer("expected_duration_ms"),
  isCritical: boolean("is_critical").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  createdDate: timestamp("created_date").defaultNow(),
  modifiedDate: timestamp("modified_date")
}, (table) => ({
  categoryOrderIdx: index("idx_workflow_steps_category_order").on(table.stepCategory, table.stepOrder),
  codeIdx: index("idx_workflow_steps_code").on(table.stepCode)
}))

export const workflowHistory = pgTable("workflow_history", {
  historyId: varchar("history_id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  stepId: integer("step_id").notNull(),
  executedBy: varchar("executed_by", { length: 255 }),
  executedDate: timestamp("executed_date").notNull(),
  duration: integer("duration"),
  success: boolean("success").default(true),
  errorCode: varchar("error_code", { length: 100 }),
  notes: text("notes"),
  robotJobId: varchar("robot_job_id", { length: 255 }),
  relatedEntityId: varchar("related_entity_id", { length: 255 }),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdDate: timestamp("created_date").defaultNow()
}, (table) => ({
  timelineIdx: index("idx_workflow_timeline").on(table.requestId, table.executedDate),
  stepMonitoringIdx: index("idx_workflow_step_monitoring").on(table.stepId, table.executedDate),
  errorsIdx: index("idx_workflow_errors").on(table.success, table.errorCode, table.executedDate),
  robotTrackingIdx: index("idx_workflow_robot_tracking").on(table.executedBy, table.executedDate),
  performanceIdx: index("idx_workflow_performance").on(table.stepId, table.duration),
  auditIdx: index("idx_workflow_audit").on(table.executedDate)
}))

// ===== TYPE EXPORTS =====

// NextAuth types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// TCRS types
export type InvoiceData = typeof invoiceData.$inferSelect
export type NewInvoiceData = typeof invoiceData.$inferInsert

export type ApprovalRequest = typeof approvalRequests.$inferSelect  
export type NewApprovalRequest = typeof approvalRequests.$inferInsert

export type ApproverList = typeof approverList.$inferSelect
export type NewApproverList = typeof approverList.$inferInsert

export type WorkflowStep = typeof workflowSteps.$inferSelect
export type NewWorkflowStep = typeof workflowSteps.$inferInsert

export type WorkflowHistory = typeof workflowHistory.$inferSelect
export type NewWorkflowHistory = typeof workflowHistory.$inferInsert