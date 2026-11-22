import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.stack || err.message);

  if (err.message.includes('no encontrad')) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err.message.includes('no autorizado') || err.message.includes('No autorizado')) {
    res.status(403).json({ error: err.message });
    return;
  }

  if (err.message.includes('conflicto') || err.message.includes('Conflicto')) {
    res.status(409).json({ error: err.message });
    return;
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
};

