import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Prescription } from '../PrescriptionContext';
import PrescriptionPrintTemplate from '@/components/prescriptions/PrescriptionPrintTemplate';
import { Bill } from '../BillingContext';

export interface PDFResult {
  base64: string;
  filename: string;
}

/**
 * Generate a PDF from the prescription data
 * 
 * @param prescription Prescription data
 * @param settings Clinic and doctor settings
 * @param returnPdf Whether to return the PDF data instead of saving
 * @returns If returnPdf is true, returns base64 data and filename, otherwise void
 */
export const generatePrescriptionPDF = async (
  prescription: Prescription,
  settings: { 
    clinic: { 
      name: string; 
      address: string; 
      phone: string; 
      email: string;
    }; 
    doctor: {
      name: string;
      specialization: string;
    };
  },
  returnPdf: boolean = false
): Promise<PDFResult | void> => {
  try {
    // Create a container for the template
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    // Render the template with prescription data
    const template = React.createElement(PrescriptionPrintTemplate, {
      prescription,
      clinicName: settings.clinic.name,
      clinicAddress: settings.clinic.address,
      clinicPhone: settings.clinic.phone,
      clinicEmail: settings.clinic.email,
      doctorName: settings.doctor.name,
      doctorSpecialization: settings.doctor.specialization
    });
    
    // Convert React component to HTML string
    const htmlString = ReactDOMServer.renderToString(template);
    container.innerHTML = htmlString;

    // Use html2canvas to capture the template
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Remove the container after capturing
    document.body.removeChild(container);

    // Calculate dimensions for A4 page (210mm x 297mm)
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Create PDF (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add the captured image to the PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if the content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate a filename based on patient name and date
    const patientName = prescription.patientName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `prescription_${patientName}_${dateStr}.pdf`;

    // If returnPdf is true, return the PDF data as base64
    if (returnPdf) {
      const pdfData = pdf.output('datauristring');
      return {
        base64: pdfData.split(',')[1], // Remove the data URI prefix
        filename: filename
      };
    }
    
    // Otherwise, save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate a PDF from the bill data
 * 
 * @param bill Bill data
 * @param settings Clinic settings
 * @param returnPdf Whether to return the PDF data instead of saving
 * @returns If returnPdf is true, returns base64 data and filename, otherwise void
 */
export const generateBillPDF = async (
  bill: Bill,
  settings: { 
    clinic: { 
      name: string; 
      address: string; 
      phone: string; 
      email: string;
    }; 
    doctor: {
      name: string;
      specialization: string;
    };
    location: {
      currency: string;
      dateFormat: string;
      timeFormat: string;
      timezone: string;
      language: string;
    };
  },
  returnPdf: boolean = false
): Promise<PDFResult | void> => {
  try {
    // Create a container for the bill template
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(container);

    // Generate bill HTML template directly
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: settings.location.currency || 'USD'
      }).format(amount);
    };

    const date = new Date(bill.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'paid': return 'PAID';
        case 'pending': return 'PENDING';
        case 'cancelled': return 'CANCELLED';
        default: return status.toUpperCase();
      }
    };

    // Create the HTML content
    container.innerHTML = `
      <div style="padding: 10px; max-width: 100%;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 24px; color: #333; margin: 0;">${settings.clinic.name}</h1>
            <p style="margin: 5px 0; color: #666;">${settings.clinic.address}</p>
            <p style="margin: 5px 0; color: #666;">Phone: ${settings.clinic.phone}</p>
            <p style="margin: 5px 0; color: #666;">Email: ${settings.clinic.email}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 28px; color: #333; margin: 0;">INVOICE</h2>
            <p style="margin: 5px 0; font-size: 16px; color: #666;">#${bill.invoiceNumber}</p>
            <p style="margin: 5px 0; color: #666;">Date: ${formattedDate}</p>
            <p style="margin: 5px 0; font-weight: bold; color: ${
              bill.status === 'paid' ? '#4CAF50' : 
              bill.status === 'pending' ? '#FF9800' : '#F44336'
            };">
              ${getStatusLabel(bill.status)}
            </p>
          </div>
        </div>

        <div style="margin: 30px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${bill.patientName}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">${item.description}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${formatCurrency(item.unitPrice)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-left: auto; width: 300px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Subtotal:</span>
            <span>${formatCurrency(bill.subtotal)}</span>
          </div>
          ${bill.tax ? `
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Tax:</span>
            <span>${formatCurrency(bill.tax)}</span>
          </div>
          ` : ''}
          ${bill.discount ? `
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Discount:</span>
            <span>-${formatCurrency(bill.discount)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; margin-top: 5px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(bill.total)}</span>
          </div>
        </div>

        ${bill.notes ? `
        <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Notes:</h3>
          <p style="margin: 0; color: #666;">${bill.notes}</p>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;

    // Use html2canvas to capture the template
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Remove the container after capturing
    document.body.removeChild(container);

    // Calculate dimensions for A4 page (210mm x 297mm)
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Create PDF (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add the captured image to the PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if the content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate a filename based on patient name and invoice number
    const patientName = bill.patientName.replace(/\s+/g, '_');
    const filename = `invoice_${bill.invoiceNumber}_${patientName}.pdf`;

    // If returnPdf is true, return the PDF data as base64
    if (returnPdf) {
      const pdfData = pdf.output('datauristring');
      return {
        base64: pdfData.split(',')[1], // Remove the data URI prefix
        filename: filename
      };
    }
    
    // Otherwise, save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating bill PDF:', error);
    throw error;
  }
}; 