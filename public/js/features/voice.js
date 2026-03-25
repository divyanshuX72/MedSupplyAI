/**
 * MedicineSupply.ai - Advanced Voice Recognition Module
 * Handles voice commands, medicine search, and intelligent voice interactions
 */

const VoiceModule = {
    recognition: null,
    isListening: false,
    currentBillingMode: false,
    billingCart: [],
    medicineDatabase: {},

    /**
     * Initialize voice recognition
     */
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not available');
            NotificationsModule.show('Voice Assistant not supported in this browser', 'warning');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;

        this.loadMedicineDatabase();
        this.setupEventListeners();
        return true;
    },

    /**
     * Load medicine database from localStorage or use demo data
     */
    loadMedicineDatabase() {
        const stored = localStorage.getItem('voiceMedicineDB');
        if (stored) {
            this.medicineDatabase = JSON.parse(stored);
        } else {
            // Use database from DataModule if available
            if (typeof DataModule !== 'undefined' && DataModule.MEDICINE_DATABASE) {
                this.medicineDatabase = DataModule.MEDICINE_DATABASE;
            } else {
                // Fallback demo data
                this.medicineDatabase = {
                    'B-992': { name: 'Paracetamol IV', category: 'General', stock: 120, price: 5.50, location: 'Rack A-12', expiry: '2025-12-31', manufacturer: 'PharmaCorp' },
                    'B-334': { name: 'Ceftriaxone 1g', category: 'Antibiotic', stock: 450, price: 12.30, location: 'Rack C-05', expiry: '2026-06-20', manufacturer: 'MedLife' },
                    'B-402': { name: 'Insulin Glargine', category: 'Diabetes', stock: 32, price: 35.75, location: 'Fridge 1', expiry: '2025-02-14', manufacturer: 'NovoNordisk' },
                    'B-115': { name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 280, price: 3.20, location: 'Rack B-03', expiry: '2026-09-10', manufacturer: 'PharmaCorp' },
                    'B-101': { name: 'O- Blood Units', category: 'Critical', stock: 4, price: 45.00, location: 'Cold Storage 2', expiry: '2025-03-15', manufacturer: 'BloodBank' }
                };
            }
        }
    },

    /**
     * Setup recognition event listeners
     */
    setupEventListeners() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateListeningUI(true);
            this.playListeningSound();
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            const recognizedText = final || interim;
            this.updateTranscriptDisplay(recognizedText, !final);
            
            if (final) {
                this.handleVoiceInput(final.trim());
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateListeningUI(false);
        };

        this.recognition.onerror = (event) => {
            console.warn('Voice error:', event.error);
            this.updateTranscriptDisplay(`Error: ${event.error}`, false);
            NotificationsModule.show(`Voice Error: ${event.error}`, 'error');
        };
    },

    /**
     * Start listening for voice input
     */
    startListening() {
        if (!this.recognition) {
            if (!this.init()) {
                return;
            }
        }
        
        Helpers.toggleVisibility('voice-assistant-modal', true);
        this.updateTranscriptDisplay('Listening...', true);
        this.recognition.start();
    },

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition) {
            this.recognition.abort();
        }
        this.isListening = false;
        this.updateListeningUI(false);
    },

    /**
     * Close voice assistant modal
     */
    closeVoiceAssistant() {
        this.stopListening();
        Helpers.toggleVisibility('voice-assistant-modal', false);
    },

    /**
     * Update listening UI status
     */
    updateListeningUI(listening) {
        const statusEl = Helpers.getElement('voice-listening-status');
        if (statusEl) {
            statusEl.innerHTML = listening 
                ? '<span class="inline-block animate-pulse">🎤 Listening...</span>'
                : '<span>🎤 Ready to listen</span>';
        }

        const micBtn = Helpers.getElement('voice-mic-btn');
        if (micBtn) {
            micBtn.classList.toggle('listening', listening);
        }
    },

    /**
     * Update transcript display
     */
    updateTranscriptDisplay(text, isInterim) {
        const display = Helpers.getElement('voice-transcript-display');
        if (display) {
            display.innerHTML = `<span class="${isInterim ? 'text-gray-400 italic' : 'text-cyan-300 font-semibold'}">${text}</span>`;
        }
    },

    /**
     * Main voice input handler - routes to appropriate function
     */
    handleVoiceInput(text) {
        const cmd = text.toLowerCase().trim();
        
        // Check if it's a command or medicine search
        if (this.isCommand(cmd)) {
            this.executeCommand(cmd);
        } else {
            // Try to find medicine by name
            this.findMedicineByVoice(cmd);
        }
    },

    /**
     * Check if input is a command
     */
    isCommand(text) {
        const commands = [
            'open analytics', 'open billing', 'open inventory',
            'stock check', 'expiry check', 'add ', 'remove ',
            'today sales', 'low stock', 'near expiry', 'help',
            'cancel billing', 'complete billing', 'clear cart'
        ];
        return commands.some(cmd => text.includes(cmd));
    },

    /**
     * Execute voice commands
     */
    executeCommand(cmd) {
        // Navigation commands
        if (cmd.includes('open analytics')) {
            this.closeVoiceAssistant();
            ModalsModule.openAnalytics();
            NotificationsModule.show('Voice: Opening Analytics Dashboard', 'success');
            return;
        }

        if (cmd.includes('open billing')) {
            this.closeVoiceAssistant();
            this.startBillingMode();
            NotificationsModule.show('Voice: Billing Mode Started', 'success');
            return;
        }

        if (cmd.includes('open inventory')) {
            this.closeVoiceAssistant();
            NotificationsModule.show('Voice: Opening Inventory', 'success');
            return;
        }

        // Stock and expiry checks
        if (cmd.includes('stock check')) {
            const medicineName = cmd.replace('stock check', '').trim();
            this.handleStockCheck(medicineName);
            return;
        }

        if (cmd.includes('expiry check')) {
            const medicineName = cmd.replace('expiry check', '').trim();
            this.handleExpiryCheck(medicineName);
            return;
        }

        // Billing commands
        if (cmd.includes('add ') && this.currentBillingMode) {
            const parts = cmd.replace('add', '').trim().split(/\s+/);
            const medicineName = parts.slice(0, -1).join(' ');
            const quantity = parseInt(parts[parts.length - 1]) || 1;
            this.addMedicineToBilling(medicineName, quantity);
            return;
        }

        if (cmd.includes('remove ') && this.currentBillingMode) {
            const medicineName = cmd.replace('remove', '').trim();
            this.removeMedicineFromBilling(medicineName);
            return;
        }

        if (cmd.includes('complete billing') || cmd.includes('generate invoice')) {
            this.generateBillingInvoice();
            return;
        }

        if (cmd.includes('cancel billing') || cmd.includes('clear cart')) {
            this.cancelBillingMode();
            NotificationsModule.show('Voice: Billing cancelled', 'warning');
            return;
        }

        // Report commands
        if (cmd.includes('today sales')) {
            NotificationsModule.show('Voice: Generating today\'s sales report', 'success');
            return;
        }

        if (cmd.includes('low stock')) {
            this.showLowStockAlerts();
            return;
        }

        if (cmd.includes('near expiry')) {
            this.showExpiryAlerts();
            return;
        }

        if (cmd.includes('help')) {
            this.showVoiceCommandHelp();
            return;
        }

        NotificationsModule.show(`Voice: Command not recognized`, 'warning');
    },

    /**
     * Find medicine by voice input with fuzzy matching
     */
    findMedicineByVoice(query) {
        const results = this.fuzzySearchMedicines(query, 5);
        
        if (results.length === 0) {
            NotificationsModule.show(`Voice: No medicines found for "${query}"`, 'warning');
            this.updateTranscriptDisplay(`No match for "${query}". Try again.`, false);
            return;
        }

        // Show top match in popup
        const bestMatch = results[0];
        this.showMedicinePopup(bestMatch);

        // Show all matches
        if (results.length > 1) {
            this.updateTranscriptDisplay(`Found: ${results.map(r => r.name).join(', ')}`, false);
        }
    },

    /**
     * Fuzzy search algorithm using Levenshtein distance
     */
    fuzzySearchMedicines(query, limit = 5) {
        const results = [];
        const queryLower = query.toLowerCase();

        // First, try exact matches
        for (const [code, medicine] of Object.entries(this.medicineDatabase)) {
            const nameLower = medicine.name.toLowerCase();
            
            if (nameLower === queryLower || nameLower.includes(queryLower)) {
                results.push({
                    code,
                    ...medicine,
                    matchScore: 100,
                    matchType: 'exact'
                });
            }
        }

        // If no exact matches, use Levenshtein distance
        if (results.length === 0) {
            const matches = [];
            
            for (const [code, medicine] of Object.entries(this.medicineDatabase)) {
                const distance = this.levenshteinDistance(queryLower, medicine.name.toLowerCase());
                const similarity = 1 - (distance / Math.max(queryLower.length, medicine.name.length));
                
                if (similarity > 0.6) { // 60% similarity threshold
                    matches.push({
                        code,
                        ...medicine,
                        matchScore: Math.round(similarity * 100),
                        matchType: 'fuzzy'
                    });
                }
            }

            matches.sort((a, b) => b.matchScore - a.matchScore);
            results.push(...matches.slice(0, limit));
        }

        return results.slice(0, limit);
    },

    /**
     * Levenshtein distance algorithm for fuzzy matching
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    },

    /**
     * Show medicine details popup
     */
    showMedicinePopup(medicine) {
        const popup = Helpers.getElement('voice-medicine-popup');
        if (!popup) return;

        const daysToExpiry = this.calculateDaysToExpiry(medicine.expiry);
        const expiryStatus = daysToExpiry < 30 ? '🚨 EXPIRING SOON' : daysToExpiry < 60 ? '⚠️ WATCH' : '✅ SAFE';
        const stockStatus = medicine.stock < 50 ? '🔴 LOW' : medicine.stock < 100 ? '🟡 MEDIUM' : '🟢 HIGH';

        const html = `
            <div class="voice-popup-content">
                <div class="voice-popup-header">
                    <h3 class="text-xl font-bold text-cyan-300">${medicine.name}</h3>
                    <span class="text-xs px-2 py-1 rounded bg-cyan-600/30">${medicine.code}</span>
                </div>

                <div class="space-y-3 mt-4">
                    <div class="voice-popup-row">
                        <span class="label">Category:</span>
                        <span class="value">${medicine.category}</span>
                    </div>

                    <div class="voice-popup-row">
                        <span class="label">Stock:</span>
                        <span class="value ${stockStatus.includes('🔴') ? 'text-red-400' : stockStatus.includes('🟡') ? 'text-yellow-400' : 'text-green-400'}">
                            ${medicine.stock} units ${stockStatus}
                        </span>
                    </div>

                    <div class="voice-popup-row">
                        <span class="label">Price:</span>
                        <span class="value text-green-400">₹${medicine.price.toFixed(2)}</span>
                    </div>

                    <div class="voice-popup-row">
                        <span class="label">Location:</span>
                        <span class="value">${medicine.location}</span>
                    </div>

                    <div class="voice-popup-row">
                        <span class="label">Expiry:</span>
                        <span class="value ${expiryStatus.includes('🚨') ? 'text-red-400' : expiryStatus.includes('⚠️') ? 'text-yellow-400' : 'text-green-400'}">
                            ${medicine.expiry} ${expiryStatus}
                        </span>
                    </div>

                    <div class="voice-popup-row">
                        <span class="label">Manufacturer:</span>
                        <span class="value text-gray-300">${medicine.manufacturer || 'N/A'}</span>
                    </div>
                </div>

                <div class="voice-popup-actions mt-4">
                    <button onclick="VoiceModule.addMedicineToBilling('${medicine.name}', 1)" class="btn-action">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add to Cart
                    </button>
                    <button onclick="VoiceModule.closeVoiceAssistant()" class="btn-action">
                        <i data-lucide="x" class="w-4 h-4"></i> Close
                    </button>
                </div>
            </div>
        `;

        popup.innerHTML = html;
        Helpers.toggleVisibility('voice-medicine-popup', true);
        Helpers.refreshIcons();
    },

    /**
     * Calculate days until medicine expiry
     */
    calculateDaysToExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Handle stock check command
     */
    handleStockCheck(medicineName) {
        const results = this.fuzzySearchMedicines(medicineName, 1);
        
        if (results.length === 0) {
            NotificationsModule.show(`Voice: Medicine "${medicineName}" not found`, 'warning');
            return;
        }

        const medicine = results[0];
        const status = medicine.stock < 50 ? 'LOW' : medicine.stock < 100 ? 'MEDIUM' : 'HIGH';
        
        const message = `${medicine.name}: ${medicine.stock} units in stock. Status: ${status}. Location: ${medicine.location}`;
        this.speakText(message);
        NotificationsModule.show(`Voice: ${message}`, 'success');
    },

    /**
     * Handle expiry check command
     */
    handleExpiryCheck(medicineName) {
        const results = this.fuzzySearchMedicines(medicineName, 1);
        
        if (results.length === 0) {
            NotificationsModule.show(`Voice: Medicine "${medicineName}" not found`, 'warning');
            return;
        }

        const medicine = results[0];
        const daysToExpiry = this.calculateDaysToExpiry(medicine.expiry);
        const status = daysToExpiry < 30 ? 'EXPIRING SOON' : daysToExpiry < 60 ? 'WATCH' : 'SAFE';
        
        const message = `${medicine.name} expires on ${medicine.expiry}. ${daysToExpiry} days remaining. Status: ${status}`;
        this.speakText(message);
        NotificationsModule.show(`Voice: ${message}`, 'success');
    },

    /**
     * Start billing mode
     */
    startBillingMode() {
        this.currentBillingMode = true;
        this.billingCart = [];
        NotificationsModule.show('Voice: Billing mode active. Say "add <medicine> <quantity>" to add items', 'success');
        this.updateBillingDisplay();
    },

    /**
     * Cancel billing mode
     */
    cancelBillingMode() {
        this.currentBillingMode = false;
        this.billingCart = [];
        this.updateBillingDisplay();
    },

    /**
     * Add medicine to billing cart
     */
    addMedicineToBilling(medicineName, quantity = 1) {
        const results = this.fuzzySearchMedicines(medicineName, 1);
        
        if (results.length === 0) {
            NotificationsModule.show(`Voice: Medicine "${medicineName}" not found`, 'warning');
            return;
        }

        const medicine = results[0];
        
        // Check if already in cart
        const existingItem = this.billingCart.find(item => item.code === medicine.code);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.billingCart.push({
                ...medicine,
                quantity: quantity
            });
        }

        NotificationsModule.show(`Voice: Added ${quantity} × ${medicine.name} to cart`, 'success');
        this.updateBillingDisplay();
    },

    /**
     * Remove medicine from billing cart
     */
    removeMedicineFromBilling(medicineName) {
        const results = this.fuzzySearchMedicines(medicineName, 1);
        
        if (results.length === 0) {
            NotificationsModule.show(`Voice: Medicine "${medicineName}" not found`, 'warning');
            return;
        }

        const medicine = results[0];
        this.billingCart = this.billingCart.filter(item => item.code !== medicine.code);
        
        NotificationsModule.show(`Voice: Removed ${medicine.name} from cart`, 'success');
        this.updateBillingDisplay();
    },

    /**
     * Update billing display
     */
    updateBillingDisplay() {
        const display = Helpers.getElement('voice-billing-cart');
        if (!display) return;

        if (this.billingCart.length === 0) {
            display.innerHTML = '<p class="text-gray-400">Cart is empty</p>';
            return;
        }

        let total = 0;
        let html = '<div class="space-y-2">';

        this.billingCart.forEach(item => {
            const itemTotal = item.quantity * item.price;
            total += itemTotal;
            html += `
                <div class="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div>
                        <p class="font-semibold">${item.name}</p>
                        <p class="text-xs text-gray-400">${item.quantity} × ₹${item.price.toFixed(2)}</p>
                    </div>
                    <p class="font-bold text-green-400">₹${itemTotal.toFixed(2)}</p>
                </div>
            `;
        });

        html += `</div>
            <div class="mt-4 pt-2 border-t border-white/20">
                <div class="flex justify-between items-center">
                    <span class="font-bold">Total:</span>
                    <span class="text-xl font-bold text-green-400">₹${total.toFixed(2)}</span>
                </div>
            </div>`;

        display.innerHTML = html;
    },

    /**
     * Generate billing invoice
     */
    generateBillingInvoice() {
        if (this.billingCart.length === 0) {
            NotificationsModule.show('Voice: Cart is empty', 'warning');
            return;
        }

        let total = 0;
        const items = this.billingCart.map(item => {
            const itemTotal = item.quantity * item.price;
            total += itemTotal;
            return `${item.name}: ${item.quantity} × ₹${item.price} = ₹${itemTotal.toFixed(2)}`;
        });

        const invoice = `
INVOICE
================
${items.join('\n')}
================
Total: ₹${total.toFixed(2)}
Generated: ${new Date().toLocaleString()}
        `;

        NotificationsModule.show(`Voice: Invoice generated. Total: ₹${total.toFixed(2)}`, 'success');
        this.speakText(`Invoice generated. Total amount is ${total.toFixed(2)} rupees`);
        
        // Reset billing
        this.cancelBillingMode();

        console.log(invoice);
    },

    /**
     * Show low stock alerts via voice
     */
    showLowStockAlerts() {
        const lowStock = Object.entries(this.medicineDatabase)
            .filter(([_, medicine]) => medicine.stock < 50)
            .map(([code, medicine]) => `${medicine.name}: ${medicine.stock} units`)
            .slice(0, 5);

        if (lowStock.length === 0) {
            NotificationsModule.show('Voice: No low stock items', 'success');
            return;
        }

        const message = `Low stock: ${lowStock.join('. ')}`;
        this.speakText(message);
        NotificationsModule.show(`Voice: ${message}`, 'warning');
    },

    /**
     * Show expiry alerts via voice
     */
    showExpiryAlerts() {
        const expiringItems = Object.entries(this.medicineDatabase)
            .filter(([_, medicine]) => {
                const days = this.calculateDaysToExpiry(medicine.expiry);
                return days < 60 && days > 0;
            })
            .map(([code, medicine]) => {
                const days = this.calculateDaysToExpiry(medicine.expiry);
                return `${medicine.name}: expires in ${days} days`;
            })
            .slice(0, 5);

        if (expiringItems.length === 0) {
            NotificationsModule.show('Voice: No items expiring soon', 'success');
            return;
        }

        const message = `Expiring soon: ${expiringItems.join('. ')}`;
        this.speakText(message);
        NotificationsModule.show(`Voice: ${message}`, 'warning');
    },

    /**
     * Show voice command help
     */
    showVoiceCommandHelp() {
        const helpModal = Helpers.getElement('voice-help-modal');
        if (helpModal) {
            Helpers.toggleVisibility('voice-help-modal', true);
        }
    },

    /**
     * Text-to-speech output
     */
    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    },

    /**
     * Play listening sound effect
     */
    playListeningSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Silently fail if audio context not available
        }
    }
};

// Export for use in other modules
window.VoiceModule = VoiceModule;