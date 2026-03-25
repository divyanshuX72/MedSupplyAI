const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.argv[2] || process.env.PORT || 3000;

// Import ALN Engine
const ALNEngine = require('./services/aln_engine');
const MLEngine = require('./services/ml_engine');
const CommunicationService = require('./services/communication_service');


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, '../public')));


// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'rewtrytrtyetrj3t425463253463@%#@$*#)%*@#$RHE@(#*P&%RYGBW#@(UBNFNC#$';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

// Register
// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, hospital_name, role } = req.body;

    try {
        // Check existence
        const check = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Validate Inputs
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Transaction
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert User
            const [userRes] = await connection.execute(
                'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [name, email, hash, role || 'user']
            );
            const userId = userRes.insertId;

            // Insert Profile
            await connection.execute(
                'INSERT INTO user_profiles (user_id, hospital_name) VALUES (?, ?)',
                [userId, hospital_name || 'General Hospital']
            );

            await connection.commit();
            res.status(201).json({ message: 'User registered successfully' });

        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'User not found' });

        // Check Status
        if (user.status === 'inactive' || user.status === 'disabled') {
            return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
        }

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        // Create Token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Log Login
        await db.query('INSERT INTO login_logs (user_id, ip_address) VALUES (?, ?)',
            [user.id, req.ip]);

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.role, p.hospital_name, p.city 
            FROM users u 
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
        `, [req.user.id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET: Profile Me (Specific for Admin Name Display)
app.get('/api/profile/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT name as full_name, email, role FROM users WHERE id = ?', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Basic API Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running backend!' });
});

// Serve Scanner Page
app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/scanner.html'));
});

// Database Test Route
app.get('/api/db-check', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as now');
        res.json({
            status: 'ok',
            message: 'Database connected!',
            time: result.rows[0].now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: err.message
        });
    }
});

// GET: Fetch all medicines
app.get('/api/inventory', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM medicines ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// GET: Comprehensive Analytics Dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        // Parallel execution of all analytics queries for performance
        const [
            salesSummary,
            salesTrend,
            profitAnalysis,
            categoryDist,
            topMedicines,
            revenueByMed,
            lowStock,
            expiryAlerts,
            stockMovement,
            supplierPerf,
            customerStats,
            creditAging,
            aiPredictions
        ] = await Promise.all([
            // 1. Sales Summary (30d)
            db.query(`
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COUNT(id) as total_orders,
                    COALESCE(SUM(total_amount) / NULLIF(COUNT(id), 0), 0) as avg_order_value
                FROM invoices 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `),

            // 2. Sales Trend (Last 7 days)
            db.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%b %d') as date,
                    SUM(total_amount) as amount
                FROM invoices
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY 1, DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `),

            // 3. Profit Analysis (Proxy Cost: 70%)
            db.query(`
                WITH SalesData AS (
                    SELECT 
                        SUM(ii.quantity * ii.price_at_sale) as revenue,
                        SUM(ii.quantity * (m.price * 0.7)) as cost
                    FROM invoice_items ii
                    JOIN invoices i ON ii.invoice_id = i.id
                    JOIN medicines m ON ii.medicine_id = m.id
                    WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                )
                SELECT 
                    COALESCE((revenue - cost), 0) as total_profit,
                    COALESCE(((revenue - cost) / NULLIF(revenue, 0)) * 100, 0) as profit_margin
                FROM SalesData
            `),

            // 4. Category Distribution
            db.query(`SELECT category, COUNT(*) as count FROM medicines GROUP BY category`),

            // 5. Top 10 Selling Medicines
            db.query(`
                SELECT m.name, SUM(ii.quantity) as total_qty, SUM(ii.quantity * ii.price_at_sale) as total_revenue
                FROM invoice_items ii
                JOIN medicines m ON ii.medicine_id = m.id
                GROUP BY m.name
                ORDER BY total_qty DESC
                LIMIT 10
            `),

            // 6. Revenue by Medicine
            db.query(`
                SELECT m.name, SUM(ii.quantity * ii.price_at_sale) as revenue
                FROM invoice_items ii
                JOIN medicines m ON ii.medicine_id = m.id
                GROUP BY m.name
                ORDER BY revenue DESC
                LIMIT 10
            `),

            // 7. Low Stock Alerts
            db.query(`SELECT name, stock, batch_number as code FROM medicines WHERE stock < 50 ORDER BY stock ASC LIMIT 20`),

            // 8. Expiry Alerts
            db.query(`
                SELECT 
                    name, expiry_date,
                    DATEDIFF(expiry_date, CURRENT_DATE) as days_remaining,
                    CASE 
                        WHEN expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'Critical'
                        WHEN expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY) THEN 'Warning'
                        ELSE 'Safe'
                    END as status
                FROM medicines
                WHERE expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
                ORDER BY days_remaining ASC
            `),

            // 9. Fast vs Slow Moving
            db.query(`
                WITH RecentSales AS (
                    SELECT medicine_id, SUM(quantity) as sold_qty
                    FROM invoice_items ii
                    JOIN invoices i ON ii.invoice_id = i.id
                    WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY medicine_id
                )
                SELECT m.name, m.stock, COALESCE(rs.sold_qty, 0) as velocity,
                    CASE 
                        WHEN COALESCE(rs.sold_qty, 0) > 50 THEN 'Fast'
                        WHEN COALESCE(rs.sold_qty, 0) < 5 AND m.stock > 100 THEN 'Slow'
                        ELSE 'Normal'
                    END as movement
                FROM medicines m
                LEFT JOIN RecentSales rs ON m.id = rs.medicine_id
                WHERE m.stock > 0
                ORDER BY velocity DESC
            `),

            // 10. Supplier Performance
            db.query(`
                SELECT manufacturer as name, COUNT(*) as product_count, AVG(price) as avg_price, 98 as delivery_score
                FROM medicines
                GROUP BY manufacturer
                LIMIT 5
            `),

            // 11. Customer Analytics
            db.query(`
                WITH CustomerStats AS (
                    SELECT customer_name, COUNT(*) as orders FROM invoices GROUP BY customer_name
                )
                SELECT COUNT(*) as total_customers, SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END) as repeat_customers FROM CustomerStats
            `),

            // 12. Credit Aging (Placeholder for now as no credit table)
            Promise.resolve({ rows: [] }),

            // 13. AI Predictions (ALN Engine) & Auto-Procurement Trigger
            (async () => {
                const meds = await db.query('SELECT * FROM medicines');
                let predictions = [];

                // Process each medicine for alerts and procurement
                for (const m of meds.rows) {
                    // 1. Generate visual alerts for the dashboard
                    const itemAlerts = ALNEngine.analyzeItem(m);
                    predictions = [...predictions, ...itemAlerts];

                    // 2. Trigger Auto-Procurement Decision
                    const decision = ALNEngine.decideProcurement(m);
                    if (decision) {
                        try {
                            // Check if a PENDING order already exists in the UNIFIED auto_procurement_queue
                            // We use source='AI_LOW_STOCK' to identify these
                            const existing = await db.query(
                                'SELECT id FROM auto_procurement_queue WHERE medicine_name = ? AND status = "PENDING_REVIEW"',
                                [m.name]
                            );

                            if (existing.rows.length === 0) {
                                // Insert into Unified Queue
                                await db.query(
                                    `INSERT INTO auto_procurement_queue (medicine_name, barcode, detected_quantity, reason, status, source)
                                     VALUES (?, ?, ?, ?, ?, ?)`,
                                    [
                                        m.name,
                                        m.barcode || 'N/A',
                                        decision.quantity,
                                        `Low Stock (Current: ${m.stock}, Threshold: ${m.min_stock || 10})`,
                                        'PENDING_REVIEW',
                                        'AI_LOW_STOCK'
                                    ]
                                );
                                console.log(`[ALN] Unified Queue Item Generated for ${m.name}`);
                            }
                        } catch (err) {
                            console.error('[ALN] Unified procurement error:', err);
                        }
                    }
                }
                return predictions.slice(0, 6);
            })()
        ]);

        // Construct Response Object
        const responseData = {
            summary: {
                sales: parseFloat(salesSummary.rows[0]?.total_sales || 0),
                orders: parseInt(salesSummary.rows[0]?.total_orders || 0),
                avgOrderValue: parseFloat(salesSummary.rows[0]?.avg_order_value || 0)
            },
            profit: {
                total: parseFloat(profitAnalysis.rows[0]?.total_profit || 0),
                margin: parseFloat(profitAnalysis.rows[0]?.profit_margin || 0)
            },
            charts: {
                salesTrend: salesTrend.rows,
                categories: categoryDist.rows,
                revenueByMedicine: revenueByMed.rows,
                expiryDistribution: expiryAlerts.rows, // Re-use expiry data for chart
                creditAging: creditAging.rows
            },
            lists: {
                topMedicines: topMedicines.rows,
                lowStock: lowStock.rows,
                expiry: expiryAlerts.rows,
                fastSlowStock: stockMovement.rows,
                suppliers: supplierPerf.rows,
                customers: {
                    total: parseInt(customerStats.rows[0]?.total_customers || 0),
                    repeat: parseInt(customerStats.rows[0]?.repeat_customers || 0)
                },
                predictions: aiPredictions || [] // New Field
            }
        };

        res.json(responseData);

    } catch (err) {
        console.error('Analytics Dashboard Error:', err);
        res.status(500).json({ error: 'Failed to generate analytics dashboard' });
    }
});

