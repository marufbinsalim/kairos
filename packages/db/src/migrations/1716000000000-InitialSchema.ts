import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716000000000 implements MigrationInterface {
  name = 'InitialSchema1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "device_type_enum" AS ENUM ('web', 'cli', 'recovery_device')
    `);

    await queryRunner.query(`
      CREATE TYPE "device_status_enum" AS ENUM ('pending', 'active', 'revoked')
    `);

    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "device_type_enum" NOT NULL,
        "status" "device_status_enum" NOT NULL DEFAULT 'pending',
        "publicKey" text NOT NULL,
        "label" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_devices_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "environments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "projectId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_environments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_environments_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wrapped_deks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "environmentId" uuid NOT NULL,
        "deviceId" uuid,
        "wrappedDEK" text NOT NULL,
        "isRecovery" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wrapped_deks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wrapped_deks_environmentId" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wrapped_deks_deviceId" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "secrets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "environmentId" uuid NOT NULL,
        "key" character varying NOT NULL,
        "encryptedValue" text NOT NULL,
        "iv" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_secrets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_secrets_environmentId" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "secrets"`);
    await queryRunner.query(`DROP TABLE "wrapped_deks"`);
    await queryRunner.query(`DROP TABLE "environments"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TYPE "device_status_enum"`);
    await queryRunner.query(`DROP TYPE "device_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
