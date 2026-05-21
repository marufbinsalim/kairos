import 'reflect-metadata';
import { AppDataSource } from '@kairos/db';

async function run() {
  await AppDataSource.initialize();
  console.log('Schema synchronized');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Schema sync failed:', err);
  process.exit(1);
});