// POST: Add new medicine
app.post('/api/inventory', async (req, res) => {
    const { name, category, stock, price, location, expiry, manufacturer, batch, barcode } = req.body;

    // Basic validation
    if (!name || !batch) {
        return res.status(400).json({ error: 'Name and Batch Number are required' });
    }

    // Transaction Start
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get or Create Master Medicine
        // Logic: Check if Master exists by Name + Manufacturer
        let [medicine] = await connection.execute(
            'SELECT id FROM medicines WHERE name = ? AND manufacturer = ?',
            [name, manufacturer]
        );

        let medicineId;
        if (medicine.length === 0) {
            const [res] = await connection.execute(
                'INSERT INTO medicines (name, category, manufacturer, price) VALUES (?, ?, ?, ?)',
                [name, category, manufacturer, price]
            );
            medicineId = res.insertId;
        } else {
            medicineId = medicine[0].id;
        }

        // 2. Insert Batch
        // Link barcode ↔ batch_number ↔ medicine_id
        const finalBatch = batch; // Frontend sends 'batch'

        const [batchRes] = await connection.execute(`
            INSERT INTO medicine_batches 
            (medicine_id, batch_number, barcode, quantity, location, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [medicineId, finalBatch, barcode, stock, location, expiry]);

        await connection.commit();

        res.status(201).json({
            id: batchRes.insertId,
            medicine_id: medicineId,
            name,
            batch: finalBatch,
            message: 'Medicine and batch added successfully'
        });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to add medicine', details: err.message });
    } finally {
        connection.release();
    }
});

// PUT: Update medicine
app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, stock, price, location, expiry, manufacturer, batch, barcode } = req.body;

    if (!name || !batch) {
        return res.status(400).json({ error: 'Name and Batch Number are required' });
    }

    try {
        const query = `
            UPDATE medicines 
            SET name = ?, category = ?, stock = ?, price = ?, location = ?, expiry_date = ?, manufacturer = ?, batch_number = ?, barcode = ?
            WHERE id = ?
        `;
        const values = [name, category, stock, price, location, expiry, manufacturer, batch, barcode || null, id];
        const result = await db.query(query, values);

        if (result.rowCount === 0) { // Changed from rows.length for UPDATE
            return res.status(404).json({ error: 'Medicine not found' });
        }

        const updatedItem = await db.query('SELECT * FROM medicines WHERE id = ?', [id]);
        res.json(updatedItem.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update medicine', details: err.message });
    }
});

// GET: Fetch by Barcode (New Endpoint)
app.get('/api/inventory/scan/:barcode', async (req, res) => {
    const { barcode } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                mb.id, 
                mb.batch_number, 
                mb.barcode, 
                mb.quantity as stock, 
                m.price, 
                mb.expiry_date, 
                mb.location, 
                m.name, 
                m.category, 
                m.manufacturer,
                m.id as medicine_master_id
            FROM medicine_batches mb
            JOIN medicines m ON m.id = mb.medicine_id
            WHERE mb.barcode = ?
        `, [barcode]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            // Fallback: Check if barcode exists in Master (Migrated legacy or error)
            const masterCheck = await db.query('SELECT * FROM medicines WHERE barcode = ?', [barcode]);
            if (masterCheck.rows.length > 0) {
                res.json(masterCheck.rows[0]);
            } else {
                res.status(404).json({ error: 'Medicine not found' });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch medicine' });
    }
});


// POST: Seed Database
app.post('/api/seed', async (req, res) => {
    try {
        // Check if DB is empty
        const countResult = await db.query('SELECT COUNT(*) as count FROM medicines');
        const count = parseInt(countResult.rows[0].count);

        if (count > 0) {
            return res.json({ message: 'Database already has data', count });
        }

        console.log('Seeding database with sample data...');

        // Insert sample data
        for (const med of SAMPLE_MEDICINES) {
            const query = `
                INSERT INTO medicines (batch_number, name, category, stock, price, location, expiry_date, manufacturer)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [med.batch, med.name, med.category, med.stock, med.price, med.location, med.expiry, med.manufacturer];
            await db.query(query, values);
        }

        res.json({ message: 'Database seeded successfully', seededCount: SAMPLE_MEDICINES.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to seed database' });
    }
});

// Initialize Database Schema on Start
const initDB = async () => {
    try {
        // 1. Authentication & Users
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
             CREATE TABLE IF NOT EXISTS user_profiles (
                user_id INT PRIMARY KEY,
                hospital_name VARCHAR(200),
                phone VARCHAR(20),
                city VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
             CREATE TABLE IF NOT EXISTS login_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 2. Inventory & Expiry Tracking
        await db.query(`
             CREATE TABLE IF NOT EXISTS medicines (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                batch_number VARCHAR(50) UNIQUE NOT NULL, 
                name VARCHAR(100) NOT NULL, 
                category VARCHAR(50), 
                stock INT DEFAULT 0, 
                price DECIMAL(10, 2), 
                location VARCHAR(100), 
                expiry_date DATE, 
                manufacturer VARCHAR(100),
                barcode VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Sales & Invoicing
        await db.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(100),
                total_amount DECIMAL(10, 2) NOT NULL,
                user_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 3. Sales & Invoicing (Consolidated)
        // Note: Invoices table dropped in cleanup. Future: Re-implement if needed.

        // 4. AI Procurement & Supplier Invoicing
        // Unified into auto_procurement_queue
        await db.query(`
             CREATE TABLE IF NOT EXISTS auto_procurement_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                medicine_name VARCHAR(100),
                barcode VARCHAR(50),
                detected_quantity INT DEFAULT 1,
                reason VARCHAR(255),
                status ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_REVIEW',
                source VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                branch_id INT DEFAULT 1
            )
        `);

        await db.query(`
             CREATE TABLE IF NOT EXISTS purchase_orders (
                id VARCHAR(50) PRIMARY KEY,
                medicine_id INT,
                quantity INT,
                estimated_cost DECIMAL(10, 2),
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES medicines(id)
            )
        `);

        // 5. System & Auditing
        await db.query(`
             CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT,
                action VARCHAR(50),
                target VARCHAR(100),
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);

        await db.query(`
             CREATE TABLE IF NOT EXISTS auto_procurement_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                medicine_name VARCHAR(100),
                barcode VARCHAR(50),
                detected_quantity INT DEFAULT 1,
                reason VARCHAR(255),
                status ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_REVIEW',
                source VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables Verified');

        // Step 2: Explicit Migration 
        // Add barcode column if missing - MySQL syntax
        try {
            await db.query(`SELECT barcode FROM medicines LIMIT 1`);
        } catch (e) {
            await db.query(`ALTER TABLE medicines ADD COLUMN barcode VARCHAR(50);`);
        }

        // Add role column if missing
        try {
            await db.query(`SELECT role FROM users LIMIT 1`);
        } catch (e) {
            await db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';`);
        }

        console.log('>>> MIGRATION SUCCESSFUL: Schema Updated <<<');

    } catch (err) {
        console.error('Schema Init Failed:', err);
        process.exit(1); // Exit if DB init fails
    }
};


// --- ADMIN MIDDLEWARE ---
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: Admins Only' });
    }
};

// --- ADMIN ROUTES ---

// GET: Admin Dashboard Stats
app.get('/api/admin/dashboard', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const [users, medicines, lowStock, pendingOrders] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM users'),
            db.query('SELECT COUNT(*) as count FROM medicines'),
            db.query('SELECT COUNT(*) as count FROM medicines WHERE stock < 20'),
            db.query('SELECT COUNT(*) as count FROM purchase_orders WHERE status = "Pending"')
        ]);

        res.json({
            users: users.rows[0].count,
            medicines: medicines.rows[0].count,
            lowStock: lowStock.rows[0].count,
            pendingOrders: pendingOrders.rows[0].count
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// GET: All Users (excluding deleted)
app.get('/api/admin/users', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, email, role, status, created_at FROM users WHERE status != 'deleted' ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET: User Statistics
app.get('/api/admin/users/stats', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const [total, active, admin, staff] = await Promise.all([
            db.query("SELECT COUNT(*) as count FROM users WHERE status != 'deleted'"),
            db.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
            db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status != 'deleted'"),
            db.query("SELECT COUNT(*) as count FROM users WHERE role IN ('staff', 'user') AND status != 'deleted'")
        ]);

        res.json({
            total: total.rows[0].count,
            active: active.rows[0].count,
            admin: admin.rows[0].count,
            staff: staff.rows[0].count
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});

// POST: Create New User (Admin)
app.post('/api/admin/users', authenticateToken, verifyAdmin, async (req, res) => {
    const { name, email, password, role, hospital_name } = req.body;

    try {
        // Validation
        if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

        const check = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hash = await bcrypt.hash(password, 10);

        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            const [userRes] = await connection.execute(
                'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
                [name, email, hash, role || 'user', 'active']
            );

            await connection.execute(
                'INSERT INTO user_profiles (user_id, hospital_name) VALUES (?, ?)',
                [userRes.insertId, hospital_name || 'General Hospital']
            );

            await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
                [req.user.id, 'CREATE_USER', `User ${email}`, `Created new ${role}`]);

            await connection.commit();
            res.status(201).json({ message: 'User created successfully' });

        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DELETE: Soft Delete User
app.delete('/api/admin/users/:id', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    try {
        await db.query("UPDATE users SET status = 'deleted' WHERE id = ?", [id]);

        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DELETE_USER', `User ${id}`, 'Soft deleted user']);

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PATCH: Update User Role
app.patch('/api/admin/users/:id/role', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'staff', 'pharmacist', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPDATE_ROLE', `User ${id}`, `Changed role to ${role}`]);

        res.json({ message: 'User role updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// GET: Enhanced Procurement Queue
// FIXED: Query auto_procurement_queue where data actually exists (21 records with PENDING_REVIEW status)
app.get('/api/admin/procurement-queue', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        // Query auto_procurement_queue for unregistered medicines detected during scanning
        const result = await db.query(`
            SELECT 
                id,
                medicine_name,
                barcode,
                detected_quantity as suggested_qty,
                detected_quantity as final_qty,
                reason,
                status,
                source,
                created_at,
                NULL as medicine_id,
                NULL as current_stock,
                NULL as unit_price,
                0.00 as total_cost
            FROM auto_procurement_queue
            WHERE status = 'PENDING_REVIEW'
            ORDER BY created_at DESC
        `);

        console.log(`[PROCUREMENT QUEUE] Fetched ${result.rows.length} items from auto_procurement_queue`);
        res.json(result.rows);
    } catch (err) {
        console.error('[PROCUREMENT QUEUE ERROR]', err);
        res.status(500).json({
            error: 'Failed to fetch procurement queue',
            details: err.message
        });
    }
});

// PATCH: Update Procurement Item Quantity (Auto Queue)
app.patch('/api/procurement/:id/update-qty', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        // Update detected_quantity in auto_procurement_queue
        await db.query('UPDATE auto_procurement_queue SET detected_quantity = ? WHERE id = ?', [quantity, id]);

        // Audit Log
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'PROCUREMENT_QTY_UPDATE', `Item ${id}`, `Quantity set to ${quantity}`]);

        res.json({ success: true, quantity });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update quantity' });
    }
});

// POST: Approve Procurement Item(s)
app.post('/api/procurement/approve', authenticateToken, verifyAdmin, async (req, res) => {
    const { ids } = req.body; // Array of IDs
    try {
        // Update status for all items
        // Note: For unregistered items, this might trigger the registration flow (not fully automated here yet)
        // For now, we just mark them as APPROVED in the queue.
        // Ideally, this should trigger a "Register Medicine" modal or action in frontend if it's unregistered.
        await db.query('UPDATE auto_procurement_queue SET status = "APPROVED" WHERE id IN (?)', [ids]);

        // Audit Log
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'PROCUREMENT_APPROVE', `Bulk: ${ids.length} items`, `Approved IDs: ${ids.join(', ')}`]);

        res.json({ message: 'Items approved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve items' });
    }
});

// POST: Reject Procurement Item(s)
app.post('/api/procurement/reject', authenticateToken, verifyAdmin, async (req, res) => {
    const { ids } = req.body;
    try {
        await db.query('UPDATE auto_procurement_queue SET status = "REJECTED" WHERE id IN (?)', [ids]);

        // Audit Log
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'PROCUREMENT_REJECT', `Bulk: ${ids.length} items`, `Rejected IDs: ${ids.join(', ')}`]);

        res.json({ message: 'Items rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject items' });
    }
});

// POST: Create Procurement Invoice
app.post('/api/invoices/create', authenticateToken, verifyAdmin, async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get all APPROVED items
        const [items] = await connection.execute(`
            SELECT pq.*, m.name, m.manufacturer 
            FROM procurement_queue pq
            JOIN medicines m ON pq.medicine_id = m.id
            WHERE pq.status = 'APPROVED'
        `);

        if (items.length === 0) {
            throw new Error('No approved items to invoice');
        }

        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
        const invoiceNumber = `INV-PROC-${Date.now()}`;

        // 2. Create Invoice
        const [invRes] = await connection.execute(
            'INSERT INTO procurement_invoices (invoice_number, total_amount, supplier_email, hospital_email) VALUES (?, ?, ?, ?)',
            [invoiceNumber, totalAmount, 'supplier@example.com', 'procurement@hospital.com']
        );
        const invoiceId = invRes.insertId;

        // 3. Create Invoice Items & Update Queue
        for (const item of items) {
            await connection.execute(
                'INSERT INTO procurement_invoice_items (invoice_id, medicine_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
                [invoiceId, item.medicine_id, item.final_qty, item.unit_price, item.total_cost]
            );
            await connection.execute('UPDATE procurement_queue SET status = "INVOICED" WHERE id = ?', [item.id]);
        }

        // 4. Audit Log
        await connection.execute(
            'INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'CREATE_PROC_INVOICE', invoiceNumber, `Invoice generated for ${items.length} items. Total: $${totalAmount}`]
        );

        // 5. Generate PDF & "Send" Email
        const invoiceData = {
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            supplier_email: 'supplier@example.com',
            hospital_email: 'procurement@hospital.com',
            items: items.map(i => ({
                name: i.name,
                quantity: i.final_qty,
                unit_price: i.unit_price,
                line_total: i.total_cost
            }))
        };

        const pdfBuffer = await CommunicationService.generateInvoicePDF(invoiceData);
        await CommunicationService.sendInvoiceEmail(invoiceData, pdfBuffer);

        await connection.commit();
        res.json({ success: true, invoiceNumber, totalAmount, message: 'Invoice created and dispatched to supplier' });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message || 'Invoice creation failed' });
    } finally {
        connection.release();
    }
});

