import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserKeypair1716300000000 implements MigrationInterface {
  name = 'AddUserKeypair1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "encryptedPrivateKey" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "publicKey" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "publicKey"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "encryptedPrivateKey"`);
  }
}
