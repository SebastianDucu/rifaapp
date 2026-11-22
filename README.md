# 🎰 RifaApp — Gestión y Publicación de Rifas

Aplicación web completa para crear, gestionar y compartir rifas digitales. El organizador administra un tablero de números, asigna compradores, genera imágenes para redes sociales y comparte un enlace público de solo lectura.

## 🚀 Inicio Rápido (Desarrollo)

### Requisitos
- Node.js 18+ (recomendado 22)
- npm 9+

### Instalación

```bash
# 1. Clonar y entrar al proyecto
cd rifaapp

# 2. Instalar dependencias
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configurar variables de entorno
cp .env.example backend/.env
# Edita backend/.env con tus valores (el default funciona para desarrollo)

# 4. Crear la base de datos y aplicar migraciones
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# 5. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `cd backend && npx prisma studio` → http://localhost:5555

### Credenciales de prueba
- **Email**: admin@rifaapp.com
- **Password**: password123

### URL pública de ejemplo
http://localhost:5173/r/rifa-navidad-2024

---

## 🏗️ Estructura del Proyecto

```
rifaapp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema de base de datos
│   │   └── seed.ts            # Datos de ejemplo
│   ├── src/
│   │   ├── config/            # Configuración y conexión a BD
│   │   ├── controllers/       # Controladores HTTP
│   │   ├── middlewares/       # Auth, validación, errores
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Lógica de negocio
│   │   ├── utils/             # Utilidades
│   │   ├── validators/        # Esquemas Zod
│   │   └── index.ts           # Punto de entrada
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # Cliente API (Axios)
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilidades
│   │   ├── i18n/              # Internacionalización
│   │   ├── App.tsx            # Rutas de la app
│   │   └── main.tsx           # Punto de entrada
│   └── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🔧 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a la BD | `file:./dev.db` |
| `JWT_SECRET` | Secreto para firmar JWT | (requerido) |
| `JWT_EXPIRES_IN` | Expiración del token | `7d` |
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Entorno | `development` |
| `FRONTEND_URL` | URL del frontend (para CORS) | `http://localhost:5173` |
| `UPLOAD_DIR` | Directorio de uploads | `./uploads` |
| `CACHE_DIR` | Directorio de caché de imágenes | `./cache` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests por ventana | `100` |
| `LOGIN_RATE_LIMIT_MAX` | Max intentos de login | `5` |

---

## 🐳 Despliegue con Docker

```bash
# Construir y levantar con PostgreSQL
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Ejecutar seed
docker-compose exec app sh -c "npx prisma db seed"
```

La app estará en http://localhost:3001

---

## 🌐 Despliegue en la Nube

### Railway
1. Conecta tu repositorio en [railway.app](https://railway.app)
2. Agrega un servicio PostgreSQL
3. Configura las variables de entorno (usa la `DATABASE_URL` de Railway)
4. Railway detecta el Dockerfile automáticamente

### Render
1. Crea un Web Service en [render.com](https://render.com)
2. Selecciona "Docker" como entorno
3. Agrega un PostgreSQL managed
4. Configura las variables de entorno

### Vercel (solo frontend)
1. Despliega el backend en Railway/Render
2. Despliega `frontend/` en Vercel
3. Configura la variable `VITE_API_URL` apuntando al backend

---

## 📋 API Endpoints

### Auth
- `POST /api/auth/register` — Registro
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Usuario actual

### Rifas
- `GET /api/raffles` — Listar mis rifas
- `POST /api/raffles` — Crear rifa
- `GET /api/raffles/:id` — Detalle
- `PUT /api/raffles/:id` — Editar
- `POST /api/raffles/:id/duplicate` — Duplicar
- `PATCH /api/raffles/:id/archive` — Archivar
- `DELETE /api/raffles/:id` — Eliminar
- `POST /api/raffles/:id/draw` — Sortear ganador

### Tickets
- `GET /api/raffles/:id/tickets` — Listar tickets
- `PATCH /api/tickets/:id` — Actualizar ticket
- `PATCH /api/raffles/:id/tickets/bulk` — Actualización masiva

### Participantes
- `GET /api/raffles/:id/participants` — Lista agrupada
- `GET /api/raffles/:id/export.csv` — Exportar CSV
- `POST /api/raffles/:id/import` — Importar CSV

### Imagen
- `POST /api/raffles/:id/image` — Generar imagen con opciones
- `GET /api/public/raffles/:slug/image.png` — Imagen pública

### Público
- `GET /api/public/raffles/:slug` — Vista pública

---

## 🧪 Tests

```bash
cd backend
npm test
```

---

## 📝 Mejoras Futuras

1. **Pagos en línea**: Integración con Stripe/MercadoPago para que los compradores paguen directamente
2. **Notificaciones WhatsApp**: API de WhatsApp Business para enviar recordatorios automáticos
3. **Multiusuario**: Roles (admin, vendedor, etc.) y equipos
4. **WebSockets**: Actualización en tiempo real del tablero (en lugar de polling)
5. **PWA**: Convertir en Progressive Web App para uso offline
6. **Plantillas de imagen**: Más diseños y personalización (backgrounds, borders, gradients)
7. **Estadísticas avanzadas**: Gráficas de ventas por día, heatmap de números populares
8. **Código QR**: Generar QR del enlace público para imprimir
9. **Ticket digital**: PDF con comprobante de compra para cada participante
10. **Programa de referidos**: Descuento por referir compradores
11. **Múltiples premios**: Soportar rifas con 1er, 2do, 3er lugar
12. **Galería de premios**: Subir múltiples fotos del premio
13. **Countdown timer**: Cuenta regresiva al sorteo en la vista pública
14. **Webhook/integración**: Notificar a sistemas externos al vender un número
15. **App móvil**: React Native o Flutter para gestión desde el celular

---

## 🛡️ Seguridad

- JWT en cookies httpOnly (no accesible desde JavaScript)
- Contraseñas con bcrypt (12 salt rounds)
- Rate limiting en login (5 intentos/min)
- Helmet para headers HTTP seguros
- Validación con Zod en frontend y backend
- Sanitización XSS en inputs de texto
- CORS configurado por origen
- Datos privados (teléfonos) nunca expuestos en la vista pública
- Optimistic locking para evitar condiciones de carrera

---

Hecho con ❤️ usando React, Express, Prisma y TypeScript.

