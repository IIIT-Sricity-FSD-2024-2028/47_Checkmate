-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "password_hash" TEXT,
    "created" DATE,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "business_name" TEXT,
    "category" TEXT,
    "status" TEXT,
    "user_id" TEXT,
    "created" DATE,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_applications" (
    "id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "password_hash" TEXT,
    "rejection_reason" TEXT,
    "decided_by" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "decided_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "vendor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_applications" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "staff_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "vendor_id" TEXT,
    "user_id" TEXT,
    "status" TEXT,
    "workload" INTEGER,
    "experience_years" INTEGER,
    "skills" TEXT[],
    "bio" TEXT,
    "avatar" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "date" DATE,
    "end_date" DATE,
    "time" TEXT,
    "end_time" TEXT,
    "venue" TEXT,
    "guests" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "client_id" TEXT,
    "vendor_id" TEXT,
    "quoted_price" DECIMAL(12,2),
    "notes" TEXT,
    "requested_resources" JSONB,
    "requested_staff" JSONB,
    "cancellation_reason" TEXT,
    "cancelled_by" JSONB,
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2),
    "unit" TEXT,
    "condition_status" TEXT,
    "vendor_id" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'allocated',
    "released_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_assignments" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "decline_reason" TEXT,
    "tasks" JSONB,
    "responded_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "client_id" TEXT,
    "vendor_id" TEXT,
    "status" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "original_cost" DECIMAL(12,2),
    "advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
    "commission_rate" DECIMAL(6,4),
    "commission_amount" DECIMAL(12,2),
    "vendor_payout_amount" DECIMAL(12,2),
    "payout_status" TEXT NOT NULL DEFAULT 'pending',
    "cancellation_fee_rate" DECIMAL(6,4),
    "refund_amount" DECIMAL(12,2),
    "vendor_splits" JSONB,
    "settled_at" TIMESTAMPTZ,
    "settled_by" TEXT,
    "created" DATE,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "method_label" TEXT,
    "status" TEXT NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'simulated',
    "gateway_ref" TEXT,
    "receipt_no" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_ratings" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "rated_by" TEXT,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "staff_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_feedback" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "vendor_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "vendor_id" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "title" TEXT,
    "category" TEXT,
    "priority" TEXT,
    "status" TEXT,
    "target" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor_id" TEXT,
    "capacity" INTEGER,
    "status" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_tasks" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT,
    "event_id" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "staff_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "message_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "sender" TEXT,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_chat_messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT,
    "sender_email" TEXT,
    "recipient_email" TEXT,
    "text" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "admin_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "user_id" TEXT NOT NULL,
    "thread_key" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("user_id","thread_key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_url" TEXT,
    "created_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");

-- CreateIndex
CREATE INDEX "events_client_id_idx" ON "events"("client_id");

-- CreateIndex
CREATE INDEX "events_vendor_id_idx" ON "events"("vendor_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "allocations_event_id_idx" ON "allocations"("event_id");

-- CreateIndex
CREATE INDEX "staff_assignments_staff_id_idx" ON "staff_assignments"("staff_id");

-- CreateIndex
CREATE INDEX "staff_assignments_event_id_idx" ON "staff_assignments"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_event_id_key" ON "bookings"("event_id");

-- CreateIndex
CREATE INDEX "bookings_client_id_idx" ON "bookings"("client_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_ratings_vendor_id_staff_id_event_id_key" ON "staff_ratings"("vendor_id", "staff_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_feedback_event_id_key" ON "vendor_feedback"("event_id");

-- CreateIndex
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_chat_messages_sender_email_idx" ON "admin_chat_messages"("sender_email");

-- CreateIndex
CREATE INDEX "admin_chat_messages_recipient_email_idx" ON "admin_chat_messages"("recipient_email");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_feedback" ADD CONSTRAINT "vendor_feedback_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_feedback" ADD CONSTRAINT "vendor_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_feedback" ADD CONSTRAINT "vendor_feedback_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rules the database enforces itself (Prisma cannot express CHECK)
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_stars_1_to_5" CHECK ("stars" BETWEEN 1 AND 5);
ALTER TABLE "vendor_feedback" ADD CONSTRAINT "vendor_feedback_stars_1_to_5" CHECK ("stars" BETWEEN 1 AND 5);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_quantity_positive" CHECK ("quantity" > 0);
