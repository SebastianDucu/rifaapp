import type { TicketStatus } from '@/types';

/**
 * Formatea un número con ceros a la izquierda
 */
export function padNumber(num: number, total: number, zeroPad: boolean): string {
  if (!zeroPad) return num.toString();
  const digits = total.toString().length;
  return num.toString().padStart(digits, '0');
}

/**
 * Formatea un precio en moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Colores y estilos profesionales para celdas del tablero
 */
export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/25 dark:border-emerald-800/80 dark:text-emerald-300 dark:hover:bg-emerald-950/40';
    case 'RESERVED':
      return 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950/25 dark:border-amber-800/80 dark:text-amber-300 dark:hover:bg-amber-950/40';
    case 'PAID':
      return 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-950/25 dark:border-rose-800/80 dark:text-rose-300 dark:hover:bg-rose-950/40';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200';
  }
}

/**
 * Color de badge para estado de ticket
 */
export function getStatusBadgeColor(status: TicketStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
    case 'RESERVED':
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
    case 'PAID':
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300';
  }
}

/**
 * Label de estado en español
 */
export function getStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'RESERVED':
      return 'Apartado';
    case 'PAID':
      return 'Pagado';
    default:
      return status;
  }
}

/**
 * Genera mensaje formal de WhatsApp para un comprador (sin emojis)
 */
export function generateWhatsAppMessage(
  buyerName: string,
  numbers: number[],
  total: number,
  raffleName: string,
  zeroPad: boolean,
  totalTickets: number
): string {
  const numList = numbers.map((n) => padNumber(n, totalTickets, zeroPad)).join(', ');
  return `Estimado/a ${buyerName}, confirmamos sus números para la rifa "${raffleName}": ${numList}. Total a liquidar: ${formatCurrency(total)}. Agradecemos su participación.`;
}

/**
 * Abre WhatsApp con un mensaje
 */
export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Descarga un blob como archivo
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Comparte usando Web Share API (móvil)
 */
export async function shareImage(blob: Blob, title: string): Promise<boolean> {
  if (!navigator.share) return false;

  try {
    const file = new File([blob], 'tablero.png', { type: 'image/png' });
    await navigator.share({
      title,
      files: [file],
    });
    return true;
  } catch {
    return false;
  }
}
