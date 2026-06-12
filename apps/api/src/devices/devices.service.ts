import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Device, DeviceStatus, DeviceType, WrappedDEK, Environment } from '@kairos/db';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { CompleteApprovalDto } from './dto/complete-approval.dto';

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
    if (dto.type === DeviceType.web) {
      const existing = await this.deviceRepo.findOne({ where: { userId, type: DeviceType.web } });
      if (existing) {
        if (existing.publicKey !== dto.publicKey) {
          existing.publicKey = dto.publicKey;
          await this.deviceRepo.save(existing);
        }
        return { deviceId: existing.id, status: existing.status };
      }

      const device = this.deviceRepo.create({
        userId,
        publicKey: dto.publicKey,
        type: DeviceType.web,
        label: dto.label ?? null,
        status: DeviceStatus.active,
        requestedEnvironmentIds: [],
      });
      try {
        await this.deviceRepo.save(device);
      } catch {
        // Unique constraint hit (concurrent login) — return the existing one
        const existing = await this.deviceRepo.findOne({ where: { userId, type: DeviceType.web } });
        return { deviceId: existing!.id, status: existing!.status };
      }
      return { deviceId: device.id, status: device.status };
    }

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
    });
    await this.wrappedDEKRepo.save(wdek);
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
    const envs = allEnvIds.length
      ? await this.envRepo.find({ where: { id: In(allEnvIds) }, relations: ['project'] })
      : [];

    return devices.map((d) => ({
      ...d,
      requestedEnvInfo: (d.requestedEnvironmentIds ?? []).map((envId) => {
        const env = envs.find((e) => e.id === envId);
        return {
          id: envId,
          name: env?.name ?? 'Unknown',
          projectName: (env as Environment & { project?: { name: string } })?.project?.name ?? '',
        };
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
      }),
    );

    await this.wrappedDEKRepo.save(wdeks);
    targetDevice.status = DeviceStatus.active;
    await this.deviceRepo.save(targetDevice);
    return { success: true };
  }

  async listDevices(userId: string) {
    const devices = await this.deviceRepo.find({
      where: { userId, status: DeviceStatus.active },
      select: ['id', 'type', 'label', 'publicKey', 'createdAt', 'status'],
    });
    if (!devices.length) return [];

    const deviceIds = devices.map((d) => d.id);
    const wdeks = await this.wrappedDEKRepo.find({ where: { deviceId: In(deviceIds) } });
    const envIds = [...new Set(wdeks.map((w) => w.environmentId))];
    const envs = envIds.length
      ? await this.envRepo.find({ where: { id: In(envIds) }, relations: ['project'] })
      : [];

    return devices.map((d) => {
      const myEnvIds = wdeks.filter((w) => w.deviceId === d.id).map((w) => w.environmentId);
      const environments = envs
        .filter((e) => myEnvIds.includes(e.id))
        .map((e) => ({ id: e.id, name: e.name, projectName: (e as any).project?.name ?? '' }));
      return { ...d, environments };
    });
  }

  async updateLabel(userId: string, deviceId: string, label: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');
    device.label = label;
    await this.deviceRepo.save(device);
    return { success: true };
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');
    await this.wrappedDEKRepo.delete({ deviceId });
    await this.deviceRepo.remove(device);
    return { success: true };
  }

  async getDeviceEnvironments(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, userId, status: DeviceStatus.active } });
    if (!device) throw new NotFoundException('Device not found');

    const wdeks = await this.wrappedDEKRepo.find({ where: { deviceId } });
    const envIds = wdeks.map((w) => w.environmentId);
    if (!envIds.length) return [];

    const envs = await this.envRepo.findByIds(envIds);
    return envs.map((e) => ({ id: e.id, name: e.name }));
  }
}
