import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function runMigrations() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  console.log('Migrations complete');
  await AppDataSource.destroy();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
