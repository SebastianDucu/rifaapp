import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario demo
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@rifaapp.com' },
    update: {},
    create: {
      email: 'admin@rifaapp.com',
      passwordHash,
      name: 'Organizador Demo',
    },
  });

  console.log(`✅ Usuario creado: ${user.email}`);

  // Crear rifa de ejemplo con 100 números
  const raffle = await prisma.raffle.upsert({
    where: { slug: 'rifa-navidad-2024' },
    update: {},
    create: {
      userId: user.id,
      name: 'Rifa Navidad 2024',
      slug: 'rifa-navidad-2024',
      description:
        '¡Gran rifa navideña! Participa y gana un increíble premio. Cada número tiene la misma probabilidad de ganar. Los números se apartan con un depósito y se confirman al verificar el pago.',
      prize: 'Smart TV Samsung 55" 4K + Consola PlayStation 5',
      drawDate: new Date('2024-12-24T20:00:00'),
      pricePerTicket: 50,
      totalTickets: 100,
      startNumber: 0,
      zeroPad: true,
      lotteryMethod: 'Sorteo con Lotería Nacional del 24 de diciembre',
      paymentInfo:
        'Transferencia BBVA: 4152 3138 0012 3456 | CLABE: 012180001234567890 | A nombre de: Juan Pérez',
      contactInfo: 'Juan Pérez - Organizador',
      contactPhone: '+52 55 1234 5678',
      primaryColor: '#dc2626',
      template: 'default',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Rifa creada: ${raffle.name}`);

  // Verificar si ya existen tickets
  const existingTickets = await prisma.ticket.count({ where: { raffleId: raffle.id } });

  if (existingTickets === 0) {
    // Crear 100 tickets
    const tickets = [];
    for (let i = 0; i < 100; i++) {
      tickets.push({
        raffleId: raffle.id,
        number: i,
        status: 'AVAILABLE',
      });
    }

    await prisma.ticket.createMany({ data: tickets });
    console.log(`✅ 100 tickets creados`);

    // Simular algunos tickets apartados y pagados
    const sampleBuyers = [
      { name: 'María García', phone: '+52 55 9876 5432', numbers: [7, 13, 42] },
      { name: 'Carlos López', phone: '+52 55 5555 1234', numbers: [15, 28] },
      { name: 'Ana Martínez', phone: '+52 55 4444 5678', numbers: [33, 50, 75, 99] },
      { name: 'Roberto Hernández', phone: '+52 55 3333 9012', numbers: [8, 22] },
      { name: 'Laura Sánchez', phone: '+52 55 2222 3456', numbers: [61] },
    ];

    for (const buyer of sampleBuyers) {
      // Primeros números: pagados
      const paidNumbers = buyer.numbers.slice(0, Math.ceil(buyer.numbers.length / 2));
      const reservedNumbers = buyer.numbers.slice(Math.ceil(buyer.numbers.length / 2));

      if (paidNumbers.length > 0) {
        await prisma.ticket.updateMany({
          where: {
            raffleId: raffle.id,
            number: { in: paidNumbers },
          },
          data: {
            status: 'PAID',
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            amountPaid: 50,
            paymentMethod: 'Transferencia',
            paymentDate: new Date(),
          },
        });
      }

      if (reservedNumbers.length > 0) {
        await prisma.ticket.updateMany({
          where: {
            raffleId: raffle.id,
            number: { in: reservedNumbers },
          },
          data: {
            status: 'RESERVED',
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
          },
        });
      }
    }

    console.log(`✅ Tickets de ejemplo actualizados con compradores`);
  } else {
    console.log(`⏭️  Tickets ya existen, saltando...`);
  }

  // Crear registro de auditoría
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      raffleId: raffle.id,
      action: 'SEED',
      entityType: 'RAFFLE',
      entityId: raffle.id,
      after: JSON.stringify({ message: 'Datos de ejemplo creados por seed' }),
    },
  });

  console.log(`\n🎉 Seed completado exitosamente!`);
  console.log(`\n📋 Credenciales de prueba:`);
  console.log(`   Email:    admin@rifaapp.com`);
  console.log(`   Password: password123`);
  console.log(`\n🔗 URL pública: /r/rifa-navidad-2024`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

