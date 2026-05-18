import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestedEnvironments1716200000000 implements MigrationInterface {
  name = 'AddRequestedEnvironments1716200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "requestedEnvironmentIds" jsonb NOT NULL DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "requestedEnvironmentIds"`);
  }
}
