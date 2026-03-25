/**
 * MedicineSupply.ai - Render Module
 * Handles UI rendering functions
 */

const RenderModule = {
    /**
     * Render navigation
     */
    renderNav() {
        const nav = Helpers.getElement('nav-container');
        if (!nav) return;

        nav.innerHTML = DataModule.NAV_ITEMS.map(item => `
            <button onclick="ViewModule.switchView('${item.id}')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all text-left ${item.id === ViewModule.currentView ? 'bg-white/5 text-cyan-400' : ''}">
                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                <span class="hidden lg:block">${item.label}</span>
            </button>
        `).join('');

        Helpers.refreshIcons();
    },

    /**
     * Render sidebar actions
     */
    /**
     * Render sidebar actions
     */
    renderSidebarActions() {
        const container = Helpers.getElement('sidebar-actions');
        if (!container) return;

        // Sidebar Actions
        container.innerHTML = `
            <!-- Analytics Button -->
            <button onclick="ModalsModule.openAnalytics()" class="sidebar-action group mb-2">
                <i data-lucide="bar-chart-3" class="sidebar-action-icon"></i>
                <div class="text-left hidden lg:block">
                    <p class="text-xs font-bold">Analytics</p>
                    // <p class="text-[10px] text-slate-500">View Reports</p>
                </div>
            </button>

            <!-- AI Model Button -->
            <button onclick="PredictionsModule.activateModel()" id="ai-model-btn-sidebar" class="sidebar-action group mb-2">
                <i data-lucide="cpu" class="sidebar-action-icon"></i>
                <div class="text-left hidden lg:block">
                    <p class="text-xs font-bold">AI Model</p>
                    <p id="ai-model-status-sidebar" class="text-[10px] text-slate-500">Click to Activate</p>
                </div>
            </button>

            <!-- Advanced Analytics Button -->
            <button onclick="ModalsModule.openAnalytics()" class="sidebar-action group mb-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 hover:border-cyan-400/50">
                <i data-lucide="bar-chart-2" class="sidebar-action-icon text-cyan-400"></i>
                <div class="text-left hidden lg:block">
                    <p class="text-xs font-bold text-cyan-100">Analytics</p>
                    <p class="text-[10px] text-cyan-400/70">View Reports</p>
                </div>
            </button>

            <!-- Scanner Button -->
            <button onclick="ScannerModule.open()" class="sidebar-action group mb-2">
                <i data-lucide="scan" class="sidebar-action-icon"></i>
                <div class="text-left hidden lg:block">
                    <p class="text-xs font-bold">Scanner</p>
                    <p class="text-[10px] text-slate-500">Scan Barcode</p>
                </div>
            </button>

            <!-- Voice Button -->
            <button onclick="VoiceModule.startListening()" id="voice-btn-sidebar" class="sidebar-action group mb-4">
                <i data-lucide="mic" class="sidebar-action-icon" id="voice-btn-icon"></i>
                <div class="text-left hidden lg:block">
                    <p class="text-xs font-bold">Voice</p>
                    <p id="voice-status" class="text-[10px] text-slate-500">Say Commands</p>
                </div>
            </button>

            <div class="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20 mt-auto">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-3 h-3 rounded-full bg-green-500 pulse-dot"></div>
                    <span class="text-xs font-bold uppercase">System</span>
                </div>
                <p class="text-sm">Online</p>
            </div>
        `;

        Helpers.refreshIcons();
    },

    /**
     * Render header actions
     */
    renderHeaderActions() {
        const container = Helpers.getElement('header-actions');
        if (!container) return;

        // Expanded Header Actions with Quick Tools
        container.innerHTML = `
            <!-- Quick Tools Group -->
            <div class="flex items-center gap-2 mr-4 pr-4 border-r border-white/10">
                <button onclick="VoiceModule.startListening()" class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 hover:border-white/20 relative group" title="Voice Assistant">
                    <i data-lucide="mic" class="w-5 h-5"></i>
                    <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full hidden"></span>
                </button>
                
                <button onclick="PredictionsModule.activateModel()" id="ai-model-btn" class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 hover:border-white/20 relative" title="AI Model">
                    <i data-lucide="cpu" class="w-5 h-5"></i>
                    <span id="ai-indicator" class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full hidden"></span>
                </button>

                <button onclick="ModalsModule.openAnalytics()" class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 hover:border-white/20" title="Analytics">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Primary Actions -->
            <div class="flex items-center gap-3">
                <button onclick="ScannerModule.open()" class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all hover:scale-105">
                    <i data-lucide="scan" class="w-4 h-4"></i> <span class="hidden sm:inline">Scan Item</span>
                </button>

                <button onclick="ModalsModule.openAddMedicine()" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                    <i data-lucide="plus" class="w-4 h-4"></i> <span class="hidden lg:inline">Add</span>
                </button>

                <button onclick="PredictionsModule.run()" class="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                    <i data-lucide="zap" class="w-4 h-4"></i> <span class="hidden lg:inline">Predict</span>
                </button>

                <button onclick="ModalsModule.openProcurement()" class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105">
                    <i data-lucide="truck" class="w-4 h-4"></i> 
                    <span id="procurement-badge" class="ml-1 bg-red-500 text-xs rounded-full px-2">0</span>
                </button>

                <button onclick="App.toggleEmergency()" id="emergency-btn" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-900/50 text-white font-semibold flex items-center gap-2 border border-white/10 hover:border-red-500/50 transition-all">
                    <i data-lucide="shield-alert" class="w-4 h-4 text-red-400"></i>
                </button>
            </div>
        `;

        Helpers.refreshIcons();
    },

    /**
     * Render statistics cards
     */
    renderStats() {
        const container = Helpers.getElement('stats-container');
        if (!container) return;

        const stats = AppState.getStats();

        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-6 bg-white/5 border border-white/10 stat-card">
                <div class="flex justify-between items-start mb-4">
                    <i data-lucide="droplet" class="text-cyan-400 w-6 h-6"></i>
                    <span class="text-xs bg-black/20 px-2 py-1 rounded">Live</span>
                </div>
                <h3 class="text-slate-400 text-sm">Critical Items</h3>
                <p id="critical-count" class="text-3xl font-bold mt-2">${stats.criticalCount}</p>
            </div>

            <div class="glass-panel rounded-2xl p-6 bg-white/5 border border-white/10 stat-card">
                <div class="flex justify-between items-start mb-4">
                    <i data-lucide="box" class="text-emerald-400 w-6 h-6"></i>
                    <span class="text-xs bg-black/20 px-2 py-1 rounded">Total</span>
                </div>
                <h3 class="text-slate-400 text-sm">Total Stock</h3>
                <p id="total-stock" class="text-3xl font-bold mt-2">${stats.totalStock}</p>
            </div>

            <div class="glass-panel rounded-2xl p-6 bg-white/5 border border-white/10 stat-card relative group">
                <div class="flex justify-between items-start mb-4">
                    <i data-lucide="alert-triangle" class="text-amber-400 w-6 h-6"></i>
                    <span class="text-xs bg-black/20 px-2 py-1 rounded">Expiring</span>
                </div>
                <h3 class="text-slate-400 text-sm">Expiry Risk</h3>
                <p id="expiring-count" class="text-3xl font-bold mt-2">${stats.expiredCount + stats.expiringSoonCount}</p>
                
                <!-- Hover Breakdown -->
                <div class="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center z-10">
                    <div class="mb-2 w-full border-b border-white/10 pb-2">
                        <span class="text-red-400 font-bold text-xl block">${stats.expiredCount}</span>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider">Expired</span>
                    </div>
                    <div class="w-full pt-1">
                        <span class="text-amber-400 font-bold text-xl block">${stats.expiringSoonCount}</span>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider">Soon (< 30d)</span>
                    </div>
                </div>
            </div>

            <div class="glass-panel rounded-2xl p-6 bg-white/5 border border-white/10 stat-card">
                <div class="flex justify-between items-start mb-4">
                    <i data-lucide="indian-rupee" class="text-violet-400 w-6 h-6"></i>
                    <span class="text-xs bg-black/20 px-2 py-1 rounded">Value</span>
                </div>
                <h3 class="text-slate-400 text-sm">Total Value</h3>
                <p id="total-value" class="text-2xl font-bold mt-2">${Helpers.formatCurrency(stats.totalValue)}</p>
            </div>
        `;

        Helpers.refreshIcons();
    },

    /**
     * Render stock table
     */
    /**
     * Render stock table (Both Dashboard & Full View)
     */
    renderStock() {
        // 1. Render Full Inventory Table
        const fullTbody = Helpers.getElement('stock-table-body');
        const dashboardTbody = Helpers.getElement('dashboard-stock-table-body');

        const searchInput = Helpers.getElement('search-medicine');
        const search = (searchInput?.value || '').toLowerCase();
        const allItems = AppState.getStockItems();

        // Filter for Full Table
        const filtered = allItems.filter(item =>
            item.name.toLowerCase().includes(search)
        );

        const createRow = (item, simple = false) => {
            const subtotal = item.stock * item.price;
            const isExpired = Helpers.daysUntil(item.expiry) < 0;
            const isExpiringSoon = Helpers.daysUntil(item.expiry) >= 0 && Helpers.daysUntil(item.expiry) <= 30;

            // Simplified row for Dashboard
            if (simple) {
                return `
                <tr class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <td class="px-4 py-3">
                        <div class="font-medium text-sm text-white">${item.name}</div>
                        <div class="text-[10px] text-slate-500">${item.batch}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-300">${item.category}</td>
                    <td class="px-4 py-3 text-xs font-bold text-white">${item.stock}</td>
                    <td class="px-4 py-3">
                        <span style="${Helpers.getStatusStyle(item.status)}" class="px-2 py-1 rounded text-[10px] font-bold">
                            ${item.status}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-xs">
                         <button onclick="ViewModule.switchView('inventory')" class="text-cyan-400 hover:text-cyan-300">
                            Details
                        </button>
                    </td>
                </tr>`;
            }

            // Full row for Inventory View
            return `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td class="px-4 py-3">
                    <div class="font-medium text-sm text-white">${item.name}</div>
                    <div class="text-[10px] text-slate-500">${item.barcode}</div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-300">${item.category}</td>
                <td class="px-4 py-3 font-bold text-white">${item.stock}</td>
                <td class="px-4 py-3 text-xs text-slate-400">${item.location}</td>
                <td class="px-4 py-3">
                    <span style="${Helpers.getStatusStyle(item.status)}" class="px-2 py-1 rounded text-[10px] font-bold">
                        ${item.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-300">
                    <div class="flex items-center gap-2">
                        <span>${item.expiry || '-'}</span>
                        ${isExpired ? '<i data-lucide="alert-circle" class="w-3 h-3 text-red-500"></i>' : ''}
                        ${isExpiringSoon ? '<i data-lucide="clock" class="w-3 h-3 text-amber-500"></i>' : ''}
                    </div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-300">${Helpers.formatCurrency(item.price)}</td>
                <td class="px-4 py-3 text-xs font-bold text-cyan-300">${Helpers.formatCurrency(subtotal)}</td>
                <td class="px-4 py-3 text-xs">
                    <button onclick="MedicineModule.edit(${item.id})" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                        Edit
                    </button>
                </td>
            </tr>`;
        };

        if (fullTbody) {
            fullTbody.innerHTML = filtered.map(item => createRow(item, false)).join('');
        }

        if (dashboardTbody) {
            // Show only first 5 items for dashboard
            dashboardTbody.innerHTML = allItems.slice(0, 5).map(item => createRow(item, true)).join('');
        }

        Helpers.refreshIcons();
    },

    /**
     * Update all views
     */
    refreshAll() {
        this.renderStats();
        this.renderStock();
        NotificationsModule.renderAlerts();
        ProcurementModule.renderSuggestions();
        Helpers.refreshIcons();
    }
};

// Export for use in other modules
window.RenderModule = RenderModule;