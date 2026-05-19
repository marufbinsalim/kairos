import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRecovery1716400000000 implements MigrationInterface {
  name = 'RemoveRecovery1716400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "wrapped_deks" WHERE "isRecovery" = true`);
    await queryRunner.query(`ALTER TABLE "wrapped_deks" DROP COLUMN IF EXISTS "isRecovery"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wrapped_deks" ADD COLUMN "isRecovery" boolean NOT NULL DEFAULT false`);
  }
}
