-- ============================================================================
-- Event Management System (EMS) - Fully Normalized Relational Database Schema (3NF / BCNF)
-- Engine: MySQL 8.0+ / MariaDB 10.5+ / InnoDB
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS EventManagement
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE EventManagement;

-- Disable foreign key checks during schema creation and teardown
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing views if any
DROP VIEW IF EXISTS view_financial_analytics_summary;
DROP VIEW IF EXISTS view_staff_workload_roster;
DROP VIEW IF EXISTS view_resource_inventory_status;
DROP VIEW IF EXISTS view_event_comprehensive_report;
DROP VIEW IF EXISTS EventReport;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS message_threads;
DROP TABLE IF EXISTS contingency_plans;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS event_progress_monitors;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS staff_tasks;
DROP TABLE IF EXISTS event_staff_assignments;
DROP TABLE IF EXISTS event_resource_allocations;
DROP TABLE IF EXISTS event_staff_requirements;
DROP TABLE IF EXISTS event_resource_requirements;
DROP TABLE IF EXISTS venue_allocations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS package_staff_requirements;
DROP TABLE IF EXISTS package_resource_items;
DROP TABLE IF EXISTS preset_packages;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS resource_categories;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS vendor_documents;
DROP TABLE IF EXISTS vendor_applications;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================
CREATE TABLE users (
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) NULL,
    role ENUM('Admin', 'Superuser', 'Vendor', 'Staff', 'Client') NOT NULL,
    status ENUM('Active', 'Inactive', 'Pending', 'Suspended') NOT NULL DEFAULT 'Active',
    profile_picture_url VARCHAR(255) NULL,
    bio TEXT NULL,
    location VARCHAR(255) NULL,
    address TEXT NULL,
    date_of_birth DATE NULL,
    years_experience INT NOT NULL DEFAULT 0,
    skills TEXT NULL,
    website_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. VENDORS & ONBOARDING
