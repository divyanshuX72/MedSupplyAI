/**
 * MedicineSupply.ai - PredictionsModule
 * Handles AI predictions functionality
 */

const PredictionsModule = {
    /**
     * Initialize module
     */
    init() {
        this.updateUI();
        if (AppState.aiModelActive) {
            ProcurementModule.renderSuggestions();
        }
    },

    /**
     * Activate/deactivate AI model
     */
    activateModel() {
        AppState.setAIModelActive(!AppState.aiModelActive);
        this.updateUI();

        if (AppState.aiModelActive) {
            NotificationsModule.show('🤖 AI Model activated', 'success');
            ProcurementModule.renderSuggestions();
        }
    },

    /**
     * Update UI based on state
     */
    updateUI() {
        const btn = Helpers.getElement('ai-model-btn');
        const status = Helpers.getElement('ai-model-status');
        const sidebarBtn = Helpers.getElement('ai-model-btn-sidebar');
        const sidebarStatus = Helpers.getElement('ai-model-status-sidebar');

        const isActive = AppState.aiModelActive;

        // Update Header Button
        if (btn && status) {
            if (isActive) {
                btn.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
                btn.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                status.innerText = 'Model Active ✓';
            } else {
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                status.innerText = 'Click to Activate';
            }
        }

        // Update Sidebar Button
        if (sidebarBtn) {
            if (isActive) {
                sidebarBtn.classList.add('bg-purple-500/20', 'border-purple-500/50');
                if (sidebarStatus) sidebarStatus.innerText = 'Active';
            } else {
                sidebarBtn.classList.remove('bg-purple-500/20', 'border-purple-500/50');
                if (sidebarStatus) sidebarStatus.innerText = 'Click to Activate';
            }
        }
    },

    /**
     * Run AI predictions
     */
    run() {
        if (!AppState.aiModelActive) {
            NotificationsModule.show('Please activate AI Model first', 'warning');
            return;
        }

        // ModalsModule.openPrediction(); // Removed: We render to the dashboard column now
        this.generatePredictions();
    },

    /**
     * Generate AI predictions
     */
    async generatePredictions() {
        // In the new 3-column layout, "Predictions" column (Col 2)
        // should show Pending Procurement Suggestions from the AI.

        const modalContent = Helpers.getElement('prediction-content');
        const viewContent = Helpers.getElement('view-prediction-content');

        // Render to wherever is available
        const targets = [];
        if (modalContent) targets.push(modalContent);
        if (viewContent) targets.push(viewContent);

        if (targets.length === 0) return;

        // Show loading
        targets.forEach(target => {
            target.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <i data-lucide="loader-2" class="w-8 h-8 animate-spin mb-3 text-cyan-400"></i>
                    <p>Running ALN Analysis...</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        });

        try {
            // Re-use the pending suggestions logic from ProcurementModule
            // (Since that module now handles the data fetching for AI proposals)
            const suggestions = await ProcurementModule.generateSuggestions();

            // Filter only Pending
            const pending = suggestions.filter(s => s.status === 'Pending');

            const contentHTML = pending.length === 0 ? `
                <div class="p-8 text-center text-emerald-400 border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5 col-span-full">
                    <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p>No issues detected.</p>
                    <p class="text-xs text-slate-400 mt-1">Inventory is healthy.</p>
                </div>
            ` : pending.map(item => `
                <div class="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-cyan-500/30 transition-all group">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-bold text-sm text-cyan-100">${item.medicine}</h4>
                            <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">${item.reason}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-[10px] font-bold ${item.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
                            ${item.priority}
                        </span>
                    </div>
                    
                    <div class="flex justify-between items-end">
                        <div class="text-xs text-slate-300">
                            <span class="block text-slate-500">Suggested Qty</span>
                            <span class="font-bold text-lg">${item.quantity}</span>
                        </div>
                        <button onclick="ProcurementModule.approve('${item.id}', '${item.medicine}', ${item.quantity}, ${item.estimatedCost})" 
                                class="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center">
                            Approve <i data-lucide="arrow-right" class="w-3 h-3 ml-1"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            targets.forEach(target => {
                target.innerHTML = contentHTML;
            });

            if (window.lucide) lucide.createIcons();

        } catch (error) {
            console.error(error);
            targets.forEach(target => {
                target.innerHTML = `<p class="text-red-400 text-center py-4 col-span-full">Analysis Failed</p>`;
            });
        }
    },

    /**
     * Render View (Wrapper for lazy render from App ViewModule)
     */
    renderView() {
        this.generatePredictions();
    },

    /**
     * Take action on prediction
     * @param {string} title - Prediction title
     */
    takeAction(title) {
        NotificationsModule.show(`Action initiated: ${title}`, 'success');
    }
};

// Export for use in other modules
window.PredictionsModule = PredictionsModule;