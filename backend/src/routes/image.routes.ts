import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { generateImageSchema } from '../validators';

const router = Router();

// Autenticado: generar imagen con opciones
router.post('/raffles/:id/image', authMiddleware, validate(generateImageSchema), ImageController.generate);
router.post('/raffles/:id/image/zip', authMiddleware, validate(generateImageSchema), ImageController.generateZip);

// Público: imagen cacheada
router.get('/public/raffles/:slug/image.png', ImageController.getPublic);

export default router;

