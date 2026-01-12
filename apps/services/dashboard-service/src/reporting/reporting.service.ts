import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ReportGeneratorService } from './report-generator.service';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly reportGenerator: ReportGeneratorService) {}

  /**
   * Report generieren
   */
  async generateReport(
    tenantId: string,
    reportType: string,
    options?: Record<string, any>,
  ): Promise<any> {
    return await this.reportGenerator.generate(tenantId, reportType, options);
  }

  /**
   * PDF-Report generieren
   * 
   * Unterstützt zwei Methoden:
   * 1. puppeteer (HTML-zu-PDF) - empfohlen für komplexe Reports
   * 2. pdfkit (programmatisch) - empfohlen für einfache Reports
   * 
   * @throws {NotImplementedException} Wenn weder puppeteer noch pdfkit installiert sind
   */
  async generatePdfReport(
    tenantId: string,
    reportType: string,
    options?: Record<string, any>,
  ): Promise<Buffer> {
    // Versuche puppeteer zu verwenden (besser für HTML-basierte Reports)
    try {
      const puppeteer = require('puppeteer');
      return await this.generatePdfWithPuppeteer(tenantId, reportType, options, puppeteer);
    } catch (error) {
      this.logger.debug('Puppeteer not available, trying pdfkit');
    }

    // Fallback: Versuche pdfkit zu verwenden
    try {
      const PDFDocument = require('pdfkit');
      return await this.generatePdfWithPdfKit(tenantId, reportType, options, PDFDocument);
    } catch (error) {
      this.logger.debug('PDFKit not available');
    }

    throw new NotImplementedException(
      'PDF generation requires either puppeteer or pdfkit to be installed. ' +
      'Please install one of these packages: npm install puppeteer or npm install pdfkit',
    );
  }

  /**
   * PDF mit Puppeteer generieren (HTML-zu-PDF)
   * @private
   */
  private async generatePdfWithPuppeteer(
    tenantId: string,
    reportType: string,
    options: Record<string, any> | undefined,
    puppeteer: any,
  ): Promise<Buffer> {
    const report = await this.reportGenerator.generate(tenantId, reportType, options);
    
    // Generiere HTML aus Report-Daten
    const html = this.generateHtmlFromReport(report, reportType);

    // Erstelle Browser-Instanz
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generiere PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * PDF mit PDFKit generieren (programmatisch)
   * @private
   */
  private async generatePdfWithPdfKit(
    tenantId: string,
    reportType: string,
    options: Record<string, any> | undefined,
    PDFDocument: any,
  ): Promise<Buffer> {
    const report = await this.reportGenerator.generate(tenantId, reportType, options);
    
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {});

    // PDF-Inhalt generieren
    doc.fontSize(20).text(`Report: ${reportType}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tenant ID: ${tenantId}`);
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown(2);

    // Report-Daten hinzufügen
    doc.fontSize(14).text('Report Data:', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(JSON.stringify(report, null, 2), {
      align: 'left',
      indent: 20,
    });

    doc.end();

    // Warte auf PDF-Generierung
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  /**
   * HTML aus Report-Daten generieren
   * @private
   */
  private generateHtmlFromReport(report: any, reportType: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report: ${reportType}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #3498db;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Report: ${reportType}</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <div id="content">
    <pre>${JSON.stringify(report, null, 2)}</pre>
  </div>
  <div class="footer">
    <p>Generated by WattWeiser Dashboard Service</p>
  </div>
</body>
</html>
    `.trim();
  }
}

