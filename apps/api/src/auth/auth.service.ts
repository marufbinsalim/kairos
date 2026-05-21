import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User } from '@kairos/db';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMnemonicDto } from './dto/update-mnemonic.dto';
import { RecoveryInitDto } from './dto/recovery-init.dto';
import { ResetWithMnemonicDto } from './dto/reset-with-mnemonic.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const password = await argon2.hash(dto.password);
    const user = this.userRepo.create({
      email: dto.email,
      password,
      encryptedPrivateKey: dto.encryptedPrivateKey ?? null,
      mnemonicEncryptedPrivateKey: dto.mnemonicEncryptedPrivateKey ?? null,
      publicKey: dto.publicKey ?? null,
    });
    await this.userRepo.save(user);

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await argon2.verify(user.password, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.password = await argon2.hash(dto.newPassword);
    user.encryptedPrivateKey = dto.newEncryptedPrivateKey;
    await this.userRepo.save(user);

    return { message: 'Password updated' };
  }

  async updateMnemonic(userId: string, dto: UpdateMnemonicDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    user.mnemonicEncryptedPrivateKey = dto.mnemonicEncryptedPrivateKey;
    await this.userRepo.save(user);

    return { message: 'Recovery phrase updated' };
  }

  async recoveryInit(dto: RecoveryInitDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('No account found with that email');

    return { mnemonicEncryptedPrivateKey: user.mnemonicEncryptedPrivateKey };
  }

  async resetWithMnemonic(dto: ResetWithMnemonicDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('No account found with that email');

    user.password = await argon2.hash(dto.newPassword);
    user.encryptedPrivateKey = dto.newEncryptedPrivateKey;
    await this.userRepo.save(user);

    return { message: 'Password reset successful' };
  }

  private issueToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      userId: user.id,
      encryptedPrivateKey: user.encryptedPrivateKey ?? undefined,
    };
  }
}
