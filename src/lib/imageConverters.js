/**
 * Image Converters Module
 * 
 * This module handles all image conversion functionality for Files2Any.
 * It supports conversion between various image formats, resizing, quality adjustment,
 * and metadata operations.
 */

// Import required libraries
import { jsPDF } from 'jspdf';
import imageCompression from 'browser-image-compression';

/**
 * Constants for supported formats
 */
export const IMAGE_FORMATS = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
  GIF: 'gif',
  BMP: 'bmp',
  SVG: 'svg'
};

/**
 * Helper function to create an Image element from a file
 * @param {File} file - The image file
 * @returns {Promise<HTMLImageElement>} - A promise that resolves to an HTMLImageElement
 */
const createImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = event.target.result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper function to create a canvas from an image
 * @param {HTMLImageElement} img - The image element
 * @param {Object} options - Options for creating the canvas
 * @returns {HTMLCanvasElement} - The canvas element with the image drawn on it
 */
const createCanvasFromImage = (img, options = {}) => {
  const {
    width = img.width,
    height = img.height,
    quality = 1.0,
    grayscale = false,
    sepia = false,
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
    crop = null
  } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Apply transformations
  ctx.save();
  
  // Apply rotation
  if (rotation !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
  }
  
  // Apply flip
  if (flipHorizontal || flipVertical) {
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    if (flipHorizontal) ctx.translate(-width, 0);
    if (flipVertical) ctx.translate(0, -height);
  }

  // Draw the image with or without crop
  if (crop) {
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height, // Source coordinates
      0, 0, width, height // Destination coordinates
    );
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }
  
  // Apply filters
  if (grayscale || sepia) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (grayscale) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      } else if (sepia) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));      // red
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));  // green
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));  // blue
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  ctx.restore();
  return canvas;
};

/**
 * Helper function to create a Blob from a canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {string} format - The desired output format (e.g., 'image/jpeg')
 * @param {number} quality - The quality of the output image (0-1)
 * @returns {Promise<Blob>} - A promise that resolves to a Blob
 */
const canvasToBlob = (canvas, format, quality = 0.92) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, format, quality);
  });
};

/**
 * Helper function to remove EXIF metadata from an image
 * @param {Blob} imageBlob - The image blob with metadata
 * @returns {Promise<Blob>} - A promise that resolves to a Blob without metadata
 */
const removeMetadata = async (imageBlob) => {
  const img = await createImageFromFile(new File([imageBlob], 'temp', { type: imageBlob.type }));
  const canvas = createCanvasFromImage(img);
  return canvasToBlob(canvas, imageBlob.type);
};

/**
 * Convert an image to JPEG format
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in JPEG format
 */
export const imageToJpeg = async (file, options = {}) => {
  const { quality = 0.92, width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop, removeMeta = false } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  return canvasToBlob(canvas, 'image/jpeg', quality);
};

/**
 * Convert an image to PNG format
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in PNG format
 */
export const imageToPng = async (file, options = {}) => {
  const { width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop, removeMeta = false } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  return canvasToBlob(canvas, 'image/png');
};

/**
 * Convert an image to WebP format
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in WebP format
 */
export const imageToWebp = async (file, options = {}) => {
  const { quality = 0.92, width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop, removeMeta = false } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  return canvasToBlob(canvas, 'image/webp', quality);
};

/**
 * Convert an image to GIF format
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in GIF format
 */
export const imageToGif = async (file, options = {}) => {
  const { width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop, removeMeta = false } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  // Note: GIF support is limited in browsers, this will create a static GIF
  return canvasToBlob(canvas, 'image/gif');
};

/**
 * Convert an image to BMP format
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in BMP format
 */
export const imageToBmp = async (file, options = {}) => {
  const { width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop, removeMeta = false } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  return canvasToBlob(canvas, 'image/bmp');
};

/**
 * Convert an image to a PDF document
 * @param {File} file - The input image file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in PDF format
 */
