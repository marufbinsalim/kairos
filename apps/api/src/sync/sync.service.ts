import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, WrappedDEK, Secret, Environment, Project } from '@kairos/db';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(WrappedDEK)
    private readonly wrappedDEKRepo: Repository<WrappedDEK>,
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async sync(userId: string, deviceId: string, environmentId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');
    if (device.status !== DeviceStatus.active) {
      throw new ForbiddenException('Device is not active');
    }

    const env = await this.envRepo.findOne({ where: { id: environmentId } });
    if (!env) throw new NotFoundException('Environment not found');
    const project = await this.projectRepo.findOne({ where: { id: env.projectId, userId } });
    if (!project) throw new ForbiddenException('Access denied');

    const wrappedDEKRecord = await this.wrappedDEKRepo.findOne({
      where: { environmentId, deviceId },
    });
    if (!wrappedDEKRecord) throw new NotFoundException('No wrapped DEK found for this device');

    const secrets = await this.secretRepo.find({ where: { environmentId } });

    return {
      wrappedDEK: wrappedDEKRecord.wrappedDEK,
      wrappedByPublicKey: wrappedDEKRecord.wrappedByPublicKey ?? null,
      secrets,
    };
  }
}
