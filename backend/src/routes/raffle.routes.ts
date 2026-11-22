import { Router } from 'express';
import { RaffleController } from '../controllers/raffle.controller';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createRaffleSchema, updateRaffleSchema, drawSchema } from '../validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', RaffleController.list);
router.post('/', validate(createRaffleSchema), RaffleController.create);
router.get('/:id', RaffleController.getById);
router.put('/:id', validate(updateRaffleSchema), RaffleController.update);
router.post('/:id/duplicate', RaffleController.duplicate);
router.patch('/:id/archive', RaffleController.archive);
router.delete('/:id', RaffleController.delete);
router.post('/:id/draw', validate(drawSchema), RaffleController.draw);
router.get('/:id/audit-log', RaffleController.getAuditLog);

export default router;

