import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'tenant_bola_master';
  await prisma.company.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'CARVION Demo Indústria Esportiva',
      taxId: '00.000.000/0001-00',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@bolamaster.com' },
    update: {},
    create: {
      tenantId,
      name: 'Roni Silva',
      email: 'admin@bolamaster.com',
      passwordHash: await hash('Admin@123', 10),
      role: 'ADMIN',
    },
  });

  const materials = await Promise.all([
    ['MAT-001', 'Couro sintético PU 1.4mm', 'm²', 1280, 1500, 28.4],
    ['MAT-002', 'Borracha butílica câmara', 'kg', 840, 600, 16.9],
    ['MAT-003', 'Linha poliéster alta resistência', 'rolo', 74, 90, 42.5],
    ['MAT-004', 'Válvula esportiva universal', 'un.', 4200, 5000, 0.82],
  ].map(([sku, name, unit, stock, minStock, unitCost]) =>
    prisma.material.upsert({
      where: { tenantId_sku: { tenantId, sku: String(sku) } },
      update: {},
      create: { tenantId, sku: String(sku), name: String(name), unit: String(unit), stock, minStock, unitCost },
    }),
  ));

  const product = await prisma.product.create({
    data: {
      tenantId,
      name: 'Futebol Pró 5',
      ballType: 'Futebol',
      imageUrl: 'uploads/WhatsApp Image 2026-04-28 at 17.18.38.jpeg',
      technical: 'Tamanho oficial, 32 gomos, costura reforçada, câmara butílica.',
      salePrice: 74.9,
      bomItems: {
        create: materials.map((material, index) => ({
          materialId: material.id,
          quantity: [0.42, 0.18, 0.03, 1][index],
        })),
      },
    },
  });

  const rep = await prisma.representative.create({
    data: {
      tenantId,
      name: 'Marcos Almeida',
      region: 'São Paulo',
      commissionRate: 4,
      monthlyGoal: 500000,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      name: 'Esporte Mania Atacado',
      city: 'São Paulo/SP',
      segment: 'Atacado',
    },
  });

  await prisma.sale.create({
    data: {
      tenantId,
      customerId: customer.id,
      representativeId: rep.id,
      status: 'APROVADO',
      total: 184000,
      commission: 7360,
    },
  });

  await prisma.productionOrder.create({
    data: {
      tenantId,
      productId: product.id,
      quantity: 1200,
      status: 'EM_PRODUCAO',
      estimatedCost: 27800,
      realCost: 28460,
      wasteRate: 3.8,
      steps: {
        create: [
          { name: 'CORTE', laborHours: 14, laborCost: 980, producedQty: 1200 },
          { name: 'COSTURA', laborHours: 32, laborCost: 2560, producedQty: 720 },
          { name: 'MONTAGEM', laborHours: 0, laborCost: 0, producedQty: 0 },
          { name: 'ACABAMENTO', laborHours: 0, laborCost: 0, producedQty: 0 },
        ],
      },
      materialUsage: {
        create: materials.map((material, index) => ({
          materialId: material.id,
          quantity: [504, 216, 36, 1200][index],
          cost: [14313.6, 3650.4, 1530, 984][index],
          wasteQty: [18, 7, 2, 31][index],
        })),
      },
    },
  });

  await prisma.finishedStock.create({
    data: {
      tenantId,
      productId: product.id,
      lotCode: 'LOTE-FP5-0426',
      quantity: 3420,
      unitCost: 22.6,
    },
  });

  console.log('Seed concluído: admin@bolamaster.com / Admin@123');
}

main().finally(async () => prisma.$disconnect());
