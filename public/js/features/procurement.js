/**
 * MedicineSupply.ai - Procurement Module
 * Handles auto-procurement functionality
 */

const ProcurementModule = {
    /**
     * Generate procurement suggestions
     * @returns {Array}
     */
    /**
     * Generate procurement suggestions (Async)
     */
    async generateSuggestions() {
        // Renamed internally for clarity: This fetches AI PROPOSALS (Pending)
        // We do NOT render these to the main list anymore.
        try {
            const response = await fetch('/api/ai/procurement');
            if (!response.ok) return [];

            const suggestions = await response.json();

            // Only update local state for pending items logic (if needed for prediction view)
            // But strict rule says: UI must fetch approved from DB.
            return suggestions;

        } catch (error) {
            console.error('Procurement AI Error:', error);
            return [];
        }
    },

    /**
     * Fetch and Render Confirmed/Approved Orders from DB
     * (Single Source of Truth)
     */
    async fetchApprovedOrders() {
        const list = Helpers.getElement('approved-orders-list');
        const badge = Helpers.getElement('procurement-badge');

        if (!list) return;

        try {
            const response = await fetch('/api/procurement/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');

            const orders = await response.json();

            if (badge) badge.innerText = orders.length;

            if (orders.length === 0) {
                list.innerHTML = `
                    <div class="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                        <p>No confirmed purchase orders.</p>
                    </div>
                 `;
                return;
            }

            list.innerHTML = orders.map(order => {
                // Determine Badge Type
                // If created recently and status is approved, we assume auto if no user override
                // Actually server doesn't track "who" approved yet, but we can style uniformly
                const isAuto = true; // Simplified for UI consistent look

                return `
                <div class="p-4 rounded-xl border border-white/10 bg-black/20 group hover:bg-white/5 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-sm text-white">${order.medicine_name}</h4>
                            <p class="text-xs text-slate-400">${order.manufacturer}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved ✓
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div>
                            <span class="text-slate-400">Qty:</span>
                            <span class="font-bold text-white">${order.quantity}</span>
                        </div>
                         <div>
                            <span class="text-slate-400">Cost:</span>
                            <span class="font-bold text-emerald-300">$${order.estimated_cost}</span>
                        </div>
                    </div>
                    
                    <div class="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                        <span>ID: ${order.id.substring(0, 12)}...</span>
                        <span>${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                `;
            }).join('');

        } catch (error) {
            console.error(error);
            list.innerHTML = `<p class="text-center text-red-400 text-xs py-4">Error loading orders</p>`;
        }
    },

    /**
     * Render Queue (Refactored to Render Approved List)
     */
    renderQueue() {
        this.fetchApprovedOrders();
    },

    /**
     * Render View
     */
    renderView() {
        this.renderQueue();
    },

    /**
     * Render procurement suggestions preview
     * (Kept for compatibility if other modules call it, but logic diverted)
     */
    renderSuggestions() {
        this.fetchApprovedOrders();
    },

    /**
     * Approve procurement order
     * @param {string} procId - Procurement ID
     */
    async approve(procId, name, qty, cost) {
        // Call Manual Approval Endpoint
        try {
            const res = await fetch('/api/procurement/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Added Auth Header
                },
                body: JSON.stringify({
                    id: procId,
                    medicine_name: name,
                    quantity: qty,
                    cost: cost
                })
            });

            if (res.ok) {
                NotificationsModule.show(`✓ Order approved: ${name}`, 'success');
                // Refresh Approved List (Strict DB Read)
                this.fetchApprovedOrders();
                // Refresh Predictions (Analysis) to remove it from pending list if we were separating them
                PredictionsModule.generatePredictions();
            } else {
                NotificationsModule.show('Failed to approve order', 'error');
            }
        } catch (e) {
            console.error(e);
            NotificationsModule.show('Network error approving order', 'error');
        }
    },

    /**
     * Reject procurement order
     * @param {string} procId - Procurement ID
     */
    reject(procId) {
        const queue = AppState.getProcurementQueue();
        const proc = queue.find(p => p.id === procId);

        if (proc) {
            proc.status = 'Rejected';
            // In a real app, POST to /api/procurement/reject
            AppState.setProcurementQueue([...queue]);
            this.renderQueue();
            this.updateBadge();
        }
    },

    /**
     * Update procurement badge
     */
    updateBadge() {
        const badge = Helpers.getElement('procurement-badge');
        if (badge) {
            badge.innerText = AppState.getPendingProcurementCount();
        }
    }
};

// Export for use in other modules
window.ProcurementModule = ProcurementModule;