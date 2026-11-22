import { createCanvas, loadImage } from '@napi-rs/canvas';
import prisma from '../config/database';
import { GenerateImageInput } from '../validators';
import { padNumber } from '../utils';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

interface ImageSize {
  width: number;
  height: number;
  label: string;
}

const SIZES: Record<string, ImageSize> = {
  square: { width: 1080, height: 1080, label: 'Cuadrado 1080×1080' },
  story: { width: 1080, height: 1920, label: 'Historia 1080×1920' },
  a4: { width: 2480, height: 3508, label: 'A4' },
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Función auxiliar para dibujar rectángulos con bordes redondeados
function roundRect(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export class ImageService {
  /**
   * Genera la imagen del tablero de una rifa
   */
  static async generate(
    raffleId: string,
    userId: string,
    options: GenerateImageInput
  ): Promise<Buffer> {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    let tickets = await prisma.ticket.findMany({
      where: { raffleId },
      orderBy: { number: 'asc' },
    });

    if (options.showOnlyAvailable) {
      tickets = tickets.filter((t) => t.status === 'AVAILABLE');
    }

    const size = SIZES[options.size] || SIZES.square;
    return ImageService.renderPoster(raffle, tickets, size, options);
  }

  /**
   * Genera la imagen pública cacheada
   */
  static async generatePublic(slug: string): Promise<Buffer> {
    const raffle = await prisma.raffle.findUnique({ where: { slug } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.status === 'DRAFT') throw new Error('Rifa no publicada');

    const cachePath = path.join(config.cacheDir, `${slug}.png`);
    if (!raffle.imageStale && fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath);
    }

    const tickets = await prisma.ticket.findMany({
      where: { raffleId: raffle.id },
      orderBy: { number: 'asc' },
    });

    const options: GenerateImageInput = {
      showNames: false,
      showOnlyAvailable: false,
      size: 'square',
      theme: 'dark', // Estilo dark póster premium por defecto
    };

    const buffer = await ImageService.renderPoster(raffle, tickets, SIZES.square, options);

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, buffer);

    await prisma.raffle.update({
      where: { id: raffle.id },
      data: { imageStale: false },
    });

    return buffer;
  }

  /**
   * Renderizado de Póster Profesional de Alta Definición
   */
  private static async renderPoster(
    raffle: {
      name: string;
      prize: string;
      pricePerTicket: number;
      totalTickets: number;
      zeroPad: boolean;
      drawDate: Date | null;
      lotteryMethod: string;
      contactInfo: string;
      contactPhone: string;
      paymentInfo: string;
      prizeImageUrl: string | null;
      primaryColor: string;
    },
    tickets: Array<{
      number: number;
      status: string;
      buyerName: string | null;
    }>,
    size: ImageSize,
    options: GenerateImageInput
  ): Promise<Buffer> {
    const width = 1080;
    const isDark = options.theme !== 'light';

    // Paleta de colores refinada estilo póster
    const theme = isDark
      ? {
          bgTop: '#090d16',
          bgBottom: '#0f172a',
          cardBg: '#1e293b',
          cardBorder: '#334155',
          textPrimary: '#ffffff',
          textSecondary: '#94a3b8',
          textAccent: '#60a5fa',
          gridBg: '#0f172a',
          gridBorder: '#1e293b',
          cellAvailBg: '#064e3b',
          cellAvailBorder: '#059669',
          cellAvailText: '#a7f3d0',
          cellResBg: '#78350f',
          cellResBorder: '#d97706',
          cellResText: '#fde68a',
          cellPaidBg: '#881337',
          cellPaidBorder: '#e11d48',
          cellPaidText: '#fecdd3',
        }
      : {
          bgTop: '#f8fafc',
          bgBottom: '#f1f5f9',
          cardBg: '#ffffff',
          cardBorder: '#e2e8f0',
          textPrimary: '#0f172a',
          textSecondary: '#64748b',
          textAccent: '#2563eb',
          gridBg: '#ffffff',
          gridBorder: '#cbd5e1',
          cellAvailBg: '#ecfdf5',
          cellAvailBorder: '#86efac',
          cellAvailText: '#065f46',
          cellResBg: '#fffbeb',
          cellResBorder: '#fde68a',
          cellResText: '#92400e',
          cellPaidBg: '#fff1f2',
          cellPaidBorder: '#fecdd3',
          cellPaidText: '#9f1239',
        };

    // Calcular cuadrícula
    const count = tickets.length;
    let cols = 10;
    if (count <= 50) cols = 10;
    else if (count <= 100) cols = 10;
    else if (count <= 200) cols = 10;
    else cols = 15;

    const rows = Math.ceil(count / cols);
    const PADDING = 48;
    const gridAvailableWidth = width - PADDING * 2 - 32; // margen interior del contenedor
    const cellGap = 6;
    const cellSize = Math.floor((gridAvailableWidth - (cols - 1) * cellGap) / cols);
    const gridHeight = rows * cellSize + (rows - 1) * cellGap + 32;

    // Calcular altura total
    const HEADER_HEIGHT = raffle.prizeImageUrl ? 380 : 310;
    const LEGEND_HEIGHT = 65;
    const FOOTER_HEIGHT = 160;
    const totalHeight = HEADER_HEIGHT + gridHeight + LEGEND_HEIGHT + FOOTER_HEIGHT;

    const canvas = createCanvas(width, totalHeight);
    const ctx = canvas.getContext('2d');

    // 1. Fondo degradado del póster
    const bgGrad = ctx.createLinearGradient(0, 0, width, totalHeight);
    bgGrad.addColorStop(0, theme.bgTop);
    bgGrad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, totalHeight);

    // Marco exterior sutil decorativo
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, 16, 16, width - 32, totalHeight - 32, 24, false, true);

    // ==================== ENCABEZADO / HERO ====================
    let cursorY = 48;

    // Badge superior "TABLERO OFICIAL"
    ctx.fillStyle = isDark ? '#1e293b' : '#e0e7ff';
    roundRect(ctx, width / 2 - 120, cursorY, 240, 32, 16, true, false);
    ctx.fillStyle = isDark ? '#60a5fa' : '#3730a3';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SORTEO OFICIAL', width / 2, cursorY + 16);
    cursorY += 54;

    // Título de la Rifa
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(raffle.name.toUpperCase(), width / 2, cursorY);
    cursorY += 38;

    // Cargar y dibujar foto del premio si existe
    let prizeImageLoaded = false;
    if (raffle.prizeImageUrl) {
      try {
        let imageSource = raffle.prizeImageUrl;
        if (imageSource.startsWith('/uploads/')) {
          const localPath = path.resolve(config.uploadDir, path.basename(imageSource));
          if (fs.existsSync(localPath)) {
            imageSource = localPath;
          }
        }
        const img = await loadImage(imageSource);
        const imgSize = 100;
        const imgX = PADDING;
        const imgY = cursorY + 6;

        ctx.save();
        roundRect(ctx, imgX, imgY, imgSize, imgSize, 14, false, false);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();

        // Borde fino a la foto
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        roundRect(ctx, imgX, imgY, imgSize, imgSize, 14, false, true);
        prizeImageLoaded = true;
      } catch (e) {
        // Fallback si no carga la imagen
      }
    }

    // Tarjeta del Premio Destacada
    const prizeCardX = prizeImageLoaded ? PADDING + 116 : PADDING;
    const prizeCardW = prizeImageLoaded ? width - PADDING * 2 - 116 : width - PADDING * 2;
    const prizeCardH = 92;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, prizeCardX, cursorY + 10, prizeCardW, prizeCardH, 14, true, true);

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PREMIO MAYOR', prizeCardX + 20, cursorY + 36);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(raffle.prize, prizeCardX + 20, cursorY + 68);

    cursorY += 120;

    // Fila con 2 tarjetas de información rápida (Precio y Sorteo)
    const cardW = (width - PADDING * 2 - 16) / 2;

    // Tarjeta 1: Precio por boleto
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    roundRect(ctx, PADDING, cursorY, cardW, 60, 12, true, true);
    ctx.fillStyle = theme.textSecondary;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VALOR POR BOLETO', PADDING + 16, cursorY + 22);
    ctx.fillStyle = '#10b981'; // Verde llamativo
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(formatMoney(raffle.pricePerTicket), PADDING + 16, cursorY + 44);

    // Tarjeta 2: Fecha de sorteo o Lotería
    roundRect(ctx, PADDING + cardW + 16, cursorY, cardW, 60, 12, true, true);
    ctx.fillStyle = theme.textSecondary;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(raffle.lotteryMethod ? 'JUEGA CON / MÉTODO' : 'FECHA DE SORTEO', PADDING + cardW + 32, cursorY + 22);
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 16px sans-serif';

    let dateOrMethodText = 'Por definir';
    if (raffle.drawDate) {
      dateOrMethodText = new Date(raffle.drawDate).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } else if (raffle.lotteryMethod) {
      dateOrMethodText = raffle.lotteryMethod;
    }
    ctx.fillText(dateOrMethodText, PADDING + cardW + 32, cursorY + 44);

    cursorY += 80;

    // ==================== CONTENEDOR DEL TABLERO ====================
    const containerX = PADDING;
    const containerW = width - PADDING * 2;

    ctx.fillStyle = theme.gridBg;
    ctx.strokeStyle = theme.gridBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, containerX, cursorY, containerW, gridHeight, 18, true, true);

    const startX = containerX + 16;
    const startY = cursorY + 16;

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellSize + cellGap);
      const y = startY + row * (cellSize + cellGap);

      let cellBg = theme.cellAvailBg;
      let cellBorder = theme.cellAvailBorder;
      let cellText = theme.cellAvailText;

      if (t.status === 'RESERVED') {
        cellBg = theme.cellResBg;
        cellBorder = theme.cellResBorder;
        cellText = theme.cellResText;
      } else if (t.status === 'PAID') {
        cellBg = theme.cellPaidBg;
        cellBorder = theme.cellPaidBorder;
        cellText = theme.cellPaidText;
      }

      ctx.fillStyle = cellBg;
      ctx.strokeStyle = cellBorder;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, cellSize, cellSize, 8, true, true);

      // Número
      ctx.fillStyle = cellText;
      const fontSize = Math.max(12, Math.min(cellSize * 0.38, 22));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const numStr = padNumber(t.number, raffle.totalTickets, raffle.zeroPad);

      if (options.showNames && t.buyerName) {
        ctx.fillText(numStr, x + cellSize / 2, y + cellSize * 0.35);
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = `bold ${Math.max(9, fontSize * 0.55)}px sans-serif`;
        let name = t.buyerName.split(' ')[0]; // Solo primer nombre para legibilidad
        ctx.fillText(name, x + cellSize / 2, y + cellSize * 0.72);
      } else {
        ctx.fillText(numStr, x + cellSize / 2, y + cellSize / 2);
      }
    }

    cursorY += gridHeight + 20;

    // ==================== LEYENDA TIPO PASTILLAS ====================
    const legends = [
      { bg: theme.cellAvailBg, border: theme.cellAvailBorder, text: theme.cellAvailText, label: 'DISPONIBLE' },
      { bg: theme.cellResBg, border: theme.cellResBorder, text: theme.cellResText, label: 'APARTADO' },
      { bg: theme.cellPaidBg, border: theme.cellPaidBorder, text: theme.cellPaidText, label: 'PAGADO' },
    ];

    const pillW = 160;
    const pillH = 36;
    const pillSpacing = 18;
    const totalPillsW = legends.length * pillW + (legends.length - 1) * pillSpacing;
    let pillStartX = (width - totalPillsW) / 2;

    legends.forEach((leg) => {
      ctx.fillStyle = leg.bg;
      ctx.strokeStyle = leg.border;
      ctx.lineWidth = 1.5;
      roundRect(ctx, pillStartX, cursorY, pillW, pillH, 18, true, true);

      // Círculo de estado
      ctx.fillStyle = leg.border;
      ctx.beginPath();
      ctx.arc(pillStartX + 22, cursorY + pillH / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = leg.text;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(leg.label, pillStartX + 36, cursorY + pillH / 2);

      pillStartX += pillW + pillSpacing;
    });

    cursorY += pillH + 24;

    // ==================== PIE / CONTACTO Y PAGO ====================
    const footerW = width - PADDING * 2;
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, PADDING, cursorY, footerW, 95, 14, true, true);

    const contactStr = raffle.contactPhone
      ? `${raffle.contactInfo ? raffle.contactInfo + ' · ' : ''}WhatsApp: ${raffle.contactPhone}`
      : raffle.contactInfo || 'Comunícate con el organizador para apartar';

    ctx.fillStyle = theme.textAccent;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESERVAS Y CONTACTO', PADDING + 20, cursorY + 22);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(contactStr, PADDING + 20, cursorY + 42);

    if (raffle.paymentInfo) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '12px sans-serif';
      const cleanPay = raffle.paymentInfo.length > 70 ? raffle.paymentInfo.substring(0, 68) + '...' : raffle.paymentInfo;
      ctx.fillText(`Pago: ${cleanPay}`, PADDING + 20, cursorY + 70);
    }

    // Timestamp al fondo
    const nowStr = new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Tablero generado en vivo · Actualizado: ${nowStr}`, width / 2, totalHeight - 20);

    return Buffer.from(canvas.toBuffer('image/png'));
  }

  /**
   * Generar multi-page o array
   */
  static async generateAllPages(
    raffleId: string,
    userId: string,
    options: GenerateImageInput
  ): Promise<Buffer[]> {
    const single = await ImageService.generate(raffleId, userId, options);
    return [single];
  }
}
