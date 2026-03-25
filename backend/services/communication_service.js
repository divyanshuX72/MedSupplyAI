const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class CommunicationService {
    constructor() {
        // Mock Transport for development (Ethereal or local logging)
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'mock_user@ethereal.email',
                pass: 'mock_pass'
            }
        });
    }

    async generateInvoicePDF(invoiceData) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fillColor('#444444')
                .fontSize(20)
                .text('OFFICIAL PROCUREMENT INVOICE', 110, 57)
                .fontSize(10)
                .text('Medicinesupply AI System', 200, 50, { align: 'right' })
                .text('Atreal Studios, India', 200, 65, { align: 'right' })
                .moveDown();

            // Invoice Info
            doc.fillColor('#000000')
                .fontSize(14)
                .text(`Invoice Number: ${invoiceData.invoice_number}`, 50, 160)
                .fontSize(10)
                .text(`Date: ${new Date().toLocaleDateString()}`, 50, 180)
                .text(`Total Amount: $${parseFloat(invoiceData.total_amount).toFixed(2)}`, 50, 200)
                .moveDown();

            // Table Header
            const tableTop = 270;
            doc.font('Helvetica-Bold');
            this.generateTableRow(doc, tableTop, 'Item Name', 'Qty', 'Unit Price', 'Line Total');
            this.generateHr(doc, tableTop + 20);
            doc.font('Helvetica');

            // Table Rows
            let i = 0;
            invoiceData.items.forEach(item => {
                const position = tableTop + (i + 1) * 30;
                this.generateTableRow(doc, position, item.name, item.quantity, `$${item.unit_price}`, `$${item.line_total}`);
                this.generateHr(doc, position + 20);
                i++;
            });

            // Footer
            const footerTop = tableTop + (i + 1) * 30 + 50;
            doc.fontSize(10)
                .fillColor('gray')
                .text('This is a system-generated invoice from Medicinesupply AI. No signature required.', 50, footerTop, { align: 'center', width: 500 });

            doc.end();
        });
    }

    generateTableRow(doc, y, item, qty, price, total) {
        doc.fontSize(10)
            .text(item, 50, y)
            .text(qty, 280, y, { width: 90, align: 'right' })
            .text(price, 370, y, { width: 90, align: 'right' })
            .text(total, 480, y, { align: 'right' });
    }

    generateHr(doc, y) {
        doc.strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }

    async sendInvoiceEmail(invoiceData, pdfBuffer) {
        const mailOptions = {
            from: '"Medicinesupply AI" <procurement@atreal.in>',
            to: invoiceData.supplier_email,
            cc: invoiceData.hospital_email,
            subject: `Procurement Order: ${invoiceData.invoice_number}`,
            text: `Please find the procurement order ${invoiceData.invoice_number} attached. Total Amount: $${invoiceData.total_amount}`,
            attachments: [
                {
                    filename: `${invoiceData.invoice_number}.pdf`,
                    content: pdfBuffer
                }
            ]
        };

        try {
            // In development, we'll just log this
            console.log(`[COMMUNICATION] Sending email to ${invoiceData.supplier_email}...`);
            // await this.transporter.sendMail(mailOptions); // Real sending disabled for safety in mock
            return { success: true, message: 'Email queued for dispatch' };
        } catch (error) {
            console.error('[COMMUNICATION] Email failed:', error);
            throw error;
        }
    }
}

module.exports = new CommunicationService();
