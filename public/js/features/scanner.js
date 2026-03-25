/**
 * MedicineSupply.ai - Professional Pharmacy Scanner Module
 * Barcode/QR scanning with premium POS interface
 * Antique premium theme with dark coffee + muted gold accents
 */

const ScannerModule = {
    // Core state
    scanner: null,
    isScanning: false,
    mode: 'billing', // 'billing' or 'stock'
    torchEnabled: false,
    bulkMode: false,
    scanHistory: [],
    lastScannedCode: null,
    lastScanTime: 0,
    scannedItems: {},

    // Configuration
    DUPLICATE_SCAN_INTERVAL: 2000, // 2 seconds
    MAX_HISTORY_ITEMS: 5,
    BEEP_ENABLED: true,
    VIBRATION_ENABLED: true,

    /**
     * Initialize scanner module
     */
    init() {
        console.log('🔍 Scanner Module initializing...');
        this.loadMedicineDatabase();
        this.setupScannerUI();
        this.setupEventListeners();
        return true;
    },

    /**
     * Load medicine database from API (No Demo Data)
     */
    async loadMedicineDatabase() {
        this.medicineDatabase = {};

        try {
            console.log('🔄 Fetching full inventory for scanner...');
            const response = await fetch('/api/inventory');
            if (!response.ok) throw new Error('API Sync Failed');

            const items = await response.json();
            this.syncDatabase(items);

        } catch (err) {
            console.error('Scanner DB Sync Error:', err);
            this.showToast('Scanner Offline: DB Sync Failed');
        }
    },

    /**
     * Sync database from State or API
     */
    syncDatabase(items) {
        if (!items || !Array.isArray(items)) return;

        this.medicineDatabase = {};

        items.forEach(item => {
            // Support both direct DB format and AppState format
            const code = item.barcode || item.batch_number || item.batch; // Prefer barcode, fall back to batch
            if (code) {
                this.medicineDatabase[code] = {
                    name: item.name,
                    category: item.category,
                    stock: item.stock,
                    price: parseFloat(item.price),
                    location: item.location,
                    expiry: item.expiry_date || item.expiry,
                    manufacturer: item.manufacturer,
                    barcode: code,
                    id: item.id
                };
            }
        });
        console.log(`✓ Scanner DB Synced: ${Object.keys(this.medicineDatabase).length} items`);
    },

    /**
     * Setup scanner UI structure
     */
    setupScannerUI() {
        // Check if modal already exists
        if (Helpers.getElement('scanner-modal')) {
            console.log('✓ Scanner modal already exists');
            return;
        }

        const scannerHTML = `
            <div id="scanner-modal" class="hidden fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
                <!-- Top Bar -->
                <div class="bg-slate-900 border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-xl">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-cyan-500/10 rounded-lg">
                            <i data-lucide="scan-line" class="w-6 h-6 text-cyan-400"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-white tracking-tight">Scanner</h1>
                            <p class="text-xs text-cyan-400 font-mono" id="scanner-status">Camera Active</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <!-- Mode Toggle -->
                        <div class="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button onclick="ScannerModule.setMode('billing')" class="scanner-mode-btn active px-4 py-2 rounded-md text-sm font-bold transition-all" data-mode="billing">
                                Billing
                            </button>
                            <button onclick="ScannerModule.setMode('stock')" class="scanner-mode-btn px-4 py-2 rounded-md text-sm font-bold transition-all" data-mode="stock">
                                Stock
                            </button>
                        </div>
                        <!-- Close -->
                        <button onclick="ScannerModule.closeScanner()" class="text-slate-400 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-lg">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                    <!-- Camera Container -->
                    <div class="w-full max-w-lg mb-8 relative group">
                        <!-- Decorative glow -->
                        <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        
                        <div id="scanner-camera" class="relative bg-black rounded-2xl overflow-hidden aspect-square border border-white/10 shadow-2xl ring-1 ring-white/5">
                            <video id="scanner-video" class="w-full h-full object-cover"></video>
                            
                            <!-- Initial Overlay with Start Button -->
                            <div id="scanner-overlay-start" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                                <i data-lucide="scan-line" class="w-16 h-16 text-cyan-500 mb-4 animate-pulse"></i>
                                <p class="text-white font-bold text-lg mb-2">Ready to Scan</p>
                                <button onclick="ScannerModule.startScan()" class="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-bold shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform">
                                    Start Camera
                                </button>
                            </div>

                            <div class="absolute inset-0 pointer-events-none" id="scanner-guide" style="display: none;">
                                <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <pattern id="scanner-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <rect x="0" y="0" width="20" height="20" fill="none" stroke="rgba(6, 182, 212, 0.1)" stroke-width="0.5"/>
                                        </pattern>
                                    </defs>
                                    <rect width="100" height="100" fill="url(#scanner-grid)"/>
                                    <!-- Focus Square -->
                                    <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="rgba(6, 182, 212, 0.5)" stroke-width="1" stroke-dasharray="4 4" class="animate-pulse"/>
                                    
                                    <!-- Corners (Cyan) -->
                                    <g stroke="#22d3ee" stroke-width="3" fill="none" stroke-linecap="round">
                                        <path d="M 30 20 L 20 20 L 20 30" />
                                        <path d="M 70 20 L 80 20 L 80 30" />
                                        <path d="M 30 80 L 20 80 L 20 70" />
                                        <path d="M 70 80 L 80 80 L 80 70" />
                                    </g>
                                    
                                    <!-- Scanning Line -->
                                    <line x1="10" y1="50" x2="90" y2="50" stroke="#22d3ee" stroke-width="2" class="opacity-50">
                                        <animate attributeName="y1" values="20;80;20" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="y2" values="20;80;20" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                                    </line>
                                </svg>
                            </div>
                            <!-- Scanning Indicator -->
                            <div id="scanner-indicator" class="absolute top-0 left-0 right-0 h-full bg-cyan-500/10 opacity-0 transition-opacity duration-200"></div>
                        </div>
                    </div>

                    <!-- Result Card -->
                    <div id="scanner-result-card" class="hidden w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 id="scanner-result-name" class="text-xl font-bold text-white mb-1">Product Name</h3>
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-mono" id="scanner-result-code">CODE</span>
                                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">VERIFIED</span>
                                </div>
                            </div>
                            <span id="scanner-result-qty" class="bg-cyan-500 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg shadow-cyan-500/20">×1</span>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
                            <div>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Stock</p>
                                <p id="scanner-result-stock" class="text-lg font-bold text-white">--</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Price</p>
                                <p id="scanner-result-price" class="text-lg font-bold text-cyan-400">--</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                <p id="scanner-result-location" class="text-sm text-slate-200">--</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Expiry</p>
                                <p id="scanner-result-expiry" class="text-sm text-slate-200">--</p>
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <button onclick="ScannerModule.addScannedItem()" class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                <i data-lucide="check" class="w-5 h-5"></i> Confirm
                            </button>
                            <button onclick="ScannerModule.clearResult()" class="px-6 py-3 bg-white/5 text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <!-- History Section -->
                    <div id="scanner-history-section" class="w-full max-w-lg">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Scans</h3>
                            <button onclick="ScannerModule.clearHistory()" class="text-[10px] text-slate-500 hover:text-white transition-colors">Clear</button>
                        </div>
                        <div id="scanner-history-list" class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            <p class="text-xs text-slate-400 text-center py-4 italic">No recent scans</p>
                        </div>
                    </div>
                </div>

                <!-- Bottom Action Bar -->
                <div class="bg-slate-900 border-t border-white/10 px-6 py-4">
                    <div class="grid grid-cols-4 gap-3 max-w-lg mx-auto">
                        <!-- Scan Now -->
                        <button onclick="ScannerModule.startScan()" class="col-span-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-3 flex flex-col items-center gap-1 transition-all shadow-lg shadow-cyan-500/20 group">
                            <i data-lucide="camera" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                            <span class="text-[10px] font-bold">Camera</span>
                        </button>

                        <!-- Torch -->
                        <button onclick="ScannerModule.toggleTorch()" class="col-span-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl py-3 flex flex-col items-center gap-1 transition-all border border-white/5">
                            <i data-lucide="flashlight" class="w-5 h-5"></i>
                            <span class="text-[10px] font-bold">Light</span>
                        </button>

                        <!-- Manual -->
                        <button onclick="ScannerModule.showManualInput()" class="col-span-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl py-3 flex flex-col items-center gap-1 transition-all border border-white/5">
                            <i data-lucide="keyboard" class="w-5 h-5"></i>
                            <span class="text-[10px] font-bold">Type</span>
                        </button>

                        <!-- Done -->
                        <button onclick="ScannerModule.closeScanner()" class="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl py-3 flex flex-col items-center gap-1 transition-all border border-white/10">
                            <i data-lucide="check-circle" class="w-5 h-5"></i>
                            <span class="text-[10px] font-bold">Done</span>
                        </button>
                    </div>
                </div>

                <!-- Notification Toast (Floating) -->
            <div id="scanner-toast" class="hidden fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-white/10 backdrop-blur-md z-[70] flex items-center gap-3">
                <span id="toast-icon"></span>
                <span id="toast-message"></span>
            </div>
            </div>

            <!--Manual Input Modal-->
    <div id="scanner-manual-modal" class="hidden fixed inset-0 bg-black/80 z-[70] flex items-center justify-center backdrop-blur-sm p-4">
        <div class="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl relative">
            <button onclick="ScannerModule.closeManualInput()" class="absolute top-4 right-4 text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="text-center mb-6">
                <div class="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-lucide="keyboard" class="w-6 h-6 text-cyan-400"></i>
                </div>
                <h2 class="text-xl font-bold text-white">Manual Entry</h2>
                <p class="text-sm text-slate-400">Type the barcode number below</p>
            </div>

            <input type="text" id="scanner-manual-input" placeholder="e.g. B-992"
                class="w-full bg-black/30 text-white placeholder-slate-600 border border-white/10 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-cyan-500 transition-colors text-center font-mono tracking-widest uppercase">

                <button onclick="ScannerModule.handleManualInput()" class="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20">
                    Search Database
                </button>
        </div>
    </div>
`;

        // Insert into modals container
        const modalsContainer = Helpers.getElement('modals-container');
        if (modalsContainer) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scannerHTML;
            const children = Array.from(tempDiv.children);
            children.forEach(child => modalsContainer.appendChild(child));
            console.log('✓ Scanner UI created with', children.length, 'elements');
        } else {
            console.warn('⚠️ modals-container not found');
        }

        // Initialize Lucide icons
        if (window.lucide) {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Manual input modal
        const manualInput = Helpers.getElement('scanner-manual-input');
        if (manualInput) {
            manualInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleManualInput();
                }
            });
        }

        // Camera select (for mobile)
        // this.initializeCamera(); // Removed to prevent auto-start
    },

    /**
     * Initialize camera access
     */
    initializeCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    const video = Helpers.getElement('scanner-video');
                    if (video) {
                        video.srcObject = stream;
                        this.cameraStream = stream;
                        console.log('✓ Camera initialized');
                    }
                })
                .catch(err => {
                    console.warn('Camera access denied:', err);
                    this.showToast('Camera access required');
                });
        } catch (e) {
            console.warn('Camera initialization error:', e);
        }
    },

    /**
     * Open scanner (alias for open compatibility)
     */
    open() {
        console.log('📱 Scanner opening...');
        this.openScanner();
    },

    /**
     * Open scanner main function
     */
    openScanner() {
        console.log('🔍 openScanner() called');
        const modal = Helpers.getElement('scanner-modal');
        if (!modal) {
            console.error('❌ Scanner modal not found! Trying to create...');
            this.setupScannerUI();
            return;
        }

        modal.classList.remove('hidden');
        this.isScanning = true;
        this.updateStatus('Ready to scan...');
        console.log('✓ Scanner modal opened');

        // Try to initialize camera
        // this.initializeCamera(); // Removed: Don't just init, actually start the scan if that's the intention, 
        // or wait for "Start Scan" button.
        // Given user wants "start only after clicking 'Scan Barcode'", we might interpret 
        // opening the modal AS clicking "Scan Barcode" from the dashboard.
        // However, simpler to just let them click the camera button inside.
        // BUT, usually "Scan Barcode" on dashboard means "I want to scan".
        // Let's AUTO-START when modal opens, as the modal *is* the scanner.
        // The user's compliant was "auto start in web dashboard", which likely meant background/on-load.
        this.startScan(); // Auto-start when modal opens explicitly
    },

    /**
     * Close scanner
     */
    closeScanner() {
        console.log('🔍 closeScanner() called');
        const modal = Helpers.getElement('scanner-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.stopScan();
        this.isScanning = false;
        console.log('✓ Scanner closed');
    },

    /**
     * Close scanner (alias for compatibility)
     */
    close() {
        this.closeScanner();
    },

    /**
     * Start scanning
     */
    /**
     * Start scanning
     */
    startScan() {
        console.log('🔍 Start scanning clicked');

        if (this.isScanning && this.codeReader) {
            console.log('Already scanning');
            return;
        }

        // Initialize ZXing Reader if not ready
        if (!this.codeReader) {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            console.log('📷 ZXing Reader Initialized');
        }

        this.isScanning = true;
        this.updateStatus('Starting camera...');

        // Hide start overlay, show guide
        const overlay = Helpers.getElement('scanner-overlay-start');
        const guide = Helpers.getElement('scanner-guide');
        if (overlay) overlay.classList.add('hidden');
        if (guide) guide.style.display = 'block';

        // Get selected device or default (environment)
        // We can pass undefined to let ZXing pick the default facingMode: environment
        this.codeReader.decodeFromVideoDevice(undefined, 'scanner-video', (result, err) => {
            if (result) {
                // SUCCESSFUL DECODE
                console.log('🏷️ Barcode Detected:', result.getText());
                this.handleScanResult(result.getText());
            } else if (err && !(err instanceof ZXing.NotFoundException)) {
                // Real error (ignore NotFoundException which happens every frame no code is found)
                console.warn('Scan Error:', err);
            }
        })
            .then(() => {
                console.log('📷 Camera Feed Active');
                this.updateStatus('Scanning... Point at code');
                this.animateScanIndicator();
            })
            .catch(err => {
                console.error('❌ Camera Start Error:', err);
                this.showToast('Camera Error: ' + err.message);
                this.updateStatus('Camera Failed');
                this.isScanning = false;
            });
    },

    /**
     * Stop scanning
     */
    stopScan() {
        if (this.codeReader) {
            this.codeReader.reset(); // Stops video and decoding
            console.log('📷 Camera Stopped');
        }
        this.isScanning = false;
        this.isScanning = false;
        this.updateStatus('Ready to scan');

        // Show start overlay, hide guide
        const overlay = Helpers.getElement('scanner-overlay-start');
        const guide = Helpers.getElement('scanner-guide');
        if (overlay) overlay.classList.remove('hidden');
        if (guide) guide.style.display = 'none';
    },

    /**
     * Handle scan result
     */
    async handleScanResult(scannedCode) {
        // Check for duplicate scans within 2 seconds
        const now = Date.now();
        if (this.lastScannedCode === scannedCode && (now - this.lastScanTime) < this.DUPLICATE_SCAN_INTERVAL) {
            return;
        }

        this.lastScannedCode = scannedCode;
        this.lastScanTime = now;

        // Play beep
        if (this.BEEP_ENABLED) {
            this.playBeep();
        }

        // Vibrate
        if (this.VIBRATION_ENABLED && navigator.vibrate) {
            navigator.vibrate(50);
        }

        this.updateStatus('Processing...');

        // LOCAL LOOKUP ONLY (Preview)
        const product = this.medicineDatabase[scannedCode];

        if (product) {
            this.showToast('Product Found');
            this.displayResult(scannedCode, product);
        } else {
            console.warn('❌ Product not found locally:', scannedCode);
            this.showToast('Product not found in Local DB');
            this.updateStatus('Unknown Product');
        }
    },

    /**
     * Find product by barcode (Legacy / Fallback if needed)
     */
    findProductByBarcode(barcode) {
        return null; // Not used
    },

    /**
     * Display scan result
     */
    displayResult(code, product) {
        const resultCard = Helpers.getElement('scanner-result-card');
        if (!resultCard) return;

        // Update quantity (visual tracking for this session)
        if (!this.scannedItems[code]) {
            this.scannedItems[code] = { ...product, quantity: 1 };
        } else {
            this.scannedItems[code].quantity += 1;
        }

        const item = this.scannedItems[code];

        // Handle DB field differences (expiry_date vs expiry)
        const expiryDate = product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : (product.expiry || 'N/A');
        const price = parseFloat(product.price || 0);

        // Update result card
        Helpers.getElement('scanner-result-name').textContent = product.name;
        Helpers.getElement('scanner-result-code').textContent = `Code: ${code} `;
        Helpers.getElement('scanner-result-qty').textContent = `×${item.quantity} `;
        Helpers.getElement('scanner-result-stock').textContent = `${product.stock} units`;
        Helpers.getElement('scanner-result-price').textContent = `$${price.toFixed(2)} `;
        Helpers.getElement('scanner-result-location').textContent = product.location || 'Unsorted';
        Helpers.getElement('scanner-result-expiry').textContent = expiryDate;

        // Show result card
        resultCard.classList.remove('hidden');

        // Add to history
        this.addToHistory(product, code);

        this.updateStatus(`Scanned: ${product.name} `);
    },

    /**
     * Add scanned item (CONFIRM ACTION)
     */
    async addScannedItem() {
        const resultCard = Helpers.getElement('scanner-result-card');
        if (resultCard.classList.contains('hidden')) return;

        const code = Helpers.getElement('scanner-result-code').textContent.replace('Code: ', '').trim();
        const product = this.scannedItems[code];

        if (!product) return;

        // 1. Send to Backend (Create Pending Order)
        try {
            this.updateStatus('Sending to Queue...');

            const response = await fetch('/api/scan/barcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barcode: code,
                    branch_id: 1 // Default to Main Branch for Hackathon
                })
            });

            const data = await response.json();

            if (response.status === 404 && data.actionRequired === 'ADMIN_REVIEW') {
                this.showToast('Medicine not registered. Storage rejected.', 'error');
                this.updateStatus('Sent for Admin Review');
                this.clearResult();
                return;
            }

            if (data.success) {
                // Success
                this.showToast('Order Sent to Queue');

                // 2. Clear UI
                this.clearResult();
                this.closeScanner();

                // 3. Navigate to Auto-Procurement
                if (window.ViewModule) {
                    setTimeout(() => {
                        ViewModule.switchView('procurement');
                    }, 500);
                }

            } else {
                this.showToast(data.message || 'Failed to queue order');
            }

        } catch (error) {
            console.error('Queue Error:', error);
            this.showToast('Network Error');
        }
    },

    /**
     * Clear result
     */
    clearResult() {
        const resultCard = Helpers.getElement('scanner-result-card');
        if (resultCard) {
            resultCard.classList.add('hidden');
        }
        this.updateStatus('Ready to scan...');
    },

    /**
     * Add to history
     */
    addToHistory(product, code) {
        const history = {
            name: product.name,
            code,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.scanHistory.unshift(history);
        if (this.scanHistory.length > this.MAX_HISTORY_ITEMS) {
            this.scanHistory.pop();
        }

        this.updateHistoryDisplay();
    },

    /**
     * Clear history
     */
    clearHistory() {
        this.scanHistory = [];
        this.updateHistoryDisplay();
        this.showToast('History cleared');
    },

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyList = Helpers.getElement('scanner-history-list');
        if (!historyList) return;

        if (this.scanHistory.length === 0) {
            historyList.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">No recent scans</p>';
            return;
        }

        historyList.innerHTML = this.scanHistory.map(item => `
            <div class="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs hover:bg-white/10 transition-colors cursor-pointer" onclick="ScannerModule.searchByCode('${item.code}')">
                <div>
                    <p class="text-white font-medium">${item.name}</p>
                    <p class="text-slate-400 font-mono">${item.code}</p>
                </div>
                <p class="text-slate-500">${item.time}</p>
            </div>
        `).join('');
    },

    /**
     * Search by code from history
     */
    searchByCode(code) {
        const product = this.medicineDatabase[code];
        if (product) {
            this.displayResult(code, product);
        }
    },

    /**
     * Set mode
     */
    setMode(newMode) {
        this.mode = newMode;

        // Update button states
        document.querySelectorAll('.scanner-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });

        this.showToast(newMode === 'billing' ? 'Billing Mode' : 'Stock Mode');
    },

    /**
     * Toggle torch
     */
    toggleTorch() {
        this.torchEnabled = !this.torchEnabled;

        if (this.cameraStream) {
            const videoTrack = this.cameraStream.getVideoTracks()[0];
            if (videoTrack && videoTrack.getCapabilities && videoTrack.getCapabilities().torch) {
                videoTrack.applyConstraints({
                    advanced: [{ torch: this.torchEnabled }]
                });
                this.showToast(this.torchEnabled ? 'Light ON' : 'Light OFF');
            }
        }
    },

    /**
     * Toggle bulk mode
     */
    toggleBulkMode() {
        this.bulkMode = !this.bulkMode;
        this.showToast(this.bulkMode ? 'Bulk Mode ON' : 'Bulk Mode OFF');
    },

    /**
     * Show manual input modal
     */
    showManualInput() {
        console.log('📝 Manual input opened');
        const modal = Helpers.getElement('scanner-manual-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        const input = Helpers.getElement('scanner-manual-input');
        if (input) {
            input.focus();
            input.value = '';
        }
    },

    /**
     * Close manual input modal
     */
    closeManualInput() {
        console.log('📝 Manual input closed');
        const modal = Helpers.getElement('scanner-manual-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    /**
     * Handle manual input
     */
    handleManualInput() {
        const input = Helpers.getElement('scanner-manual-input');
        if (!input) {
            console.warn('Manual input field not found');
            return;
        }

        const code = input.value.trim();
        console.log('🔍 Searching for code:', code);

        if (!code) {
            this.showToast('Enter a product code');
            return;
        }

        const product = this.medicineDatabase[code];
        if (product) {
            console.log('✓ Product found:', product.name);
            this.displayResult(code, product);
            this.closeManualInput();
        } else {
            console.warn('❌ Product not found:', code);
            this.showToast('Product not found');
        }
    },

    /**
     * Update status
     */
    updateStatus(message) {
        const status = Helpers.getElement('scanner-status');
        if (status) {
            status.textContent = message;
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = Helpers.getElement('scanner-toast');
        if (!toast) return;

        toast.textContent = message;

        // Handle styling based on type
        if (type === 'error') {
            toast.classList.remove('bg-slate-800/90', 'border-white/10');
            toast.classList.add('bg-red-500/90', 'border-red-500/50');
        } else {
            toast.classList.add('bg-slate-800/90', 'border-white/10');
            toast.classList.remove('bg-red-500/90', 'border-red-500/50');
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    /**
     * Play beep sound
     */
    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            // Silently fail
        }
    },

    /**
     * Animate scan indicator
     */
    animateScanIndicator() {
        const indicator = Helpers.getElement('scanner-indicator');
        if (!indicator) return;

        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 300);
    }
};

// Export module
window.ScannerModule = ScannerModule;