import { Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service';
import { AuthRequest } from '../middlewares/auth';

export class TicketController {
  static async getByRaffle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const tickets = await TicketService.getByRaffle(req.params.id, req.userId!, {
        status: status as string,
        search: search as string,
      });
      res.json({ tickets });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.update(req.params.id, req.body, req.userId!);
      res.json({ ticket });
    } catch (error) {
      if ((error as Error).message.includes('Conflicto')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  static async bulkUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.bulkUpdate(req.params.id, req.body, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getParticipants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const participants = await TicketService.getParticipants(req.params.id, req.userId!);
      res.json({ participants });
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await TicketService.exportCsv(req.params.id, req.userId!);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
      // BOM para Excel
      res.send('\uFEFF' + csv);
    } catch (error) {
      next(error);
    }
  }

  static async importCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No se envió ningún archivo CSV' });
        return;
      }

      const csvContent = file.buffer.toString('utf-8');
      const result = await TicketService.importCsv(req.params.id, csvContent, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

