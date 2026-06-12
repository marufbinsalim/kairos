import { Controller, Post, Patch, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { SetupKeysDto } from './dto/setup-keys.dto';
import { UpdateMnemonicDto } from './dto/update-mnemonic.dto';
import { CliCodeDto } from './dto/cli-code.dto';
import { CliPollDto } from './dto/cli-poll.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

// JwtStrategy.validate() returns the full User entity
type AuthedRequest = { user: { id: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: AuthedRequest) {
    return this.authService.me(req.user.id);
  }

  @Post('setup-keys')
  @UseGuards(JwtAuthGuard)
  setupKeys(@Request() req: AuthedRequest, @Body() dto: SetupKeysDto) {
    return this.authService.setupKeys(req.user.id, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }

  @Patch('update-mnemonic')
  @UseGuards(JwtAuthGuard)
  updateMnemonic(@Request() req: AuthedRequest, @Body() dto: UpdateMnemonicDto) {
    return this.authService.updateMnemonic(req.user.id, dto);
  }

  // ─── CLI device-code flow ─────────────────────────────────────────────────

  @Post('cli/start')
  @HttpCode(HttpStatus.OK)
  cliStart() {
    return this.authService.cliStart();
  }

  @Post('cli/approve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cliApprove(@Request() req: AuthedRequest, @Body() dto: CliCodeDto) {
    return this.authService.cliApprove(req.user.id, dto.code);
  }

  @Post('cli/deny')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cliDeny(@Request() req: AuthedRequest, @Body() dto: CliCodeDto) {
    return this.authService.cliDeny(req.user.id, dto.code);
  }

  @Post('cli/poll')
  @HttpCode(HttpStatus.OK)
  cliPoll(@Body() dto: CliPollDto) {
    return this.authService.cliPoll(dto.pollSecret);
  }
}
