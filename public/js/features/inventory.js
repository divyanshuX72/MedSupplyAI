/**
 * MedicineSupply.ai - Inventory Feature
 * Handles inventory operations
 */

const InventoryModule = {
    /**
     * Export inventory to CSV
     */
    export() {
        const items = AppState.getStockItems();

        if (items.length === 0) {
            NotificationsModule.show('No items to export', 'warning');
            return;
        }

        // CSV Header
        const headers = ['ID', 'Batch', 'Name', 'Category', 'Stock', 'Price', 'Location', 'Expiry', 'Manufacturer'];

        // CSV Rows
        const rows = items.map(item => [
            item.id,
            item.batch_number || item.batch, // Handle both DB and local field names if different
            `"${item.name}"`, // Quote strings to handle commas
            item.category,
            item.stock,
            item.price,
            `"${item.location}"`,
            item.expiry_date || item.expiry,
            `"${item.manufacturer}"`
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        NotificationsModule.show('Inventory exported successfully', 'success');
    }
};

// Export for global access
window.InventoryModule = InventoryModule;
