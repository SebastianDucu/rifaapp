import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateTicketSchema, bulkUpdateTicketsSchema } from '../validators';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// Rutas protegidas para tickets y participantes
router.get('/raffles/:id/tickets', authMiddleware, TicketController.getByRaffle);
router.patch('/tickets/:id', authMiddleware, validate(updateTicketSchema), TicketController.update);
router.patch('/raffles/:id/tickets/bulk', authMiddleware, validate(bulkUpdateTicketsSchema), TicketController.bulkUpdate);

// Participantes
router.get('/raffles/:id/participants', authMiddleware, TicketController.getParticipants);

// Export/Import CSV
router.get('/raffles/:id/export.csv', authMiddleware, TicketController.exportCsv);
router.post('/raffles/:id/import', authMiddleware, upload.single('file'), TicketController.importCsv);

export default router;

