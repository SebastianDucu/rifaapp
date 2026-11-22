import { Router } from 'express';
import { RaffleController } from '../controllers/raffle.controller';

const router = Router();

// Vista pública de rifa (no requiere autenticación)
router.get('/raffles/:slug', RaffleController.getPublic);

export default router;

