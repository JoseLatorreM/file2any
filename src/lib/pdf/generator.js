import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Clase base optimizada para generación de PDFs
 * Actúa como una capa de abstracción sobre jsPDF y autoTable
 */
export class PdfGenerator {
  constructor(options = {}) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });
    this.margin = options.margin || 20;
    this.y = this.margin;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  /**
   * Agrega un título o encabezado
   */
  addHeading(text, level = 1) {
    const sizes = { 1: 18, 2: 16, 3: 14, 4: 12 };
    const size = sizes[level] || 12;
    
    this.checkPageBreak(size * 0.5);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(size);
    this.doc.setTextColor(0, 0, 0);
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.doc.text(lines, this.margin, this.y + (size * 0.3));
    
    this.y += (lines.length * size * 0.4) + 4;
  }

  /**
   * Agrega un párrafo de texto
   */
  addParagraph(text, options = {}) {
    if (!text) return;
    
    const fontSize = options.fontSize || 11;
    const align = options.align || 'left';
    const color = options.color || [0, 0, 0];
    
    this.doc.setFont('helvetica', options.fontStyle || 'normal');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.checkPageBreak(lines.length * fontSize * 0.5);
    
    this.doc.text(lines, this.margin, this.y + (fontSize * 0.3), { align: align === 'justify' ? 'left' : align });
    this.y += (lines.length * fontSize * 0.45) + 2;
  }

  /**
   * Agrega una tabla optimizada
   */
  addTable(headers, body, options = {}) {
    if (!body || body.length === 0) return;

    this.checkPageBreak(20);

    autoTable(this.doc, {
      startY: this.y,
      head: headers ? [headers] : undefined,
      body: body,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid', // 'striped', 'grid', 'plain'
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 3,
        overflow: 'linebreak'
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      ...options
    });
    
    this.y = this.doc.lastAutoTable.finalY + 10;
  }

  /**
   * Agrega una nueva página manualmente
   */
  addNewPage() {
    this.doc.addPage();
    this.y = this.margin;
  }

  /**
   * Verifica si es necesario un salto de página
   */
  checkPageBreak(heightNeeded) {
    if (this.y + heightNeeded > this.pageHeight - this.margin) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  /**
   * Genera y descarga el PDF
   */
  save(filename) {
    return this.doc.save(filename);
  }
  
  /**
   * Retorna el Blob del PDF
   */
  getBlob() {
    return this.doc.output('blob');
  }
}