// GET: Unregistered Medicine Queue
app.get('/api/admin/unregistered-queue', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM auto_procurement_queue WHERE status = 'PENDING_REVIEW' ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch unregistered queue' });
    }
});

// POST: Approve & Register Unregistered Medicine
app.post('/api/admin/unregistered-queue/:id/approve', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, category, price, location, expiry, manufacturer } = req.body;

    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get request details
        const [request] = await connection.execute('SELECT * FROM auto_procurement_queue WHERE id = ?', [id]);
        if (!request.length) throw new Error('Request not found');

        // 2. Register into medicines table
        await connection.execute(
            'INSERT INTO medicines (batch_number, name, category, stock, price, location, expiry_date, manufacturer, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [request[0].barcode, name || request[0].medicine_name, category || 'General', request[0].detected_quantity, price || 0, location || 'Unsorted', expiry || null, manufacturer || 'Unknown', request[0].barcode]
        );

        // 3. Update queue status
        await connection.execute('UPDATE auto_procurement_queue SET status = "APPROVED" WHERE id = ?', [id]);

        // 4. Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'APPROVE_UNREGISTERED', `Medicine ${request[0].barcode}`, `Approved and registered ${request[0].medicine_name}`]);

        await connection.commit();
        res.json({ message: 'Medicine registered and approved' });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Approval failed' });
    } finally {
        connection.release();
    }
});