export const imageToPdf = async (file, options = {}) => {
  const { width, height, grayscale, sepia, rotation, flipHorizontal, flipVertical, crop } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight,
    grayscale,
    sepia,
    rotation,
    flipHorizontal,
    flipVertical,
    crop
  });
  
  // Create a PDF with the image dimensions
  const pdf = new jsPDF({
    orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [targetWidth, targetHeight]
  });
  
  // Add the image to the PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  pdf.addImage(imgData, 'JPEG', 0, 0, targetWidth, targetHeight);
  
  // Return as blob
  return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
};

/**
 * Convert an SVG image to PNG
 * @param {File} file - The input SVG file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in PNG format
 */
export const svgToPng = async (file, options = {}) => {
  const { width, height } = options;
  
  const text = await file.text();
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  
  URL.revokeObjectURL(url);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  return canvasToBlob(canvas, 'image/png');
};

/**
 * Convert an SVG image to JPEG
 * @param {File} file - The input SVG file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in JPEG format
 */
export const svgToJpeg = async (file, options = {}) => {
  const { quality = 0.92, width, height } = options;
  
  const text = await file.text();
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  
  URL.revokeObjectURL(url);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white'; // Add white background to prevent transparency
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  return canvasToBlob(canvas, 'image/jpeg', quality);
};

/**
 * Convert an SVG image to PDF
 * @param {File} file - The input SVG file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob>} - A promise that resolves to a Blob in PDF format
 */
export const svgToPdf = async (file, options = {}) => {
  const { quality = 0.92, width, height } = options;
  
  const text = await file.text();
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  
  URL.revokeObjectURL(url);
  
  // Calculate dimensions - handle both number and string (percentage) inputs
  const targetWidth = width ? (typeof width === 'string' && width.endsWith('%') ? (parseInt(width) / 100) * img.width : parseInt(width)) : img.width;
  const targetHeight = height ? (typeof height === 'string' && height.endsWith('%') ? (parseInt(height) / 100) * img.height : parseInt(height)) : img.height;
  
  const pdf = new jsPDF({
    orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [targetWidth, targetHeight]
  });
  
  // Draw SVG on canvas to convert to image for PDF
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, targetWidth, targetHeight);
  
  return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
};

/**
 * Convert a PDF to PNG images
 * @param {File} file - The input PDF file
 * @param {Object} options - Conversion options
 * @returns {Promise<Blob[]>} - A promise that resolves to an array of Blobs in PNG format
 */
export const pdfToImages = async (file, options = {}) => {
  const { format = 'png', quality = 0.92, pageNumber = 1 } = options;
  
  // We need to use PDF.js for this
  // For simplicity, we'll implement basic functionality here
  // For production use, you should use PDF.js directly
  
  // Placeholder code - in a real implementation, you would use PDF.js
  const img = document.createElement('canvas');
  img.width = 800;
  img.height = 1100;
  const ctx = img.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, img.width, img.height);
  ctx.fillStyle = '#000';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`PDF Page ${pageNumber} Preview`, img.width / 2, img.height / 2);
  
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  return [await canvasToBlob(img, mimeType, quality)];
};

/**
 * Optimize an image for web by reducing quality and removing metadata
 * @param {File} file - The input image file
 * @param {Object} options - Optimization options
 * @returns {Promise<Blob>} - A promise that resolves to an optimized image Blob
 */
export const optimizeForWeb = async (file, options = {}) => {
  const { quality = 0.8, maxWidth = 1200, format } = options;
  
  const img = await createImageFromFile(file);
  
  // Calculate dimensions to maintain aspect ratio
  let targetWidth = img.width;
  let targetHeight = img.height;
  
  if (targetWidth > maxWidth) {
    const ratio = maxWidth / targetWidth;
    targetWidth = maxWidth;
    targetHeight = Math.round(targetHeight * ratio);
  }
  
  const canvas = createCanvasFromImage(img, {
    width: targetWidth,
    height: targetHeight
  });
  
  // Determine output format
  let outputFormat;
  if (format) {
    outputFormat = `image/${format.toLowerCase()}`;
  } else if (file.type.includes('png') && !file.type.includes('jpeg')) {
    outputFormat = 'image/png';
  } else {
    outputFormat = 'image/jpeg'; // Default to JPEG for better compression
  }
  
  return canvasToBlob(canvas, outputFormat, quality);
};

