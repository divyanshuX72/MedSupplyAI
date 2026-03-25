/**
 * MedicineSupply.ai - Chat Module
 * Handles chatbot functionality
 */

const ChatModule = {
    /**
     * Toggle chat window
     */
    toggle() {
        AppState.toggleChat();
        Helpers.toggleVisibility('chat-window', AppState.chatOpen);
    },

    /**
     * Handle key press in chat input
     * @param {Event} event - Keyboard event
     */
    handleKey(event) {
        if (event.key === 'Enter') {
            this.send();
        }
    },

    /**
     * Send chat message
     */
    send() {
        const input = Helpers.getElement('chat-input');
        const msg = input.value.trim();
        
        if (!msg) return;

        this.addBubble(msg, 'user');
        input.value = '';

        setTimeout(() => {
            const reply = this.generateResponse(msg);
            this.addBubble(reply, 'ai');
        }, 500);
    },

    /**
     * Generate AI response
     * @param {string} message - User message
     * @returns {string}
     */
    generateResponse(message) {
        const lower = message.toLowerCase();
        const items = AppState.getStockItems();

        // Response patterns
        if (lower.includes('hello') || lower.includes('hi')) {
            return "👋 Hello! I'm Medi-Mind. How can I assist you today?";
        }
        
        if (lower.includes('stock')) {
            const critical = items.filter(i => i.status === 'Critical');
            return `📦 ${critical.length} critical items: ${critical.map(i => i.name).join(', ')}`;
        }
        
        if (lower.includes('expir')) {
            const expiring = items.filter(i => {
                const days = Helpers.daysUntil(i.expiry);
                return days < 30 && days > 0;
            });
            return `⏰ ${expiring.length} items expiring soon`;
        }

        if (lower.includes('help')) {
            return "I can help with:\n• Stock status\n• Expiry alerts\n• Medicine search\n• Analytics";
        }

        if (lower.includes('analytics') || lower.includes('report')) {
            const stats = AppState.getStats();
            return `📊 Quick Stats:\n• Total: ${stats.totalStock} units\n• Critical: ${stats.criticalCount}\n• Value: ${Helpers.formatCurrency(stats.totalValue)}`;
        }

        return "I'm here to help! Try asking about stock, expiry, or analytics.";
    },

    /**
     * Add chat bubble
     * @param {string} text - Message text
     * @param {string} sender - 'user' or 'ai'
     */
    addBubble(text, sender) {
        const container = Helpers.getElement('chat-messages');
        const div = document.createElement('div');
        
        div.className = `chat-message flex items-start gap-2 ${sender === 'user' ? 'flex-row-reverse' : ''}`;
        
        if (sender === 'ai') {
            div.innerHTML = `
                <div class="min-w-[24px] h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <i data-lucide="bot" class="w-3 h-3 text-cyan-400"></i>
                </div>
                <div class="bg-white/5 rounded-lg rounded-tl-none p-2.5 border border-white/10 text-sm text-slate-300 whitespace-pre-line">${text}</div>
            `;
        } else {
            div.innerHTML = `
                <div class="bg-cyan-600/20 rounded-lg rounded-tr-none p-2.5 border border-cyan-500/30 text-sm text-white">${text}</div>
            `;
        }
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        
        Helpers.refreshIcons();
    },

    /**
     * Add welcome message
     */
    addWelcomeMessage() {
        this.addBubble("👋 Welcome! I'm Medi-Mind AI. Ask about medicines, stock, or analytics!", 'ai');
    }
};

// Export for use in other modules
window.ChatModule = ChatModule;