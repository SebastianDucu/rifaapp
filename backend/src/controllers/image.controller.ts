import { Response, NextFunction } from 'express';
import { ImageService } from '../services/image.service';
import { AuthRequest } from '../middlewares/auth';
import archiver from 'archiver';

export class ImageController {
  /**
   * Generar imagen del tablero (autenticado)
   */
  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await ImageService.generate(req.params.id, req.userId!, req.body);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename=tablero.png');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generar todas las páginas como ZIP (para rifas con muchos números)
   */
  static async generateZip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pages = await ImageService.generateAllPages(req.params.id, req.userId!, req.body);

      if (pages.length === 1) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename=tablero.png');
        res.send(pages[0]);
        return;
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=tablero.zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      pages.forEach((page, index) => {
        archive.append(page, { name: `tablero-pagina-${index + 1}.png` });
      });

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Imagen pública cacheada
   */
  static async getPublic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await ImageService.generatePublic(req.params.slug);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minuto de caché
      res.setHeader('Content-Disposition', 'inline');
      res.send(buffer);
    } catch (error) {
      if ((error as Error).message.includes('no encontrada') || (error as Error).message.includes('no publicada')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      next(error);
    }
  }
}

