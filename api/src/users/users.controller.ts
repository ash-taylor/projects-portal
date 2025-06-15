import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../auth/models/role.enum';
import { Roles } from '../auth/role.decorator';
import { UserEmailDto } from './dtos/user-email.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.log.log('Initializing Users Controller...');
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  async getUsers(@Query() queryParams?: UserEmailDto) {
    if (queryParams && queryParams.email) return await this.usersService.getUserByEmail(queryParams.email);
    return await this.usersService.getAllUsers();
  }
}
