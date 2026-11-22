import { Response, NextFunction } from 'express';
import { RaffleService } from '../services/raffle.service';
import { AuthRequest } from '../middlewares/auth';

export class RaffleController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffles = await RaffleService.list(req.userId!);
      res.json({ raffles });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.getById(req.params.id, req.userId!);
      res.json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.create(req.body, req.userId!);
      res.status(201).json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.update(req.params.id, req.body, req.userId!);
      res.json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.duplicate(req.params.id, req.userId!);
      res.status(201).json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.archive(req.params.id, req.userId!);
      res.json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RaffleService.delete(req.params.id, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async draw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { method, manualTicketNumber } = req.body;
      const raffle = await RaffleService.draw(req.params.id, req.userId!, method, manualTicketNumber);
      res.json({ raffle });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await RaffleService.getAuditLog(req.params.id, req.userId!);
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  static async getPublic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raffle = await RaffleService.getPublic(req.params.slug);
      res.json({ raffle });
    } catch (error) {
      next(error);
    }
  }
}

