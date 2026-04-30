-- ============================================
-- Event Management System Database
-- ============================================
CREATE DATABASE IF NOT EXISTS EventManagement;

USE EventManagement;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    role ENUM('admin', 'client', 'vendor', 'staff') NOT NULL,
    status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VENDORS
-- ============================================
CREATE TABLE Vendor (
    vendor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rating DECIMAL(2, 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- STAFF
-- ============================================
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    availability_status ENUM('available', 'assigned', 'inactive') DEFAULT 'available',
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id) ON DELETE CASCADE
);

-- ============================================
-- VENUE
-- ============================================
CREATE TABLE Venue (
    venue_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    venue_name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT,
    price_per_day DECIMAL(10, 2),
    availability_status ENUM('AVAILABLE', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id) ON DELETE CASCADE
);

-- ============================================
-- EVENT
-- ============================================
CREATE TABLE Event (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guest_count INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- ============================================
-- VENUE ALLOCATION
-- ============================================
CREATE TABLE VenueAllocation (
    event_id INT NOT NULL,
    venue_id INT NOT NULL,
    allocation_status ENUM('pending', 'allocated', 'released') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES Venue(venue_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, venue_id)
);

-- ============================================
-- BOOKING
-- ============================================
CREATE TABLE Booking (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    vendor_id INT NOT NULL,
    status ENUM(
        'requested',
        'approved',
        'rejected',
        'completed',
        'cancelled'
    ) DEFAULT 'requested',
    total_cost DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id) ON DELETE CASCADE
);

-- ============================================
-- RESOURCE CATEGORY
-- ============================================
CREATE TABLE ResourceCategory (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- ============================================
-- RESOURCE
-- ============================================
CREATE TABLE Resource (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    resource_name VARCHAR(150) NOT NULL,
    description TEXT,
    price_type ENUM('PER_HEAD', 'PER_DAY', 'FLAT'),
    price DECIMAL(10, 2) NOT NULL,
    availability_status ENUM('AVAILABLE', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id),
    FOREIGN KEY (category_id) REFERENCES ResourceCategory(category_id)
);

-- ============================================
-- VENDOR DOCUMENT
-- ============================================
CREATE TABLE VendorDocument (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    verified_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id) ON DELETE CASCADE
);

-- ============================================
-- EVENT STAFF ASSIGNMENT
-- ============================================
CREATE TABLE EventStaffAssignment (
    event_id INT NOT NULL,
    staff_id INT NOT NULL,
    role VARCHAR(50),
    assignment_status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, staff_id)
);

-- ============================================
-- EVENT RESOURCE ALLOCATION
-- ============================================
CREATE TABLE EventResourceAllocation (
    event_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity INT NOT NULL,
    allocation_status ENUM('pending', 'allocated', 'released') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, resource_id)
);

-- ============================================
-- EVENT RESOURCE REQUIREMENT
-- ============================================
CREATE TABLE EventResourceRequirement (
    event_id INT NOT NULL,
    category_id INT NOT NULL,
    quantity_required INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ResourceCategory(category_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, category_id)
);

-- ============================================
-- EVENT STAFF REQUIREMENT
-- ============================================
CREATE TABLE EventStaffRequirement (
    event_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    required_count INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, role)
);

-- ============================================
-- EVENT REPORT VIEW
-- ============================================
CREATE VIEW EventReport AS
SELECT
    e.event_id,
    e.event_type,
    e.event_date,
    e.start_time,
    e.end_time,
    v.venue_name,
    b.total_cost,
    COUNT(DISTINCT esa.staff_id) AS staff_count,
    COUNT(DISTINCT era.resource_id) AS resources_count
FROM
    Event e
    LEFT JOIN VenueAllocation va ON e.event_id = va.event_id
    LEFT JOIN Venue v ON va.venue_id = v.venue_id
    LEFT JOIN Booking b ON e.event_id = b.event_id
    LEFT JOIN EventStaffAssignment esa ON e.event_id = esa.event_id
    LEFT JOIN EventResourceAllocation era ON e.event_id = era.event_id
GROUP BY
    e.event_id;
