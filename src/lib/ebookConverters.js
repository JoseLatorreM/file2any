import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import ePub from 'epubjs';
import { pdfToText, pdfToHtml } from './pdf/converter';

/**
 * Crea un archivo EPUB a partir de un título y contenido.
 * @param {string} title - Título del libro
 * @param {string} content - Contenido (texto o HTML)
 * @param {boolean} isHtml - Indica si el contenido ya es HTML
 * @returns {Promise<Blob>} - Archivo EPUB
 */
export async function createEpub(title, content, isHtml = false) {
  const zip = new JSZip();
  const uuid = crypto.randomUUID();

  // El archivo mimetype debe ser el primero y no estar comprimido
  zip.file('mimetype', 'application/epub+zip', { compression: "STORE" });

  // META-INF/container.xml
  zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS');

  let bodyContent = '';
  if (isHtml) {
    bodyContent = content;
  } else {
    // Escapar contenido para XML y convertir saltos de línea a <br/>
    bodyContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
  }
  
  // OEBPS/content.xhtml
  oebps.file('content.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${title}</title>
  <meta charset="utf-8"/>
  <style>
    body { font-family: serif; line-height: 1.5; padding: 1em; }
    p { margin-bottom: 1em; }
    h1, h2, h3 { color: #333; margin-top: 1.5em; }
    hr { border: 0; border-top: 1px solid #ccc; margin: 2em 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${bodyContent}
</body>
</html>`);

  // OEBPS/toc.ncx (para compatibilidad)
  oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${title}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>Inicio</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`);

  // OEBPS/content.opf
  oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:language>es</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">${uuid}</dc:identifier>
    <dc:creator>File2Any</dc:creator>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

/**
 * Convierte PDF a EPUB preservando estructura básica
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo EPUB
 */
export async function pdfToEpub(file) {
  try {
    const html = await pdfToHtml(file);
    const title = file.name.replace(/\.pdf$/i, '');
    return createEpub(title, html, true);
  } catch (e) {
    console.warn("Falló la conversión HTML, usando fallback texto plano", e);
    const textBlob = await pdfToText(file);
    const text = await textBlob.text();
    const title = file.name.replace(/\.pdf$/i, '');
    return createEpub(title, text, false);
  }
}

/**
 * Convierte Texto a EPUB
 * @param {File} file - Archivo de texto
 * @returns {Promise<Blob>} - Archivo EPUB
 */
export async function textToEpub(file) {
  const text = await file.text();
  const title = file.name.replace(/\.txt$/i, '');
  return createEpub(title, text);
}

/**
 * Extrae texto de un archivo EPUB y lo convierte a PDF preservando formato usando epubjs
 * @param {File} file - Archivo EPUB
 * @returns {Promise<Blob>} - Archivo PDF
 */
export async function epubToPdf(file) {
  // Usar epubjs para cargar el libro
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;

  // Obtener todos los items del spine (capítulos)
  const spine = book.spine;
  let fullHtml = '<div style="font-family: serif; line-height: 1.5; color: #000;">';

  // Iterar sobre cada sección del spine
  for (const item of spine.items) {
    try {
        // Cargar el documento usando el loader interno de epubjs
        // Esto nos da acceso al DOM parseado
        const doc = await item.load(book.load.bind(book));
        
        if (doc && doc.body) {
            // Resolver imágenes relativas a absolutas (base64)
            const images = doc.body.querySelectorAll('img');
            for (const img of images) {
                const src = img.getAttribute('src');
                if (src) {
                    // Resolver url absoluta dentro del zip
                    const url = book.path.resolve(src, item.href);
                    // Obtener el archivo del zip
                    const blob = await book.archive.getBlob(url);
                    if (blob) {
                        const reader = new FileReader();
                        const base64 = await new Promise(resolve => {
                            reader.onload = e => resolve(e.target.result);
                            reader.readAsDataURL(blob);
                        });
                        img.setAttribute('src', base64);
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                    }
                }
            }
            
            // Añadir contenido al HTML global
            fullHtml += `<div class="chapter" style="page-break-after: always;">${doc.body.innerHTML}</div>`;
        }
    } catch (e) {
        console.error("Error cargando sección EPUB:", e);
    }
  }
  
  fullHtml += '</div>';

  // Generar PDF usando jsPDF
  const container = document.createElement('div');
  container.style.width = '595px';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.innerHTML = fullHtml;
  document.body.appendChild(container);

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  await new Promise((resolve) => {
      doc.html(container, {
          callback: function(doc) {
              resolve();
          },
          x: 40,
          y: 40,
          width: 515,
          windowWidth: 595,
          autoPaging: 'text'
      });
  });

  document.body.removeChild(container);
  return doc.output('blob');
}

/**
 * Extrae texto de un archivo EPUB
 * @param {File} file - Archivo EPUB
 * @returns {Promise<Blob>} - Archivo TXT
 */
export async function epubToTxt(file) {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Encontrar el archivo OPF
    const containerXml = await zip.file('META-INF/container.xml').async('text');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfile = containerDoc.querySelector('rootfile');
    const opfPath = rootfile.getAttribute('full-path');
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));
  
    // 2. Leer el archivo OPF
    const opfContent = await zip.file(opfPath).async('text');
    const opfDoc = parser.parseFromString(opfContent, 'application/xml');
    
    // 3. Obtener el orden de lectura (spine) y el manifiesto
    const manifestItems = Array.from(opfDoc.querySelectorAll('manifest item'));
    const spineItems = Array.from(opfDoc.querySelectorAll('spine itemref'));
    
    const manifest = {};
    manifestItems.forEach(item => {
      manifest[item.getAttribute('id')] = item.getAttribute('href');
    });
  
    // 4. Extraer texto de cada capítulo en orden
    let fullText = '';
    
    for (const item of spineItems) {
      const idref = item.getAttribute('idref');
      const href = manifest[idref];
      
      if (href) {
        const fullPath = opfDir ? `${opfDir}/${href}` : href;
        const fileInZip = zip.file(fullPath);
        
        if (fileInZip) {
          const content = await fileInZip.async('text');
          const doc = parser.parseFromString(content, 'application/xhtml+xml') || parser.parseFromString(content, 'text/html');
          
          const elements = doc.body ? doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div') : [];
          
          if (elements.length > 0) {
              elements.forEach(el => {
                  const text = el.textContent.trim();
                  if (text) {
                      fullText += text + '\n\n';
                  }
              });
          } else {
              fullText += (doc.body ? doc.body.textContent : doc.documentElement.textContent) + '\n\n';
          }
        }
      }
    }
  
    return new Blob([fullText], { type: 'text/plain' });
  }


