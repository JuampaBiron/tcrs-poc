CREATE TABLE "account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"account_code" varchar(255) PRIMARY KEY NOT NULL,
	"account_description" varchar(255),
	"account_combined" varchar(255),
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"request_id" varchar(255) PRIMARY KEY NOT NULL,
	"requester" varchar(255),
	"assigned_approver" varchar(255),
	"approver_status" varchar(50),
	"approved_date" timestamp,
	"comments" varchar(1000),
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "approver_list" (
	"approver_id" varchar(255) PRIMARY KEY NOT NULL,
	"erp" varchar(255),
	"branch" varchar(255),
	"authorized_amount" numeric(12, 2),
	"authorized_approver" varchar(255),
	"email_address" varchar(255),
	"back_up_approver" varchar(255),
	"back_up_email_address" varchar(255),
	CONSTRAINT "unique_authorized_approver_branch" UNIQUE("authorized_approver","branch")
);
--> statement-breakpoint
CREATE TABLE "facility" (
	"facility_code" varchar(255) PRIMARY KEY NOT NULL,
	"facility_description" varchar(255),
	"facility_combined" varchar(255),
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "gl_coding_data" (
	"upload_id" varchar(255) NOT NULL,
	"account_code" varchar(255),
	"facility_code" varchar(255),
	"tax_code" varchar(255),
	"amount" numeric(12, 2),
	"equipment" varchar(255),
	"comments" text,
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "gl_coding_uploaded_data" (
	"upload_id" varchar(255) PRIMARY KEY NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"uploader" varchar(255),
	"uploaded_file" boolean,
	"status" varchar(50),
	"blob_url" varchar(500),
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoice_data" (
	"invoice_id" varchar(255) PRIMARY KEY NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"company" varchar(255),
	"tcrs_company" boolean,
	"branch" varchar(255),
	"vendor" varchar(255),
	"po" varchar(255),
	"amount" numeric(12, 2),
	"currency" varchar(10),
	"approver" varchar(255),
	"blob_url" varchar(500),
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp,
	CONSTRAINT "invoice_data_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiff_file_generation" (
	"gen_id" varchar(255) PRIMARY KEY NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"generation_status" varchar(50),
	"file_name" varchar(255),
	"blob_url" varchar(500),
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "workflow_history" (
	"history_id" varchar(255) PRIMARY KEY NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"step_id" integer NOT NULL,
	"executed_by" varchar(255),
	"executed_date" timestamp NOT NULL,
	"duration" integer,
	"success" boolean DEFAULT true,
	"error_code" varchar(100),
	"notes" text,
	"robot_job_id" varchar(255),
	"related_entity_id" varchar(255),
	"related_entity_type" varchar(100),
	"previous_value" text,
	"new_value" text,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"step_id" serial PRIMARY KEY NOT NULL,
	"step_code" varchar(100) NOT NULL,
	"step_name" varchar(255) NOT NULL,
	"step_description" text,
	"step_category" varchar(100) NOT NULL,
	"step_order" integer,
	"is_user_action" boolean DEFAULT false,
	"is_robot_action" boolean DEFAULT false,
	"is_system_action" boolean DEFAULT false,
	"expected_duration_ms" integer,
	"is_critical" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"created_date" timestamp DEFAULT now(),
	"modified_date" timestamp,
	CONSTRAINT "workflow_steps_step_code_unique" UNIQUE("step_code")
);
--> statement-breakpoint
CREATE INDEX "idx_workflow_timeline" ON "workflow_history" USING btree ("request_id","executed_date");--> statement-breakpoint
CREATE INDEX "idx_workflow_step_monitoring" ON "workflow_history" USING btree ("step_id","executed_date");--> statement-breakpoint
CREATE INDEX "idx_workflow_errors" ON "workflow_history" USING btree ("success","error_code","executed_date");--> statement-breakpoint
CREATE INDEX "idx_workflow_robot_tracking" ON "workflow_history" USING btree ("executed_by","executed_date");--> statement-breakpoint
CREATE INDEX "idx_workflow_performance" ON "workflow_history" USING btree ("step_id","duration");--> statement-breakpoint
CREATE INDEX "idx_workflow_audit" ON "workflow_history" USING btree ("executed_date");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_category_order" ON "workflow_steps" USING btree ("step_category","step_order");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_code" ON "workflow_steps" USING btree ("step_code");