/**
 * MedicineSupply.ai - Artificial Logic Network (ALN) Engine
 * Core Intelligence for Prediction & Decision Making
 */

class ALNEngine {

    constructor() {
        this.weights = {
            stockRisk: 0.6,
            expiryRisk: 0.4
        };

        // Safety Rules (Hardcoded Constraints)
        this.safetyRules = {
            maxAutoOrderValue: 200, // Lowered for visual demo (force more pending reviews)
            restrictedCategories: ['Controlled', 'Narcotic']
        };
    }

    /**
     * Calculate Normalized Stock Risk Score (0.0 - 1.0)
     * Risk -> 1.0 means Critical Stock (0 units)
     * Risk -> 0.0 means Safe Stock (> 100 units)
     */
    calculateStockRisk(currentStock, minSafeStock = 20) {
        if (currentStock <= 0) return 1.0;
        if (currentStock >= 100) return 0.0;

        // Linear interpolation between 0 and 100
        // Lower stock = Higher risk
        return Math.max(0, Math.min(1, 1 - (currentStock / 100)));
    }

    /**
     * Calculate Normalized Expiry Risk Score (0.0 - 1.0)
     * Risk -> 1.0 means Expired (< 0 days)
     * Risk -> 0.0 means Fresh (> 365 days)
     */
    calculateExpiryRisk(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const timeDiff = expiry - today;
        const daysToExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysToExpiry <= 0) return 1.0; // Expired
        if (daysToExpiry >= 365) return 0.0; // Fresh

        // Closer to 0 days = Higher risk
        return Math.max(0, Math.min(1, 1 - (daysToExpiry / 365)));
    }

    /**
     * Predict Alerts for a single item
     */
    analyzeItem(item) {
        // Validation: Required fields
        if (!item || item.stock === undefined || !item.expiry_date) {
            console.warn('ALN: Invalid item data', item);
            return [];
        }

        const stockRisk = this.calculateStockRisk(item.stock);
        const expiryRisk = this.calculateExpiryRisk(item.expiry_date);

        const alerts = [];

        // ALN Rule: Critical Stock
        if (stockRisk > 0.8) {
            alerts.push({
                type: 'CRITICAL_STOCK',
                score: stockRisk,
                title: '🚨 Critical Stock',
                medicine: item.name,
                message: `${item.name} is critical (${item.stock} units). Order immediately.`,
                confidence: Math.round(stockRisk * 100),
                action: `${item.name} is critical (${item.stock} units). Order immediately.`,
                severity: 'Critical',
                color: 'red'
            });
        }

        // ALN Rule: Expiry Risk
        if (expiryRisk > 0.9) { // < ~30 days
            alerts.push({
                type: 'EXPIRY_RISK',
                score: expiryRisk,
                title: '⏰ High Expiry Risk',
                medicine: item.name,
                message: `${item.name} expires soon. AI recommends rotation.`,
                confidence: Math.round(expiryRisk * 100),
                action: `${item.name} expires soon. AI recommends rotation.`,
                severity: 'High',
                color: 'orange'
            });
        }

        // ALN Rule: Demand Surge (Pattern Matching - Simulated for V1)
        if (item.category === 'Antibiotic' && item.stock > 50 && item.stock < 150) {
            alerts.push({
                type: 'DEMAND_SURGE',
                score: 0.75,
                title: '📈 Demand Velocity',
                medicine: item.name,
                message: `AI detects rising demand for ${item.category}. Optimization required.`,
                confidence: 82,
                action: `AI detects rising demand for ${item.category}. Optimization required.`,
                severity: 'Medium',
                color: 'blue'
            });
        }

        return alerts;
    }

    /**
     * Make Procurement Decision
     * Returns: { decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW', quantity, reason }
     */
    decideProcurement(item) {
        const stockRisk = this.calculateStockRisk(item.stock);

        if (stockRisk < 0.5) return null; // No action needed

        const isCritical = stockRisk > 0.8;
        const multiplier = isCritical ? 5 : 3;
        const quantity = Math.ceil(item.stock * multiplier);
        const estimatedCost = quantity * item.price;

        const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const decision = {
            id: `ALN-${item.id}-${todayString}`,
            medicine: item.name,
            quantity: quantity,
            estimatedCost: estimatedCost.toFixed(2),
            supplier: item.manufacturer,
            reason: isCritical ? `Critical Risk (Score: ${stockRisk.toFixed(2)})` : 'Replenishment',
            priority: isCritical ? 'High' : 'Medium',
            confidence: Math.round(stockRisk * 100),
            status: 'Pending' // Default
        };

        // AUTO-APPROVAL LOGIC (The "AI Decision")
        let autoApprove = false;

        // Rule 1: High Reliability & Safe Category
        if (isCritical && !this.safetyRules.restrictedCategories.includes(item.category)) {
            autoApprove = true;
        }

        // Rule 2: Cost Safety Check
        if (estimatedCost > this.safetyRules.maxAutoOrderValue) {
            autoApprove = false; // Force manual review for expensive orders
            decision.reason += ' [High Cost - Manager Review Required]';
        }

        if (autoApprove) {
            decision.status = 'Approved';
            decision.aiNote = 'Auto-approved by ALN Safety Logic';
        } else {
            decision.status = 'Pending';
            decision.aiNote = 'Queued for manual review';
        }

        return decision;
    }
}

module.exports = new ALNEngine();
