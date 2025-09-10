// docxConverters.js
// Centraliza toda la lógica de conversión desde DOCX a otros formatos coherentes

import mammoth from 'mammoth';
import jsPDF from 'jspdf';

// DOCX → TXT (extrae texto plano preservando estructura y codificación)
export async function docxToTxt(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value) {
      throw new Error("No se pudo extraer texto del archivo DOCX");
    }
    
    // Solo limpiar saltos de línea, sin agregar contenido extra
    let cleanText = result.value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return new Blob([cleanText], { type: 'text/plain; charset=utf-8' });
  } catch (error) {
    throw new Error("No se pudo convertir el archivo DOCX a TXT: " + error.message);
  }
}

// DOCX → MD (convierte a Markdown preservando formato completo)
export async function docxToMarkdown(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configuración robusta para detectar estilos y formato
    const options = {
      styleMap: [
        // Encabezados principales
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        // Texto con formato
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "b => strong", // Detectar negritas directas
        "i => em",     // Detectar cursivas directas
        // Listas y párrafos especiales
        "p[style-name='List Paragraph'] => p:fresh",
        "p[style-name='Quote'] => blockquote:fresh"
      ],
      // Transformar elementos con formato directo
      transformDocument: function(element) {
        if (element.type === "run") {
          // Detectar negritas por peso de fuente
          if (element.isBold) {
            return {
              ...element,
              children: [{
                type: "text",
                value: `**${element.children.map(c => c.value || '').join('')}**`
              }]
            };
          }
          // Detectar cursivas
          if (element.isItalic) {
            return {
              ...element,
              children: [{
                type: "text", 
                value: `*${element.children.map(c => c.value || '').join('')}*`
              }]
            };
          }
        }
        return element;
      }
    };
    
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    if (!result.value) {
      throw new Error("No se pudo extraer contenido del archivo DOCX");
    }
    
    // Conversión HTML a Markdown robusta
    let markdown = result.value
      // Encabezados
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Formato de texto robusto
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
      // Listas
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      // Citas
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      // Enlaces
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Párrafos
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Saltos de línea
      .replace(/<br\s*\/?>/gi, '\n')
      // Líneas horizontales
      .replace(/<hr[^>]*>/gi, '\n---\n\n')
      // Remover HTML restante
      .replace(/<[^>]*>/g, '')
      // Decodificar entidades HTML
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Limpiar espacios extra
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return new Blob([markdown], { type: 'text/markdown; charset=utf-8' });
  } catch (error) {
    throw new Error("No se pudo convertir el archivo DOCX a Markdown: " + error.message);
  }
}

// DOCX → PDF (genera PDF preservando formato original)
export async function docxToPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Extraer contenido con formato preservado
    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "b => strong",
        "i => em"
      ]
    };
    
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    if (!result.value) {
      throw new Error("No se pudo extraer contenido del archivo DOCX");
    }
    
    // Crear PDF con jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    pdf.setFont('helvetica');
    
    // Procesar contenido HTML y mantener formato
    let content = result.value
      // Convertir encabezados manteniendo jerarquía
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n=== $1 ===\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n--- $1 ---\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n*** $1 ***\n\n')
      // Mantener negritas y cursivas
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Limpiar párrafos
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      // Decodificar caracteres
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    
    // Agregar contenido al PDF
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(content, 170);
    let y = 20;
    
    lines.forEach((line) => {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      
      // Aplicar formato basado en marcadores
      if (line.startsWith('=== ') && line.endsWith(' ===')) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.replace(/===/g, '').trim(), 20, y);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      } else if (line.startsWith('--- ') && line.endsWith(' ---')) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.replace(/---/g, '').trim(), 20, y);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      } else if (line.startsWith('*** ') && line.endsWith(' ***')) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.replace(/\*\*\*/g, '').trim(), 20, y);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(line, 20, y);
      }
      
      y += 6;
    });
    
    return pdf.output('blob');
    
  } catch (error) {
    throw new Error("No se pudo convertir el archivo DOCX a PDF: " + error.message);
  }
}

// Exportar las opciones de conversión soportadas
export const DOCX_CONVERSION_OPTIONS = ['PDF', 'TXT', 'MD'];