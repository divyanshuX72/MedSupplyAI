/**
 * MedicineSupply.ai - State Management
 * Central state management for the application
 */

const AppState = {
    // Stock items
    stockItems: [],

    // UI State
    isEmergency: false,
    aiModelActive: true,
    chatOpen: false,
    voiceActive: false,
    voiceText: '',

    // Procurement queue
    procurementQueue: [],

    // Charts instances
    charts: {},

    // Voice recognition instance
    recognition: null,

    /**
     * Initialize state
     */
    async init() {
        console.log('State initialized');
        // Initial fetch is handled by startRealTimeUpdates calling fetchInventory
    },

    /**
     * Start real-time updates
     * @param {number} intervalMs - Polling interval in ms
     */
    startRealTimeUpdates(intervalMs = 5000) {
        console.log('Starting real-time updates...');
        // Initial fetch - NOT SILENT so we see errors
        this.fetchInventory(false);

        // Setup polling
        setInterval(() => {
            this.fetchInventory(true);
        }, intervalMs);

        console.log(`Real-time updates started (Interval: ${intervalMs}ms)`);
    },

    /**
     * Fetch inventory from API
     * @param {boolean} silent - If true, suppress error notifications
     */
    async fetchInventory(silent = false) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: ${text}`);
            }

            const data = await response.json();

            // Auto-Seed if empty
            if (data.length === 0) {
                if (!silent) console.log('Database empty, attempting to seed...');
                const seedResponse = await fetch('/api/seed', {
                    method: 'POST',
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                const seedData = await seedResponse.json();
                console.log('Seed result:', seedData);

                // Recursively fetch again (once)
                if (seedData.seededCount > 0) {
                    return this.fetchInventory(silent);
                }
            }

            if (!silent) console.log(`Fetched ${data.length} items from API`);

            // Map DB fields to Frontend fields
            const newItems = data.map(item => ({
                id: item.id,
                batch: item.batch_number,
                barcode: item.barcode, // Expose Barcode
                name: item.name,
                category: item.category,
                stock: item.stock,
                price: parseFloat(item.price),
                location: item.location,
                expiry: item.expiry_date ? (typeof item.expiry_date === 'string' ? item.expiry_date.split('T')[0] : new Date(item.expiry_date).toISOString().split('T')[0]) : '',
                manufacturer: item.manufacturer,
                status: DataModule.calculateStatus(item.stock)
            }));

            // Change detection (Simple JSON string comparison)
            // In a larger app, we might use a hash or deep comparison lib
            const isChanged = JSON.stringify(this.stockItems) !== JSON.stringify(newItems);

            if (isChanged || this.stockItems.length === 0) {
                this.stockItems = newItems;

                // Sync with Scanner if initialized
                if (window.ScannerModule && typeof ScannerModule.syncDatabase === 'function') {
                    ScannerModule.syncDatabase(newItems);
                }

                // Refresh UI if RenderModule is available
                if (window.RenderModule) {
                    RenderModule.refreshAll();
                } else {
                    console.warn('RenderModule not ready yet');
                }
            }

        } catch (error) {
            console.error('Fetch error:', error);
            if (!silent) {
                NotificationsModule.show('Failed to connect to server: ' + error.message, 'error');
            }
        }
    },

    /**
     * Get stock items
     * @returns {Array}
     */
    getStockItems() {
        return this.stockItems;
    },

    /**
     * Add stock item
     * @param {Object} item - Stock item to add
     */
    addStockItem(item) {
        this.stockItems.push(item);
    },

    /**
     * Update stock item
     * @param {number} id - Item ID
     * @param {Object} updates - Updates to apply
     */
    updateStockItem(id, updates) {
        const index = this.stockItems.findIndex(item => item.id === id);
        if (index !== -1) {
            this.stockItems[index] = { ...this.stockItems[index], ...updates };
        }
    },

    /**
     * Get next item ID
     * @returns {number}
     */
    getNextItemId() {
        return Math.max(...this.stockItems.map(m => m.id)) + 1;
    },

    /**
     * Set emergency mode
     * @param {boolean} isEmergency - Emergency state
     */
    setEmergency(isEmergency) {
        this.isEmergency = isEmergency;
    },

    /**
     * Set AI model active state
     * @param {boolean} active - Active state
     */
    setAIModelActive(active) {
        this.aiModelActive = active;
    },

    /**
     * Toggle chat open state
     */
    toggleChat() {
        this.chatOpen = !this.chatOpen;
    },

    /**
     * Set voice active state
     * @param {boolean} active - Active state
     */
    setVoiceActive(active) {
        this.voiceActive = active;
    },

    /**
     * Set voice text
     * @param {string} text - Voice text
     */
    setVoiceText(text) {
        this.voiceText = text;
    },

    /**
     * Set procurement queue
     * @param {Array} queue - Procurement queue
     */
    setProcurementQueue(queue) {
        this.procurementQueue = queue;
    },

    /**
     * Get procurement queue
     * @returns {Array}
     */
    getProcurementQueue() {
        return this.procurementQueue;
    },

    /**
     * Get pending procurement count
     * @returns {number}
     */
    getPendingProcurementCount() {
        return this.procurementQueue.filter(p => p.status === 'Pending').length;
    },

    /**
     * Set chart instance
     * @param {string} name - Chart name
     * @param {Object} chart - Chart instance
     */
    setChart(name, chart) {
        this.charts[name] = chart;
    },

    /**
     * Get chart instance
     * @param {string} name - Chart name
     * @returns {Object|null}
     */
    getChart(name) {
        return this.charts[name] || null;
    },

    /**
     * Calculate statistics
     * @returns {Object}
     */
    getStats() {
        const items = this.stockItems;
        return {
            totalStock: items.reduce((sum, item) => sum + item.stock, 0),
            criticalCount: items.filter(i => i.status === 'Critical').length,
            expiredCount: items.filter(i => Helpers.daysUntil(i.expiry) < 0).length,
            expiringSoonCount: items.filter(i => {
                const days = Helpers.daysUntil(i.expiry);
                return days >= 0 && days <= 30;
            }).length,
            totalValue: items.reduce((sum, item) => sum + (item.stock * item.price), 0)
        };
    }
};

// Export for use in other modules
window.AppState = AppState;