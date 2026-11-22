import prisma from '../config/database';
import { CreateRaffleInput, UpdateRaffleInput } from '../validators';
import { generateSlug, shortId, sanitizeObject } from '../utils';

export class RaffleService {
  /**
   * Listar rifas del usuario autenticado
   */
  static async list(userId: string) {
    const raffles = await prisma.raffle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    // Agregar stats a cada rifa
    const rafflesWithStats = await Promise.all(
      raffles.map(async (raffle) => {
        const stats = await RaffleService.getStats(raffle.id);
        return { ...raffle, stats };
      })
    );

    return rafflesWithStats;
  }

  /**
   * Obtener una rifa por ID (verificando propiedad)
   */
  static async getById(raffleId: string, userId: string) {
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
    });

    if (!raffle) {
      throw new Error('Rifa no encontrada');
    }

    if (raffle.userId !== userId) {
      throw new Error('No autorizado para ver esta rifa');
    }

    const stats = await RaffleService.getStats(raffleId);
    return { ...raffle, stats };
  }

  /**
   * Crear una nueva rifa con todos sus tickets
   */
  static async create(data: CreateRaffleInput, userId: string) {
    const sanitized = sanitizeObject(data as Record<string, unknown>) as CreateRaffleInput;

    // Generar slug único
    let slug = generateSlug(sanitized.name);
    const existingSlug = await prisma.raffle.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${shortId()}`;
    }

    // Crear rifa y tickets en una transacción
    const raffle = await prisma.$transaction(async (tx) => {
      const newRaffle = await tx.raffle.create({
        data: {
          userId,
          name: sanitized.name,
          slug,
          description: sanitized.description || '',
          prize: sanitized.prize,
          prizeImageUrl: sanitized.prizeImageUrl || null,
          drawDate: sanitized.drawDate ? new Date(sanitized.drawDate) : null,
          pricePerTicket: sanitized.pricePerTicket,
          totalTickets: sanitized.totalTickets,
          startNumber: sanitized.startNumber,
          zeroPad: sanitized.zeroPad,
          lotteryMethod: sanitized.lotteryMethod || 'random',
          paymentInfo: sanitized.paymentInfo || '',
          contactInfo: sanitized.contactInfo || '',
          contactPhone: sanitized.contactPhone || '',
          primaryColor: sanitized.primaryColor || '#3b82f6',
          logoUrl: sanitized.logoUrl || null,
          template: sanitized.template || 'default',
          status: sanitized.status || 'DRAFT',
        },
      });

      // Crear tickets en batch
      const tickets = [];
      for (let i = 0; i < sanitized.totalTickets; i++) {
        tickets.push({
          raffleId: newRaffle.id,
          number: sanitized.startNumber + i,
          status: 'AVAILABLE',
        });
      }

      // SQLite no soporta createMany con skipDuplicates, usamos loop
      const BATCH_SIZE = 100;
      for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
        const batch = tickets.slice(i, i + BATCH_SIZE);
        await tx.ticket.createMany({ data: batch });
      }

      // Registrar auditoría
      await tx.auditLog.create({
        data: {
          userId,
          raffleId: newRaffle.id,
          action: 'CREATE',
          entityType: 'RAFFLE',
          entityId: newRaffle.id,
          after: JSON.stringify({ name: newRaffle.name, totalTickets: sanitized.totalTickets }),
        },
      });

      return newRaffle;
    });

    return raffle;
  }

  /**
   * Actualizar una rifa
   */
  static async update(raffleId: string, data: UpdateRaffleInput, userId: string) {
    const existing = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!existing) throw new Error('Rifa no encontrada');
    if (existing.userId !== userId) throw new Error('No autorizado para editar esta rifa');

    const sanitized = sanitizeObject(data as Record<string, unknown>) as UpdateRaffleInput;

    // Si cambió el nombre, actualizar slug
    let slug = existing.slug;
    if (sanitized.name && sanitized.name !== existing.name) {
      slug = generateSlug(sanitized.name);
      const existingSlug = await prisma.raffle.findUnique({ where: { slug } });
      if (existingSlug && existingSlug.id !== raffleId) {
        slug = `${slug}-${shortId()}`;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const { drawDate, description, ...rest } = sanitized;
      const updateData: Record<string, any> = {
        ...rest,
        slug,
        imageStale: true,
      };

      if (description !== undefined) {
        updateData.description = description || '';
      }

      if (drawDate !== undefined) {
        updateData.drawDate = drawDate ? new Date(drawDate) : null;
      }

      const raffle = await tx.raffle.update({
        where: { id: raffleId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId,
          raffleId,
          action: 'UPDATE',
          entityType: 'RAFFLE',
          entityId: raffleId,
          before: JSON.stringify(existing),
          after: JSON.stringify(raffle),
        },
      });

      return raffle;
    });

    return updated;
  }

  /**
   * Duplicar una rifa (copia sin datos de compradores)
   */
  static async duplicate(raffleId: string, userId: string) {
    const original = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!original) throw new Error('Rifa no encontrada');
    if (original.userId !== userId) throw new Error('No autorizado');

    const newName = `${original.name} (copia)`;
    return RaffleService.create(
      {
        name: newName,
        description: original.description,
        prize: original.prize,
        prizeImageUrl: original.prizeImageUrl,
        drawDate: original.drawDate?.toISOString() || null,
        pricePerTicket: original.pricePerTicket,
        totalTickets: original.totalTickets,
        startNumber: original.startNumber,
        zeroPad: original.zeroPad,
        lotteryMethod: original.lotteryMethod,
        paymentInfo: original.paymentInfo,
        contactInfo: original.contactInfo,
        contactPhone: original.contactPhone,
        primaryColor: original.primaryColor,
        logoUrl: original.logoUrl,
        template: original.template as 'default' | 'compact' | 'modern',
        status: 'DRAFT',
      },
      userId
    );
  }

  /**
   * Archivar/finalizar una rifa
   */
  static async archive(raffleId: string, userId: string) {
    const existing = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!existing) throw new Error('Rifa no encontrada');
    if (existing.userId !== userId) throw new Error('No autorizado');

    return prisma.raffle.update({
      where: { id: raffleId },
      data: { status: 'FINISHED' },
    });
  }

  /**
   * Eliminar una rifa (cascade elimina tickets y logs)
   */
  static async delete(raffleId: string, userId: string) {
    const existing = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!existing) throw new Error('Rifa no encontrada');
    if (existing.userId !== userId) throw new Error('No autorizado');

    await prisma.raffle.delete({ where: { id: raffleId } });
    return { message: 'Rifa eliminada correctamente' };
  }

  /**
   * Obtener datos públicos de una rifa por slug
   */
  static async getPublic(slug: string) {
    const raffle = await prisma.raffle.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        prize: true,
        prizeImageUrl: true,
        drawDate: true,
        pricePerTicket: true,
        totalTickets: true,
        startNumber: true,
        zeroPad: true,
        lotteryMethod: true,
        paymentInfo: true,
        contactInfo: true,
        contactPhone: false, // Nunca exponer teléfono del organizador públicamente
        primaryColor: true,
        logoUrl: true,
        template: true,
        status: true,
        winnerTicketNum: true,
        winnerName: true,
        tickets: {
          select: {
            id: true,
            number: true,
            status: true,
            buyerName: true,
            // NO incluir buyerPhone ni notes en público
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!raffle) {
      throw new Error('Rifa no encontrada');
    }

    if (raffle.status === 'DRAFT') {
      throw new Error('Esta rifa aún no está publicada');
    }

    const stats = await RaffleService.getStats(raffle.id);
    return { ...raffle, stats };
  }

  /**
   * Sorteo de un ganador
   */
  static async draw(raffleId: string, userId: string, method: 'random' | 'manual', manualTicketNumber?: number) {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');
    if (raffle.winnerTicketNum !== null) throw new Error('Esta rifa ya tiene un ganador');

    let winnerTicket;

    if (method === 'manual') {
      if (manualTicketNumber === undefined) throw new Error('Debes indicar el número ganador');
      winnerTicket = await prisma.ticket.findFirst({
        where: { raffleId, number: manualTicketNumber, status: 'PAID' },
      });
      if (!winnerTicket) throw new Error('El número indicado no está pagado');
    } else {
      // Selección aleatoria entre pagados
      const paidTickets = await prisma.ticket.findMany({
        where: { raffleId, status: 'PAID' },
      });
      if (paidTickets.length === 0) throw new Error('No hay números pagados para sortear');

      const randomIndex = Math.floor(Math.random() * paidTickets.length);
      winnerTicket = paidTickets[randomIndex];
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRaffle = await tx.raffle.update({
        where: { id: raffleId },
        data: {
          winnerTicketNum: winnerTicket!.number,
          winnerName: winnerTicket!.buyerName,
          status: 'FINISHED',
          imageStale: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          raffleId,
          action: 'DRAW',
          entityType: 'RAFFLE',
          entityId: raffleId,
          after: JSON.stringify({
            winnerTicketNum: winnerTicket!.number,
            winnerName: winnerTicket!.buyerName,
          }),
        },
      });

      return updatedRaffle;
    });

    return updated;
  }

  /**
   * Obtener estadísticas de una rifa
   */
  static async getStats(raffleId: string) {
    const [available, reserved, paid, totalPaidAmount] = await Promise.all([
      prisma.ticket.count({ where: { raffleId, status: 'AVAILABLE' } }),
      prisma.ticket.count({ where: { raffleId, status: 'RESERVED' } }),
      prisma.ticket.count({ where: { raffleId, status: 'PAID' } }),
      prisma.ticket.aggregate({
        where: { raffleId, status: 'PAID' },
        _sum: { amountPaid: true },
      }),
    ]);

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { pricePerTicket: true, totalTickets: true },
    });

    const collected = totalPaidAmount._sum.amountPaid || 0;
    const pendingReserved = reserved * (raffle?.pricePerTicket || 0);
    const totalExpected = (raffle?.totalTickets || 0) * (raffle?.pricePerTicket || 0);

    return {
      available,
      reserved,
      paid,
      total: available + reserved + paid,
      collected,
      pendingReserved,
      totalExpected,
    };
  }

  /**
   * Obtener historial de auditoría
   */
  static async getAuditLog(raffleId: string, userId: string) {
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new Error('Rifa no encontrada');
    if (raffle.userId !== userId) throw new Error('No autorizado');

    return prisma.auditLog.findMany({
      where: { raffleId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}

