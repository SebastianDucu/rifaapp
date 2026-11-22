// ============================================
// Tipos compartidos del frontend
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type RaffleStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED';
export type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'PAID';
export type TemplateType = 'default' | 'compact' | 'modern';

export interface RaffleStats {
  available: number;
  reserved: number;
  paid: number;
  total: number;
  collected: number;
  pendingReserved: number;
  totalExpected: number;
}

export interface Raffle {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  prize: string;
  prizeImageUrl: string | null;
  drawDate: string | null;
  pricePerTicket: number;
  totalTickets: number;
  startNumber: number;
  zeroPad: boolean;
  lotteryMethod: string;
  paymentInfo: string;
  contactInfo: string;
  contactPhone: string;
  primaryColor: string;
  logoUrl: string | null;
  template: TemplateType;
  status: RaffleStatus;
  winnerTicketNum: number | null;
  winnerName: string | null;
  imageStale: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: RaffleStats;
}

export interface Ticket {
  id: string;
  raffleId: string;
  number: number;
  status: TicketStatus;
  buyerName: string | null;
  buyerPhone: string | null;
  notes: string | null;
  amountPaid: number | null;
  paymentMethod: string | null;
  paymentDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  name: string;
  phone: string | null;
  tickets: {
    id: string;
    number: number;
    status: string;
    amountPaid: number | null;
  }[];
  totalToPay: number;
  totalPaid: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  raffleId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: string | null;
  after: string | null;
  createdAt: string;
}

export interface ImageOptions {
  showNames: boolean;
  showOnlyAvailable: boolean;
  size: 'square' | 'story' | 'a4';
  theme: 'light' | 'dark';
}

export interface CreateRaffleData {
  name: string;
  description?: string;
  prize: string;
  prizeImageUrl?: string | null;
  drawDate?: string | null;
  pricePerTicket: number;
  totalTickets: number;
  startNumber?: number;
  zeroPad?: boolean;
  lotteryMethod?: string;
  paymentInfo?: string;
  contactInfo?: string;
  contactPhone?: string;
  primaryColor?: string;
  logoUrl?: string | null;
  template?: TemplateType;
  status?: RaffleStatus;
}

export interface UpdateTicketData {
  status: TicketStatus;
  buyerName?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  amountPaid?: number | null;
  paymentMethod?: string | null;
  paymentDate?: string | null;
  version: number;
}

export interface BulkUpdateData {
  ticketIds: string[];
  status: TicketStatus;
  buyerName?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  amountPaid?: number | null;
  paymentMethod?: string | null;
}

