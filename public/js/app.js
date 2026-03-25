/**
 * MedicineSupply.ai - Main Application
 * Application initialization and global functions
 */

/**
 * View Module - Client Side Navigation
 */
const ViewModule = {
    currentView: 'dashboard',

    switchView(viewId) {
        // Special Case: Scanner
        if (viewId === 'scanner') {
            ScannerModule.open();
            this.updateNavState(viewId);
            return;
        }

        // 1. Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        // 2. Show target view
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            this.currentView = viewId;
        }

        // 3. Update Nav State
        this.updateNavState(viewId);

        // 4. Trigger specific renders if needed
        if (viewId === 'predict') {
            PredictionsModule.renderView();
        } else if (viewId === 'supply') {
            ProcurementModule.renderView();
        }
    },

    updateNavState(activeId) {
        // Delegate sidebar rendering to the shared module
        if (window.SidebarModule) {
            SidebarModule.render('app-sidebar', activeId);
        } else {
            // Fallback if module missing (legacy)
            const navContainer = document.getElementById('nav-container');
            if (navContainer && DataModule && DataModule.NAV_ITEMS) {
                // ... (legacy logic implied, but we rely on module now) ...
                // Minimal fallback to avoid errors
                console.warn('SidebarModule not loaded');
            }
        }
    }
};

window.ViewModule = ViewModule;

const App = {
    /**
     * Initialize application
     */
    init() {
        console.log('Initializing App...');

        // Initialize Modules
        AppState.init();
        RenderModule.refreshAll();
        // Determine initial view from URL
        const path = window.location.pathname.replace('/', '') || 'dashboard';
        // Handle query params fallback still
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');

        const initialView = viewParam || (['inventory', 'predict', 'supply', 'scanner'].includes(path) ? path : 'dashboard');

        ViewModule.switchView(initialView);

        // Initialize AI
        PredictionsModule.init();

        // Initialize Scanner
        ScannerModule.init();

        // Setup Event Listeners
        this.setupEventListeners();

        // Start real-time updates (poll every 5 seconds)
        AppState.startRealTimeUpdates(5000);
    },

    /**
     * Render all UI components
     */
    renderUI() {
        RenderModule.renderNav();
        RenderModule.renderSidebarActions();
        RenderModule.renderHeaderActions();
        RenderModule.renderStats();
        RenderModule.renderStock();
        NotificationsModule.renderAlerts();
        ProcurementModule.renderSuggestions();
        Helpers.refreshIcons();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = Helpers.getElement('search-medicine');
        if (searchInput) {
            searchInput.addEventListener('input',
                Helpers.debounce(() => RenderModule.renderStock(), 300)
            );
        }
    },

    /**
     * Handle Search Scan
     */
    html5QrCodeSearch: null,

    async handleSearchScan() {
        const modal = document.getElementById('dashboard-scanner-modal');
        if (!modal) return;

        // Reuse the existing modal structure
        const readerId = "dashboard-reader"; // Same container

        // 1. Show Modal
        modal.classList.remove('hidden');

        // 2. Change Close Action to stop THIS scanner
        const closeBtn = modal.querySelector('button');
        closeBtn.onclick = () => this.stopSearchScan();

        // 3. Wait for render
        await new Promise(r => setTimeout(r, 300));

        try {
            if (!this.html5QrCodeSearch) {
                this.html5QrCodeSearch = new Html5Qrcode(readerId);
            }

            await this.html5QrCodeSearch.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    if (decodedText) {
                        this.onSearchScanSuccess(decodedText);
                    }
                },
                () => { }
            );
        } catch (err) {
            console.error("Search Scanner Error:", err);
            alert("Camera failed to start for search.");
            this.stopSearchScan();
        }
    },

    async onSearchScanSuccess(decodedText) {
        if (!decodedText) return;

        await this.stopSearchScan();

        const scannedValue = String(decodedText).trim().toUpperCase();
        console.log("Search Scan:", scannedValue);

        const searchInput = Helpers.getElement('search-medicine');
        if (searchInput) {
            searchInput.value = scannedValue;
            // Trigger Input Event to Filter
            searchInput.dispatchEvent(new Event('input'));
            NotificationsModule.show(`Found Barcode: ${scannedValue}`, 'success');
        }
    },

    async stopSearchScan() {
        if (this.html5QrCodeSearch && this.html5QrCodeSearch.isScanning) {
            try {
                await this.html5QrCodeSearch.stop();
            } catch (e) {
                console.warn("Stop search scanner error", e);
            }
        }
        document.getElementById('dashboard-scanner-modal').classList.add('hidden');
    },

    /**
     * Toggle emergency mode
     */
    toggleEmergency() {
        AppState.setEmergency(!AppState.isEmergency);

        const body = Helpers.getElement('app-body');

        if (AppState.isEmergency) {
            body.classList.add('emergency-mode');
            NotificationsModule.show('🚨 EMERGENCY MODE ACTIVATED', 'critical');
        } else {
            body.classList.remove('emergency-mode');
            NotificationsModule.show('Emergency mode deactivated', 'success');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for global access
window.App = App;