// POST: Reject Unregistered Medicine
app.post('/api/admin/unregistered-queue/:id/reject', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE auto_procurement_queue SET status = "REJECTED" WHERE id = ?', [id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'REJECT_UNREGISTERED', `Request ${id}`, 'Denied registration request']);

        res.json({ message: 'Request rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Rejection failed' });
    }
});

// POST: Approve Order
app.post('/api/admin/procurement/:id/approve', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE purchase_orders SET status = "Approved" WHERE id = ?', [id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'APPROVE_ORDER', `Order ${id}`, 'Approved auto-procurement']);

        res.json({ message: 'Order approved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve order' });
    }
});

// POST: Reject Order
app.post('/api/admin/procurement/:id/reject', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE purchase_orders SET status = "Rejected" WHERE id = ?', [id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'REJECT_ORDER', `Order ${id}`, 'Rejected auto-procurement']);

        res.json({ message: 'Order rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject order' });
    }
});

// PATCH: Modify Pending Order Quantity
app.patch('/api/admin/procurement/:id/quantity', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        await db.query('UPDATE purchase_orders SET quantity = ? WHERE id = ? AND status = "Pending"', [quantity, id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'MODIFY_ORDER', `Order ${id}`, `Quantity changed to ${quantity}`]);

        res.json({ message: 'Order updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to modify order' });
    }
});

