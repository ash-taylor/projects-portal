import { Body, Controller, Delete, Get, Logger, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { DeleteUserDto } from './dtos/delete-user.dto';
import { MessageResponseDto } from './dtos/message-response.dto';
import { SignInDto } from './dtos/signin.dto';
import { SignupResponseDto } from './dtos/signup-response.dto';
import { SignupDto } from './dtos/signup.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
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
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response): Promise<SignupResponseDto> {
    return this.authService.signup(dto, res);
  }

  @Post('verify')
  async verify(
    @Body() dto: VerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    return this.authService.verifyUser(dto, req, res);
  }

  @Post('signin')
  async signin(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
    return await this.authService.userSignIn(dto, res);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<MessageResponseDto> {
    return await this.authService.refresh(req, res);
  }

  @Post('logout')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<MessageResponseDto> {
    return await this.authService.logout(req, res);
  }

  @Get('me')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async me(@Req() req: Request): Promise<UserResponseDto> {
    return await this.authService.returnLoggedInUserInfo(req);
  }

  @Patch('me')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard)
  async updateMe(@Body() dto: UpdateUserDto, @Req() req: Request): Promise<UserResponseDto> {
    return await this.authService.updateLoggedInUserInfo(dto, req);
  }

  @Delete('me')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard)
  async deleteMe(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
    return await this.authService.deleteLoggedInUser(req, res);
  }

  @Delete('user')
  @Roles(Role.Admin) // Admin only
  @UseGuards(AuthGuard)
  async deleteUser(@Query() dto: DeleteUserDto, @Req() req: Request): Promise<UserResponseDto> {
    return await this.authService.deleteUser(dto.email, req);
  }

  // TEST ROUTE
  @Get()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  async getSecret(): Promise<Record<string, string>> {
    return await this.authService.getSecret();
  }
}
