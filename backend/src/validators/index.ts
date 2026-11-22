import { z } from 'zod';

// ============================================
// Auth Validators
// ============================================

export const registerSchema = z.object({
  email: z.string().min(3, 'El identificador o email es requerido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'El usuario o correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// ============================================
// Raffle Validators
// ============================================

export const createRaffleSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(2000).optional().nullable().default(''),
  prize: z.string().min(1, 'El premio es requerido').max(500),
  prizeImageUrl: z.string().optional().nullable(),
  drawDate: z.string().optional().nullable(),
  pricePerTicket: z.coerce.number().positive('El precio por boleto debe ser mayor a 0'),
  totalTickets: z.coerce.number().int().min(1, 'Mínimo 1 número').max(10000, 'Máximo 10,000 números'),
  startNumber: z.coerce.number().int().min(0).default(0),
  zeroPad: z.boolean().default(true),
  lotteryMethod: z.string().max(200).optional().nullable().default(''),
  paymentInfo: z.string().max(2000).optional().nullable().default(''),
  contactInfo: z.string().max(500).optional().nullable().default(''),
  contactPhone: z.string().max(50).optional().nullable().default(''),
  primaryColor: z.string().optional().nullable().default('#3b82f6'),
  logoUrl: z.string().optional().nullable(),
  template: z.enum(['default', 'compact', 'modern']).default('default'),
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']).default('DRAFT'),
});

export const updateRaffleSchema = createRaffleSchema.partial();

// ============================================
// Ticket Validators
// ============================================

export const updateTicketSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'PAID']),
  buyerName: z.string().max(200).optional().nullable(),
  buyerPhone: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  amountPaid: z.coerce.number().min(0).optional().nullable(),
  paymentMethod: z.string().max(100).optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  version: z.number().int(), // Required for optimistic locking
});

export const bulkUpdateTicketsSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Selecciona al menos un número'),
  status: z.enum(['AVAILABLE', 'RESERVED', 'PAID']),
  buyerName: z.string().max(200).optional().nullable(),
  buyerPhone: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  amountPaid: z.coerce.number().min(0).optional().nullable(),
  paymentMethod: z.string().max(100).optional().nullable(),
});

// ============================================
// Image Generation Validators
// ============================================

export const generateImageSchema = z.object({
  showNames: z.boolean().default(false),
  showOnlyAvailable: z.boolean().default(false),
  size: z.enum(['square', 'story', 'a4']).default('square'),
  theme: z.enum(['light', 'dark']).default('light'),
});

// ============================================
// Draw Validator
// ============================================

export const drawSchema = z.object({
  method: z.enum(['random', 'manual']).default('random'),
  manualTicketNumber: z.coerce.number().int().optional(),
});

// ============================================
// Type exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRaffleInput = z.infer<typeof createRaffleSchema>;
export type UpdateRaffleInput = z.infer<typeof updateRaffleSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type BulkUpdateTicketsInput = z.infer<typeof bulkUpdateTicketsSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type DrawInput = z.infer<typeof drawSchema>;
