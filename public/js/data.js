/**
 * MedicineSupply.ai - Data Module
 * Contains database and constant values
 */

const DataModule = {
    /**
     * Medicine Database - Master data
     */
    MEDICINE_DATABASE: {
        'B-992': {
            name: 'Paracetamol IV',
            category: 'General',
            stock: 120,
            price: 5.50,
            location: 'Rack A-12',
            expiry: '2025-12-31',
            manufacturer: 'PharmaCorp'
        },
        'B-101': {
            name: 'O- Blood Units',
            category: 'Critical',
            stock: 4,
            price: 45.00,
            location: 'Cold Storage 2',
            expiry: '2025-03-15',
            manufacturer: 'BloodBank'
        },
        'B-334': {
            name: 'Ceftriaxone 1g',
            category: 'Antibiotic',
            stock: 450,
            price: 12.30,
            location: 'Rack C-05',
            expiry: '2026-06-20',
            manufacturer: 'MedLife'
        },
        'B-402': {
            name: 'Insulin Glargine',
            category: 'Diabetes',
            stock: 32,
            price: 35.75,
            location: 'Fridge 1',
            expiry: '2025-02-14',
            manufacturer: 'NovoNordisk'
        },
        'B-115': {
            name: 'Amoxicillin 500mg',
            category: 'Antibiotic',
            stock: 280,
            price: 2.10,
            location: 'Rack B-05',
            expiry: '2026-08-15',
            manufacturer: 'GlaxoSmithKline'
        },
        'B-203': {
            name: 'Metformin 500mg',
            category: 'Diabetes',
            stock: 150,
            price: 1.50,
            location: 'Rack A-08',
            expiry: '2026-10-20',
            manufacturer: 'Cipla'
        },
        'B-305': {
            name: 'Aspirin 100mg',
            category: 'Cardiac',
            stock: 500,
            price: 0.80,
            location: 'Rack C-12',
            expiry: '2027-01-15',
            manufacturer: 'Bayer'
        },
        'B-410': {
            name: 'Ciprofloxacin 500mg',
            category: 'Antibiotic',
            stock: 89,
            price: 8.75,
            location: 'Rack B-08',
            expiry: '2025-09-30',
            manufacturer: 'MedLife'
        },
        'B-502': {
            name: 'Adrenaline 1:1000',
            category: 'Critical',
            stock: 25,
            price: 15.00,
            location: 'Secure Cabinet 1',
            expiry: '2025-05-10',
            manufacturer: 'Hospira'
        },
        'B-603': {
            name: 'Morphine 10mg',
            category: 'Surgery',
            stock: 18,
            price: 12.50,
            location: 'Secure Cabinet 1',
            expiry: '2025-04-22',
            manufacturer: 'Abbott'
        },
    },

    /**
     * Navigation items
     */
    NAV_ITEMS: [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'inventory', icon: 'package', label: 'Inventory' },
        { id: 'predict', icon: 'brain', label: 'Predictions' },
        { id: 'supply', icon: 'truck', label: 'Procurement' },
        { id: 'scanner', icon: 'scan-line', label: 'Barcode Scanner' },
    ],

    /**
     * AI Prediction templates
     */
    PREDICTION_TEMPLATES: [
        { title: '🦟 Disease Forecast', confidence: 92, action: 'Dengue outbreak detected - Stock fluids', color: 'amber' },
        { title: '🚨 Critical Stock', confidence: 88, action: 'O- Blood low - Order 50 units', color: 'red' },
        { title: '⏰ Expiry Alert', confidence: 95, action: 'Insulin expires in 15 days', color: 'orange' },
        { title: '📈 Demand Surge', confidence: 82, action: 'Antibiotics demand ↑20%', color: 'blue' },
        { title: '💰 Cost Save', confidence: 85, action: 'Bulk discount available', color: 'emerald' },
        { title: '🏥 Surgery Prep', confidence: 90, action: 'Morphine reorder needed', color: 'violet' },
    ],

    /**
     * Categories list
     */
    CATEGORIES: ['General', 'Antibiotic', 'Critical', 'Diabetes', 'Cardiac', 'Surgery'],

    /**
     * Locations list
     */
    LOCATIONS: ['Rack A-12', 'Rack B-05', 'Cold Storage 1', 'Fridge 1', 'Secure Cabinet 1'],

    /**
     * Suppliers list
     */
    SUPPLIERS: ['PharmaCorp', 'MedLife', 'GlaxoSmithKline', 'Cipla', 'Bayer'],

    /**
     * Initialize stock items from database
     * @returns {Array}
     */
    initializeStockItems() {
        return Object.entries(this.MEDICINE_DATABASE).map(([batch, data], id) => ({
            id: id + 101,
            batch,
            ...data,
            status: this.calculateStatus(data.stock)
        }));
    },

    /**
     * Calculate stock status
     * @param {number} stock - Stock quantity
     * @returns {string}
     */
    calculateStatus(stock) {
        if (stock < 20) return 'Critical';
        if (stock < 50) return 'Low';
        return 'Stable';
    },

    /**
     * Get medicine by barcode
     * @param {string} barcode - Barcode value
     * @returns {Object|null}
     */
    getMedicineByBarcode(barcode) {
        return this.MEDICINE_DATABASE[barcode] || null;
    }
};

// Export for use in other modules
window.DataModule = DataModule;