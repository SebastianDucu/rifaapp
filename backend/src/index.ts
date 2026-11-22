import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from './config/database';

import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import raffleRoutes from './routes/raffle.routes';
import ticketRoutes from './routes/ticket.routes';
import imageRoutes from './routes/image.routes';
import publicRoutes from './routes/public.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();

// ==================== Middlewares globales ====================

// Seguridad HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Lo configuramos por separado si es necesario
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir localhost, IP local (192.168.x.x) y peticiones sin origen (apps nativas)
      if (
        !origin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://192.168.') ||
        origin === config.frontendUrl
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting general
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Archivos estáticos (uploads)
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// ==================== Rutas ====================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas públicas y de autenticación
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);

// Rutas de gestión
app.use('/api/raffles', raffleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', ticketRoutes);
app.use('/api', imageRoutes);

// Servir frontend en producción
if (config.isProd) {
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ==================== Manejo de errores ====================

app.use(errorHandler);

// ==================== Iniciar servidor ====================

async function initDb() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('salito2021D!', 12);
      await prisma.user.create({
        data: {
          name: 'educuara',
          email: 'educuara@rifaapp.com',
          passwordHash,
        },
      });
      console.log('✅ Usuario inicial educuara creado con éxito.');
    }
  } catch (err) {
    console.error('Error al inicializar admin:', err);
  }
}

app.listen(config.port, '0.0.0.0', () => {
  initDb();
  console.log(`
╔══════════════════════════════════════════╗
║          🎰 RifaApp Backend             ║
║   Servidor corriendo en puerto ${config.port}      ║
║   Entorno: ${config.nodeEnv.padEnd(28)}║
╚══════════════════════════════════════════╝
  `);
});

export default app;

