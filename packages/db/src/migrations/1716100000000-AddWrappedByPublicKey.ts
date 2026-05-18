import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWrappedByPublicKey1716100000000 implements MigrationInterface {
  name = 'AddWrappedByPublicKey1716100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wrapped_deks" ADD COLUMN "wrappedByPublicKey" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wrapped_deks" DROP COLUMN "wrappedByPublicKey"`);
  }
}
