/**
 * MedicineSupply.ai - Machine Learning Engine
 * Implements Linear Regression for Demand Forecasting & Anomaly Detection
 */

class LinearRegression {
    constructor() {
        this.slope = 0;
        this.intercept = 0;
        this.r2 = 0;
    }

    /**
     * Train the model with x (time) and y (sales) data
     * @param {Array<number>} x - Time steps (days)
     * @param {Array<number>} y - Sales quantity
     */
    train(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) return;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

        // Calculate Slope (m) and Intercept (b)
        // m = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = (n * sumXX) - (sumX * sumX);

        if (denominator === 0) {
            this.slope = 0;
            this.intercept = sumY / n;
        } else {
            this.slope = numerator / denominator;
            this.intercept = (sumY - this.slope * sumX) / n;
        }

        // Calculate R-Squared (Coefficient of Determination)
        const predictedY = x.map(xi => this.predict(xi));
        const meanY = sumY / n;
        const sshl = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictedY[i], 2), 0); // Sum of Squared Residuals
        const sstol = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0); // Total Sum of Squares

        this.r2 = sstol === 0 ? 1 : 1 - (sshl / sstol);
    }

    /**
     * Predict y value for a given x
     * @param {number} x 
     * @returns {number}
     */
    predict(x) {
        return this.slope * x + this.intercept;
    }
}

class MLEngine {
    constructor() {
        this.model = new LinearRegression();
    }

    /**
     * Forecast when stock will run out
     * @param {number} currentStock 
     * @param {Array<{date: string, quantity: number}>} salesHistory 
     */
    predictStockout(currentStock, salesHistory) {
        if (!salesHistory || salesHistory.length < 3) {
            return {
                status: 'INSUFFICIENT_DATA',
                daysUntilStockout: -1,
                predictedDate: null,
                confidence: 0,
                slope: 0
            };
        }

        // 1. Prepare Data
        // Convert dates to "day numbers" (0, 1, 2...)
        const sortedHistory = salesHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        const startDate = new Date(sortedHistory[0].date).getTime();
        
        const x = []; // Days since start
        const y = []; // Cumulative Sales (to model depletion) OR Daily Sales (to model velocity)
        
        // We model *Depletion* (Stock Level over Time)
        // Assume starting stock was (Current + Total Sold in Period)
        const totalSold = sortedHistory.reduce((sum, item) => sum + item.quantity, 0);
        let simulatedStock = currentStock + totalSold;
        
        // Data points: Day 0 -> Start Stock
        x.push(0);
        y.push(simulatedStock);

        sortedHistory.forEach(item => {
            const dayNum = Math.round((new Date(item.date).getTime() - startDate) / (1000 * 60 * 60 * 24));
            simulatedStock -= item.quantity;
            x.push(dayNum);
            y.push(Math.max(0, simulatedStock));
        });

        // 2. Train Model
        this.model.train(x, y);

        // 3. Predict "Zero Day"
        // 0 = slope * day + intercept
        // day = -intercept / slope
        
        let daysUntilZero = -1;
        
        if (this.model.slope >= 0) {
            // Slope is positive or zero?? Means stock is NOT decreasing?
            // Anomalous or re-stocking happened without tracking.
            return {
                status: 'STABLE_OR_INCREASING',
                daysUntilStockout: 999,
                predictedDate: null,
                confidence: 50,
                slope: this.model.slope
            };
        } else {
            const dayZero = -this.model.intercept / this.model.slope;
            const currentDay = x[x.length - 1]; // Today (relative)
            daysUntilZero = Math.ceil(dayZero - currentDay);
        }

        // 4. Calculate Confidence
        // R2 score * Data Quantity Factor
        const dataQuality = Math.min(1, salesHistory.length / 30); // Need ~30 days for 100% confidence
        const confidence = Math.round(this.model.r2 * dataQuality * 100);

        return {
            status: daysUntilZero < 7 ? 'CRITICAL' : (daysUntilZero < 30 ? 'WARNING' : 'SAFE'),
            daysUntilStockout: daysUntilZero,
            predictedDate: daysUntilZero > 0 ? new Date(Date.now() + daysUntilZero * 86400000).toISOString().split('T')[0] : 'Today',
            confidence: Math.max(0, confidence),
            slope: this.model.slope // Daily consumption rate (negative)
        };
    }
}

module.exports = new MLEngine();