// PATCH: Update User Status (Enable/Disable)
app.patch('/api/admin/users/:id/status', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    try {
        // Add status column if missing (Quick Migration Helper for this specific feature)
        try {
            await db.query(`SELECT status FROM users LIMIT 1`);
        } catch (e) {
            await db.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';`);
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

        // Log Action
        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPDATE_STATUS', `User ${id}`, `Status changed to ${status}`]);

        res.json({ message: 'User status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// GET: Inventory List (Branch Aware)
app.get('/api/inventory', async (req, res) => {
    try {
        const branchId = req.query.branch_id || 1; // Default to Main Branch

        // Return inventory for specific branch
        const result = await db.query(`
            SELECT * FROM medicines 
            WHERE branch_id = ? 
            ORDER BY name ASC
        `, [branchId]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// GET: Inventory List
app.get('/api/admin/inventory', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM medicines ORDER BY stock ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// PATCH: Admin Update Inventory (Stock, Expiry, Barcode)
app.patch('/api/admin/inventory/:id', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { stock, expiry, barcode } = req.body;

    try {
        // Dynamic Update Query Construction
        let fields = [];
        let values = [];

        if (stock !== undefined) {
            fields.push('stock = ?');
            values.push(stock);
        }
        if (expiry !== undefined) {
            fields.push('expiry_date = ?');
            values.push(expiry);
        }
        if (barcode !== undefined) {
            fields.push('barcode = ?');
            values.push(barcode);
        }

        if (fields.length === 0) return res.json({ message: 'No changes provided' });

        values.push(id); // For WHERE clause

        const query = `UPDATE medicines SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        await db.query('INSERT INTO audit_logs (admin_id, action, target, details) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPDATE_INVENTORY', `Medicine ${id}`, `Updated: ${fields.join(', ')}`]);

        res.json({ message: 'Inventory updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// GET: Audit Logs
app.get('/api/admin/logs', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT l.*, u.name as admin_name 
            FROM audit_logs l 
            JOIN users u ON l.admin_id = u.id 
            ORDER BY l.timestamp DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET Current User Profile (Moved down to keep grouped)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.role, p.hospital_name, p.city 
            FROM users u 
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
        `, [req.user.id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// GET: AI Predictions (Powered by ML Engine & ALN)
app.get('/api/ai/predict', async (req, res) => {
    try {
        // 1. Fetch Medicines
        const medicinesResult = await db.query('SELECT * FROM medicines');
        const medicines = medicinesResult.rows;

        if (!medicines || medicines.length === 0) {
            return res.json([]);
        }

        // 2. Fetch Sales History (Bulk Query for Performance)
        // Get last 90 days of sales
        const historyResult = await db.query(`
            SELECT ii.medicine_id, ii.quantity, i.created_at as date
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        `);

        // Group history by medicine_id
        const historyMap = {};
        historyResult.rows.forEach(record => {
            if (!historyMap[record.medicine_id]) {
                historyMap[record.medicine_id] = [];
            }
            historyMap[record.medicine_id].push({
                date: record.date,
                quantity: record.quantity
            });
        });

        let predictions = [];

        medicines.forEach(m => {
            // A. Run ML Prediction (Statistical)
            const history = historyMap[m.id] || [];
            const mlResult = MLEngine.predictStockout(m.stock, history);

            // B. Run ALN Heuristics (Rule-based)
            const alnAlerts = ALNEngine.analyzeItem(m);

            // C. Combine Results

            // 1. ML-Based Alerts (Critical/Warning)
            if (mlResult.status !== 'SAFE' && mlResult.status !== 'INSUFFICIENT_DATA') {
                predictions.push({
                    type: 'ML_FORECAST',
                    title: mlResult.status === 'CRITICAL' ? '📉 Stockout Imminent' : '⚠️ Projected Low Stock',
                    medicine: m.name,
                    message: `ML predicts stockout in ${mlResult.daysUntilStockout} days (${mlResult.predictedDate}).`,
                    confidence: mlResult.confidence,
                    action: `Restock before ${mlResult.predictedDate}`,
                    severity: mlResult.status === 'CRITICAL' ? 'Critical' : 'High',
                    color: mlResult.status === 'CRITICAL' ? 'red' : 'orange'
                });
            }

            // 2. Anomaly Detection (High Slope)
            if (mlResult.slope < -10) { // arbitrary threshold for "high daily drain"
                predictions.push({
                    type: 'ANOMALY',
                    title: '🔥 High Consumption',
                    medicine: m.name,
                    message: `Unusual drain rate detected (${Math.abs(mlResult.slope).toFixed(1)} units/day).`,
                    confidence: 85,
                    action: 'Investigate usage causes.',
                    severity: 'Medium',
                    color: 'purple'
                });
            }

            // 3. Add ALN Alerts (Expiry, etc.)
            // Filter out stock alerts from ALN if ML already caught them to avoid duplicates
            alnAlerts.forEach(alert => {
                if (alert.type === 'CRITICAL_STOCK' && mlResult.status === 'CRITICAL') return;
                predictions.push(alert);
            });
        });

        // Add a general "safe" one if empty
        if (predictions.length === 0) {
            predictions.push({
                title: '✅ Optimal Operations',
                confidence: 99,
                action: 'AI & ML Engines indicate optimal stock levels.',
                color: 'emerald'
            });
        }

        // Limit to 8 predictions (increased from 6)
        res.json(predictions.slice(0, 8));

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'Failed',
            stage: 'SERVER_ERROR',
            reason: err.message,
            fix: 'Check server logs.'
        });
    }
});

// GET: Dashboard Stats (Expiry Risk)
app.get('/api/dashboard/expiry-risk', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT expiry_date FROM medicines');
        const today = new Date();
        const thirtyDaysWithToday = new Date();
        thirtyDaysWithToday.setDate(today.getDate() + 30);

        let expired = 0;
        let expiringSoon = 0;

        result.rows.forEach(row => {
            const expiryDate = new Date(row.expiry_date);
            if (expiryDate < today) {
                expired++;
            } else if (expiryDate <= thirtyDaysWithToday) {
                expiringSoon++;
            }
        });

        res.json({
            expired,
            expiringSoon,
            totalRisk: expired + expiringSoon
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expiry risk stats' });
    }
});

// GET: AI Procurement (Strict Logic: Store Only Approved)
app.get('/api/ai/procurement', async (req, res) => {
    try {
        // JOIN medicines and medicine_batches to get Stock + Master Info
        // This ensures AI sees the ACTUAL batch stock and expiry
        const result = await db.query(`
            SELECT 
                mb.id, 
                mb.batch_number, 
                mb.barcode, 
                mb.quantity as stock, 
                m.price, 
                mb.expiry_date, 
                m.name, 
                m.category, 
                m.id as medicine_master_id
            FROM medicine_batches mb
            JOIN medicines m ON m.id = mb.medicine_id
        `);
        const medicines = result.rows;

        if (!medicines || medicines.length === 0) {
            return res.json([]);
        }

        const procurementDocs = [];

        for (const m of medicines) {
            // Use ALN Engine Logic (Pass Batch Data)
            const decision = ALNEngine.decideProcurement(m);

            if (decision) {
                // Check if this decision ID (Deterministic) already exists in purchase_orders
                // If it exists, it means it's strictly DONE/APPROVED. Do not show again.
                const existsCheck = await db.query('SELECT id FROM purchase_orders WHERE id = ?', [decision.id]);

                if (existsCheck.rows.length > 0) {
                    continue; // Skip, already processed
                }

                // STRICT LOGIC: If Approved (Auto), Persist to DB immediately
                if (decision.status === 'Approved') {
                    await db.query(`
                            INSERT INTO purchase_orders (id, medicine_id, quantity, estimated_cost, status)
                            VALUES (?, ?, ?, ?, ?)
                        `, [decision.id, m.id, decision.quantity, decision.estimatedCost, decision.status]);
                    console.log(`Auto-Approved Order Saved: ${decision.id}`);
                    // If auto-approved, we might still want to show it in "Approved" list via /api/procurement/orders
                    // But frontend requested "remove card". If it's auto-approved, it goes to orders list.
                    // We probably shouldn't send it in this "Pending" list response either?
                    // Actually, UI usually separates Pending vs Approved.
                    // If we return it here, it might show up in "Suggested".
                    // Let's NOT return it if auto-approved and saved.
                    continue;
                }

                // Return decision to UI (Only Pending items now)
                procurementDocs.push(decision);
            }
        }

        res.json(procurementDocs);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'Failed',
            stage: 'SERVER_ERROR',
            reason: err.message
        });
    }
});

// POST: Manual Approval Endpoint
app.post('/api/procurement/approve', authenticateToken, async (req, res) => {
    const { id, medicine_name, quantity, cost } = req.body;

    try {
        const medResult = await db.query('SELECT id FROM medicines WHERE name = ?', [medicine_name]);
        if (medResult.rows.length === 0) {
            console.error(`Medicine not found for approval: ${medicine_name}`);
            return res.status(404).json({ error: 'Medicine not found' });
        }
        const medId = medResult.rows[0].id;

        // Insert into DB (Persistence)
        // Using INSERT IGNORE or checking existence prevents uniqueness errors
        // We trust the ID from frontend (ALN-...)
        const check = await db.query('SELECT id FROM purchase_orders WHERE id = ?', [id]);
        if (check.rows.length === 0) {
            await db.query(`
                INSERT INTO purchase_orders (id, medicine_id, quantity, estimated_cost, status)
                VALUES (?, ?, ?, ?, 'Approved')
            `, [id, medId, quantity, cost]);

            // SYNC FIX: Also update auto_procurement_queue if exists
            await db.query(`
                UPDATE auto_procurement_queue 
                SET status = 'APPROVED' 
                WHERE medicine_name = ? AND status = 'PENDING_REVIEW'
            `, [medicine_name]);

            // 3. Update Stock (The Critical Fix)
            // Strategy: Find LATEST batch (by expiry) and add stock.
            const batches = await db.query(`
                SELECT id, quantity as stock FROM medicine_batches 
                WHERE medicine_id = ? 
                ORDER BY expiry_date DESC LIMIT 1
            `, [medId]);

            if (batches.rows.length > 0) {
                const batchId = batches.rows[0].id;
                const newStock = batches.rows[0].stock + parseInt(quantity);
                await db.query('UPDATE medicine_batches SET quantity = ? WHERE id = ?', [newStock, batchId]);
                console.log(`Updated Batch ${batchId} Stock: ${batches.rows[0].stock} -> ${newStock}`);
            } else {
                // No batch exists? Create a generic new batch.
                const newBatchNum = `BATCH-${Date.now()}`;
                const expiry = new Date();
                expiry.setFullYear(expiry.getFullYear() + 1);

                await db.query(`
                    INSERT INTO medicine_batches (medicine_id, batch_number, quantity, expiry_date, location)
                    VALUES (?, ?, ?, ?, 'Received Zone')
                `, [medId, newBatchNum, quantity, expiry]);
                console.log(`Created New Batch ${newBatchNum} for Order ${id}`);
            }

            console.log(`Manual Order Approved: ${id}`);
        } else {
            console.log(`Order ${id} already exists`);
        }

        res.json({ message: 'Order approved and stock updated', id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve order' });
    }
});

// GET: Fetch Confirmed Purchase Orders (Strict: From DB Only)
app.get('/api/procurement/orders', async (req, res) => {
    try {
        const query = `
            SELECT po.*, m.name as medicine_name, m.manufacturer
            FROM purchase_orders po
            JOIN medicines m ON po.medicine_id = m.id
            ORDER BY po.created_at DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});

// POST: Barcode Scan Endpoint (Real-time Scanner Integration)
app.post('/api/scan/barcode', async (req, res) => {
    const { barcode } = req.body;

    // 1. Validate Input
    if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    // 2. Sanitize Input (remove whitespace, control characters, normalize case)
    let sanitizedBarcode = barcode
        .trim()                          // Remove leading/trailing whitespace
        .replace(/[\r\n\t]/g, '')        // Remove control characters
        .toUpperCase();                  // Normalize to uppercase

    // 3. Validate Format (Code-128 compatible)
    const CODE128_REGEX = /^[A-Z0-9\-_]+$/;
    if (!CODE128_REGEX.test(sanitizedBarcode)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid barcode format',
            received: barcode,
            sanitized: sanitizedBarcode
        });
    }

    // 4. Validate Length
    if (sanitizedBarcode.length < 3 || sanitizedBarcode.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Barcode length must be 3-50 characters'
        });
    }

    try {
        // 5. HYBRID LOOKUP: Check BOTH new medicine_batches table AND old medicines table
        // Strategy 1: Try new medicine_batches table first (proper schema)
        // Note: medicine_batches doesn't have branch_id yet in this migration, so we focus on medicines table update 
        // or assume batches are global for now?
        // Actually, for this hackathon fix, we heavily rely on the 'medicines' table fallback.

        const branchId = req.body.branch_id || 1; // Default to Main Branch if not provided

        let check = await db.query(`
            SELECT 
                mb.id,
                mb.batch_number,
                mb.barcode,
                mb.stock,
                mb.sale_price as price,
                mb.expiry_date,
                mb.location,
                mb.medicine_id,
                m.name,
                m.category,
                m.manufacturer,
                'batch' as source_table
            FROM medicine_batches mb
            JOIN medicines_master m ON m.id = mb.medicine_id
            WHERE (UPPER(TRIM(mb.barcode)) = ? OR UPPER(TRIM(mb.batch_number)) = ?)
            LIMIT 1
        `, [sanitizedBarcode, sanitizedBarcode]);

        // Strategy 2: Fallback to old medicines table (NOW WITH BRANCH SUPPORT)
        if (check.rows.length === 0) {
            check = await db.query(`
                SELECT 
                    *,
                    'medicine' as source_table
                FROM medicines 
                WHERE (UPPER(TRIM(IFNULL(barcode, ''))) = ? OR UPPER(TRIM(batch_number)) = ?)
                  AND branch_id = ?
                LIMIT 1
            `, [sanitizedBarcode, sanitizedBarcode, branchId]);
        }

        // Strategy 2: Fallback to old medicines table if not found in batches
        if (check.rows.length === 0) {
            check = await db.query(`
                SELECT 
                    *,
                    'medicine' as source_table
                FROM medicines 
                WHERE UPPER(TRIM(IFNULL(barcode, ''))) = ?
                   OR UPPER(TRIM(batch_number)) = ?
                LIMIT 1
            `, [sanitizedBarcode, sanitizedBarcode]);
        }

        if (check.rows.length === 0) {
            // Log to Auto-Procurement Queue (REJECTED/PENDING_REVIEW)
            await db.query(`
                INSERT INTO auto_procurement_queue (medicine_name, barcode, detected_quantity, reason, status, source)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['Unknown Medicine', sanitizedBarcode, 1, 'Medicine not registered', 'PENDING_REVIEW', 'Scanner']);

            // STRICT RULE: If not in DB, REJECT.
            return res.status(404).json({
                success: false,
                message: 'Medicine not registered. Storage rejected.',
                actionRequired: 'ADMIN_REVIEW',
                scannedCode: sanitizedBarcode
            });
        }

        // 4. Medicine Found - Proceed with Logic
        const item = check.rows[0];

        // Transaction Start: Get dedicated client
        const connection = await db.pool.getConnection();

        try {
            await connection.beginTransaction();

            // B. Create PENDING Purchase Order (Queue for Approval)
            // Generate unique Order ID (e.g., PO-SCAN-TIMESTAMP)
            const orderId = `PO-SCAN-${Date.now()}`;

            await connection.execute(`
                INSERT INTO purchase_orders (id, medicine_id, quantity, estimated_cost, status)
                VALUES (?, ?, ?, ?, 'Pending')
            `, [orderId, item.id, 1, item.price]); // 1 unit, Pending

            await connection.commit();

            // 5. Return Success Response
            return res.json({
                success: true,
                type: 'update',
                message: 'Order Queued for Approval',
                product: { ...item }, // Return original item data
                orderId: orderId
            });

        } catch (txError) {
            await connection.rollback();
            throw txError;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Scan Transaction Error:', err);
        res.status(500).json({ success: false, message: 'Database Transaction Failed' });
    }
});

// Catch-all route to serve index.html for SPA-like behavior (optional, good for navigation)
// Specific Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// SPA Routes: Serve dashboard.html and let client-side JS handle the view
app.get('/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/predict', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/supply', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// ------------------------------------------------------------------
// ANALYTICS & EXPORTS
// ------------------------------------------------------------------

// Route: Standalone Analytics Page
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/analytics.html'));
});

// Export: PDF
app.get('/api/analytics/export/pdf', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        // Set Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Inventory_Report_${Date.now()}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Hospital Inventory Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Fetch Data directly from DB for fresh report
        const salesData = await db.query(`
             SELECT 
                COALESCE(SUM(total_amount), 0) as total_sales,
                COUNT(id) as total_orders
             FROM invoices 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // Summary Section
        doc.fontSize(14).text('Executive Summary (30 Days)', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Sales: $${salesData.rows[0].total_sales}`);
        doc.text(`Total Orders: ${salesData.rows[0].total_orders}`);
        doc.moveDown(2);

        // Low Stock Table
        const lowStock = await db.query('SELECT name, stock, batch_number FROM medicines WHERE stock < 50 LIMIT 10');
        doc.fontSize(14).text('Critical Stock Alerts', { underline: true });
        doc.moveDown();

        lowStock.rows.forEach(item => {
            doc.fontSize(10).text(`${item.name} (Stock: ${item.stock})`, { bullet: true });
        });

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});


(async () => {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Final Startup Failed:', err);
    }
})();
