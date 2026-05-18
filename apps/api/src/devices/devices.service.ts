import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, DeviceType, WrappedDEK, Environment } from '@kairos/db';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { CompleteApprovalDto } from './dto/complete-approval.dto';
import { CompleteRecoveryDto } from './dto/complete-recovery.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(WrappedDEK)
    private readonly wrappedDEKRepo: Repository<WrappedDEK>,
    @InjectRepository(Environment)
    private readonly envRepo: Repository<Environment>,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = this.deviceRepo.create({
      userId,
      publicKey: dto.publicKey,
      type: dto.type,
      label: dto.label ?? null,
      status: DeviceStatus.pending,
      requestedEnvironmentIds: dto.environmentIds ?? [],
    });
    await this.deviceRepo.save(device);
    return { deviceId: device.id, status: device.status };
  }

  async completeRegistration(userId: string, dto: CompleteRegistrationDto) {
    const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');

    const wdek = this.wrappedDEKRepo.create({
      environmentId: dto.environmentId,
      deviceId: device.id,
      wrappedDEK: dto.wrappedDEK,
      isRecovery: false,
    });
    const recoveryWdek = this.wrappedDEKRepo.create({
      environmentId: dto.environmentId,
      deviceId: null,
      wrappedDEK: dto.wrappedDEKRecovery,
      isRecovery: true,
    });

    await this.wrappedDEKRepo.save([wdek, recoveryWdek]);
    device.status = DeviceStatus.active;
    await this.deviceRepo.save(device);
    return { success: true };
  }

  async getPendingDevices(userId: string) {
    const devices = await this.deviceRepo.find({
      where: { userId, status: DeviceStatus.pending },
      select: ['id', 'type', 'label', 'publicKey', 'createdAt', 'status', 'requestedEnvironmentIds'],
    });

    const allEnvIds = [...new Set(devices.flatMap((d) => d.requestedEnvironmentIds ?? []))];
    const envs = allEnvIds.length ? await this.envRepo.findByIds(allEnvIds) : [];

    return devices.map((d) => ({
      ...d,
      requestedEnvInfo: (d.requestedEnvironmentIds ?? []).map((envId) => {
        const env = envs.find((e) => e.id === envId);
        return { id: envId, name: env?.name ?? 'Unknown' };
      }),
    }));
  }

  async completeApproval(userId: string, dto: CompleteApprovalDto) {
    const targetDevice = await this.deviceRepo.findOne({ where: { id: dto.deviceId, userId } });
    if (!targetDevice) throw new NotFoundException('Target device not found');
    if (targetDevice.status !== DeviceStatus.pending) {
      throw new BadRequestException('Device is not pending');
    }

    const wdeks = dto.environments.map((entry) =>
      this.wrappedDEKRepo.create({
        environmentId: entry.environmentId,
        deviceId: targetDevice.id,
        wrappedDEK: entry.wrappedDEK,
        wrappedByPublicKey: entry.wrappedByPublicKey,
        isRecovery: false,
      }),
    );

    await this.wrappedDEKRepo.save(wdeks);
    targetDevice.status = DeviceStatus.active;
    await this.deviceRepo.save(targetDevice);
    return { success: true };
  }

  async listDevices(userId: string) {
    return this.deviceRepo.find({
      where: { userId, status: DeviceStatus.active },
      select: ['id', 'type', 'label', 'publicKey', 'createdAt', 'status'],
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');
    device.status = DeviceStatus.revoked;
    await this.deviceRepo.save(device);
    return { success: true };
  }

  async completeRecovery(userId: string, dto: CompleteRecoveryDto) {
    const newDevice = await this.deviceRepo.findOne({ where: { id: dto.deviceId, userId } });
    if (!newDevice) throw new NotFoundException('Device not found');

    await this.deviceRepo
      .createQueryBuilder()
      .update()
      .set({ status: DeviceStatus.revoked })
      .where('userId = :userId AND id != :newDeviceId', { userId, newDeviceId: dto.deviceId })
      .execute();

    const wdek = this.wrappedDEKRepo.create({
      environmentId: dto.environmentId,
      deviceId: newDevice.id,
      wrappedDEK: dto.wrappedDEK,
      isRecovery: false,
    });
    await this.wrappedDEKRepo.save(wdek);
    newDevice.status = DeviceStatus.active;
    await this.deviceRepo.save(newDevice);
    return { success: true };
  }

  async getDeviceEnvironments(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId, status: DeviceStatus.active } });
    if (!device) throw new NotFoundException('Device not found');

    const wdeks = await this.wrappedDEKRepo.find({
      where: { deviceId, isRecovery: false },
    });

    const envIds = wdeks.map((w) => w.environmentId);
    if (!envIds.length) return [];

    const envs = await this.envRepo.findByIds(envIds);
    return envs.map((e) => ({ id: e.id, name: e.name }));
  }
}
