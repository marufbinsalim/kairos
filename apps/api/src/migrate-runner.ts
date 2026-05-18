import 'reflect-metadata';
import { AppDataSource } from '@kairos/db';

async function run() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  console.log('Migrations complete');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
