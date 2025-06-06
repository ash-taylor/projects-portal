import { Body, Controller, Get, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { VerifyDto } from './dtos/verify.dto';
import { Role } from './models/role.enum';
import { Roles } from './role.decorator';

@Controller('auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.log.log('Initializing Auth Controller...');
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verifyUser(dto);
  }

  @Post('signin')
  async signin(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return await this.authService.userSignIn(dto, res);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return await this.authService.refresh(req, res);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(req, res);
  }

  @Get('me')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    return await this.authService.returnLoggedInUserInfo(req);
  }

  // TEST ROUTE
  @Get()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async getSecret(): Promise<Record<string, string>> {
    return await this.authService.getSecret();
  }
}
