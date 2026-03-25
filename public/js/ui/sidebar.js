/**
 * MedicineSupply.ai - Sidebar Module
 * Reusable Sidebar Component
 */

const SidebarModule = {
    /**
     * Render the sidebar into a container
     * @param {string} containerId - ID of the container element (default: 'app-sidebar')
     * @param {string} activePage - ID of the active page/link for highlighting
     */
    render(containerId = 'app-sidebar', activePage = '') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Sidebar container #${containerId} not found`);
            return;
        }

        container.className = "w-20 lg:w-64 flex-shrink-0 border-r border-white/5 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between p-4 z-20 overflow-y-auto custom-scrollbar";

        const navItems = DataModule.NAV_ITEMS || [];

        const navHTML = navItems.map(item => {
            const isActive = item.id === activePage || (item.link && window.location.pathname === item.link);
            const activeClass = isActive ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/5';

            // Handle external links vs internal views
            const clickAction = item.link
                ? `onclick="window.location.href='${item.link}'"`
                : `onclick="ViewModule.switchView('${item.id}')"`;

            // Special handling if we are NOT on dashboard.html but trying to switch view
            // If we are on /analytics and click "Dashboard", we must go to /
            const isDashboard = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('dashboard.html');
            const finalAction = (!isDashboard && !item.link)
                ? `onclick="window.location.href='/${item.id}'"`
                : clickAction;

            return `
            <button ${finalAction} class="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left mb-1 ${activeClass}">
                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                <span class="hidden lg:block">${item.label}</span>
            </button>
            `;
        }).join('');

        container.innerHTML = `
            <div>
                <!-- Logo -->
                <div class="flex items-center gap-3 px-2 mb-10 cursor-pointer" onclick="window.location.href='/'">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                        <i data-lucide="activity" class="text-white w-6 h-6"></i>
                    </div>
                    <span class="hidden lg:block font-bold text-xl tracking-tight">Medicine<span class="text-cyan-400">Supply.ai</span></span>
                </div>

                <!-- Navigation -->
                <nav class="space-y-1">
                    ${navHTML}
                </nav>

                <!-- Special Actions -->
                <div class="mt-8 space-y-3">
                 
             

                    <!-- Analytics Button -->
                    <button onclick="window.location.href='/analytics'"
                        class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700
                        hover:from-cyan-500 hover:to-cyan-600 text-white font-bold
                        shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2
                        group transition-all">
                        <i data-lucide="bar-chart-3"
                            class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:block">Analytics</span>
                    </button>
                </div>
            </div>

            <!-- Sidebar Bottom Actions -->
            <div class="space-y-4">
                <button onclick="VoiceModule.startListening()" class="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                    <i data-lucide="mic" class="w-5 h-5 group-hover:animate-pulse"></i>
                    <span class="hidden lg:block">Voice Assistant</span>
                </button>
              
                <!-- Logout -->
                <button onclick="logout()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                    <span class="hidden lg:block">Logout</span>
                </button>
            </div>
        `;

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};

// Export
window.SidebarModule = SidebarModule;
