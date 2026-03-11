import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding de dados...');

  const hashedPassword = await hash('senha123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@nextstore.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@nextstore.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categoriasData = [
    { name: 'Couro', slug: 'couro' },
    { name: 'Altos', slug: 'altos' },
    { name: 'Mulher', slug: 'mulher' },
    { name: 'Acessórios', slug: 'acessorios' },
    { name: 'Saltos', slug: 'saltos' },
    { name: 'Rasteiros', slug: 'rasteiros' },
    { name: 'Sapatilhas', slug: 'sapatilhas' }
  ];

  const categories: Array<{ id: string; slug: string }> = [];
  for (const cat of categoriasData) {
    const createdCat = await prisma.category.create({ data: cat });
    categories.push(createdCat);
  }
  
  const getCatId = (slug: string) => categories.find((c) => c.slug === slug)?.id || categories[0].id;

  const produtosData = [
    {
      name: 'Sapato Social de Couro Legitimo',
      slug: 'sapato-social-couro',
      description: 'Elegância e conforto em couro de alta qualidade.',
      price: 289.90,
      comparePrice: 349.90,
      sku: 'COURO-001',
      quantity: 50,
      categoryId: getCatId('couro'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Tênis Nike Air Max Azul',
      slug: 'tenis-nike-air-max',
      description: 'Amortecimento clássico e visual moderno.',
      price: 450.00,
      comparePrice: 599.00,
      sku: 'ALTOS-001',
      quantity: 30,
      categoryId: getCatId('altos'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Salto Alto Scarpin Floral',
      slug: 'salto-alto-scarpin',
      description: 'O toque de sofisticação que faltava no seu look.',
      price: 189.90,
      sku: 'MULHER-001',
      quantity: 100,
      categoryId: getCatId('mulher'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Bolsa de Luxo Feminina',
      slug: 'bolsa-luxo-feminina',
      description: 'Acessório indispensável para grandes ocasiões.',
      price: 320.00,
      comparePrice: 445.90,
      sku: 'ACE-001',
      quantity: 200,
      categoryId: getCatId('acessorios'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Sandália Salto Fino Nude',
      slug: 'sandalia-salto-fino',
      description: 'Leveza e elegância em cada passo.',
      price: 165.50,
      sku: 'SALTOS-001',
      quantity: 150,
      categoryId: getCatId('saltos'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Rasteirinha Confort Birken',
      slug: 'rasteirinha-confort-birken',
      description: 'Estilo casual com o máximo de conforto.',
      price: 129.90,
      comparePrice: 159.90,
      sku: 'RAST-001',
      quantity: 45,
      categoryId: getCatId('rasteiros'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Sapatilha Casual Versátil',
      slug: 'sapatilha-casual',
      description: 'Praticidade para o dia a dia sem perder o estilo.',
      price: 98.00,
      sku: 'SAP-001',
      quantity: 25,
      categoryId: getCatId('sapatilhas'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=800&h=800&fit=crop'
    },
    {
      name: 'Bota Masculina Adventure',
      slug: 'bota-masculina-adventure',
      description: 'Resistência e durabilidade para todas as trilhas.',
      price: 335.90,
      sku: 'COURO-002',
      quantity: 80,
      categoryId: getCatId('couro'),
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=800&h=800&fit=crop'
    }
  ];

  await prisma.product.createMany({
    data: produtosData.map(p => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      sku: p.sku,
      quantity: p.quantity,
      categoryId: p.categoryId,
      status: 'ACTIVE',
      image: p.image
    }))
  });

  console.log('Seeding concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

