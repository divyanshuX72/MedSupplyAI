/**
 * MedicineSupply.ai - Medicine Feature
 * Handles adding and managing medicines
 */

const MedicineModule = {
    /**
     * Save new medicine
     */
    /**
     * STATE: Single source of truth for barcode
     */
    currentBarcode: '',
    html5QrCode: null,

    /**
     * Handle Manual Barcode Input
     * Unified logic for typing and pasting
     */
    handleBarcodeInput(value) {
        // Normalize: Upper case, trim
        const normalized = (value || '').trim().toUpperCase();
        this.currentBarcode = normalized;

        // Update UI Validation Status
        const statusEl = document.getElementById('medicine-barcode-status');
        if (statusEl) {
            if (normalized.length > 3) {
                statusEl.innerText = 'Valid format';
                statusEl.className = 'text-xs min-h-[20px] text-emerald-400';
            } else if (normalized.length > 0) {
                statusEl.innerText = 'Too short';
                statusEl.className = 'text-xs min-h-[20px] text-amber-400';
            } else {
                statusEl.innerText = '';
            }
        }
    },

    /**
     * Start Camera Scanner
     * Triggers the mobile-friendly scanner modal
     */
    async startScan() {
        const modal = document.getElementById('dashboard-scanner-modal');
        if (!modal) return;

        // 1. Show Modal
        modal.classList.remove('hidden');

        // 2. Wait for render
        await new Promise(r => setTimeout(r, 300));

        try {
            // 3. Init Scanner
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode("dashboard-reader");
            }

            // 4. Start Stream
            await this.html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    if (decodedText) {
                        this.onScanSuccess(decodedText);
                    }
                },
                () => { } // Ignore frame errors
            );
        } catch (err) {
            console.error("Scanner start error:", err);
            if (err?.name === 'NotAllowedError') {
                alert("Camera permission denied.");
            } else if (!err?.toString().includes("is running")) {
                alert("Failed to start camera.");
            }
            this.stopScan();
        }
    },

    /**
     * Handle Successful Scan
     */
    async onScanSuccess(decodedText) {
        if (!decodedText) return;

        // 1. Stop Scanner
        await this.stopScan();

        // 2. Process Value
        const scannedValue = String(decodedText).trim().toUpperCase();
        console.log("Dashboard Scan:", scannedValue);

        // 3. Update Input
        const input = document.getElementById('medicine-barcode');
        if (input) {
            input.value = scannedValue;
            this.handleBarcodeInput(scannedValue);
        }

        // 4. Feedback
        const status = document.getElementById('medicine-barcode-status');
        if (status) {
            status.innerText = 'Scan Successful!';
            status.className = 'text-xs min-h-[20px] text-emerald-400';
            setTimeout(() => {
                if (status.innerText === 'Scan Successful!') this.handleBarcodeInput(scannedValue);
            }, 2000);
        }
    },

    /**
     * Stop Scanner
     */
    async stopScan() {
        if (this.html5QrCode && this.html5QrCode.isScanning) {
            try {
                await this.html5QrCode.stop();
            } catch (e) {
                console.warn("Stop scanner error", e);
            }
        }
        document.getElementById('dashboard-scanner-modal').classList.add('hidden');
    },

    /**
     * Save new medicine
     */
    async save() {
        // Collect form data
        const data = {
            name: Helpers.getElement('medicine-name')?.value,
            category: Helpers.getElement('medicine-category')?.value,
            stock: parseInt(Helpers.getElement('medicine-stock')?.value || 0),
            price: parseFloat(Helpers.getElement('medicine-price')?.value || 0),
            batch: Helpers.getElement('medicine-batch')?.value || ('BATCH-' + Date.now()), // Auto-generate if missing
            location: Helpers.getElement('medicine-location')?.value,
            expiry: Helpers.getElement('medicine-expiry')?.value,
            manufacturer: Helpers.getElement('medicine-manufacturer')?.value,
            barcode: this.currentBarcode || Helpers.getElement('medicine-barcode')?.value // Use state or input
        };

        // Validation
        if (!data.name || !data.batch || !data.category || !data.location) {
            NotificationsModule.show('Please fill in all required fields (*)', 'error');
            return;
        }

        try {
            // Show loading state
            const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'Saving...';
            saveBtn.disabled = true;

            // Send to API
            const method = this.editingId ? 'PUT' : 'POST';
            const url = this.editingId ? `/api/inventory/${this.editingId}` : '/api/inventory';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Added Auth Header
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save medicine');
            }

            // Success
            const action = this.editingId ? 'updated' : 'added';
            NotificationsModule.show(`Successfully ${action} ${result.name}`, 'success');

            // Refresh inventory
            await AppState.fetchInventory();

            // Close modal and reset form
            ModalsModule.closeAddMedicine();
            this.resetForm();

        } catch (error) {
            console.error('Save error:', error);
            NotificationsModule.show(error.message, 'error');
        } finally {
            // Restore button
            const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');
            if (saveBtn) {
                saveBtn.innerText = 'Add Medicine';
                saveBtn.disabled = false;
            }
        }
    },

    /**
     * Edit medicine
     * @param {number} id - Medicine ID
     */
    edit(id) {
        const item = AppState.getStockItems().find(i => i.id === id);
        if (!item) {
            NotificationsModule.show('Medicine not found', 'error');
            return;
        }

        // Sync State
        this.currentBarcode = item.barcode || '';

        // Populate fields
        ModalsModule.fillMedicineForm(item, item.barcode || '');

        // Update UI for Edit Mode
        this.editingId = id;
        const modalTitle = document.querySelector('#add-medicine-modal h2');
        const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');

        if (modalTitle) modalTitle.innerHTML = '<i data-lucide="edit" class="text-cyan-400 w-5 h-5"></i> Edit Medicine';
        if (saveBtn) saveBtn.innerText = 'Update Medicine';

        Helpers.refreshIcons();
        ModalsModule.openAddMedicine(false);
    },

    /**
     * Reset form fields and state
     */
    resetForm() {
        this.editingId = null;
        this.currentBarcode = ''; // Reset State

        // Reset UI Text
        const modalTitle = document.querySelector('#add-medicine-modal h2');
        const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');
        const statusEl = document.getElementById('medicine-barcode-status');

        if (modalTitle) modalTitle.innerHTML = '<i data-lucide="package-plus" class="text-emerald-400 w-5 h-5"></i> Add Medicine';
        if (saveBtn) saveBtn.innerText = 'Add Medicine';
        if (statusEl) statusEl.innerText = '';

        Helpers.refreshIcons();

        const ids = [
            'medicine-name', 'medicine-category', 'medicine-stock',
            'medicine-price', 'medicine-location',
            'medicine-expiry', 'medicine-manufacturer', 'medicine-barcode',
            'medicine-batch' // Add batch to reset
        ];

        ids.forEach(id => {
            const el = Helpers.getElement(id);
            if (el) el.value = '';
            if (el) el.classList.remove('border-red-500'); // Also remove validation styling
        });
    },

    /**
     * Validate Medicine Form
     */
    validateMedicineForm() {
        const ids = [
            'medicine-name', 'medicine-category', 'medicine-stock',
            'medicine-price', 'medicine-location',
            'medicine-expiry', 'medicine-manufacturer', 'medicine-barcode'
            // 'medicine-batch' removed from UI
        ];

        let isValid = true;
        ids.forEach(id => {
            const el = Helpers.getElement(id);
            if (!el || !el.value.trim()) {
                isValid = false;
                if (el) el.classList.add('border-red-500');
            } else {
                if (el) el.classList.remove('border-red-500');
            }
        });

        return isValid;
    }
};

// Export for global access
window.MedicineModule = MedicineModule;
