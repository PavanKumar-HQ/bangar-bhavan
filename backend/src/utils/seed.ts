import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export const seedDatabase = async () => {
  console.log('🌱 Seeding Bangar Bhavan Chats initial data...');

  // 1. Create Tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'bangar-bhavan' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Bangar Bhavan Chats',
        slug: 'bangar-bhavan'
      }
    });
  }

  // 2. Create Default Admin User
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        username: 'admin',
        password: hashedPassword,
        name: 'Bangar Bhavan Counter Operator',
        role: 'ADMIN'
      }
    });
    console.log('👤 Admin user created: admin / admin123');
  }

  // 3. Create Shop Settings
  const existingSettings = await prisma.settings.findUnique({
    where: { tenantId: tenant.id }
  });

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        tenantId: tenant.id,
        shopName: 'Bangar Bhavan Chats',
        address: 'Main Commercial Street, Opp. Metro Gate 2, Bengaluru',
        phone: '+91 98765 43210',
        footerText: 'Authentic Taste • 100% Pure Hygiene • Visit Again!',
        parcelCharge: 5.0,
        currency: '₹'
      }
    });
  }

  // 4. Create Initial Fast-Food Chat Menu Items
  const initialItems = [
    { name: 'Pani Puri (6 pcs)', price: 40, category: 'Puris', displayOrder: 1, isFavorite: true },
    { name: 'Masala Puri', price: 50, category: 'Chats', displayOrder: 2, isFavorite: true },
    { name: 'Sev Puri', price: 50, category: 'Puris', displayOrder: 3, isFavorite: true },
    { name: 'Bhel Puri', price: 50, category: 'Chats', displayOrder: 4, isFavorite: true },
    { name: 'Dahi Puri (6 pcs)', price: 60, category: 'Special Puris', displayOrder: 5, isFavorite: true },
    { name: 'Samosa Masala Chaat', price: 60, category: 'Special Chats', displayOrder: 6, isFavorite: true },
    { name: 'Aloo Tikki Chaat', price: 60, category: 'Special Chats', displayOrder: 7, isFavorite: false },
    { name: 'Pav Bhaji (2 Pav)', price: 90, category: 'Pav Specialties', displayOrder: 8, isFavorite: true },
    { name: 'Extra Pav (1 pc)', price: 15, category: 'Pav Specialties', displayOrder: 9, isFavorite: false },
    { name: 'Cheese Pav Bhaji', price: 110, category: 'Pav Specialties', displayOrder: 10, isFavorite: false },
    { name: 'Vada Pav', price: 40, category: 'Pav Specialties', displayOrder: 11, isFavorite: true },
    { name: 'Cheese Vada Pav', price: 55, category: 'Pav Specialties', displayOrder: 12, isFavorite: false },
    { name: 'Raj Kachori Chaat', price: 90, category: 'Special Chats', displayOrder: 13, isFavorite: true },
    { name: 'Dahi Vada (2 pcs)', price: 60, category: 'Special Puris', displayOrder: 14, isFavorite: false },
    { name: 'Sweet Lassi', price: 50, category: 'Beverages', displayOrder: 15, isFavorite: false },
    { name: 'Badam Milk (Cold)', price: 40, category: 'Beverages', displayOrder: 16, isFavorite: false }
  ];

  const currentCount = await prisma.menuItem.count({ where: { tenantId: tenant.id } });
  if (currentCount === 0) {
    for (const item of initialItems) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          name: item.name,
          price: item.price,
          category: item.category,
          displayOrder: item.displayOrder,
          isFavorite: item.isFavorite,
          isActive: true
        }
      });
    }
    console.log(`🍟 Seeded ${initialItems.length} menu items.`);
  }

  console.log('✅ Seeding completed successfully!');
};

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
