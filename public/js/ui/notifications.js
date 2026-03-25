/**
 * MedicineSupply.ai - Notifications Module
 * Handles toast notifications and alerts display
 */

const NotificationsModule = {
    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - Type: 'success', 'warning', 'critical'
     */
    show(message, type = 'warning') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 5rem;
                right: 1rem;
                z-index: 100;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');

        const styleMap = {
            critical: 'background-color: rgba(239, 68, 68, 0.9); border-color: rgba(239, 68, 68, 0.5); color: white;',
            warning: 'background-color: rgba(217, 119, 6, 0.9); border-color: rgba(217, 119, 6, 0.5); color: white;',
            success: 'background-color: rgba(16, 185, 129, 0.9); border-color: rgba(16, 185, 129, 0.5); color: white;',
            info: 'background-color: rgba(6, 182, 212, 0.9); border-color: rgba(6, 182, 212, 0.5); color: white;'
        };

        const iconMap = {
            critical: 'alert-triangle',
            warning: 'alert-circle',
            success: 'check-circle',
            info: 'info'
        };

        notification.style.cssText = `
            padding: 1rem; 
            border-radius: 0.5rem; 
            border: 1px solid; 
            max-width: 20rem; 
            min-width: 15rem;
            animation: slideInRight 0.3s ease-out;
            pointer-events: auto;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            ${styleMap[type] || styleMap.info}
        `;

        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${iconMap[type] || 'info'}" class="w-5 h-5"></i>
                <p class="text-sm font-medium">${message}</p>
            </div>
        `;

        container.appendChild(notification);
        Helpers.refreshIcons();

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            notification.addEventListener('animationend', () => {
                notification.remove();
                // Clean up container if empty
                if (container.children.length === 0) {
                    container.remove();
                }
            });
        }, 3000);
    },

    /**
     * Render alerts in the notifications container
     */
    renderAlerts() {
        const alerts = this.generateAlerts();
        const container = Helpers.getElement('notifications-container');

        if (!container) return;

        container.innerHTML = alerts.map(alert => `
            <div style="${Helpers.getAlertStyle(alert.type)}" class="p-3 rounded-lg border flex gap-3">
                <i data-lucide="${Helpers.getAlertIcon(alert.type)}" class="w-4 h-4 flex-shrink-0"></i>
                <div>
                    <p class="text-sm font-medium">${alert.message}</p>
                    <span class="text-xs text-slate-500">${alert.time}</span>
                </div>
            </div>
        `).join('');

        Helpers.refreshIcons();
    },

    /**
     * Generate alerts from stock data
     * @returns {Array}
     */
    generateAlerts() {
        const alerts = [];
        const items = AppState.getStockItems();

        // Critical stock alerts
        items.filter(i => i.status === 'Critical').forEach(item => {
            alerts.push({
                type: 'critical',
                message: `🚨 ${item.name} stock critical (${item.stock} units)`,
                time: 'Just now'
            });
        });

        // Expiry alerts
        items.forEach(item => {
            const days = Helpers.daysUntil(item.expiry);
            if (days < 30 && days > 0) {
                alerts.push({
                    type: 'warning',
                    message: `⏰ ${item.name} expires in ${days} days`,
                    time: '2h ago'
                });
            }
        });

        // Limit to 5 most recent
        return alerts.slice(0, 5);
    }
};

// Export for use in other modules
window.NotificationsModule = NotificationsModule;