-- ============================================================================
CREATE TABLE vendors (
    vendor_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NULL,
    business_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NULL,
    category_class VARCHAR(50) NULL,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    approval_status ENUM('Approved', 'Pending', 'Rejected') NOT NULL DEFAULT 'Approved',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id),
    UNIQUE KEY uq_vendors_business_name (business_name),
    INDEX idx_vendors_user_id (user_id),
    INDEX idx_vendors_approval_status (approval_status),
    CONSTRAINT fk_vendors_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendor_applications (
    application_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(150) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    category VARCHAR(100) NULL,
    category_class VARCHAR(50) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    note TEXT NULL,
    password_hash VARCHAR(255) NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP NULL,
    decided_by VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (application_id),
    INDEX idx_vendor_apps_status (status),
    INDEX idx_vendor_apps_email (email),
    CONSTRAINT fk_vendor_apps_decided_by FOREIGN KEY (decided_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendor_documents (
    document_id INT AUTO_INCREMENT NOT NULL,
    application_id VARCHAR(50) NULL,
    vendor_id VARCHAR(50) NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- e.g. 'license', 'insurance', 'tax_id'
    file_path VARCHAR(500) NOT NULL,
    verified_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by VARCHAR(50) NULL,
    PRIMARY KEY (document_id),
    INDEX idx_vendor_docs_app (application_id),
    INDEX idx_vendor_docs_vendor (vendor_id),
    CONSTRAINT fk_vendor_docs_app FOREIGN KEY (application_id) 
        REFERENCES vendor_applications (application_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vendor_docs_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vendor_docs_verifier FOREIGN KEY (verified_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. VENUES & SPATIAL INVENTORY
-- ============================================================================
CREATE TABLE venues (
    venue_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NULL,
    venue_name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NULL,
    capacity INT NOT NULL DEFAULT 0,
    price_per_day DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    availability_status ENUM('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (venue_id),
    INDEX idx_venues_vendor (vendor_id),
    INDEX idx_venues_status (availability_status),
    CONSTRAINT fk_venues_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. RESOURCE CATEGORIES & INVENTORY
-- ============================================================================
CREATE TABLE resource_categories (
    category_id INT AUTO_INCREMENT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_resource_categories_name (category_name),
    UNIQUE KEY uq_resource_categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resources (
    resource_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NULL,
    vendor_name VARCHAR(150) NULL,
    category_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    cat VARCHAR(100) NULL, -- Subcategory: 'Audio', 'Visual', 'Furniture', 'Decoration'
    resource_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    quantity_total INT NOT NULL DEFAULT 0,
    quantity_available INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'day',
    available BOOLEAN NOT NULL DEFAULT TRUE,
    condition_status ENUM('Ready', 'In Use', 'Maintenance', 'Damaged') NOT NULL DEFAULT 'Ready',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (resource_id),
    INDEX idx_resources_vendor (vendor_id),
    INDEX idx_resources_category (category_id),
    INDEX idx_resources_available (available),
    CONSTRAINT fk_resources_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resources_category FOREIGN KEY (category_id) 
        REFERENCES resource_categories (category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_resource_quantity_valid CHECK (quantity_available >= 0 AND quantity_available <= quantity_total)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. STAFF ROSTER & WORKLOAD
-- ============================================================================
CREATE TABLE staff (
    staff_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NULL,
    vendor_id VARCHAR(50) NULL,
    vendor_name VARCHAR(150) NULL,
    name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NULL,
    workload INT NOT NULL DEFAULT 0, -- 0 to 100 percentage
    status ENUM('available', 'assigned', 'on-leave', 'inactive') NOT NULL DEFAULT 'available',
    avail VARCHAR(50) NOT NULL DEFAULT 'Available',
    avatar VARCHAR(50) NOT NULL DEFAULT 'teal',
    events_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (staff_id),
    INDEX idx_staff_user (user_id),
    INDEX idx_staff_vendor (vendor_id),
    INDEX idx_staff_status (status),
    INDEX idx_staff_role (role),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_staff_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_staff_workload CHECK (workload >= 0 AND workload <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PRESET PACKAGES & TEMPLATES
-- ============================================================================
CREATE TABLE preset_packages (
    package_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NULL,
    vendor_name VARCHAR(150) NULL,
    created_by VARCHAR(50) NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Wedding', 'Birthday', 'Conference', 'Corporate', 'Gala'
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    duration_hours INT NOT NULL DEFAULT 1,
    capacity VARCHAR(100) NOT NULL, -- e.g. '100-300'
    description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (package_id),
    INDEX idx_packages_vendor (vendor_id),
    INDEX idx_packages_category (category),
    INDEX idx_packages_status (status),
    CONSTRAINT fk_packages_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_packages_creator FOREIGN KEY (created_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE package_resource_items (
    item_id INT AUTO_INCREMENT NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50) NULL,
    resource_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id),
    INDEX idx_pkg_res_package (package_id),
    INDEX idx_pkg_res_resource (resource_id),
    CONSTRAINT fk_pkg_res_package FOREIGN KEY (package_id) 
        REFERENCES preset_packages (package_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pkg_res_resource FOREIGN KEY (resource_id) 
        REFERENCES resources (resource_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE package_staff_requirements (
    req_id INT AUTO_INCREMENT NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (req_id),
    INDEX idx_pkg_staff_package (package_id),
    CONSTRAINT fk_pkg_staff_package FOREIGN KEY (package_id) 
        REFERENCES preset_packages (package_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. EVENTS & EVENT REQUESTS
-- ============================================================================
CREATE TABLE events (
    event_id VARCHAR(50) NOT NULL,
    client_id VARCHAR(50) NULL,
    client_name VARCHAR(150) NULL,
    vendor_id VARCHAR(50) NULL,
    vendor_name VARCHAR(150) NULL,
    venue_id VARCHAR(50) NULL,
    package_id VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    venue_name VARCHAR(255) NOT NULL,
    people_count INT NOT NULL DEFAULT 1,
    guest_count INT NOT NULL DEFAULT 1,
    budget DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    estimated_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    budget_range VARCHAR(100) NULL,
    notes TEXT NULL,
    status ENUM('pending', 'approved', 'confirmed', 'live', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_by VARCHAR(50) NOT NULL DEFAULT 'client',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    INDEX idx_events_client (client_id),
    INDEX idx_events_vendor (vendor_id),
    INDEX idx_events_venue (venue_id),
    INDEX idx_events_package (package_id),
    INDEX idx_events_status (status),
    INDEX idx_events_date (event_date),
    CONSTRAINT fk_events_client FOREIGN KEY (client_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_events_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) 
        REFERENCES venues (venue_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_events_package FOREIGN KEY (package_id) 
        REFERENCES preset_packages (package_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. VENUE ALLOCATIONS
-- ============================================================================
CREATE TABLE venue_allocations (
    allocation_id INT AUTO_INCREMENT NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    venue_id VARCHAR(50) NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    allocation_status ENUM('pending', 'allocated', 'released', 'cancelled') NOT NULL DEFAULT 'pending',
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (allocation_id),
    UNIQUE KEY uq_event_venue (event_id, venue_id),
    INDEX idx_venue_alloc_event (event_id),
    INDEX idx_venue_alloc_venue (venue_id),
    CONSTRAINT fk_venue_alloc_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_venue_alloc_venue FOREIGN KEY (venue_id) 
        REFERENCES venues (venue_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. EVENT REQUIREMENTS (RESOURCE & STAFF)
-- ============================================================================
CREATE TABLE event_resource_requirements (
    req_id INT AUTO_INCREMENT NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    category_id INT NULL,
    resource_id VARCHAR(50) NULL,
    resource_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NULL,
    quantity_required INT NOT NULL DEFAULT 1,
    price_per_day DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (req_id),
    INDEX idx_event_res_req_event (event_id),
    INDEX idx_event_res_req_res (resource_id),
    CONSTRAINT fk_event_res_req_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_event_res_req_cat FOREIGN KEY (category_id) 
        REFERENCES resource_categories (category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_event_res_req_res FOREIGN KEY (resource_id) 
        REFERENCES resources (resource_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_staff_requirements (
    req_id INT AUTO_INCREMENT NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    required_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (req_id),
    INDEX idx_event_staff_req_event (event_id),
    CONSTRAINT fk_event_staff_req_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. EVENT RESOURCE ALLOCATIONS
-- ============================================================================
CREATE TABLE event_resource_allocations (
    allocation_id INT AUTO_INCREMENT NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50) NOT NULL,
    resource_name VARCHAR(150) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    allocation_status ENUM('pending', 'allocated', 'released', 'returned') NOT NULL DEFAULT 'allocated',
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    PRIMARY KEY (allocation_id),
    UNIQUE KEY uq_event_resource (event_id, resource_id),
    INDEX idx_era_event (event_id),
    INDEX idx_era_resource (resource_id),
    INDEX idx_era_status (allocation_status),
    CONSTRAINT fk_era_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_era_resource FOREIGN KEY (resource_id) 
        REFERENCES resources (resource_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_era_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. EVENT STAFF ASSIGNMENTS & TASKS
-- ============================================================================
CREATE TABLE event_staff_assignments (
    assignment_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    staff_id VARCHAR(50) NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    staff_role VARCHAR(100) NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NULL,
    event_venue VARCHAR(255) NULL,
    event_people INT NULL,
    role VARCHAR(100) NOT NULL,
    task_desc TEXT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('assigned', 'accepted', 'rejected', 'in_progress', 'completed') NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (assignment_id),
    INDEX idx_esa_event (event_id),
    INDEX idx_esa_staff (staff_id),
    INDEX idx_esa_status (status),
    CONSTRAINT fk_esa_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_esa_staff FOREIGN KEY (staff_id) 
        REFERENCES staff (staff_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE staff_tasks (
    task_id INT AUTO_INCREMENT NOT NULL,
    assignment_id VARCHAR(50) NULL,
    event_id VARCHAR(50) NOT NULL,
    staff_id VARCHAR(50) NOT NULL,
    event_name VARCHAR(255) NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('pending', 'in_progress', 'completed', 'blocked') NOT NULL DEFAULT 'pending',
    due_time TIME NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (task_id),
    INDEX idx_tasks_assignment (assignment_id),
    INDEX idx_tasks_event (event_id),
    INDEX idx_tasks_staff (staff_id),
    INDEX idx_tasks_status (status),
    CONSTRAINT fk_tasks_assignment FOREIGN KEY (assignment_id) 
        REFERENCES event_staff_assignments (assignment_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_staff FOREIGN KEY (staff_id) 
        REFERENCES staff (staff_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_verifier FOREIGN KEY (verified_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. BOOKINGS & FINANCIAL TRANSACTIONS
-- ============================================================================
CREATE TABLE bookings (
    booking_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    client VARCHAR(150) NOT NULL,
    client_id VARCHAR(50) NULL,
    vendor VARCHAR(150) NOT NULL,
    vendor_id VARCHAR(50) NULL,
    status ENUM('Requested', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected') NOT NULL DEFAULT 'Pending',
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    advance_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('unpaid', 'partially_paid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
    commission_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    vendor_payout_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payout_status ENUM('pending', 'processing', 'settled', 'cancelled') NOT NULL DEFAULT 'pending',
    settled_at TIMESTAMP NULL,
    settled_by VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    INDEX idx_bookings_event (event_id),
    INDEX idx_bookings_client (client_id),
    INDEX idx_bookings_vendor (vendor_id),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_payout_status (payout_status),
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors (vendor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_settled_by FOREIGN KEY (settled_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. LIVE EVENT PROGRESS MONITORING
-- ============================================================================
CREATE TABLE event_progress_monitors (
    progress_id INT AUTO_INCREMENT NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    setup_percentage INT NOT NULL DEFAULT 0,
    registration_percentage INT NOT NULL DEFAULT 0,
    execution_percentage INT NOT NULL DEFAULT 0,
    breakdown_percentage INT NOT NULL DEFAULT 0,
    current_phase ENUM('setup', 'registration', 'execution', 'breakdown', 'concluded') NOT NULL DEFAULT 'setup',
    last_updated_by VARCHAR(50) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (progress_id),
    UNIQUE KEY uq_progress_event (event_id),
    CONSTRAINT fk_progress_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_progress_updater FOREIGN KEY (last_updated_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_setup_pct CHECK (setup_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_reg_pct CHECK (registration_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_exec_pct CHECK (execution_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_break_pct CHECK (breakdown_percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. ISSUES & FAULT LOGGING
-- ============================================================================
CREATE TABLE issues (
    issue_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(50) NULL,
    event_name VARCHAR(255) NULL,
    resource_id VARCHAR(50) NULL,
    staff_id VARCHAR(50) NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Equipment',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    reporter VARCHAR(150) NOT NULL,
    reporter_role VARCHAR(50) NULL,
    reporter_email VARCHAR(150) NULL,
    target VARCHAR(50) NOT NULL DEFAULT 'admin',
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    resolution_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    PRIMARY KEY (issue_id),
    INDEX idx_issues_event (event_id),
    INDEX idx_issues_resource (resource_id),
    INDEX idx_issues_staff (staff_id),
    INDEX idx_issues_status (status),
    INDEX idx_issues_priority (priority),
    CONSTRAINT fk_issues_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_issues_resource FOREIGN KEY (resource_id) 
        REFERENCES resources (resource_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_issues_staff FOREIGN KEY (staff_id) 
        REFERENCES staff (staff_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. CONTINGENCY PLANS & EMERGENCY PROTOCOLS
-- ============================================================================
CREATE TABLE contingency_plans (
    plan_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(50) NULL, -- NULL indicates global/default plan template
    problem VARCHAR(255) NOT NULL,
    trigger_condition VARCHAR(255) NOT NULL,
    solution TEXT NOT NULL,
    status ENUM('ready', 'triggered', 'executed', 'cancelled') NOT NULL DEFAULT 'ready',
    activated_at TIMESTAMP NULL,
    activated_by VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (plan_id),
    INDEX idx_contingency_event (event_id),
    INDEX idx_contingency_status (status),
    CONSTRAINT fk_contingency_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contingency_activator FOREIGN KEY (activated_by) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. MESSAGES & MULTI-PARTY COORDINATION HUB
-- ============================================================================
CREATE TABLE message_threads (
    thread_id VARCHAR(100) NOT NULL,
    thread_type ENUM('direct', 'group', 'event_coordination', 'announcement') NOT NULL DEFAULT 'group',
    title VARCHAR(150) NULL,
    event_id VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id),
    INDEX idx_threads_event (event_id),
    CONSTRAINT fk_threads_event FOREIGN KEY (event_id) 
        REFERENCES events (event_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
    message_id VARCHAR(50) NOT NULL,
    thread_id VARCHAR(100) NOT NULL,
    sender VARCHAR(150) NOT NULL,
    sender_id VARCHAR(50) NULL,
    initials VARCHAR(10) NOT NULL,
    self BOOLEAN NOT NULL DEFAULT FALSE,
    text TEXT NOT NULL,
    avatar VARCHAR(50) NOT NULL DEFAULT 'teal',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id),
    INDEX idx_messages_thread (thread_id),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_sent_at (sent_at),
    CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) 
        REFERENCES message_threads (thread_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. NOTIFICATIONS & ALERTS
-- ============================================================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error', 'approval', 'assignment', 'alert') NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. AUDIT & ACTIVITY LOGS
-- ============================================================================
CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT NOT NULL,
    user_id VARCHAR(50) NULL,
    user_role VARCHAR(50) NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_created_at (created_at),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AUTOMATED TRIGGERS
-- ============================================================================

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Trigger 1: Auto-Provision Vendor & User Account on Application Approval
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_vendor_app_approval$$
CREATE TRIGGER trg_after_vendor_app_approval
AFTER UPDATE ON vendor_applications
FOR EACH ROW
BEGIN
    DECLARE new_vendor_id VARCHAR(50);
    DECLARE new_user_id VARCHAR(50);
    DECLARE existing_vendor_count INT;
    DECLARE existing_user_count INT;

    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Check if vendor record already exists
        SELECT COUNT(*) INTO existing_vendor_count FROM vendors WHERE business_name = NEW.business_name;
        IF existing_vendor_count = 0 THEN
            SET new_vendor_id = CONCAT('V', LPAD((SELECT IFNULL(MAX(CAST(SUBSTRING(vendor_id, 2) AS UNSIGNED)), 0) + 1 FROM vendors), 3, '0'));
            INSERT INTO vendors (vendor_id, business_name, category, category_class, approval_status, rating)
            VALUES (new_vendor_id, NEW.business_name, NEW.category, NEW.category_class, 'Approved', 5.00);
        END IF;

        -- Check if user account already exists
        SELECT COUNT(*) INTO existing_user_count FROM users WHERE email = NEW.email;
        IF existing_user_count = 0 THEN
            SET new_user_id = CONCAT('U', LPAD((SELECT IFNULL(MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)), 0) + 1 FROM users), 3, '0'));
            INSERT INTO users (user_id, name, email, phone_number, role, status, password_hash)
            VALUES (new_user_id, NEW.vendor_name, NEW.email, NEW.phone, 'Vendor', 'Active', IFNULL(NEW.password_hash, '$2b$10$defaultVendorHash'));
            
            -- Link vendor to newly created user
            UPDATE vendors SET user_id = new_user_id WHERE business_name = NEW.business_name;
        END IF;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 2: Auto-Deduct Resource Inventory on Allocation
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_resource_allocation_insert$$
CREATE TRIGGER trg_after_resource_allocation_insert
AFTER INSERT ON event_resource_allocations
FOR EACH ROW
BEGIN
    IF NEW.allocation_status = 'allocated' THEN
        UPDATE resources
        SET quantity_available = GREATEST(0, quantity_available - NEW.quantity),
            available = (quantity_available - NEW.quantity > 0)
        WHERE resource_id = NEW.resource_id;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 3: Adjust Resource Inventory on Allocation Updates
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_resource_allocation_update$$
CREATE TRIGGER trg_after_resource_allocation_update
AFTER UPDATE ON event_resource_allocations
FOR EACH ROW
BEGIN
    -- Quantity changed within allocated status
    IF OLD.allocation_status = 'allocated' AND NEW.allocation_status = 'allocated' THEN
        UPDATE resources
        SET quantity_available = GREATEST(0, quantity_available - (NEW.quantity - OLD.quantity)),
            available = ((quantity_available - (NEW.quantity - OLD.quantity)) > 0)
        WHERE resource_id = NEW.resource_id;
    -- Status transitioned from allocated to released/returned
    ELSEIF OLD.allocation_status = 'allocated' AND NEW.allocation_status IN ('released', 'returned', 'cancelled') THEN
        UPDATE resources
        SET quantity_available = LEAST(quantity_total, quantity_available + OLD.quantity),
            available = TRUE
        WHERE resource_id = NEW.resource_id;
    -- Status transitioned to allocated
    ELSEIF OLD.allocation_status != 'allocated' AND NEW.allocation_status = 'allocated' THEN
        UPDATE resources
        SET quantity_available = GREATEST(0, quantity_available - NEW.quantity),
            available = (quantity_available - NEW.quantity > 0)
        WHERE resource_id = NEW.resource_id;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 4: Restore Resource Inventory on Allocation Delete
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_resource_allocation_delete$$
CREATE TRIGGER trg_after_resource_allocation_delete
AFTER DELETE ON event_resource_allocations
FOR EACH ROW
BEGIN
    IF OLD.allocation_status = 'allocated' THEN
        UPDATE resources
        SET quantity_available = LEAST(quantity_total, quantity_available + OLD.quantity),
            available = TRUE
        WHERE resource_id = OLD.resource_id;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 5: Update Staff Workload & Status on Assignment Insert
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_staff_assignment_insert$$
CREATE TRIGGER trg_after_staff_assignment_insert
AFTER INSERT ON event_staff_assignments
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    SELECT COUNT(*) INTO active_count 
    FROM event_staff_assignments 
    WHERE staff_id = NEW.staff_id AND status IN ('assigned', 'accepted', 'in_progress');

    UPDATE staff
    SET events_count = events_count + 1,
        workload = LEAST(100, active_count * 25),
        status = 'assigned',
        avail = 'Assigned'
    WHERE staff_id = NEW.staff_id;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 6: Update Staff Workload & Status on Assignment Update
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_staff_assignment_update$$
CREATE TRIGGER trg_after_staff_assignment_update
AFTER UPDATE ON event_staff_assignments
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    SELECT COUNT(*) INTO active_count 
    FROM event_staff_assignments 
    WHERE staff_id = NEW.staff_id AND status IN ('assigned', 'accepted', 'in_progress');

    UPDATE staff
    SET workload = LEAST(100, active_count * 25),
        status = IF(active_count > 0, 'assigned', 'available'),
        avail = IF(active_count > 0, 'Assigned', 'Available')
    WHERE staff_id = NEW.staff_id;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 7: Auto-Initialize Event Progress Monitor on Event Creation
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_event_insert_init_monitor$$
CREATE TRIGGER trg_after_event_insert_init_monitor
AFTER INSERT ON events
FOR EACH ROW
BEGIN
    INSERT INTO event_progress_monitors (event_id, setup_percentage, registration_percentage, execution_percentage, breakdown_percentage, current_phase)
    VALUES (NEW.event_id, 0, 0, 0, 0, 'setup')
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 8: Auto-Generate Booking on Event Confirmation
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_event_status_confirmed$$
CREATE TRIGGER trg_after_event_status_confirmed
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    DECLARE new_booking_id VARCHAR(50);
    DECLARE existing_booking_count INT;
    DECLARE event_cost DECIMAL(12, 2);
    DECLARE comm_rate DECIMAL(5, 4);
    DECLARE comm_amt DECIMAL(12, 2);
    DECLARE vendor_payout DECIMAL(12, 2);

    IF NEW.status IN ('confirmed', 'approved') AND OLD.status = 'pending' THEN
        SELECT COUNT(*) INTO existing_booking_count FROM bookings WHERE event_id = NEW.event_id;
        IF existing_booking_count = 0 THEN
            SET event_cost = IF(NEW.budget > 0, NEW.budget, NEW.estimated_cost);
            SET comm_rate = 0.1000;
            SET comm_amt = ROUND(event_cost * comm_rate, 2);
            SET vendor_payout = ROUND(event_cost - comm_amt, 2);
            SET new_booking_id = CONCAT('BK', LPAD((SELECT IFNULL(MAX(CAST(SUBSTRING(booking_id, 3) AS UNSIGNED)), 0) + 1 FROM bookings), 3, '0'));

            INSERT INTO bookings (
                booking_id, event_id, event_name, client, client_id, vendor, vendor_id, 
                status, cost, advance_paid, payment_status,
                commission_rate, commission_amount, vendor_payout_amount, payout_status
            )
            VALUES (
                new_booking_id,
                NEW.event_id,
                NEW.name,
                IFNULL(NEW.client_name, 'Client'),
                NEW.client_id,
                IFNULL(NEW.vendor_name, 'Vendor'),
                NEW.vendor_id,
                'Confirmed',
                event_cost,
                0.00,
                'unpaid',
                comm_rate,
                comm_amt,
                vendor_payout,
                'pending'
            );
        END IF;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 9: Audit Trail on Event Status Change
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_audit_event_status_change$$
CREATE TRIGGER trg_audit_event_status_change
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, details)
        VALUES (
            NEW.client_id,
            'System/Client',
            'EVENT_STATUS_CHANGED',
            'EVENT',
            NEW.event_id,
            JSON_OBJECT(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'event_name', NEW.name,
                'event_date', NEW.event_date
            )
        );
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- ANALYTICAL & REPORTING VIEWS
-- ============================================================================

-- View 1: Comprehensive Event Performance Report
CREATE OR REPLACE VIEW view_event_comprehensive_report AS
SELECT
    e.event_id,
    e.name AS event_name,
    e.type AS event_type,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue_name,
    e.guest_count,
    e.status AS event_status,
    e.budget,
    e.estimated_cost,
    u.name AS client_name,
    u.email AS client_email,
    v.business_name AS vendor_name,
    IFNULL(b.cost, 0.00) AS booking_cost,
    IFNULL(b.status, 'No Booking') AS booking_status,
    COUNT(DISTINCT esa.staff_id) AS allocated_staff_count,
    COUNT(DISTINCT era.resource_id) AS allocated_resource_count,
    IFNULL(SUM(era.total_price), 0.00) AS total_resource_expense,
    COUNT(DISTINCT iss.issue_id) AS total_issues_count,
    SUM(CASE WHEN iss.status = 'open' THEN 1 ELSE 0 END) AS open_issues_count,
    pm.setup_percentage,
    pm.registration_percentage,
    pm.execution_percentage,
    pm.breakdown_percentage,
    pm.current_phase
FROM events e
LEFT JOIN users u ON e.client_id = u.user_id
LEFT JOIN vendors v ON e.vendor_id = v.vendor_id
LEFT JOIN bookings b ON e.event_id = b.event_id
LEFT JOIN event_staff_assignments esa ON e.event_id = esa.event_id
LEFT JOIN event_resource_allocations era ON e.event_id = era.event_id
LEFT JOIN issues iss ON e.event_id = iss.event_id
LEFT JOIN event_progress_monitors pm ON e.event_id = pm.event_id
GROUP BY e.event_id, e.name, e.type, e.event_date, e.start_time, e.end_time, e.venue_name, 
         e.guest_count, e.status, e.budget, e.estimated_cost, u.name, u.email, v.business_name, 
         b.cost, b.status, pm.setup_percentage, pm.registration_percentage, 
         pm.execution_percentage, pm.breakdown_percentage, pm.current_phase;

-- Legacy View Compatibility (EventReport)
CREATE OR REPLACE VIEW EventReport AS
SELECT 
    event_id,
    event_type,
    event_date,
    start_time,
    end_time,
    venue_name,
    booking_cost AS total_cost,
    allocated_staff_count AS staff_count,
    allocated_resource_count AS resources_count
FROM view_event_comprehensive_report;

-- View 2: Resource Inventory & Utilization Status
CREATE OR REPLACE VIEW view_resource_inventory_status AS
SELECT
    r.resource_id,
    r.resource_name,
    r.category,
    r.cat AS sub_category,
    r.vendor_name,
    r.quantity_total,
    r.quantity_available,
    (r.quantity_total - r.quantity_available) AS quantity_allocated,
    CASE 
        WHEN r.quantity_total > 0 THEN ROUND(((r.quantity_total - r.quantity_available) / r.quantity_total) * 100, 2)
        ELSE 0.00 
    END AS utilization_percentage,
    r.price AS unit_price,
    r.unit,
    r.available,
    r.condition_status
FROM resources r;

-- View 3: Staff Workload & Active Roster
CREATE OR REPLACE VIEW view_staff_workload_roster AS
SELECT
    s.staff_id,
    s.name AS staff_name,
    s.role AS staff_role,
    s.vendor_name,
    s.phone,
    s.email,
    s.workload AS workload_percentage,
    s.status AS availability_status,
    s.events_count AS total_assigned_events,
    COUNT(DISTINCT st.task_id) AS total_tasks,
    SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN st.status IN ('pending', 'in_progress') THEN 1 ELSE 0 END) AS pending_tasks
FROM staff s
LEFT JOIN staff_tasks st ON s.staff_id = st.staff_id
GROUP BY s.staff_id, s.name, s.role, s.vendor_name, s.phone, s.email, s.workload, s.status, s.events_count;

-- View 4: Financial Analytics Executive Summary
CREATE OR REPLACE VIEW view_financial_analytics_summary AS
SELECT
    COUNT(b.booking_id) AS total_bookings,
    IFNULL(SUM(b.cost), 0.00) AS total_gross_revenue,
    IFNULL(SUM(CASE WHEN b.status IN ('Confirmed', 'Completed', 'In Progress') THEN b.cost ELSE 0 END), 0.00) AS confirmed_revenue,
    IFNULL(SUM(CASE WHEN b.status IN ('Pending', 'Requested') THEN b.cost ELSE 0 END), 0.00) AS pending_revenue,
    IFNULL(SUM(b.commission_amount), 0.00) AS platform_commission_earned,
    IFNULL(SUM(CASE WHEN b.payout_status = 'pending' THEN b.vendor_payout_amount ELSE 0.00 END), 0.00) AS pending_vendor_payouts,
    IFNULL(SUM(CASE WHEN b.payout_status = 'settled' THEN b.vendor_payout_amount ELSE 0.00 END), 0.00) AS settled_vendor_payouts,
    IFNULL(AVG(b.cost), 0.00) AS average_booking_value,
    (SELECT COUNT(*) FROM events WHERE status = 'completed') AS completed_events_count,
    (SELECT COUNT(*) FROM events WHERE status = 'live') AS live_events_count,
    (SELECT COUNT(*) FROM issues WHERE status = 'open') AS open_issues_count
FROM bookings b;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER $$

-- Procedure: Complete and Release Event
DROP PROCEDURE IF EXISTS sp_complete_and_release_event$$
CREATE PROCEDURE sp_complete_and_release_event(IN in_event_id VARCHAR(50))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- 1. Mark Event as Completed
        UPDATE events 
        SET status = 'completed', 
            ended_at = CURRENT_TIMESTAMP 
        WHERE event_id = in_event_id;

        -- 2. Mark Booking as Completed
        UPDATE bookings 
        SET status = 'Completed' 
        WHERE event_id = in_event_id;

        -- 3. Release All Allocated Resources (Trigger 3 will automatically restore quantity_available)
        UPDATE event_resource_allocations 
        SET allocation_status = 'released', 
            released_at = CURRENT_TIMESTAMP 
        WHERE event_id = in_event_id;

        -- 4. Complete All Staff Assignments (Trigger 6 will automatically recalculate staff workload)
        UPDATE event_staff_assignments 
        SET status = 'completed', 
            completed_at = CURRENT_TIMESTAMP 
        WHERE event_id = in_event_id;

        -- 5. Mark Event Progress as Concluded
        UPDATE event_progress_monitors 
        SET setup_percentage = 100, 
            registration_percentage = 100, 
            execution_percentage = 100, 
            breakdown_percentage = 100, 
            current_phase = 'concluded' 
        WHERE event_id = in_event_id;

        -- 6. Log completion in Activity Log
        INSERT INTO activity_logs (action, entity_type, entity_id, details)
        VALUES ('EVENT_COMPLETED_AND_RELEASED', 'EVENT', in_event_id, JSON_OBJECT('event_id', in_event_id, 'timestamp', CURRENT_TIMESTAMP));

    COMMIT;
END$$

DELIMITER ;

-- ============================================================================
-- SEED DATA (100% Matching Backend & Domain Requirements)
-- ============================================================================

-- 1. Seed Users
INSERT INTO users (user_id, name, email, phone_number, role, status, created_at, password_hash) VALUES
('U001', 'Aarav Mehta', 'aarav.admin@checkmate.com', '+1 555-1001', 'Admin', 'Active', '2026-01-15 00:00:00', '$2b$10$AaravHashedPasswordPlaceholder2026'),
('U002', 'Sarah Williams', 'sarah@eliteevents.com', '+1 555-1002', 'Vendor', 'Active', '2026-02-20 00:00:00', '$2b$10$SarahHashedPasswordPlaceholder2026'),
('U003', 'Mike Johnson', 'mike.staff@eliteevents.com', '+1 555-1003', 'Staff', 'Active', '2026-03-10 00:00:00', '$2b$10$MikeHashedPasswordPlaceholder2026'),
('U004', 'Emily Carter', 'emily.client@example.com', '+1 555-1004', 'Client', 'Active', '2026-03-15 00:00:00', '$2b$10$EmilyHashedPasswordPlaceholder2026'),
('U005', 'Nina Patel', 'nina.ops@checkmate.com', '+1 555-1005', 'Superuser', 'Active', '2026-04-01 00:00:00', '$2b$10$NinaHashedPasswordPlaceholder2026')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Vendors
INSERT INTO vendors (vendor_id, user_id, business_name, category, category_class, rating, approval_status) VALUES
('V001', 'U002', 'Elite Events Co.', 'Full-Service Planning', 'active', 4.90, 'Approved'),
('V002', NULL, 'Dream Events Ltd.', 'Audio & Staging', 'active', 4.80, 'Approved'),
('V003', NULL, 'Premium Catering', 'Catering & Hospitality', 'blue', 4.50, 'Pending'),
('V004', NULL, 'Sound & Lighting Pro', 'AV Equipment', 'active', 4.70, 'Approved')
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name);

-- 3. Seed Venues
INSERT INTO venues (venue_id, vendor_id, venue_name, location, address, capacity, price_per_day, availability_status) VALUES
('VN001', 'V002', 'Convention Center', 'Downtown Metro', '100 Exhibition Blvd', 1500, 5000.00, 'AVAILABLE'),
('VN002', 'V001', 'Grand Hotel Ballroom', 'City Center', '45 Grand Avenue', 300, 3500.00, 'AVAILABLE'),
('VN003', 'V001', 'Skyline Ballroom', 'Uptown Tower', '770 Skyline Dr', 400, 4200.00, 'AVAILABLE'),
('VN004', 'V004', 'City Park Amphitheatre', 'North Park', '12 Parkside Way', 2000, 6000.00, 'AVAILABLE')
ON DUPLICATE KEY UPDATE venue_name=VALUES(venue_name);

-- 4. Seed Resource Categories
INSERT INTO resource_categories (category_id, category_name, code, description) VALUES
(1, 'Equipment', 'EQUIPMENT', 'Audio, visual, and electronic stage gear'),
(2, 'Furniture', 'FURNITURE', 'Tables, banquet chairs, and seating configurations'),
(3, 'Decor', 'DECOR', 'Floral, centerpieces, drapery, and styling assets'),
(4, 'Catering', 'CATERING', 'Food and beverage serving and kitchenware'),
(5, 'Lighting', 'LIGHTING', 'Ambient, stage, and dynamic LED fixtures')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

-- 5. Seed Resources
INSERT INTO resources (resource_id, vendor_id, vendor_name, category_id, category, cat, resource_name, description, quantity_total, quantity_available, price, unit, available, condition_status) VALUES
('R001', 'V002', 'Dream Events Ltd.', 1, 'Equipment', 'Audio', 'Audio System Premium', 'Full concert audio rig with wireless mics and line array', 12, 12, 500.00, 'day', TRUE, 'Ready'),
('R002', 'V001', 'Elite Events Co.', 1, 'Equipment', 'Visual', 'LED Screen 4K', 'High-definition modular LED screen panel array', 8, 8, 300.00, 'day', TRUE, 'Ready'),
('R003', 'V001', 'Elite Events Co.', 2, 'Furniture', 'Furniture', 'Round Banquet Tables', '10-seater round wooden banquet tables with linens', 40, 40, 25.00, 'day', TRUE, 'Ready'),
('R004', 'V004', 'Sound & Lighting Pro', 1, 'Equipment', 'Visual', 'Stage Lighting Rig', 'Automated moving head spotlight and trussing system', 5, 0, 800.00, 'day', FALSE, 'Maintenance'),
('R005', 'V001', 'Elite Events Co.', 3, 'Decor', 'Decoration', 'Floral Centrepieces', 'Curated fresh flower arrangements in crystal vases', 60, 60, 15.00, 'day', TRUE, 'Ready')
ON DUPLICATE KEY UPDATE resource_name=VALUES(resource_name);

-- 6. Seed Staff
INSERT INTO staff (staff_id, user_id, vendor_id, vendor_name, name, initials, role, phone, email, workload, status, avail, avatar, events_count) VALUES
('S001', 'U003', 'V001', 'Elite Events Co.', 'Mike Johnson', 'MJ', 'Event Coordinator', '+1 555-1003', 'mike.staff@eliteevents.com', 40, 'available', 'Available', 'pink', 3),
('S002', NULL, 'V001', 'Elite Events Co.', 'Alex Johnson', 'AJ', 'Sound Engineer', '+1 234-567-8901', 'alex@eliteevents.com', 60, 'assigned', 'Assigned', 'teal', 5),
('S003', NULL, 'V004', 'Sound & Lighting Pro', 'David Chen', 'DC', 'Lighting Technician', '+1 555-2004', 'david@soundlight.com', 20, 'available', 'Available', 'purple', 2),
('S004', NULL, 'V001', 'Elite Events Co.', 'Sophia Martinez', 'SM', 'Decorator & Stylist', '+1 555-3005', 'sophia@eliteevents.com', 0, 'available', 'Available', 'green', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Seed Preset Packages
INSERT INTO preset_packages (package_id, vendor_id, vendor_name, name, category, price, duration_hours, capacity, description, status) VALUES
('P001', 'V001', 'Elite Events Co.', 'Elegant Wedding Package', 'Wedding', 4500.00, 8, '100-300', 'Complete wedding package with premium decorations, catering support, and full day coordination.', 'approved'),
('P002', 'V001', 'Elite Events Co.', 'Birthday Celebration Special', 'Birthday', 1200.00, 5, '30-80', 'Vibrant birthday party setup with decorations, catering stations, and audio support.', 'approved'),
('P003', 'V002', 'Dream Events Ltd.', 'Professional Conference Setup', 'Conference', 3800.00, 10, '100-500', 'Conference package with AV equipment, seating, registration desks, and projectors.', 'approved'),
('P004', 'V001', 'Elite Events Co.', 'Corporate Gala Evening', 'Corporate', 6200.00, 12, '100-300', 'Premium corporate event package with elegant ambiance, executive tables, stage, and MC.', 'approved')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 8. Seed Package Resource Items
INSERT INTO package_resource_items (package_id, resource_name, quantity) VALUES
('P001', 'Banquet Chairs (250)', 250),
('P001', 'Round Tables (30)', 30),
('P001', 'Floral Arrangements', 30),
('P001', 'Lighting Rig', 1),
('P001', 'Audio System', 1),
('P002', 'Banquet Chairs (80)', 80),
('P002', 'Party Tables (10)', 10),
('P002', 'Balloon Decorations', 5),
('P002', 'Sound System', 1),
('P003', 'Conference Chairs (500)', 500),
('P003', 'LED Screens (3)', 3),
('P003', 'Registration Desk', 2),
('P003', 'Projectors', 2),
('P004', 'Premium Seating (300)', 300),
('P004', 'Ambient Lighting', 1),
('P004', 'Executive Tables (40)', 40),
('P004', 'Stage', 1);

-- 9. Seed Package Staff Requirements
INSERT INTO package_staff_requirements (package_id, role, count) VALUES
('P001', 'Event Coordinator', 1),
('P001', 'Photographer', 1),
('P002', 'Event Coordinator', 1),
('P002', 'DJ', 1),
('P003', 'Event Manager', 1),
('P003', 'Audio/Visual Technicians', 3),
('P004', 'Event Director', 1),
('P004', 'Professional MC', 1),
('P004', 'Security', 2);

-- 10. Seed Events
INSERT INTO events (event_id, client_id, client_name, vendor_id, vendor_name, venue_id, package_id, name, type, event_date, start_time, end_time, venue_name, people_count, guest_count, budget, estimated_cost, status, created_by) VALUES
('EVT001', 'U004', 'Tech Corp', 'V002', 'Dream Events Ltd.', 'VN001', 'P003', 'Tech Summit 2026', 'Conference', '2026-05-10', '09:00:00', '18:00:00', 'Convention Center', 500, 500, 45000.00, 45000.00, 'pending', 'client'),
('EVT002', 'U004', 'Sarah Ahmed', 'V001', 'Elite Events Co.', 'VN002', 'P001', 'Sarah and Mike Wedding', 'Wedding', '2026-05-18', '18:00:00', '23:30:00', 'Grand Hotel Ballroom', 150, 150, 25000.00, 25000.00, 'confirmed', 'client'),
('EVT003', 'U004', 'Emily Carter', 'V001', 'Elite Events Co.', 'VN003', 'P004', 'Annual Corporate Gala', 'Corporate', '2026-05-21', '19:30:00', '23:00:00', 'Skyline Ballroom', 320, 320, 18000.00, 18000.00, 'live', 'client'),
('EVT004', 'U004', 'City Arts Trust', 'V004', 'Sound & Lighting Pro', 'VN004', NULL, 'Music Festival', 'Conference', '2026-06-05', '12:00:00', '22:00:00', 'City Park Amphitheatre', 800, 800, 52000.00, 52000.00, 'pending', 'client')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 11. Seed Venue Allocations
INSERT INTO venue_allocations (event_id, venue_id, start_time, end_time, allocation_status) VALUES
('EVT001', 'VN001', '2026-05-10 07:00:00', '2026-05-10 20:00:00', 'pending'),
('EVT002', 'VN002', '2026-05-18 15:00:00', '2026-05-19 01:00:00', 'allocated'),
('EVT003', 'VN003', '2026-05-21 16:00:00', '2026-05-22 01:00:00', 'allocated'),
('EVT004', 'VN004', '2026-06-05 08:00:00', '2026-06-06 02:00:00', 'pending')
ON DUPLICATE KEY UPDATE allocation_status=VALUES(allocation_status);

-- 12. Seed Bookings
INSERT INTO bookings (booking_id, event_id, event_name, client, client_id, vendor, vendor_id, status, cost, advance_paid, payment_status, commission_rate, commission_amount, vendor_payout_amount, payout_status, settled_at, settled_by, created_at) VALUES
('BK001', 'EVT002', 'Sarah and Mike Wedding', 'Sarah Ahmed', 'U004', 'Elite Events Co.', 'V001', 'Confirmed', 25000.00, 10000.00, 'partially_paid', 0.1000, 2500.00, 22500.00, 'pending', NULL, NULL, '2026-03-01 00:00:00'),
('BK002', 'EVT003', 'Annual Corporate Gala', 'Emily Carter', 'U004', 'Elite Events Co.', 'V001', 'In Progress', 18000.00, 18000.00, 'paid', 0.1000, 1800.00, 16200.00, 'pending', NULL, NULL, '2026-03-20 00:00:00'),
('BK003', 'EVT001', 'Tech Summit 2026', 'Tech Corp', 'U004', 'Dream Events Ltd.', 'V002', 'Pending', 45000.00, 0.00, 'unpaid', 0.1000, 4500.00, 40500.00, 'pending', NULL, NULL, '2026-04-01 00:00:00'),
('BK004', 'EVT006', '25th Anniversary Banquet', 'Emily Carter', 'U004', 'Elite Events Co.', 'V001', 'Completed', 22000.00, 22000.00, 'paid', 0.1000, 2200.00, 19800.00, 'settled', '2026-05-02 14:30:00', 'U001', '2026-04-20 00:00:00')
ON DUPLICATE KEY UPDATE event_name=VALUES(event_name);

-- 13. Seed Vendor Applications
INSERT INTO vendor_applications (application_id, vendor_name, business_name, email, phone, category, category_class, status, submitted_at) VALUES
('VAPP001', 'Priya Nair', 'Aurora Event Studio', 'priya@auroraevents.com', '+1 555-0101', 'Event Planning', 'active', 'pending', '2026-04-25 10:15:00'),
('VAPP002', 'Daniel Reyes', 'Reyes Catering Collective', 'daniel@reyescatering.com', '+1 555-0115', 'Catering', 'blue', 'pending', '2026-04-27 14:40:00')
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name);

-- 14. Seed Vendor Documents
INSERT INTO vendor_documents (application_id, document_name, document_type, file_path, verified_status) VALUES
('VAPP001', 'business-license.pdf', 'license', '/uploads/docs/aurora-license.pdf', 'pending'),
('VAPP001', 'insurance-certificate.pdf', 'insurance', '/uploads/docs/aurora-insurance.pdf', 'pending'),
('VAPP002', 'food-safety-license.pdf', 'license', '/uploads/docs/reyes-food-safety.pdf', 'pending');

-- 15. Seed Staff Assignments
INSERT INTO event_staff_assignments (assignment_id, event_id, staff_id, staff_name, staff_role, event_name, event_date, event_venue, event_people, role, task_desc, priority, status) VALUES
('A001', 'EVT003', 'S001', 'Mike Johnson', 'Event Coordinator', 'Annual Corporate Gala', '2026-05-21', 'Skyline Ballroom', 320, 'Event Coordinator', 'Oversee main stage setup, guest arrival, and live timeline execution', 'High', 'accepted'),
('A002', 'EVT003', 'S002', 'Alex Johnson', 'Sound Engineer', 'Annual Corporate Gala', '2026-05-21', 'Skyline Ballroom', 320, 'Sound Engineer', 'Operate main sound console and coordinate wireless microphone channels', 'High', 'in_progress')
ON DUPLICATE KEY UPDATE event_name=VALUES(event_name);

-- 16. Seed Staff Tasks
INSERT INTO staff_tasks (assignment_id, event_id, staff_id, event_name, title, description, priority, status, due_time, is_done) VALUES
('A001', 'EVT003', 'S001', 'Annual Corporate Gala', 'Verify VIP Registration Desk', 'Ensure badge printers and registration lists are active', 'High', 'completed', '18:30:00', TRUE),
('A001', 'EVT003', 'S001', 'Annual Corporate Gala', 'Coordinate Catering Dinner Rollout', 'Synchronize main course service with keynote address timing', 'Medium', 'in_progress', '20:00:00', FALSE),
('A002', 'EVT003', 'S002', 'Annual Corporate Gala', 'Wireless Mic Frequency Check', 'Perform sweep for RF interference across ballroom channels', 'Urgent', 'completed', '17:00:00', TRUE);

-- 17. Seed Event Progress Monitors
INSERT INTO event_progress_monitors (event_id, setup_percentage, registration_percentage, execution_percentage, breakdown_percentage, current_phase) VALUES
('EVT001', 85, 65, 40, 0, 'registration'),
('EVT002', 0, 0, 0, 0, 'setup'),
('EVT003', 100, 100, 90, 10, 'execution'),
('EVT004', 0, 0, 0, 0, 'setup')
ON DUPLICATE KEY UPDATE setup_percentage=VALUES(setup_percentage);

-- 18. Seed Issues
INSERT INTO issues (issue_id, event_id, event_name, title, category, priority, severity, description, reporter, reporter_role, reporter_email, target, status) VALUES
('ISS001', 'EVT003', 'Annual Corporate Gala', 'Lighting rig power fluctuation', 'Equipment', 'High', 'high', 'Main stage lights flicker intermittently when LED wall operates at full luminance.', 'Sarah Williams', 'Vendor', 'sarah@eliteevents.com', 'admin', 'open')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 19. Seed Contingency Plans
INSERT INTO contingency_plans (plan_id, event_id, problem, trigger_condition, solution, status) VALUES
('CP_DEF_001', NULL, 'Weather Emergency', 'Severe weather alert issued by local meteorological department', 'Deploy indoor backup ballroom and covered walkways within 45 minutes.', 'ready'),
('CP_DEF_002', NULL, 'Power Outage', 'Main utility electrical grid disruption', 'Activate secondary 250kVA diesel backup generators with auto-transfer switch.', 'ready'),
('CP_DEF_003', NULL, 'Staff No-Show', 'Assigned key personnel uncontactable >30 minutes past call time', 'Deploy standby coordinator from local reserve roster pool.', 'ready'),
('CP_EVT003_01', 'EVT003', 'LED Wall Controller Lag', 'Frame drop or display latency detected during rehearsal', 'Switch to hot-standby Novastar video processor backup feed.', 'ready')
ON DUPLICATE KEY UPDATE problem=VALUES(problem);

-- 20. Seed Message Threads & Messages
INSERT INTO message_threads (thread_id, thread_type, title, event_id) VALUES
('vendor-vendor', 'group', 'Vendor Operations Group', NULL),
('vendor-client', 'direct', 'Client Coordination', 'EVT003'),
('vendor-staff', 'group', 'Staff Operational Channel', 'EVT003')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO messages (message_id, thread_id, sender, initials, self, text, avatar) VALUES
('MSG001', 'vendor-vendor', 'Alex Johnson', 'AJ', FALSE, 'Tech Summit setup is confirmed for tomorrow at 7:30 AM.', 'pink'),
('MSG002', 'vendor-vendor', 'Sarah Williams', 'SW', TRUE, 'Great. I will confirm the resource allocation now.', 'teal'),
('MSG003', 'vendor-client', 'Emily Carter', 'EC', FALSE, 'Can we add two more registration desks?', 'blue'),
('MSG004', 'vendor-client', 'Sarah Williams', 'SW', TRUE, 'Yes, adding 2 registration tables and badges now.', 'teal');

-- 21. Seed Activity Logs
INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, details) VALUES
('U001', 'Admin', 'SYSTEM_INITIALIZED', 'SYSTEM', 'SYS_INIT', JSON_OBJECT('version', '2.0.0', 'status', 'SUCCESS')),
('U004', 'Client', 'EVENT_CREATED', 'EVENT', 'EVT003', JSON_OBJECT('name', 'Annual Corporate Gala', 'budget', 18000.00));

-- ============================================================================
-- END OF SCHEMA DEFINITION
-- ============================================================================
