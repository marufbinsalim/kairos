import { Controller, Post, Patch, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMnemonicDto } from './dto/update-mnemonic.dto';
import { RecoveryInitDto } from './dto/recovery-init.dto';
import { ResetWithMnemonicDto } from './dto/reset-with-mnemonic.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Patch('update-mnemonic')
  @UseGuards(JwtAuthGuard)
  updateMnemonic(@Request() req: { user: { sub: string } }, @Body() dto: UpdateMnemonicDto) {
    return this.authService.updateMnemonic(req.user.sub, dto);
  }

  @Post('recovery-init')
  @HttpCode(HttpStatus.OK)
  recoveryInit(@Body() dto: RecoveryInitDto) {
    return this.authService.recoveryInit(dto);
  }

  @Post('reset-with-mnemonic')
  @HttpCode(HttpStatus.OK)
  resetWithMnemonic(@Body() dto: ResetWithMnemonicDto) {
    return this.authService.resetWithMnemonic(dto);
  }
}
