import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  Square, 
  DoorOpen, 
  Maximize2,
  Trash2, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Upload,
  Save,
  Grid3X3,
  Undo2,
  Redo2,
  Move,
  Sofa,
  Bed,
  Utensils,
  ShowerHead,
  Tv,
  Armchair,
  Lamp,
  BookOpen,
  Box,
  ChefHat,
  CircleDot,
  Car,
  TreeDeciduous,
  FileImage,
  FileText,
  Home,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Funciones para dibujar SVGs realistas en canvas
const drawFurnitureSVG = (ctx, type, x, y, width, height) => {
  ctx.save();
  
  switch (type) {
    case 'sofa':
      // Sofá 3 plazas realista
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 2;
      roundRect(ctx, x + 2, y + 8, width - 4, height - 10, 4);
      ctx.fill();
      ctx.stroke();
      // Cojines
      ctx.fillStyle = '#A0522D';
      roundRect(ctx, x + 6, y + 12, width * 0.22, height - 18, 3);
      ctx.fill();
      roundRect(ctx, x + width * 0.3, y + 12, width * 0.4, height - 18, 3);
      ctx.fill();
      roundRect(ctx, x + width * 0.73, y + 12, width * 0.22, height - 18, 3);
      ctx.fill();
      // Respaldo
      ctx.fillStyle = '#6B3E1E';
      roundRect(ctx, x + 2, y + 2, width - 4, 10, 3);
      ctx.fill();
      break;
      
    case 'armchair':
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 2;
      roundRect(ctx, x + 2, y + 8, width - 4, height - 10, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#A0522D';
      roundRect(ctx, x + 8, y + 12, width - 16, height - 18, 3);
      ctx.fill();
      ctx.fillStyle = '#6B3E1E';
      roundRect(ctx, x + 2, y + 2, width - 4, 10, 3);
      ctx.fill();
      // Brazos
      roundRect(ctx, x, y + 10, 6, height - 20, 2);
      ctx.fill();
      roundRect(ctx, x + width - 6, y + 10, 6, height - 20, 2);
      ctx.fill();
      break;
      
    case 'coffeeTable':
      ctx.fillStyle = '#DEB887';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      roundRect(ctx, x + 2, y + 2, width - 4, height - 4, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#D2B48C';
      roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 1);
      ctx.fill();
      break;
      
    case 'tv':
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, width, height, 1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = '#333';
      ctx.fillRect(x + width / 2 - 5, y + height - 2, 10, 2);
      break;
      
    case 'lamp':
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFEC8B';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF8DC';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 10, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'bookshelf':
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      // Libros de colores
      const colors = ['#654321', '#8B0000', '#006400', '#00008B', '#4B0082'];
      let bookX = x + 2;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        const bw = (width - 4) / 5;
        ctx.fillRect(bookX, y + 2, bw - 1, height - 4);
        bookX += bw;
      }
      break;
      
    case 'bedSingle':
    case 'bedDouble':
      ctx.fillStyle = '#4169E1';
      ctx.strokeStyle = '#2F4F8F';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, width, height, 3);
      ctx.fill();
      ctx.stroke();
      // Almohada
      ctx.fillStyle = '#87CEEB';
      roundRect(ctx, x + 4, y + 4, width - 8, 24, 2);
      ctx.fill();
      // Sábana
      ctx.fillStyle = '#6495ED';
      roundRect(ctx, x + 4, y + 32, width - 8, height - 40, 2);
      ctx.fill();
      // Almohada detalle
      ctx.fillStyle = '#B0C4DE';
      if (type === 'bedDouble') {
        ctx.beginPath();
        ctx.ellipse(x + width * 0.3, y + 16, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.7, y + 16, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + 16, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'wardrobe':
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(x + width / 2, y + height);
      ctx.stroke();
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(x + width / 2 - 5, y + height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width / 2 + 5, y + height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'nightstand':
      ctx.fillStyle = '#DEB887';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
      ctx.stroke();
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.25, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.75, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'diningTable':
      ctx.fillStyle = '#DEB887';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      roundRect(ctx, x + 5, y + 5, width - 10, height - 10, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#D2B48C';
      roundRect(ctx, x + 8, y + 8, width - 16, height - 16, 2);
      ctx.fill();
      break;
      
    case 'chair':
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 1;
      roundRect(ctx, x + 2, y + 10, width - 4, height - 12, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#A0522D';
      roundRect(ctx, x + 4, y, width - 8, 12, 2);
      ctx.fill();
      break;
      
    case 'fridge':
      ctx.fillStyle = '#E8E8E8';
      ctx.strokeStyle = '#B0B0B0';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, width, height, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.33);
      ctx.lineTo(x + width, y + height * 0.33);
      ctx.stroke();
      ctx.fillStyle = '#808080';
      roundRect(ctx, x + width - 8, y + 5, 3, 6, 1);
      ctx.fill();
      roundRect(ctx, x + width - 8, y + height * 0.33 + 5, 3, 10, 1);
      ctx.fill();
      break;
      
    case 'stove':
      ctx.fillStyle = '#2F2F2F';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 2;
      const burnerR = width * 0.15;
      const positions = [
        [x + width * 0.3, y + height * 0.3],
        [x + width * 0.7, y + height * 0.3],
        [x + width * 0.3, y + height * 0.7],
        [x + width * 0.7, y + height * 0.7]
      ];
      positions.forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(bx, by, burnerR, 0, Math.PI * 2);
        ctx.stroke();
      });
      break;
      
    case 'sink':
      ctx.fillStyle = '#E0E0E0';
      ctx.strokeStyle = '#B0B0B0';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, width, height, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#C0C0C0';
      ctx.strokeStyle = '#909090';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width * 0.35, height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2 + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A0A0A0';
      roundRect(ctx, x + width / 2 - 3, y + 3, 6, 8, 2);
      ctx.fill();
      break;
      
    case 'counter':
      ctx.fillStyle = '#D2691E';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
      break;
      
    case 'toilet':
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      // Tank
      roundRect(ctx, x + width * 0.15, y + 5, width * 0.7, height * 0.4, 3);
      ctx.fill();
      ctx.stroke();
      // Bowl
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height * 0.7, width * 0.43, height * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E8E8E8';
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height * 0.7, width * 0.27, height * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'bathtub':
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, width, height, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E0FFFF';
      ctx.strokeStyle = '#B0E0E6';
      ctx.lineWidth = 1;
      roundRect(ctx, x + 5, y + 5, width - 10, height - 10, 4);
      ctx.fill();
      ctx.stroke();
      // Grifo
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.arc(x + 15, y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 13, y + 12, 4, 10);
      break;
      
    case 'shower':
      ctx.fillStyle = '#E0FFFF';
      ctx.strokeStyle = '#4682B4';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#F0FFFF';
      ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
      // Cabezal
      ctx.strokeStyle = '#4682B4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + 10, 6, 0, Math.PI * 2);
      ctx.stroke();
      // Agua
      ctx.strokeStyle = '#87CEEB';
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y + 16);
      ctx.lineTo(x + width / 2, y + height - 5);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
      
    case 'washingMachine':
      ctx.fillStyle = '#E8E8E8';
      ctx.strokeStyle = '#B0B0B0';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, width, height, 2);
      ctx.fill();
      ctx.stroke();
      // Tambor
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#909090';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.6, width * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.6, width * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Panel
      ctx.fillStyle = '#D0D0D0';
      ctx.fillRect(x + 5, y + 3, width - 10, 8);
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(x + 10, y + 7, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'car':
      // Carrocería
      ctx.fillStyle = '#4682B4';
      ctx.strokeStyle = '#2F4F6F';
      ctx.lineWidth = 2;
      roundRect(ctx, x + 5, y + 15, width - 10, height - 20, 3);
      ctx.fill();
      ctx.stroke();
      // Ventanas
      ctx.fillStyle = '#87CEEB';
      ctx.strokeStyle = '#4682B4';
      ctx.lineWidth = 1;
      roundRect(ctx, x + 15, y + 5, width * 0.32, 15, 2);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, x + width * 0.5, y + 5, width * 0.32, 15, 2);
      ctx.fill();
      ctx.stroke();
      // Ruedas
      ctx.fillStyle = '#333';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 25, y + height - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + width - 25, y + height - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(x + 25, y + height - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width - 25, y + height - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'tree':
      // Copa del árbol
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2E8B2E';
      ctx.beginPath();
      ctx.arc(x + 10, y + 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width - 10, y + 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      // Tronco
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x + width / 2 - 3, y + 26, 6, 12);
      break;
      
    case 'plant':
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.65, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x + width * 0.33, y + height * 0.5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width * 0.67, y + height * 0.5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3CB371';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B4513';
      roundRect(ctx, x + width / 2 - 3, y + height - 6, 6, 5, 1);
      ctx.fill();
      break;
      
    default:
      // Fallback: rectángulo simple
      ctx.fillStyle = '#CCC';
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
  }
  
  ctx.restore();
};

