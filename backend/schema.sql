-- ==========================================
-- Medicinesupply.ai - Consolidated SQL Schema
-- Supports: Inventory, AI Procurement, Expiry Tracking, Invoicing
-- ==========================================

-- 1. AUTHENTICATION & USERS
-- -------------------------
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'staff', 'pharmacist', 'admin'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disabled', 'deleted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    hospital_name VARCHAR(200),
    phone VARCHAR(20),
    city VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. INVENTORY & EXPIRY TRACKING
-- ------------------------------
DROP TABLE IF EXISTS medicines;

CREATE TABLE medicines (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    batch_number VARCHAR(50) UNIQUE NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    category VARCHAR(50), 
    stock INT DEFAULT 0, 
    price DECIMAL(10, 2), -- Sales Price
    location VARCHAR(100), 
    expiry_date DATE, 
    manufacturer VARCHAR(100),
    barcode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SALES & INVOICING (Patient/Customer)
-- ---------------------------------------
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    total_amount DECIMAL(10, 2) NOT NULL,
    user_id INT, -- The staff/admin who created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    medicine_id INT,
    quantity INT NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- 4. AI PROCUREMENT & SUPPLIER INVOICING
-- --------------------------------------
DROP TABLE IF EXISTS procurement_invoice_items;
DROP TABLE IF EXISTS procurement_invoices;
DROP TABLE IF EXISTS procurement_queue;
DROP TABLE IF EXISTS purchase_orders;

-- Staging area for AI review
CREATE TABLE procurement_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT,
    suggested_qty INT,
    final_qty INT,
    unit_price DECIMAL(10, 2), -- Cost from supplier
    total_cost DECIMAL(10, 2),
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'INVOICED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Records of finalized supplier invoices
CREATE TABLE procurement_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(10, 2),
    supplier_email VARCHAR(100),
    hospital_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE procurement_invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    medicine_id INT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    line_total DECIMAL(10, 2),
    FOREIGN KEY (invoice_id) REFERENCES procurement_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Secondary PO Tracking (Used by Barcode Scanner for direct requests)
CREATE TABLE purchase_orders (
    id VARCHAR(50) PRIMARY KEY, -- String ID for scanning sessions
    medicine_id INT,
    quantity INT,
    estimated_cost DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- 5. SYSTEM & AUDITING
-- --------------------
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS auto_procurement_queue;

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action VARCHAR(50),
    target VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- For medicines not yet in the system detected during scanning (Legacy/Auto-Proc)
CREATE TABLE IF NOT EXISTS auto_procurement_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(100),
    barcode VARCHAR(50),
    detected_quantity INT DEFAULT 1,
    reason VARCHAR(255),
    status ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_REVIEW',
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Controlled registration flow for unknown barcodes
DROP TABLE IF EXISTS medicine_registration_requests;
CREATE TABLE medicine_registration_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    medicine_name VARCHAR(100) DEFAULT 'Unknown Medicine',
    source VARCHAR(50) DEFAULT 'scanner',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_notes TEXT
);
