const AdminModule = {
    init() {
        this.verifyAdminAccess();
        this.loadDashboardStats();
    },

    // Security Check
    async verifyAdminAccess() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            // Fetch Profile (includes full_name)
            const response = await fetch('/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await response.json();

            if (user.role !== 'admin') {
                alert('Access Denied: Administrators Only');
                window.location.href = '/dashboard';
            } else {
                // Display Name (Fallback to Email)
                const displayName = user.full_name || user.email;
                document.getElementById('admin-user-name').textContent = displayName;
            }

        } catch (e) {
            window.location.href = '/login';
        }
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    // UI Logic
    switchTab(tabId) {
        // Toggle Contents
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');

        // Toggle Buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active', 'text-red-400', 'bg-red-600/10', 'border', 'border-red-500/30');
                btn.classList.remove('text-slate-400', 'hover:bg-white/5');
            } else {
                btn.classList.remove('active', 'text-red-400', 'bg-red-600/10', 'border', 'border-red-500/30');
                btn.classList.add('text-slate-400', 'hover:bg-white/5');
            }
        });

        // Load specific data
        if (tabId === 'users') this.loadUsers();
        if (tabId === 'procurement') this.loadProcurement();
        if (tabId === 'inventory') this.loadInventory();
        if (tabId === 'logs') this.loadLogs();
        if (tabId === 'registration') this.loadRegistrationRequests();
    },

    // API calls
    async loadDashboardStats() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();

            document.getElementById('stat-users').textContent = data.users;
            document.getElementById('stat-medicines').textContent = data.medicines;
            document.getElementById('stat-low-stock').textContent = data.lowStock;
            document.getElementById('stat-pending').textContent = data.pendingOrders;

        } catch (e) {
            console.error('Stats failed', e);
        }
    },

    async loadUsers() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
            const users = await res.json();

            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = users.map(u => `
                <tr class="hover:bg-white/5 transition-colors opacity-${u.status === 'disabled' ? '50' : '100'}">
                    <td class="p-4 font-medium text-white">${u.name}</td>
                    <td class="p-4 text-slate-400">${u.email}</td>
                    <td class="p-4">
                        <span class="px-2 py-1 rounded text-xs font-bold ${this.getRoleBadge(u.role)}">
                            ${u.role.toUpperCase()}
                        </span>
                    </td>
                    <td class="p-4">
                        <span class="text-xs ${u.status === 'inactive' ? 'text-red-400' : 'text-emerald-400'}">
                            ${(u.status || 'ACTIVE').toUpperCase()}
                        </span>
                    </td>
                    <td class="p-4 flex gap-2 items-center">
                        <select onchange="AdminModule.updateRole(${u.id}, this.value)" class="bg-slate-900/50 border border-white/10 rounded text-xs px-2 py-1 text-slate-300 focus:border-cyan-500 outline-none cursor-pointer">
                            <option value="user" class="bg-slate-900 text-slate-300" ${u.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="staff" class="bg-slate-900 text-slate-300" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="pharmacist" class="bg-slate-900 text-slate-300" ${u.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
                            <option value="admin" class="bg-slate-900 text-slate-300" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        
                        <button onclick="AdminModule.toggleUserStatus(${u.id}, '${u.status === 'inactive' ? 'active' : 'inactive'}')" 
                            class="text-xs px-2 py-1 rounded border ${u.status === 'inactive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}">
                            ${u.status === 'inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Users failed', e);
        }
    },

    async updateRole(userId, newRole) {
        if (!confirm(`Change user role to ${newRole}?`)) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) this.loadUsers();
            else alert('Failed to update role');

        } catch (e) {
            console.error(e);
        }
    },

    async toggleUserStatus(userId, newStatus) {
        if (!confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} this user?`)) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) this.loadUsers();
            else alert('Failed to update status');

        } catch (e) {
            console.error(e);
        }
    },

    async loadProcurement() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/procurement-queue', { headers: { 'Authorization': `Bearer ${token}` } });
            const items = await res.json();

            const tbody = document.getElementById('procurement-table-body');
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-500 italic">No items in procurement queue</td></tr>';
                return;
            }

            tbody.innerHTML = items.map(i => `
                <tr class="hover:bg-white/5 transition-colors border-b border-white/5 group" id="proc-row-${i.id}">
                    <td class="p-4 text-center">
                        <input type="checkbox" data-id="${i.id}" onchange="AdminModule.updateProcurementSelection()"
                            class="proc-checkbox w-4 h-4 rounded border-white/10 bg-black/20 text-cyan-500 focus:ring-cyan-500">
                    </td>
                    <td class="p-4">
                        <div class="font-medium text-white">${i.medicine_name}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${i.id}</div>
                    </td>
                    <td class="p-4">
                        <div class="text-sm ${i.current_stock < 20 ? 'text-red-400 font-bold' : 'text-slate-400'}">${i.current_stock} units</div>
                    </td>
                    <td class="p-4">
                        <div class="flex flex-col gap-1">
                            <input type="number" 
                                value="${i.final_qty || i.suggested_qty}" 
                                oninput="AdminModule.handleQtyChange(${i.id}, this.value, ${i.unit_price})"
                                class="w-24 bg-black/20 border border-white/10 rounded px-3 py-1.5 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                            <span class="text-[10px] text-slate-500 font-mono pl-1">₹${i.unit_price}/unit</span>
                        </div>
                    </td>
                    <td class="p-4">
                        <div id="total-cost-${i.id}" class="text-lg font-bold text-white">₹${parseFloat(i.total_cost || (i.suggested_qty * i.unit_price)).toFixed(2)}</div>
                    </td>
                    <td class="p-4">
                        <span id="status-badge-${i.id}" class="status-badge px-2 py-1 rounded text-[10px] font-bold ${this.getStatusBadgeClass(i.status)}">
                            ${(i.status || 'PENDING').toUpperCase()}
                        </span>
                    </td>
                    <td class="p-4 text-right">
                        <div class="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="AdminModule.singleAction(${i.id}, 'approve')" class="p-2 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                            <button onclick="AdminModule.singleAction(${i.id}, 'reject')" class="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Reset headers & buttons
            document.getElementById('procurement-select-all').checked = false;
            this.updateProcurementSelection();
            if (window.lucide) lucide.createIcons();

        } catch (e) {
            console.error('Procurement failed', e);
        }
    },

    getStatusBadgeClass(status) {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default: return 'bg-white/5 text-slate-400 border border-white/10';
        }
    },

    handleQtyChange(id, qty, unitPrice) {
        const total = (parseFloat(qty || 0) * unitPrice).toFixed(2);
        document.getElementById(`total-cost-${id}`).textContent = `₹${total}`;

        // Debounce API update
        if (this.qtyTimeout) clearTimeout(this.qtyTimeout);
        this.qtyTimeout = setTimeout(() => this.saveQty(id, qty), 500);
    },

    async saveQty(id, qty) {
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/procurement/${id}/update-qty`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity: qty })
            });
        } catch (e) { console.error('Qty update failed', e); }
    },

    toggleSelectAllProcurement(checked) {
        document.querySelectorAll('.proc-checkbox').forEach(cb => cb.checked = checked);
        this.updateProcurementSelection();
    },

    updateProcurementSelection() {
        const selected = document.querySelectorAll('.proc-checkbox:checked');
        const count = selected.length;

        document.getElementById('btn-approve-bulk').disabled = count === 0;
        document.getElementById('btn-reject-bulk').disabled = count === 0;

        // Update selection UI feedback? (Optionally highlight rows)
    },

    async bulkAction(action) {
        const selected = Array.from(document.querySelectorAll('.proc-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (selected.length === 0) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/procurement/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selected })
            });

            if (res.ok) this.loadProcurement();
        } catch (e) { console.error(`${action} failed`, e); }
    },

    async singleAction(id, action) {
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/procurement/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: [id] })
            });
            this.loadProcurement();
        } catch (e) { console.error(e); }
    },

    async showInvoiceConfirmation() {
        const token = localStorage.getItem('token');
        try {
            // Re-fetch items to get latest total
            const res = await fetch('/api/admin/procurement-queue', { headers: { 'Authorization': `Bearer ${token}` } });
            const items = await res.json();

            const approved = items.filter(i => i.status === 'APPROVED');
            if (approved.length === 0) return alert('No approved items to invoice!');

            const total = approved.reduce((sum, i) => sum + parseFloat(i.total_cost), 0);

            document.getElementById('confirm-approved-count').textContent = approved.length;
            document.getElementById('confirm-total-amount').textContent = `₹${total.toFixed(2)}`;
            document.getElementById('invoice-confirm-modal').classList.remove('hidden');

        } catch (e) { console.error(e); }
    },

    async confirmInvoiceCreation() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/invoices/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                document.getElementById('invoice-confirm-modal').classList.add('hidden');
                alert(`Invoice ${data.invoiceNumber} created and sent to supplier!`);
                this.loadProcurement();
                this.loadDashboardStats();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create invoice');
            }
        } catch (e) { console.error(e); }
    },

    async loadInventory() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/inventory', { headers: { 'Authorization': `Bearer ${token}` } });
            const items = await res.json();

            const tbody = document.getElementById('inventory-table-body');
            tbody.innerHTML = items.map(i => `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 font-medium text-white">${i.name}</td>
                    <td class="p-4 ${i.stock < 20 ? 'text-red-400 font-bold' : 'text-slate-400'}">${i.stock}</td>
                    <td class="p-4 text-slate-400">${i.expiry_date}</td>
                    <td class="p-4">
                        <button onclick="AdminModule.openEditModal(${i.id}, ${i.stock}, '${i.expiry_date}')" class="text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-1.5 rounded border border-cyan-500/20">
                            Edit
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Inventory failed', e);
        }
    },

    // State for Edit Modal
    currentEditId: null,
    currentEditBarcode: '',
    html5QrCode: null, // Scanner Instance

    openEditModal(id, stock, expiry, barcode = '') {
        this.currentEditId = id;
        this.currentEditBarcode = barcode || '';

        // Populate Fields
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-stock').value = stock;
        document.getElementById('edit-expiry').value = expiry;

        // Barcode Logic: Set initial value and state
        const barcodeInput = document.getElementById('edit-barcode');
        barcodeInput.value = this.currentEditBarcode;
        this.validateBarcode(this.currentEditBarcode); // Initial validation status

        document.getElementById('edit-inventory-modal').classList.remove('hidden');
    },

    // 1. SEPARATE RESPONSIBILITIES: Manual Input Handler
    handleBarcodeInput(value) {
        // Normalize: Trim whitespace, upper case
        const normalized = value.trim().toUpperCase();
        this.currentEditBarcode = normalized;

        // Trigger Validation/Merge Logic
        this.validateBarcode(normalized);
    },

    // 2. SEPARATE RESPONSIBILITIES: Scanner Trigger (REAL CAMERA)
    async startEditScan() {
        const modal = document.getElementById('scanner-modal');

        // 1. Show Modal First (Crucial for Html5Qrcode to find element size)
        modal.classList.remove('hidden');

        // 2. Wait for transition/render
        await new Promise(r => setTimeout(r, 300));

        try {
            // 3. Initialize/Reuse Scanner
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode("reader");
            }

            // 4. Start Scan
            await this.html5QrCode.start(
                { facingMode: "environment" }, // Prefer Rear Camera
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText, decodedResult) => {
                    if (decodedText) {
                        console.log("Scan Match:", decodedText);
                        this.onScanSuccess(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignore frame-by-frame parse errors
                }
            );

        } catch (err) {
            console.error("Scanner Error:", err);

            // Handle common errors
            if (err?.name === 'NotAllowedError') {
                alert("Camera permission denied. Please allow camera access.");
            } else if (err?.toString().includes("is running")) {
                console.warn("Scanner already running");
                return; // Already active, no issue
            } else {
                alert("Failed to start camera. Ensure you are on HTTPS or localhost.");
            }

            this.stopEditScan();
        }
    },

    async onScanSuccess(decodedText) {
        if (!decodedText) return;

        // 1. Stop Scanner
        await this.stopEditScan();

        // 2. Normalize Value
        const scannedValue = String(decodedText).trim().toUpperCase();
        console.log("Processed Barcode:", scannedValue);

        // 3. Update Input & State
        const input = document.getElementById('edit-barcode');
        if (input) {
            input.value = scannedValue;
            // 4. Trigger Merge Logic
            this.handleBarcodeInput(scannedValue);
        }

        // 5. UX Feedback
        const status = document.getElementById('edit-barcode-status');
        if (status) {
            status.innerText = 'Scan Successful!';
            status.className = 'text-xs mt-1 text-emerald-400 min-h-[20px]';
            setTimeout(() => { if (status.innerText === 'Scan Successful!') status.innerText = ''; }, 2000);
        }
    },

    async stopEditScan() {
        const modal = document.getElementById('scanner-modal');

        if (this.html5QrCode) {
            try {
                // Stop scanning if active
                if (this.html5QrCode.isScanning) {
                    await this.html5QrCode.stop();
                }
                // Clear the canvas/element
                this.html5QrCode.clear();
            } catch (err) {
                console.warn("Scanner Stop Warning:", err);
            }
            // Reset instance to ensure fresh start next time
            this.html5QrCode = null;
        }

        modal.classList.add('hidden');
    },

    // 3. MERGE LOGIC & VALIDATION (Single Source of Truth)
    validateBarcode(value) {
        const status = document.getElementById('edit-barcode-status');

        if (!value) {
            status.innerText = 'Barcode cannot be empty';
            status.className = 'text-xs mt-1 text-slate-500 min-h-[20px]';
            return false;
        }

        if (value.length < 3) {
            status.innerText = 'Too short...';
            status.className = 'text-xs mt-1 text-yellow-500 min-h-[20px]';
            return false;
        }

        // Valid State
        status.innerText = '';
        return true;
    },

    async saveInventory() {
        const id = this.currentEditId;
        const stock = document.getElementById('edit-stock').value;
        const expiry = document.getElementById('edit-expiry').value;
        const barcode = this.currentEditBarcode; // USE STATE, NOT INPUT DIRECTLY (cleaner)
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/admin/inventory/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stock, expiry, barcode }) // Send barcode
            });

            if (res.ok) {
                document.getElementById('edit-inventory-modal').classList.add('hidden');
                this.loadInventory();
            } else alert('Failed to save');
        } catch (e) { console.error(e); }
    },

    async loadLogs() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } });
            const logs = await res.json();

            const tbody = document.getElementById('logs-table-body');
            tbody.innerHTML = logs.map(l => `
                <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                    <td class="p-4 text-slate-500 font-mono text-xs">${new Date(l.timestamp).toLocaleString()}</td>
                    <td class="p-4 text-white font-medium">${l.admin_name}</td>
                    <td class="p-4"><span class="px-2 py-0.5 rounded bg-white/5 text-xs border border-white/10">${l.action}</span></td>
                    <td class="p-4 text-slate-300 font-mono text-xs">${l.target}</td>
                    <td class="p-4 text-slate-400 text-sm">${l.details}</td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Logs failed', e);
        }
    },

    async loadRegistrationRequests() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/registration-requests', { headers: { 'Authorization': `Bearer ${token}` } });
            const requests = await res.json();

            const tbody = document.getElementById('registration-table-body');
            if (requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 italic">No pending registration requests</td></tr>';
                return;
            }

            tbody.innerHTML = requests.map(r => `
                <tr class="hover:bg-white/5 transition-colors border-b border-white/5 group">
                    <td class="p-4 font-mono text-cyan-400 font-bold">${r.barcode}</td>
                    <td class="p-4 text-white">${r.medicine_name}</td>
                    <td class="p-4 text-slate-400">${r.source}</td>
                    <td class="p-4 text-slate-500 text-xs">${new Date(r.requested_at).toLocaleString()}</td>
                    <td class="p-4 text-right">
                        <div class="flex gap-2 justify-end">
                            <button onclick="AdminModule.openRegistrationApprovalModal(${r.id}, '${r.barcode}')" 
                                class="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 text-xs">
                                <i data-lucide="check" class="w-3 h-3"></i> Approve
                            </button>
                            <button onclick="AdminModule.rejectRegistrationRequest(${r.id})" 
                                class="px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1 text-xs">
                                <i data-lucide="trash-2" class="w-3 h-3"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            if (window.lucide) lucide.createIcons();

        } catch (e) {
            console.error('Registration requests failed', e);
        }
    },

    openRegistrationApprovalModal(id, barcode) {
        document.getElementById('approval-request-id').value = id;
        document.getElementById('approval-name').value = ''; // Reset fields
        document.getElementById('approval-batch').value = `REG-${barcode}`;
        document.getElementById('approval-modal').classList.remove('hidden');
    },

    async confirmRegistrationApproval() {
        const id = document.getElementById('approval-request-id').value;
        const details = {
            medicine_name: document.getElementById('approval-name').value,
            category: document.getElementById('approval-category').value,
            price: document.getElementById('approval-price').value,
            location: document.getElementById('approval-location').value,
            expiry_date: document.getElementById('approval-expiry').value,
            manufacturer: document.getElementById('approval-manufacturer').value,
            batch_number: document.getElementById('approval-batch').value
        };

        if (!details.medicine_name || !details.price || !details.expiry_date) {
            alert('Please fill in all required fields');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/registration-requests/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(details)
            });

            if (res.ok) {
                document.getElementById('approval-modal').classList.add('hidden');
                alert('Medicine registered successfully!');
                this.loadRegistrationRequests();
                this.loadDashboardStats();
            } else {
                const err = await res.json();
                alert(err.error || 'Approval failed');
            }
        } catch (e) { console.error(e); }
    },

    async rejectRegistrationRequest(id) {
        if (!confirm('Reject this registration request?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/registration-requests/${id}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                this.loadRegistrationRequests();
            } else alert('Rejection failed');
        } catch (e) { console.error(e); }
    },

    getRoleBadge(role) {
        switch (role) {
            case 'admin': return 'bg-red-500/20 text-red-400 border border-red-500/20';
            case 'pharmacist': return 'bg-purple-500/20 text-purple-400 border border-purple-500/20';
            default: return 'bg-slate-700 text-slate-300';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminModule.init();
});