/**
 * Determine the type of image file
 * @param {File} file - The input file
 * @returns {string} - The image type (jpeg, png, gif, etc.)
 */
export const getImageType = (file) => {
  const type = file.type.toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpeg';
  if (type.includes('png')) return 'png';
  if (type.includes('gif')) return 'gif';
  if (type.includes('webp')) return 'webp';
  if (type.includes('bmp')) return 'bmp';
  if (type.includes('svg')) return 'svg';
  if (type.includes('tiff')) return 'tiff';
  if (type.includes('pdf')) return 'pdf';
  return 'unknown';
};

/**
 * Get available conversion options for a specific image type
 * @param {string} imageType - The image type
 * @returns {string[]} - Array of available conversion formats
 */
export const getConversionOptions = (imageType) => {
  if (!imageType) return [];
  
  const type = imageType.toLowerCase();
  
  // Define conversion options for each format
  const OPTIONS = {
    jpeg: ['PNG', 'WEBP', 'BMP', 'PDF'],
    jpg: ['PNG', 'WEBP', 'BMP', 'PDF'],
    png: ['JPG', 'WEBP', 'BMP', 'PDF'],
    webp: ['PNG', 'JPG', 'BMP', 'PDF'],
    gif: ['PNG', 'JPG', 'WEBP'],
    bmp: ['PNG', 'JPG', 'WEBP', 'PDF'],
    svg: ['PNG', 'JPG', 'PDF'],
    pdf: ['PNG', 'JPG'],
    default: ['PNG', 'JPG', 'WEBP', 'BMP', 'PDF']
  };
  
  return OPTIONS[type] || OPTIONS.default;
};

/**
 * Compress an image file using browser-image-compression
 * @param {File} file - The input image file
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - A promise that resolves to a compressed image Blob
 */
export const compressImage = async (file, options = {}) => {
  const { quality = 0.8, maxWidth = 1920 } = options;
  
  // Skip compression for SVG files
  if (getImageType(file) === 'svg') {
    return file;
  }
  
  try {
    const compressionOptions = {
      maxSizeMB: 10, // Max file size
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      initialQuality: quality
    };
    
    return await imageCompression(file, compressionOptions);
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fall back to the original file if compression fails
    return file;
  }
};

// Main conversion function that handles all image conversions
export const convertImage = async (file, targetFormat, options = {}) => {
  const sourceType = getImageType(file);
  
  try {
    // Optional compression step if removeMetadata is true
    let processedFile = file;
    if (options.removeMetadata) {
      processedFile = await compressImage(file, {
        quality: options.quality || 0.92,
        maxWidth: 4000 // Keep high quality for further processing
      });
    }
    
    // Handle conversions
    switch (targetFormat.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return imageToJpeg(processedFile, options);
      case 'png':
        if (sourceType === 'svg') {
          return svgToPng(processedFile, options);
        }
        return imageToPng(processedFile, options);
      case 'webp':
        return imageToWebp(processedFile, options);
      case 'gif':
        return imageToGif(processedFile, options);
      case 'bmp':
        return imageToBmp(processedFile, options);
      case 'pdf':
        if (sourceType === 'svg') {
          return svgToPdf(processedFile, options);
        }
        return imageToPdf(processedFile, options);
      default:
        throw new Error(`Conversion to ${targetFormat} not supported yet`);
    }
  } catch (error) {
    console.error(`Error converting ${sourceType} to ${targetFormat}:`, error);
    throw new Error(`Error en la conversión: ${error.message}`);
  }
};

// Export the manipulation functions
export const manipulateImage = {
  resize: async (file, options) => {
    const sourceType = getImageType(file);
    return convertImage(file, sourceType, options);
  },
  
  crop: async (file, cropOptions) => {
    const sourceType = getImageType(file);
    return convertImage(file, sourceType, { crop: cropOptions });
  },
  
  removeMetadata: async (file) => {
    const img = await createImageFromFile(file);
    const canvas = createCanvasFromImage(img);
    return canvasToBlob(canvas, file.type);
  },
  
  applyFilter: async (file, filterOptions) => {
    const sourceType = getImageType(file);
    return convertImage(file, sourceType, filterOptions);
  }
};

