import app from './app';
import { config } from './config';
import { prisma } from './lib/prisma';
import { seedDatabase } from './utils/seed';

const PORT = config.port;

const startServer = async () => {
  try {
    // Ensure DB is seeded on startup
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Bangar Bhavan Chats Billing API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
