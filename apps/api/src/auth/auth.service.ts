import {
  Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { User, CliAuthRequest, CliAuthStatus } from '@kairos/db';
import { SetupKeysDto } from './dto/setup-keys.dto';
import { UpdateMnemonicDto } from './dto/update-mnemonic.dto';

export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? '456932602290-3vmn3166h67mos5uu9t56f4enjtludph.apps.googleusercontent.com';

const CLI_AUTH_TTL_MS = 10 * 60 * 1000;
// No ambiguous chars (0/O, 1/I/L) — this code is read from a terminal and confirmed in a browser
const CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ23456789';

function generateUserCode(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CliAuthRequest)
    private readonly cliAuthRepo: Repository<CliAuthRequest>,
    private readonly jwtService: JwtService,
  ) {}

  async googleLogin(idToken: string) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.sub || !payload.email) throw new UnauthorizedException('Google account has no email');
    if (payload.email_verified === false) throw new UnauthorizedException('Google email is not verified');

    let user = await this.userRepo.findOne({ where: { googleId: payload.sub } });
    if (!user) {
      user = this.userRepo.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      });
      try {
        await this.userRepo.save(user);
      } catch {
        throw new ConflictException('An account with this email already exists');
      }
    } else {
      // Keep profile fresh
      let dirty = false;
      if (user.email !== payload.email) { user.email = payload.email; dirty = true; }
      if ((payload.name ?? null) !== user.name) { user.name = payload.name ?? null; dirty = true; }
      if ((payload.picture ?? null) !== user.picture) { user.picture = payload.picture ?? null; dirty = true; }
      if (dirty) await this.userRepo.save(user);
    }

    return this.sessionResponse(user);
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      publicKey: user.publicKey,
      mnemonicEncryptedPrivateKey: user.mnemonicEncryptedPrivateKey,
    };
  }

  /** One-time E2EE bootstrap after the first Google sign-in. */
  async setupKeys(userId: string, dto: SetupKeysDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.publicKey) throw new BadRequestException('Keys are already set up for this account');

    user.publicKey = dto.publicKey;
    user.mnemonicEncryptedPrivateKey = dto.mnemonicEncryptedPrivateKey;
    await this.userRepo.save(user);
    return { success: true };
  }

  async updateMnemonic(userId: string, dto: UpdateMnemonicDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    user.mnemonicEncryptedPrivateKey = dto.mnemonicEncryptedPrivateKey;
    await this.userRepo.save(user);

    return { message: 'Recovery phrase updated' };
  }

  // ─── CLI device-code flow ─────────────────────────────────────────────────

  async cliStart() {
    await this.cliAuthRepo.delete({ expiresAt: LessThan(new Date()) });

    const request = this.cliAuthRepo.create({
      code: generateUserCode(),
      pollSecret: randomBytes(32).toString('hex'),
      status: CliAuthStatus.pending,
      expiresAt: new Date(Date.now() + CLI_AUTH_TTL_MS),
    });
    await this.cliAuthRepo.save(request);

    return {
      code: request.code,
      pollSecret: request.pollSecret,
      expiresIn: Math.floor(CLI_AUTH_TTL_MS / 1000),
    };
  }

  async cliApprove(userId: string, code: string) {
    const request = await this.cliAuthRepo.findOne({ where: { code: code.toUpperCase().trim() } });
    if (!request || request.expiresAt < new Date()) {
      throw new NotFoundException('Sign-in code not found or expired. Run kairos login again.');
    }
    if (request.status !== CliAuthStatus.pending) throw new BadRequestException('Code was already used');

    request.userId = userId;
    request.status = CliAuthStatus.approved;
    await this.cliAuthRepo.save(request);
    return { success: true };
  }

  async cliDeny(userId: string, code: string) {
    const request = await this.cliAuthRepo.findOne({ where: { code: code.toUpperCase().trim() } });
    if (!request || request.expiresAt < new Date()) {
      throw new NotFoundException('Sign-in code not found or expired');
    }
    request.userId = userId;
    request.status = CliAuthStatus.denied;
    await this.cliAuthRepo.save(request);
    return { success: true };
  }

  async cliPoll(pollSecret: string) {
    const request = await this.cliAuthRepo.findOne({ where: { pollSecret } });
    if (!request || request.expiresAt < new Date()) return { status: 'expired' as const };
    if (request.status === CliAuthStatus.denied) {
      await this.cliAuthRepo.remove(request);
      return { status: 'denied' as const };
    }
    if (request.status !== CliAuthStatus.approved || !request.userId) return { status: 'pending' as const };

    const user = await this.userRepo.findOne({ where: { id: request.userId } });
    await this.cliAuthRepo.remove(request); // single-use
    if (!user) return { status: 'expired' as const };

    const session = this.sessionResponse(user);
    return { status: 'approved' as const, ...session };
  }

  private sessionResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      publicKey: user.publicKey,
      mnemonicEncryptedPrivateKey: user.mnemonicEncryptedPrivateKey,
    };
  }
}