/**
 * Parse dimension string (e.g., "1000x1000", "800x600")
 * @param {string} dimensionStr - Dimension string in format "widthxheight"
 * @returns {Object} - Object with width and height properties
 */
export const parseDimensions = (dimensionStr) => {
  if (!dimensionStr || typeof dimensionStr !== 'string') {
    return { width: null, height: null };
  }
  
  const cleaned = dimensionStr.toLowerCase().trim().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+)x(\d+)$/);
  
  if (!match) {
    throw new Error('Formato de dimensiones inválido. Use el formato: ancho x alto (ej: 1000x1000)');
  }
  
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  
  if (width <= 0 || width > 10000 || height <= 0 || height > 10000) {
    throw new Error('Las dimensiones deben estar entre 1 y 10000 píxeles');
  }
  
  return { width, height };
};

/**
 * Process multiple images in batch with the same settings
 * @param {FileList|Array<File>} files - Array of image files to process
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Array of processed image blobs with metadata
 */
export const batchProcessImages = async (files, options = {}) => {
  const {
    format = 'webp',
    dimensionStr = null,
    quality = 0.92,
    compress = true,
    removeMetadata: removeMeta = true,
    maxFiles = 400
  } = options;
  
  // Convert FileList to Array if needed
  const fileArray = Array.from(files);
  
  // Validate file count
  if (fileArray.length === 0) {
    throw new Error('No se han seleccionado archivos');
  }
  
  if (fileArray.length > maxFiles) {
    throw new Error(`Se permite un máximo de ${maxFiles} imágenes. Tienes ${fileArray.length} archivos.`);
  }
  
  // Validate all files are images
  const imageFiles = fileArray.filter(file => {
    const isImageType = file.type.startsWith('image/') || 
                       file.name.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
    return isImageType;
  });
  
  if (imageFiles.length === 0) {
    throw new Error('No se encontraron imágenes válidas en la selección');
  }
  
  if (imageFiles.length < fileArray.length) {
    console.warn(`Se ignoraron ${fileArray.length - imageFiles.length} archivos que no son imágenes`);
  }
  
  // Parse dimensions if provided
  let dimensions = { width: null, height: null };
  if (dimensionStr) {
    dimensions = parseDimensions(dimensionStr);
  }
  
  // Process all images
  const results = [];
  const errors = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    
    try {
      // Prepare conversion options
      const conversionOptions = {
        quality,
        removeMetadata: removeMeta,
        ...dimensions
      };
      
      // Convert the image
      const blob = await convertImage(file, format, conversionOptions);
      
      // Get file extension from original name
      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const newFileName = `${originalName}.${format}`;
      
      results.push({
        blob,
        fileName: newFileName,
        originalFileName: file.name,
        size: blob.size,
        index: i
      });
      
    } catch (error) {
      console.error(`Error procesando ${file.name}:`, error);
      errors.push({
        fileName: file.name,
        error: error.message,
        index: i
      });
    }
  }
  
  return {
    results,
    errors,
    totalProcessed: results.length,
    totalErrors: errors.length,
    totalFiles: imageFiles.length
  };
};

/**
 * Create a ZIP file from processed images
 * @param {Array} processedImages - Array of processed image objects
 * @param {string} zipFileName - Name for the ZIP file
 * @returns {Promise<Blob>} - ZIP file blob
 */
export const createImageZip = async (processedImages, zipFileName = 'images.zip') => {
  // We'll use JSZip library for this - need to install it
  // For now, return a simple implementation that downloads files individually
  // In production, you should install jszip package
  
  try {
    // Check if JSZip is available
    if (typeof window.JSZip === 'undefined') {
      throw new Error('JSZip library not available. Images will be downloaded individually.');
    }
    
    const JSZip = window.JSZip;
    const zip = new JSZip();
    
    // Add each image to the zip
    for (const img of processedImages) {
      zip.file(img.fileName, img.blob);
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
    
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
};
