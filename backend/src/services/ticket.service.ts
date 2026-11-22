import prisma from '../config/database';
import { UpdateTicketInput, BulkUpdateTicketsInput } from '../validators';
import { sanitize } from '../utils';

export class TicketService {
  /**
   * Obtener todos los tickets de una rifa con filtros opcionales
   */
  static async getByRaffle(
    raffleId: string,
    userId: string,
    filters?: { status?: string; search?: string }
  ) {
    // Verificar propiedad
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    const where: Record<string, unknown> = { raffleId };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      // Intentar buscar por número o por nombre
      const asNumber = parseInt(searchTerm, 10);
      if (!isNaN(asNumber)) {
        where.number = asNumber;
      } else {
        where.buyerName = { contains: searchTerm };
      }
    }

    return prisma.ticket.findMany({
      where,
      orderBy: { number: 'asc' },
    });
  }

  /**
   * Actualizar un ticket individual con optimistic locking
   */
  static async update(ticketId: string, data: UpdateTicketInput, userId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { raffle: { select: { userId: true, id: true, pricePerTicket: true } } },
    });

    if (!ticket) throw new Error('Número no encontrado');
    if (ticket.raffle.userId !== userId) throw new Error('No autorizado');

    // Optimistic locking: verificar versión
    if (ticket.version !== data.version) {
      throw new Error(
        'Conflicto: este número fue modificado por otra persona. Recarga la página e intenta de nuevo.'
      );
    }

    // Si se libera, limpiar datos del comprador
    const updateData: Record<string, unknown> = {
      status: data.status,
      version: { increment: 1 },
    };

    if (data.status === 'AVAILABLE') {
      updateData.buyerName = null;
      updateData.buyerPhone = null;
      updateData.notes = null;
      updateData.amountPaid = null;
      updateData.paymentMethod = null;
      updateData.paymentDate = null;
    } else {
      if (data.buyerName !== undefined) updateData.buyerName = data.buyerName ? sanitize(data.buyerName) : null;
      if (data.buyerPhone !== undefined) updateData.buyerPhone = data.buyerPhone || null;
      if (data.notes !== undefined) updateData.notes = data.notes ? sanitize(data.notes) : null;
      if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod || null;
      if (data.paymentDate !== undefined) {
        updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;
      }

      // Auto-fill amount if paying
      if (data.status === 'PAID' && data.amountPaid === undefined && ticket.amountPaid === null) {
        updateData.amountPaid = ticket.raffle.pricePerTicket;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Intentar actualizar con lock de versión
      const result = await tx.ticket.updateMany({
        where: { id: ticketId, version: data.version },
        data: updateData,
      });

      if (result.count === 0) {
        throw new Error(
          'Conflicto: este número fue modificado. Recarga la página e intenta de nuevo.'
        );
      }

      // Marcar imagen como desactualizada
      await tx.raffle.update({
        where: { id: ticket.raffleId },
        data: { imageStale: true },
      });

      // Registrar auditoría
      await tx.auditLog.create({
        data: {
          userId,
          raffleId: ticket.raffleId,
          action: 'UPDATE',
          entityType: 'TICKET',
          entityId: ticketId,
          before: JSON.stringify({
            number: ticket.number,
            status: ticket.status,
            buyerName: ticket.buyerName,
          }),
          after: JSON.stringify({
            number: ticket.number,
            status: data.status,
            buyerName: data.buyerName,
          }),
        },
      });

      return tx.ticket.findUnique({ where: { id: ticketId } });
    });

    return updated;
  }

  /**
   * Actualización masiva de tickets
   */
  static async bulkUpdate(raffleId: string, data: BulkUpdateTicketsInput, userId: string) {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    const updateData: Record<string, unknown> = {
      status: data.status,
      version: { increment: 1 },
    };

    if (data.status === 'AVAILABLE') {
      updateData.buyerName = null;
      updateData.buyerPhone = null;
      updateData.notes = null;
      updateData.amountPaid = null;
      updateData.paymentMethod = null;
      updateData.paymentDate = null;
    } else {
      if (data.buyerName) updateData.buyerName = sanitize(data.buyerName);
      if (data.buyerPhone) updateData.buyerPhone = data.buyerPhone;
      if (data.notes) updateData.notes = sanitize(data.notes);
      if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
      if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
      if (data.status === 'PAID' && data.amountPaid === undefined) {
        updateData.amountPaid = raffle.pricePerTicket;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.updateMany({
        where: {
          id: { in: data.ticketIds },
          raffleId,
        },
        data: updateData,
      });

      await tx.raffle.update({
        where: { id: raffleId },
        data: { imageStale: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          raffleId,
          action: 'BULK_UPDATE',
          entityType: 'TICKET',
          entityId: raffleId,
          after: JSON.stringify({
            ticketCount: data.ticketIds.length,
            status: data.status,
            buyerName: data.buyerName,
          }),
        },
      });

      return updated;
    });

    return { updatedCount: result.count };
  }

  /**
   * Obtener participantes agrupados por comprador
   */
  static async getParticipants(raffleId: string, userId: string) {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    const tickets = await prisma.ticket.findMany({
      where: {
        raffleId,
        buyerName: { not: null },
      },
      orderBy: { number: 'asc' },
    });

    // Agrupar por buyerName + buyerPhone
    const participantsMap = new Map<
      string,
      {
        name: string;
        phone: string | null;
        tickets: { id: string; number: number; status: string; amountPaid: number | null }[];
        totalToPay: number;
        totalPaid: number;
      }
    >();

    for (const ticket of tickets) {
      const key = `${ticket.buyerName}|${ticket.buyerPhone || ''}`;
      if (!participantsMap.has(key)) {
        participantsMap.set(key, {
          name: ticket.buyerName!,
          phone: ticket.buyerPhone,
          tickets: [],
          totalToPay: 0,
          totalPaid: 0,
        });
      }

      const participant = participantsMap.get(key)!;
      participant.tickets.push({
        id: ticket.id,
        number: ticket.number,
        status: ticket.status,
        amountPaid: ticket.amountPaid,
      });
      participant.totalToPay += raffle.pricePerTicket;
      participant.totalPaid += ticket.amountPaid || 0;
    }

    return Array.from(participantsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Exportar tickets a CSV
   */
  static async exportCsv(raffleId: string, userId: string): Promise<string> {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    const tickets = await prisma.ticket.findMany({
      where: { raffleId },
      orderBy: { number: 'asc' },
    });

    const header = 'Número,Estado,Comprador,Teléfono,Monto Pagado,Método de Pago,Notas\n';
    const rows = tickets.map((t) => {
      const cols = [
        t.number,
        t.status,
        `"${(t.buyerName || '').replace(/"/g, '""')}"`,
        `"${(t.buyerPhone || '').replace(/"/g, '""')}"`,
        t.amountPaid || '',
        `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
      return cols.join(',');
    });

    return header + rows.join('\n');
  }

  /**
   * Importar tickets desde CSV
   */
  static async importCsv(raffleId: string, csvContent: string, userId: string) {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV vacío o sin datos');

    // Saltar header
    const dataLines = lines.slice(1);
    let updated = 0;
    let errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const line of dataLines) {
        try {
          // Parse CSV simple (no maneja comas dentro de comillas anidadas, pero suficiente para el caso de uso)
          const cols = line.match(/(".*?"|[^,]*),?/g)?.map((c) =>
            c.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/,$/, '').trim()
          ) || [];

          const number = parseInt(cols[0], 10);
          if (isNaN(number)) continue;

          const status = cols[1] || 'AVAILABLE';
          if (!['AVAILABLE', 'RESERVED', 'PAID'].includes(status)) continue;

          const updateData: Record<string, unknown> = {
            status,
            buyerName: cols[2] || null,
            buyerPhone: cols[3] || null,
            amountPaid: cols[4] ? parseFloat(cols[4]) : null,
            paymentMethod: cols[5] || null,
            notes: cols[6] || null,
            version: { increment: 1 },
          };

          await tx.ticket.updateMany({
            where: { raffleId, number },
            data: updateData,
          });
          updated++;
        } catch (e) {
          errors.push(`Error en línea: ${line}`);
        }
      }

      await tx.raffle.update({
        where: { id: raffleId },
        data: { imageStale: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          raffleId,
          action: 'IMPORT',
          entityType: 'TICKET',
          entityId: raffleId,
          after: JSON.stringify({ updatedCount: updated, errorCount: errors.length }),
        },
      });
    });

    return { updated, errors };
  }
}

