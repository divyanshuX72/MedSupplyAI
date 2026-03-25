/**
 * MedicineSupply.ai - Utility Functions
 * Common helper functions used across modules
 */

const Helpers = {
    /**
     * Get element by ID with null check
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    getElement(id) {
        return document.getElementById(id);
    },

    /**
     * Toggle visibility of an element
     * @param {string} id - Element ID
     * @param {boolean} show - Show or hide
     */
    toggleVisibility(id, show) {
        const element = this.getElement(id);
        if (element) {
            element.classList.toggle('hidden', !show);
        }
    },

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency symbol
     * @returns {string}
     */
    formatCurrency(amount, currency = '₹') {
        if (amount >= 1_000_000_000) {
            return `${currency}${(amount / 1_000_000_000).toFixed(2)}B`;
        }
        if (amount >= 1_000_000) {
            return `${currency}${(amount / 1_000_000).toFixed(2)}M`;
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount).replace('₹', currency);
    },

    /**
     * Calculate days until date
     * @param {string} dateString - Date string
     * @returns {number}
     */
    daysUntil(dateString) {
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string}
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Create Lucide icons
     */
    refreshIcons() {
        try {
            lucide.createIcons();
        } catch (e) {
            console.warn('Lucide icons refresh failed:', e);
        }
    },

    /**
     * Get status class name
     * @param {string} status - Status value
     * @returns {string}
     */
    getStatusClass(status) {
        const statusMap = {
            'Critical': 'status-critical',
            'Low': 'status-low',
            'Stable': 'status-stable'
        };
        return statusMap[status] || 'status-stable';
    },

    /**
     * Get priority class name
     * @param {string} priority - Priority value
     * @returns {string}
     */
    getPriorityClass(priority) {
        const priorityMap = {
            'High': 'priority-high',
            'Medium': 'priority-medium'
        };
        return priorityMap[priority] || 'priority-medium';
    },

    /**
     * Get status inline styles (for dynamic rendering)
     * @param {string} status - Status value
     * @returns {string}
     */
    getStatusStyle(status) {
        const styles = {
            'Critical': 'background-color: rgba(239, 68, 68, 0.2); color: #fca5a5;',
            'Low': 'background-color: rgba(217, 119, 6, 0.2); color: #fcd34d;',
            'Stable': 'background-color: rgba(16, 185, 129, 0.2); color: #86efac;'
        };
        return styles[status] || styles['Stable'];
    },

    /**
     * Get alert inline styles
     * @param {string} type - Alert type
     * @returns {string}
     */
    getAlertStyle(type) {
        const styles = {
            'critical': 'background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2);',
            'warning': 'background-color: rgba(217, 119, 6, 0.1); border-color: rgba(217, 119, 6, 0.2);',
            'success': 'background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2);'
        };
        return styles[type] || styles['warning'];
    },

    /**
     * Get alert icon
     * @param {string} type - Alert type
     * @returns {string}
     */
    getAlertIcon(type) {
        const icons = {
            'critical': 'alert-triangle',
            'warning': 'clock',
            'success': 'check-circle'
        };
        return icons[type] || 'alert-circle';
    }
};

// Export for use in other modules
window.Helpers = Helpers;