// Helper para rectángulos redondeados
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// Catálogo de muebles
const FURNITURE_CATALOG = {
  sofa: { name: 'Sofá', category: 'living', width: 120, height: 50, icon: Sofa },
  armchair: { name: 'Sillón', category: 'living', width: 50, height: 50, icon: Armchair },
  coffeeTable: { name: 'Mesa centro', category: 'living', width: 60, height: 40, icon: Square },
  tv: { name: 'TV', category: 'living', width: 80, height: 15, icon: Tv },
  lamp: { name: 'Lámpara', category: 'living', width: 25, height: 25, icon: Lamp, isCircle: true },
  bookshelf: { name: 'Librero', category: 'living', width: 80, height: 25, icon: BookOpen },
  bedSingle: { name: 'Cama 1P', category: 'bedroom', width: 70, height: 130, icon: Bed },
  bedDouble: { name: 'Cama 2P', category: 'bedroom', width: 110, height: 130, icon: Bed },
  wardrobe: { name: 'Armario', category: 'bedroom', width: 100, height: 40, icon: Square },
  nightstand: { name: 'Mesita', category: 'bedroom', width: 30, height: 30, icon: Square },
  diningTable: { name: 'Mesa comedor', category: 'dining', width: 80, height: 50, icon: Utensils },
  chair: { name: 'Silla', category: 'dining', width: 25, height: 25, icon: Square },
  fridge: { name: 'Refrigerador', category: 'kitchen', width: 50, height: 50, icon: Box },
  stove: { name: 'Estufa', category: 'kitchen', width: 45, height: 45, icon: ChefHat },
  sink: { name: 'Fregadero', category: 'kitchen', width: 50, height: 40, icon: Square },
  counter: { name: 'Encimera', category: 'kitchen', width: 120, height: 40, icon: Square },
  toilet: { name: 'Inodoro', category: 'bathroom', width: 35, height: 50, icon: Square },
  bathtub: { name: 'Bañera', category: 'bathroom', width: 100, height: 55, icon: ShowerHead },
  shower: { name: 'Ducha', category: 'bathroom', width: 65, height: 65, icon: ShowerHead },
  washingMachine: { name: 'Lavadora', category: 'bathroom', width: 45, height: 45, icon: CircleDot },
  car: { name: 'Auto', category: 'exterior', width: 120, height: 55, icon: Car },
  tree: { name: 'Árbol', category: 'exterior', width: 45, height: 45, icon: TreeDeciduous, isCircle: true },
  plant: { name: 'Planta', category: 'exterior', width: 30, height: 30, icon: TreeDeciduous, isCircle: true },
};

