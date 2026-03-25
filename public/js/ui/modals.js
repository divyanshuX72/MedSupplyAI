/**
 * MedicineSupply.ai - Modals Module
 * Handles modal open/close operations
 */

const ModalsModule = {
    /**
     * Open add medicine modal
     */
    /**
     * Open add medicine modal
     * @param {boolean} reset - Whether to reset the form (default true)
     */
    openAddMedicine(reset = true) {
        if (reset && window.MedicineModule) {
            window.MedicineModule.resetForm();
        }
        Helpers.toggleVisibility('add-medicine-modal', true);
        Helpers.refreshIcons();
    },

    /**
     * Close add medicine modal
     */
    closeAddMedicine() {
        Helpers.toggleVisibility('add-medicine-modal', false);
        this.clearMedicineForm();
    },

    /**
     * Clear medicine form fields
     */
    clearMedicineForm() {
        const fields = [
            'medicine-name', 'medicine-category', 'medicine-stock',
            'medicine-price', 'medicine-barcode',
            'medicine-location', 'medicine-expiry', 'medicine-manufacturer'
        ];
        fields.forEach(id => {
            const el = Helpers.getElement(id);
            if (el) el.value = '';
        });
    },

    /**
     * Open AI prediction modal
     */
    openPrediction() {
        Helpers.toggleVisibility('ai-prediction-modal', true);
        Helpers.refreshIcons();
    },

    /**
     * Close AI prediction modal
     */
    closePrediction() {
        Helpers.toggleVisibility('ai-prediction-modal', false);
    },

    /**
     * Open procurement modal
     */
    openProcurement() {
        Helpers.toggleVisibility('procurement-modal', true);
        ProcurementModule.renderQueue();
        Helpers.refreshIcons();
    },

    /**
     * Close procurement modal
     */
    closeProcurement() {
        Helpers.toggleVisibility('procurement-modal', false);
    },

    /**
     * Open analytics modal
     */
    openAnalytics() {
        Helpers.toggleVisibility('analytics-modal', true);
        setTimeout(() => {
            AnalyticsModule.init();
            AnalyticsModule.refreshDashboard();
            Helpers.refreshIcons();
        }, 100);
    },

    /**
     * Close analytics modal
     */
    closeAnalytics() {
        Helpers.toggleVisibility('analytics-modal', false);
    },

    /**
     * Fill medicine form from scanned data
     * @param {Object} data - Medicine data
     * @param {string} barcode - Scanned barcode
     */
    fillMedicineForm(data, barcode) {
        const fields = {
            'medicine-name': data.name,
            'medicine-category': data.category,
            'medicine-stock': data.stock,
            'medicine-price': data.price,
            'medicine-barcode': barcode,
            'medicine-location': data.location,
            'medicine-expiry': data.expiry,
            'medicine-manufacturer': data.manufacturer
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = Helpers.getElement(id);
            if (el) el.value = value;
        });
    }
};

// Export for use in other modules
window.ModalsModule = ModalsModule;