// Habitaciones predefinidas
const ROOM_TEMPLATES = {
  bedroom: { name: 'Dormitorio', width: 250, height: 200, color: '#E8D4B8', icon: Bed },
  bathroom: { name: 'Baño', width: 150, height: 120, color: '#B0E0E6', icon: ShowerHead },
  kitchen: { name: 'Cocina', width: 200, height: 180, color: '#FFEFD5', icon: ChefHat },
  living: { name: 'Sala', width: 300, height: 250, color: '#F5DEB3', icon: Sofa },
  dining: { name: 'Comedor', width: 200, height: 180, color: '#FFE4C4', icon: Utensils },
  garage: { name: 'Garaje', width: 250, height: 300, color: '#D3D3D3', icon: Car },
  office: { name: 'Oficina', width: 180, height: 150, color: '#E6E6FA', icon: BookOpen },
};

// Tamaño mínimo de elementos
const MIN_SIZE = 20;

const GRID_SIZE = 10;
const HANDLE_SIZE = 10;

const FloorPlanEditor = () => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Estado principal
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Herramientas
  const [tool, setTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Elementos del plano
  const [elements, setElements] = useState([]);
  
  // Dibujo de paredes
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  
  // Drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  // Resize
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [resizeStart, setResizeStart] = useState(null);
  
  // UI
  const [showGrid, setShowGrid] = useState(true);
  const [furnitureCategory, setFurnitureCategory] = useState('living');
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar móvil y ajustar tamaño del canvas
  useEffect(() => {
    const updateSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableWidth = rect.width - 10;
        const availableHeight = mobile 
          ? Math.max(350, window.innerHeight - 300)
          : Math.max(500, window.innerHeight - 400);
        
        setCanvasSize({
          width: availableWidth,
          height: availableHeight
        });
        
        // Ajustar escala inicial en móvil
        if (mobile && scale === 1) {
          setScale(0.6);
        }
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [scale]);

  // Guardar en historial
  const saveHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Snap to grid
  const snap = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  // Obtener posición del mouse en el canvas
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: snap((e.clientX - rect.left - offset.x) / scale),
      y: snap((e.clientY - rect.top - offset.y) / scale)
    };
  };

  // Dibujar canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Dibujar cuadrícula
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= 2000; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1500);
        ctx.stroke();
      }
      for (let y = 0; y <= 1500; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2000, y);
        ctx.stroke();
      }
      // Líneas mayores cada 100px
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 2000; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1500);
        ctx.stroke();
      }
      for (let y = 0; y <= 1500; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2000, y);
        ctx.stroke();
      }
    }
    
    // Dibujar elementos
    elements.forEach((el) => {
      ctx.save();
      
      if (el.type === 'room') {
        ctx.fillStyle = el.color;
        ctx.strokeStyle = selectedId === el.id ? '#0066ff' : '#666';
        ctx.lineWidth = selectedId === el.id ? 3 : 2;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        
        // Nombre de la habitación
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(el.name, el.x + 10, el.y + 20);
        
        // Dimensiones
        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        const widthM = (el.width / 50).toFixed(1);
        const heightM = (el.height / 50).toFixed(1);
        ctx.fillText(`${widthM}m × ${heightM}m`, el.x + 10, el.y + el.height - 10);
        
        // Dibujar handles de redimensionamiento si está seleccionado
        if (selectedId === el.id) {
          drawResizeHandles(ctx, el);
        }
      }
      
      else if (el.type === 'wall') {
        ctx.strokeStyle = selectedId === el.id ? '#0066ff' : '#333';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        
        // Mostrar longitud
        const length = Math.sqrt(Math.pow(el.x2 - el.x1, 2) + Math.pow(el.y2 - el.y1, 2));
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${(length / 50).toFixed(1)}m`, (el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2 - 10);
      }
      
      else if (el.type === 'door') {
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation || 0) * Math.PI / 180);
        
        // Dibujar puerta realista
        ctx.fillStyle = '#FFF8DC';
        ctx.strokeStyle = selectedId === el.id ? '#0066ff' : '#8B4513';
        ctx.lineWidth = selectedId === el.id ? 3 : 2;
        roundRect(ctx, -el.width / 2, -el.height / 2, el.width, el.height, 1);
        ctx.fill();
        ctx.stroke();
        
        // Manija
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.arc(el.width / 2 - 8, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Arco de apertura
        ctx.beginPath();
        ctx.arc(-el.width / 2, -el.height / 2, el.width * 0.75, 0, Math.PI / 2);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
        ctx.save();
        
        // Dibujar handles si está seleccionado
        if (selectedId === el.id) {
          drawResizeHandles(ctx, el);
        }
      }
      
      else if (el.type === 'window') {
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation || 0) * Math.PI / 180);
        
        // Ventana realista
        ctx.fillStyle = '#87CEEB';
        ctx.strokeStyle = selectedId === el.id ? '#0066ff' : '#4682B4';
        ctx.lineWidth = selectedId === el.id ? 3 : 2;
        ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
        ctx.strokeRect(-el.width / 2, -el.height / 2, el.width, el.height);
        
        // Divisiones del vidrio
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 1;
        const segments = Math.floor(el.width / 33);
        for (let i = 1; i < segments; i++) {
          const xPos = -el.width / 2 + (el.width / segments) * i;
          ctx.beginPath();
          ctx.moveTo(xPos, -el.height / 2);
          ctx.lineTo(xPos, el.height / 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-el.width / 2, 0);
        ctx.lineTo(el.width / 2, 0);
        ctx.stroke();
        
        ctx.restore();
        ctx.save();
        
        // Dibujar handles si está seleccionado
        if (selectedId === el.id) {
          drawResizeHandles(ctx, el);
        }
      }
      
      else if (el.type === 'furniture') {
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation || 0) * Math.PI / 180);
        
        // Dibujar mueble con SVG realista
        drawFurnitureSVG(ctx, el.furnitureType, -el.width / 2, -el.height / 2, el.width, el.height);
        
        // Borde de selección
        if (selectedId === el.id) {
          ctx.strokeStyle = '#0066ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          if (el.isCircle) {
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(el.width, el.height) / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(-el.width / 2 - 3, -el.height / 2 - 3, el.width + 6, el.height + 6);
          }
          ctx.setLineDash([]);
        }
        
        ctx.restore();
        ctx.save();
        
        // Dibujar handles si está seleccionado
        if (selectedId === el.id) {
          drawResizeHandles(ctx, el);
        }
      }
      
      ctx.restore();
    });
    
    // Dibujar pared en progreso
    if (isDrawing && drawStart && tool === 'wall') {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(drawStart.currentX, drawStart.currentY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [elements, selectedId, showGrid, scale, offset, isDrawing, drawStart, tool]);

  // Dibujar handles de redimensionamiento
  const drawResizeHandles = (ctx, el) => {
    if (el.type === 'wall') return; // Las paredes no tienen handles
    
    const handles = getHandlePositions(el);
    
    handles.forEach((handle) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.fill();
      ctx.stroke();
    });
  };

  // Obtener posiciones de los handles
  const getHandlePositions = (el) => {
    if (el.type === 'wall') return [];
    
    return [
      { type: 'nw', x: el.x, y: el.y },
      { type: 'n', x: el.x + el.width / 2, y: el.y },
      { type: 'ne', x: el.x + el.width, y: el.y },
      { type: 'e', x: el.x + el.width, y: el.y + el.height / 2 },
      { type: 'se', x: el.x + el.width, y: el.y + el.height },
      { type: 's', x: el.x + el.width / 2, y: el.y + el.height },
      { type: 'sw', x: el.x, y: el.y + el.height },
      { type: 'w', x: el.x, y: el.y + el.height / 2 },
    ];
  };

  // Encontrar handle en posición
  const findHandleAt = (x, y) => {
    if (!selectedId) return null;
    const el = elements.find(e => e.id === selectedId);
    if (!el || el.type === 'wall') return null;
    
    const handles = getHandlePositions(el);
    for (const handle of handles) {
      const dist = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
      if (dist < HANDLE_SIZE) {
        return { ...handle, element: el };
      }
    }
    return null;
  };

  // Cursor según handle
  const getCursorForHandle = (handleType) => {
    const cursors = {
      'nw': 'nw-resize',
      'n': 'n-resize',
      'ne': 'ne-resize',
      'e': 'e-resize',
      'se': 'se-resize',
      's': 's-resize',
      'sw': 'sw-resize',
      'w': 'w-resize',
    };
    return cursors[handleType] || 'crosshair';
  };

  // Redibujar cuando cambian los elementos
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Encontrar elemento en posición
  const findElementAt = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'wall') {
        const dist = pointToLineDistance(x, y, el.x1, el.y1, el.x2, el.y2);
        if (dist < 15) return el;
      } else {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          return el;
        }
      }
    }
    return null;
  };

  // Distancia de punto a línea
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Manejadores de mouse
  const handleMouseDown = (e) => {
    const pos = getCanvasPos(e);
    
    if (tool === 'select') {
      // Primero verificar si estamos sobre un handle de redimensionamiento
      const handle = findHandleAt(pos.x, pos.y);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle.type);
        setResizeStart({
          x: pos.x,
          y: pos.y,
          element: { ...handle.element }
        });
        return;
      }
      
      const el = findElementAt(pos.x, pos.y);
      if (el) {
        setSelectedId(el.id);
        setIsDragging(true);
        setDragStart({ x: pos.x - el.x, y: pos.y - el.y, elX: el.x, elY: el.y });
      } else {
        setSelectedId(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y, isPan: true });
      }
    } else if (tool === 'wall') {
      setIsDrawing(true);
      setDrawStart({ x: pos.x, y: pos.y, currentX: pos.x, currentY: pos.y });
    } else if (tool === 'door') {
      addElement({
        id: `door-${Date.now()}`,
        type: 'door',
        x: pos.x - 40,
        y: pos.y - 7,
        width: 80,
        height: 14,
        rotation: 0
      });
    } else if (tool === 'window') {
      addElement({
        id: `window-${Date.now()}`,
        type: 'window',
        x: pos.x - 50,
        y: pos.y - 7,
        width: 100,
        height: 14,
        rotation: 0
      });
    } else if (tool === 'room' && selectedRoom) {
      const template = ROOM_TEMPLATES[selectedRoom];
      addElement({
        id: `room-${Date.now()}`,
        type: 'room',
        x: pos.x,
        y: pos.y,
        width: template.width,
        height: template.height,
        color: template.color,
        name: template.name
      });
    } else if (tool === 'furniture' && selectedFurniture) {
      const template = FURNITURE_CATALOG[selectedFurniture];
      addElement({
        id: `furniture-${Date.now()}`,
        type: 'furniture',
        furnitureType: selectedFurniture,
        x: pos.x - template.width / 2,
        y: pos.y - template.height / 2,
        width: template.width,
        height: template.height,
        name: template.name,
        rotation: 0,
        isCircle: template.isCircle
      });
    }
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasPos(e);
    
    // Actualizar cursor según posición
    if (tool === 'select' && !isDragging && !isResizing) {
      const handle = findHandleAt(pos.x, pos.y);
      if (handle) {
        setCursorStyle(getCursorForHandle(handle.type));
      } else {
        const el = findElementAt(pos.x, pos.y);
        setCursorStyle(el ? 'move' : 'crosshair');
      }
    }
    
    if (isResizing && resizeStart && resizeHandle) {
      // Lógica de redimensionamiento
      const el = resizeStart.element;
      let newX = el.x;
      let newY = el.y;
      let newWidth = el.width;
      let newHeight = el.height;
      
      const dx = pos.x - resizeStart.x;
      const dy = pos.y - resizeStart.y;
      
      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(MIN_SIZE, el.width + dx);
          newHeight = Math.max(MIN_SIZE, el.height + dy);
          break;
        case 'sw':
          newX = el.x + dx;
          newWidth = Math.max(MIN_SIZE, el.width - dx);
          newHeight = Math.max(MIN_SIZE, el.height + dy);
          if (newWidth <= MIN_SIZE) newX = el.x + el.width - MIN_SIZE;
          break;
        case 'ne':
          newY = el.y + dy;
          newWidth = Math.max(MIN_SIZE, el.width + dx);
          newHeight = Math.max(MIN_SIZE, el.height - dy);
          if (newHeight <= MIN_SIZE) newY = el.y + el.height - MIN_SIZE;
          break;
        case 'nw':
          newX = el.x + dx;
          newY = el.y + dy;
          newWidth = Math.max(MIN_SIZE, el.width - dx);
          newHeight = Math.max(MIN_SIZE, el.height - dy);
          if (newWidth <= MIN_SIZE) newX = el.x + el.width - MIN_SIZE;
          if (newHeight <= MIN_SIZE) newY = el.y + el.height - MIN_SIZE;
          break;
        case 'n':
          newY = el.y + dy;
          newHeight = Math.max(MIN_SIZE, el.height - dy);
          if (newHeight <= MIN_SIZE) newY = el.y + el.height - MIN_SIZE;
          break;
        case 's':
          newHeight = Math.max(MIN_SIZE, el.height + dy);
          break;
        case 'e':
          newWidth = Math.max(MIN_SIZE, el.width + dx);
          break;
        case 'w':
          newX = el.x + dx;
          newWidth = Math.max(MIN_SIZE, el.width - dx);
          if (newWidth <= MIN_SIZE) newX = el.x + el.width - MIN_SIZE;
          break;
      }
      
      setElements(prev => prev.map(item => 
        item.id === el.id
          ? { ...item, x: snap(newX), y: snap(newY), width: snap(newWidth), height: snap(newHeight) }
          : item
      ));
    } else if (isDrawing && tool === 'wall') {
      setDrawStart(prev => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
    } else if (isDragging && dragStart) {
      if (dragStart.isPan) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (selectedId) {
        setElements(prev => prev.map(el => 
          el.id === selectedId
            ? { ...el, x: snap(pos.x - dragStart.x), y: snap(pos.y - dragStart.y) }
            : el
        ));
      }
    }
  };

  const handleMouseUp = () => {
    if (isResizing) {
      saveHistory(elements);
    }
    
    if (isDrawing && tool === 'wall' && drawStart) {
      const length = Math.sqrt(
        Math.pow(drawStart.currentX - drawStart.x, 2) + 
        Math.pow(drawStart.currentY - drawStart.y, 2)
      );
      if (length > 20) {
        addElement({
          id: `wall-${Date.now()}`,
          type: 'wall',
          x1: drawStart.x,
          y1: drawStart.y,
          x2: drawStart.currentX,
          y2: drawStart.currentY,
          x: Math.min(drawStart.x, drawStart.currentX),
          y: Math.min(drawStart.y, drawStart.currentY),
          width: Math.abs(drawStart.currentX - drawStart.x) || 10,
          height: Math.abs(drawStart.currentY - drawStart.y) || 10
        });
      }
    }
    
    if (isDragging && selectedId && !dragStart?.isPan) {
      saveHistory(elements);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
  };

  // Manejadores táctiles para móvil
  const getTouchPos = (touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: snap((touch.clientX - rect.left - offset.x) / scale),
      y: snap((touch.clientY - rect.top - offset.y) / scale)
    };
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      handleMouseDown(fakeEvent);
    } else if (e.touches.length === 2) {
      // Pinch zoom - guardar distancia inicial
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setDragStart({ pinchDist: dist, startScale: scale });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      handleMouseMove(fakeEvent);
    } else if (e.touches.length === 2 && dragStart?.pinchDist) {
      // Pinch zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / dragStart.pinchDist;
      const newScale = Math.max(0.3, Math.min(3, dragStart.startScale * scaleFactor));
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  // Agregar elemento
  const addElement = (el) => {
    const newElements = [...elements, el];
    setElements(newElements);
    saveHistory(newElements);
  };

  // Eliminar elemento seleccionado
  const deleteSelected = () => {
    if (!selectedId) return;
    const newElements = elements.filter(el => el.id !== selectedId);
    setElements(newElements);
    setSelectedId(null);
    saveHistory(newElements);
  };

  // Rotar elemento
  const rotateSelected = (delta) => {
    if (!selectedId) return;
    const newElements = elements.map(el => 
      el.id === selectedId ? { ...el, rotation: ((el.rotation || 0) + delta) % 360 } : el
    );
    setElements(newElements);
    saveHistory(newElements);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  // Zoom
  const handleZoom = (delta) => {
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoom(delta);
  };

  // Limpiar todo
  const clearAll = () => {
    if (window.confirm(t('floorPlan.confirmClear', '¿Estás seguro de que deseas limpiar todo?'))) {
      setElements([]);
      setSelectedId(null);
      saveHistory([]);
    }
  };

  // Guardar proyecto
  const saveProject = () => {
    const data = JSON.stringify({ version: '1.0', elements, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cargar proyecto
  const loadProject = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setElements(data.elements || []);
        saveHistory(data.elements || []);
      } catch (err) {
        alert('Error al cargar el archivo');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Exportar como PNG
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `plano-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Exportar como PDF
  const exportPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    pdf.addImage(dataUrl, 'PNG', 10, 10, 277, 190);
    pdf.save(`plano-${Date.now()}.pdf`);
  };

  // Categorías de muebles
  const categories = [
    { id: 'living', name: 'Sala', icon: Sofa },
    { id: 'bedroom', name: 'Dormitorio', icon: Bed },
    { id: 'dining', name: 'Comedor', icon: Utensils },
    { id: 'kitchen', name: 'Cocina', icon: ChefHat },
    { id: 'bathroom', name: 'Baño', icon: ShowerHead },
    { id: 'exterior', name: 'Exterior', icon: TreeDeciduous },
  ];

  // Herramientas disponibles
  const toolsList = [
    { id: 'select', name: 'Seleccionar', icon: MousePointer2 },
    { id: 'wall', name: 'Pared', icon: Square },
    { id: 'door', name: 'Puerta', icon: DoorOpen },
    { id: 'window', name: 'Ventana', icon: Maximize2 },
    { id: 'room', name: 'Habitación', icon: Home },
    { id: 'furniture', name: 'Muebles', icon: Sofa },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="shadow-xl border-2">
        <CardHeader className="text-center pb-2 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            {t('floorPlan.title', 'Editor de Planos de Casa')}
          </CardTitle>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('floorPlan.subtitle', 'Diseña tu plano arrastrando elementos • Totalmente gratis')}
          </p>
        </CardHeader>
        
        <CardContent className="p-2 sm:p-6">
          {/* Botón para mostrar/ocultar herramientas en móvil */}
          {isMobile && (
            <div className="mb-3">
              <Button 
                onClick={() => setShowMobileTools(!showMobileTools)}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <Sofa size={18} />
                {showMobileTools ? 'Ocultar Herramientas' : 'Mostrar Herramientas'}
              </Button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Panel izquierdo - Herramientas */}
            <div className={`w-full lg:w-56 space-y-3 sm:space-y-4 ${isMobile && !showMobileTools ? 'hidden' : ''}`}>
              {/* Herramientas principales */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h3 className="font-semibold text-xs text-muted-foreground mb-2">HERRAMIENTAS</h3>
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-1.5">
                  {toolsList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTool(t.id);
                        if (t.id !== 'furniture') setSelectedFurniture(null);
                        if (t.id !== 'room') setSelectedRoom(null);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs ${
                        tool === t.id
                          ? 'bg-primary text-primary-foreground shadow'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      <t.icon size={18} />
                      <span className="mt-1">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Habitaciones */}
              {tool === 'room' && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-xs text-muted-foreground mb-2">HABITACIONES</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(ROOM_TEMPLATES).map(([key, room]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedRoom(key)}
                        className={`flex flex-col items-center p-2 rounded-md transition-all text-xs ${
                          selectedRoom === key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        <room.icon size={16} />
                        <span className="mt-1">{room.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Muebles */}
              {tool === 'furniture' && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-xs text-muted-foreground mb-2">MUEBLES</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFurnitureCategory(cat.id)}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          furnitureCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {Object.entries(FURNITURE_CATALOG)
                      .filter(([, f]) => f.category === furnitureCategory)
                      .map(([key, item]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedFurniture(key)}
                          className={`flex flex-col items-center p-1.5 rounded-md transition-all text-xs ${
                            selectedFurniture === key
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted'
                          }`}
                        >
                          <item.icon size={14} />
                          <span className="mt-0.5 text-center leading-tight">{item.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <h3 className="font-semibold text-xs text-muted-foreground mb-2">ACCIONES</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
                    <Undo2 size={14} className="mr-1" /> Deshacer
                  </Button>
                  <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo2 size={14} className="mr-1" /> Rehacer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rotateSelected(-15)} disabled={!selectedId}>
                    <RotateCcw size={14} className="mr-1" /> -15°
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rotateSelected(15)} disabled={!selectedId}>
                    <RotateCw size={14} className="mr-1" /> +15°
                  </Button>
                </div>
                <Button size="sm" variant="destructive" className="w-full" onClick={deleteSelected} disabled={!selectedId}>
                  <Trash2 size={14} className="mr-1" /> Eliminar
                </Button>
                <Button size="sm" variant="outline" className="w-full text-orange-600" onClick={clearAll}>
                  <X size={14} className="mr-1" /> Limpiar todo
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1" ref={containerRef}>
              {/* Barra de herramientas del canvas */}
              <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 p-1.5 sm:p-2 bg-muted/50 rounded-t-lg border border-b-0">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleZoom(-0.1)} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                    <ZoomOut size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium w-10 sm:w-14 text-center">{Math.round(scale * 100)}%</span>
                  <Button size="sm" variant="ghost" onClick={() => handleZoom(0.1)} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                    <ZoomIn size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setScale(isMobile ? 0.6 : 1); setOffset({ x: 0, y: 0 }); }} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                    <Move size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={showGrid ? "default" : "ghost"}
                    onClick={() => setShowGrid(!showGrid)}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    <Grid3X3 size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <label className="cursor-pointer">
                    <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                      <span><Upload size={14} className="sm:w-4 sm:h-4" /></span>
                    </Button>
                    <input type="file" accept=".json" onChange={loadProject} className="hidden" />
                  </label>
                  <Button size="sm" variant="ghost" onClick={saveProject} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                    <Save size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm" onClick={exportPNG}>
                    <FileImage size={14} className="sm:mr-1" />
                    <span className="hidden sm:inline">PNG</span>
                  </Button>
                  <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm" onClick={exportPDF}>
                    <FileText size={14} className="sm:mr-1" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </div>
              </div>

              {/* Canvas de dibujo */}
              <div className="border rounded-b-lg overflow-hidden bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  className={`cursor-${cursorStyle}`}
                  style={{ display: 'block', cursor: cursorStyle, touchAction: 'none' }}
                />
              </div>

              {/* Barra de estado */}
              <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-b-lg text-[10px] sm:text-xs text-muted-foreground mt-1">
                <span className="truncate"><strong>{toolsList.find(t => t.id === tool)?.name}</strong></span>
              </div>
              
              {/* Acciones rápidas móvil */}
              {isMobile && selectedId && (
                <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                  <Button size="sm" variant="outline" onClick={() => rotateSelected(-15)} className="h-9 px-3">
                    <RotateCcw size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rotateSelected(15)} className="h-9 px-3">
                    <RotateCw size={16} />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteSelected} className="h-9 px-3">
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/30 rounded-lg text-sm">
            <h4 className="font-semibold mb-1 text-xs sm:text-sm">📋 {isMobile ? 'Controles táctiles:' : 'Instrucciones:'}</h4>
            <ul className="text-muted-foreground text-[10px] sm:text-xs space-y-0.5">
              {isMobile ? (
                <>
                  <li>• <strong>Tocar:</strong> Selecciona o coloca elementos</li>
                  <li>• <strong>Arrastrar:</strong> Mueve elementos seleccionados</li>
                  <li>• <strong>Pellizcar:</strong> Zoom in/out en el canvas</li>
                  <li>• <strong>Esquinas:</strong> Arrastra para redimensionar</li>
                </>
              ) : (
                <>
                  <li>• <strong>Seleccionar:</strong> Arrastra elementos o el canvas para moverlos</li>
                  <li>• <strong>Pared:</strong> Haz clic y arrastra para dibujar</li>
                  <li>• <strong>Habitación/Muebles:</strong> Selecciona un tipo y haz clic en el canvas</li>
                  <li>• <strong>Zoom:</strong> Usa la rueda del mouse o los botones +/-</li>
                  <li>• <strong>Redimensionar:</strong> Selecciona y arrastra las esquinas</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FloorPlanEditor;
